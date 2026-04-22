'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { MUNICIPALITIES, INFRA, ASSETS, RECS, LAND_OPPS, BATAAN_OUTLINE, CORREGIDOR, SOVEREIGN_PROFILES, OMNIMESH_NODES, SOLAR_FARMS, PORTS_VERIFIED, AVIATION_SITES, CONSTRUCTION_ZONES, FAB_EXTENSIONS } from '@/lib/data'
import { calcScore, landCompatScore, scoreColor, zonalColor } from '@/lib/scoring'

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const OMNIMESH_COLORS = { Node:'#00b4ff', Sentinel:'#00ff88', Pulse:'#ff6b35', Whisper:'#9c44ff' }
const PRIORITY = { high:'#E63946', medium:'#F4A261', low:'#A8DADC' }

// Zone fill + stroke colors
const ZONE_CLR = {
  sbfz:  { fill:'rgba(50,180,255,0.15)',  stroke:'rgba(0,180,255,0.60)' },
  afab:  { fill:'rgba(255,200,50,0.18)',  stroke:'rgba(255,200,50,0.60)' },
  heip:  { fill:'rgba(0,255,136,0.12)',   stroke:'rgba(0,255,136,0.55)' },
  clark: { fill:'rgba(156,68,255,0.12)',  stroke:'rgba(156,68,255,0.55)' },
}

// All polygon coords are [lat, lng] — Leaflet native order
const SBFZ_POLY    = [[14.830,120.252],[14.857,120.258],[14.878,120.278],[14.882,120.303],[14.862,120.326],[14.838,120.322],[14.812,120.312],[14.798,120.290],[14.803,120.265],[14.820,120.252]]
const FAB_POLY     = [[14.438,120.456],[14.453,120.460],[14.462,120.474],[14.456,120.486],[14.441,120.483],[14.434,120.469]]
const HERMOSA_POLY = [[14.826,120.500],[14.840,120.504],[14.845,120.518],[14.836,120.527],[14.823,120.522],[14.818,120.508]]
const CLARK_POLY   = [[15.155,120.490],[15.165,120.520],[15.190,120.575],[15.210,120.578],[15.215,120.555],[15.215,120.530],[15.200,120.510],[15.178,120.490]]
const BCIB_LINE    = [[14.425,120.488],[14.392,120.572],[14.355,120.650],[14.325,120.756]]

// Zoom range for HTML marker groups — outside range markers auto-hide
const MARKER_ZOOM = {
  zones:    { min: 8,   max: 14.5 },
  infra:    { min: 9.5, max: 18   },
  recs:     { min: 9,   max: 18   },
  land:     { min: 9,   max: 18   },
  omnimesh: { min: 9,   max: 18   },
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function mkEl(html) {
  const d = document.createElement('div')
  d.innerHTML = html
  return d.firstChild
}

function dIcon(html, anchor = [0, 0]) {
  return L.divIcon({ html, className: '', iconSize: null, iconAnchor: anchor })
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function MapInner({
  selectedAsset,
  heatmapOn, zonesOn, infraOn, recsOn, landOn,
  sovereignOn, omnimeshOn, strategicOn,
  solarOn, portsOn, aviationOn, constructionOn,
  onParcelSelect, onScoreUpdate, onZoneSelect,
  csvParcels, deployedPins, onPinDeploy, onPinRemove,
  flyTarget,
}) {
  const divRef        = useRef(null)
  const map$          = useRef(null)
  const loaded        = useRef(false)
  const layerGroups   = useRef({})           // name -> L.LayerGroup
  const markerLists   = useRef({})           // name -> L.Marker[] for zoom visibility
  const placing       = useRef({ active: false, assetId: null })
  const pinMks        = useRef(new Map())    // pinId -> L.Marker
  const cb            = useRef({ onParcelSelect, onPinDeploy, onPinRemove, onScoreUpdate, onZoneSelect })
  const groupOn       = useRef({})
  const lazyLoaded    = useRef({ hazard: false, clup: false })
  const hoverLabelRef = useRef(null)
  const csvLayer      = useRef(null)
  const [coords, setCoords] = useState({ lat:'14.6560', lng:'120.4900' })
  const [legendOpen, setLegendOpen] = useState(false)

  useEffect(() => {
    cb.current = { onParcelSelect, onPinDeploy, onPinRemove, onScoreUpdate, onZoneSelect }
  }, [onParcelSelect, onPinDeploy, onPinRemove, onScoreUpdate, onZoneSelect])

  // ── TOGGLE ────────────────────────────────────────────────────────────────
  function toggle(name, on) {
    const map = map$.current
    if (!map) return

    groupOn.current[name] = on

    // Lazy-load hazard / CLUP on first enable
    if (on && !lazyLoaded.current[name] && (name === 'hazard' || name === 'clup')) {
      lazyLoadLayer(name, map)
      return
    }

    const lg = layerGroups.current[name]
    if (lg) {
      if (on) {
        if (!map.hasLayer(lg)) map.addLayer(lg)
        // Enforce zoom-based marker visibility after adding
        const zm = MARKER_ZOOM[name]
        if (zm) {
          const z = map.getZoom()
          ;(markerLists.current[name] || []).forEach(mk => {
            const el = mk.getElement()
            if (el) el.style.display = (z >= zm.min && z <= zm.max) ? '' : 'none'
          })
        }
      } else {
        if (map.hasLayer(lg)) map.removeLayer(lg)
      }
    }
  }

  // ── LAZY LAYER LOADER ─────────────────────────────────────────────────────
  function lazyLoadLayer(name, map) {
    const url = name === 'hazard' ? '/data/hazard-zones.geojson' : '/data/clup-zoning.geojson'
    fetch(url).then(r => r.json()).then(data => {
      if (!map$.current) return
      let layer
      if (name === 'hazard') {
        layer = L.geoJSON(data, {
          style: f => {
            const { type, level } = f.properties
            const c =
              type === 'flood'         ? (level==='low'?'rgba(0,120,255,.35)':level==='mid'?'rgba(0,60,200,.5)':'rgba(0,0,200,.65)')
              : type === 'liquefaction'? (level==='low'?'rgba(255,150,0,.30)':level==='mid'?'rgba(255,100,0,.45)':'rgba(255,50,0,.62)')
              :                          (level==='low'?'rgba(180,0,255,.28)':level==='mid'?'rgba(140,0,220,.44)':'rgba(100,0,200,.60)')
            return { fillColor:c, fillOpacity:1, color:'transparent', weight:0 }
          },
          onEachFeature: (feature, lyr) => {
            lyr.on('click', e => {
              if (placing.current.active) return
              const p = feature.properties
              L.popup({ className:'mpop' }).setLatLng(e.latlng)
                .setContent(`<div class="pt">⚠ ${p.type.replace('_',' ').toUpperCase()} — ${p.level.toUpperCase()}</div><div class="pnote">${p.description}</div>`)
                .openOn(map)
            })
          },
        })
      } else {
        const zCol = z => ({ Industrial:'rgba(255,107,53,0.45)', Commercial:'rgba(0,180,255,0.40)', Agricultural:'rgba(0,255,136,0.35)', Protected:'rgba(255,51,85,0.42)' }[z] || 'rgba(180,180,180,0.3)')
        layer = L.geoJSON(data, {
          style: f => ({ fillColor:zCol(f.properties.zone), fillOpacity:1, color:'transparent', weight:0 }),
          onEachFeature: (feature, lyr) => {
            lyr.on('click', e => {
              if (placing.current.active) return
              const p   = feature.properties
              const col = { Industrial:'rgba(255,107,53,1)', Commercial:'rgba(0,180,255,1)', Agricultural:'rgba(0,255,136,1)', Protected:'rgba(255,51,85,1)' }[p.zone] || '#fff'
              L.popup({ className:'mpop' }).setLatLng(e.latlng)
                .setContent(`<div class="pt" style="color:${col}">⬡ ${p.zone.toUpperCase()} — ${p.municipality}</div><div class="pnote">${p.description}</div>`)
                .openOn(map)
            })
          },
        })
      }
      layerGroups.current[name] = layer
      if (groupOn.current[name]) map.addLayer(layer)
      lazyLoaded.current[name] = true
    }).catch(() => {})
  }

  // ── INIT MAP ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (map$.current) return

    const map = L.map(divRef.current, {
      center: [14.65, 120.47],
      zoom: 11,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[4.5, 116.0], [21.5, 127.0]],
    })

    // OSM tiles — dark invert filter applied via globals.css (.leaflet-tile)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.control.attribution({ position:'bottomright', prefix:'© OpenStreetMap · PSA · SBMA · AFAB · BLIS v2' }).addTo(map)
    L.control.zoom({ position:'topleft' }).addTo(map)
    L.control.scale({ position:'bottomleft', metric:true, imperial:false }).addTo(map)

    map$.current = map
    divRef.current.setAttribute('role', 'application')
    divRef.current.setAttribute('aria-label', 'BLIS Interactive Land Map of Bataan and Subic Bay. Use arrow keys to pan, +/- to zoom.')

    map.on('mousemove', e => setCoords({ lat:e.latlng.lat.toFixed(4), lng:e.latlng.lng.toFixed(4) }))

    map.on('click', e => {
      const { active, assetId } = placing.current
      if (!active || !assetId) return
      deployPin(e.latlng.lat, e.latlng.lng, assetId)
    })

    // Zoom-based HTML marker visibility
    map.on('zoom', () => {
      const z = map.getZoom()
      Object.entries(MARKER_ZOOM).forEach(([name, { min, max }]) => {
        if (groupOn.current[name] === false) return
        ;(markerLists.current[name] || []).forEach(mk => {
          const el = mk.getElement()
          if (el) el.style.display = (z >= min && z <= max) ? '' : 'none'
        })
      })
    })

    buildLayers(map)
    loaded.current = true

    setTimeout(() => map.flyTo([14.62, 120.47], 11), 300)

    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── DEPLOY PIN ────────────────────────────────────────────────────────────
  function deployPin(lat, lng, assetId) {
    const map   = map$.current
    const score = calcScore(lat, lng, assetId)
    const asset = ASSETS[assetId]
    const sc    = scoreColor(score.total)
    const pinId = Date.now().toString()
    const muni  = MUNICIPALITIES.reduce((b, m) => {
      const d = Math.hypot(lat - m.lat, lng - m.lng)
      return d < b.d ? { m, d } : b
    }, { d:Infinity }).m?.name || 'Bataan'

    const marker = L.marker([lat, lng], {
      icon: dIcon(`<div class="amark" style="color:${asset.color};background:rgba(0,0,0,.85);border-color:${asset.color}">${asset.icon}<div class="score-badge" style="color:${sc}">${score.total}</div></div>`, [16, 16]),
    })
      .bindPopup(buildScorePopup(lat, lng, assetId, score, pinId), { maxWidth:280, className:'mpop' })
      .addTo(map)
    marker.openPopup()
    pinMks.current.set(pinId, marker)
    cb.current.onPinDeploy?.({ id:pinId, lat, lng, assetId, score, muni })
    cb.current.onScoreUpdate?.(score.total)
  }

  // ── BUILD ALL LAYERS ──────────────────────────────────────────────────────
  function buildLayers(map) {

    // Province outline ────────────────────────────────────────────────────
    // BATAAN_OUTLINE is [lat, lng] pairs — Leaflet native
    L.polygon(BATAAN_OUTLINE, {
      fillColor:'rgba(0,100,255,0.04)', fillOpacity:1,
      color:'rgba(0,180,255,0.55)', weight:1.8, dashArray:'6,4',
    })
      .on('click', e => {
        if (placing.current.active) return
        L.popup({ className:'mpop' }).setLatLng(e.latlng).setContent('<div class="pt">PROVINCE OF BATAAN</div>').openOn(map)
      })
      .addTo(map)

    // Corregidor ring + label ──────────────────────────────────────────────
    L.circle([CORREGIDOR.lat, CORREGIDOR.lng], {
      radius:CORREGIDOR.radius, fillOpacity:0,
      color:'rgba(0,180,255,0.40)', weight:1.2, dashArray:'5,4',
    }).addTo(map)
    L.marker([CORREGIDOR.lat, CORREGIDOR.lng], {
      icon: dIcon('<div style="font-family:Orbitron,monospace;font-size:7.5px;color:rgba(0,180,255,.7);text-shadow:0 0 6px rgba(0,180,255,.5),0 1px 3px #000;white-space:nowrap;letter-spacing:.07em;text-align:center;pointer-events:none;line-height:1.3">CORREGIDOR<br>ISLAND</div>', [30, 10]),
      interactive: false,
    }).addTo(map)

    // Municipality zone circles ───────────────────────────────────────────
    const zonesGroup = L.layerGroup()
    const zoneMks = []
    MUNICIPALITIES.forEach(m => {
      const col = zonalColor((m.zonalMin + m.zonalMax) / 2)
      const popHtml = `<div class="pt">${m.name.toUpperCase()}</div>
        <div class="pr"><span class="pk">BIR Zonal Range</span><span class="pv">₱${m.zonalMin.toLocaleString()}–₱${m.zonalMax.toLocaleString()}/sqm</span></div>
        <div class="pr"><span class="pk">Avg Zonal Value</span><span class="pv">₱${Math.round((m.zonalMin+m.zonalMax)/2).toLocaleString()}/sqm</span></div>
        <div class="pr"><span class="pk">Population</span><span class="pv">${m.pop.toLocaleString()}</span></div>
        <div class="pr"><span class="pk">Area</span><span class="pv">${m.areaHa.toLocaleString()} ha</span></div>
        <div class="pr"><span class="pk">Zoning</span><span class="pv">${m.zoning.join(', ')}</span></div>
        <div class="pr"><span class="pk">Key Features</span><span class="pv" style="font-size:9px">${m.features.join(' · ')}</span></div>`
      L.circle([m.lat, m.lng], { radius:m.r*1000, fillColor:col, fillOpacity:0.10, color:col, weight:1 })
        .bindPopup(popHtml, { maxWidth:290, className:'mpop' })
        .addTo(zonesGroup)
      L.circle([m.lat, m.lng], { radius:m.r*350, fillColor:col, fillOpacity:0.20, color:'transparent', weight:0 })
        .addTo(zonesGroup)
      const mk = L.marker([m.lat, m.lng], {
        icon: dIcon(`<div style="font-family:'Orbitron',monospace;font-size:8.5px;letter-spacing:.07em;color:#1e1b4b;font-weight:700;text-align:center;white-space:nowrap;pointer-events:none;background:rgba(255,255,255,0.82);padding:2px 6px;border-radius:4px;border:1px solid rgba(0,0,0,0.08);box-shadow:0 1px 4px rgba(0,0,0,0.12)">${m.name.toUpperCase()}</div>`, [40, 5]),
        interactive: false,
      }).addTo(zonesGroup)
      zoneMks.push(mk)
    })
    layerGroups.current.zones = zonesGroup
    markerLists.current.zones = zoneMks

    // Infrastructure markers ──────────────────────────────────────────────
    const infraGroup = L.layerGroup()
    const infraMks = []
    const infCols = { port:'#00b4ff', freeport:'#ffcc00', power:'#ff6b35', road:'rgba(255,255,255,.5)', fiber:'#9c44ff' }
    Object.values(INFRA).forEach(inf => {
      const col = infCols[inf.type] || '#fff'
      const mk = L.marker([inf.lat, inf.lng], {
        icon: dIcon(`<div class="infra-ic" style="border-color:${col}45;color:${col}"><span>${inf.icon}</span><span class="infra-lb">${inf.label}</span></div>`),
      }).addTo(infraGroup)
      infraMks.push(mk)
    })
    layerGroups.current.infra = infraGroup
    markerLists.current.infra = infraMks

    // Recommendation markers ──────────────────────────────────────────────
    const recsGroup = L.layerGroup()
    const recsMks = []
    Object.entries(RECS).forEach(([assetId, recs]) => {
      const cfg = ASSETS[assetId]
      recs.forEach((rec, i) => {
        const sc  = scoreColor(rec.score)
        const popHtml = `<div class="pt" style="color:${cfg.color}">${cfg.icon} ${rec.name}</div>
          <div class="pr"><span class="pk">Score</span><span class="pv" style="color:${sc}">${rec.score}/100</span></div>
          <div class="pr"><span class="pk">Tag</span><span class="pv">${rec.tag}</span></div>
          <div class="pnote">${rec.note}</div>`
        const mk = L.marker([rec.lat, rec.lng], {
          icon: dIcon(`<div class="amark rec-marker" style="color:${cfg.color};background:rgba(0,0,0,.78);border-color:${cfg.color}"><div class="rec-badge">#${i+1}</div>${cfg.icon}<div class="score-badge" style="color:${sc}">${rec.score}</div></div>`, [16, 16]),
        }).bindPopup(popHtml, { maxWidth:300, className:'mpop' }).addTo(recsGroup)
        recsMks.push(mk)
      })
    })
    layerGroups.current.recs = recsGroup
    markerLists.current.recs = recsMks

    // Land opportunity markers ────────────────────────────────────────────
    const landGroup = L.layerGroup()
    const landMks = []
    LAND_OPPS.forEach(p => {
      const urgColor = p.urgency === 'HIGH' ? PRIORITY.high : p.urgency === 'MEDIUM' ? PRIORITY.medium : PRIORITY.low
      const score = landCompatScore(p, null)
      const mk = L.marker([p.lat, p.lng], {
        icon: dIcon(`<div class="land-mk"><div class="land-mk-score">${score}</div><div class="land-mk-inner" style="border-color:${urgColor}"><span class="land-mk-icon">🏗</span></div><div class="land-mk-urg" style="background:${urgColor}20;border:1px solid ${urgColor}50;color:${urgColor}">${p.urgency}</div></div>`, [16, 16]),
      })
        .bindPopup(buildLandPopup(p), { maxWidth:300, className:'mpop' })
        .on('click', () => cb.current.onParcelSelect?.(p))
        .addTo(landGroup)
      landMks.push(mk)
    })
    layerGroups.current.land = landGroup
    markerLists.current.land = landMks

    // CSV parcel circles (simple, no clustering) ──────────────────────────
    csvLayer.current = L.layerGroup().addTo(map)

    // Heatmap ─────────────────────────────────────────────────────────────
    const heatPts = []
    for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) {
      const la = 14.43 + i * (14.90 - 14.43) / 25
      const lo = 120.25 + j * (120.73 - 120.25) / 25
      heatPts.push([la, lo, calcScore(la, lo, 'forge').total / 100])
    }
    // L.heatLayer loaded via leaflet.heat (side-effect import below)
    if (typeof L.heatLayer === 'function') {
      layerGroups.current.heatmap = L.heatLayer(heatPts, {
        radius:35, blur:25, maxZoom:17,
        gradient:{ 0:'rgba(0,0,0,0)', 0.3:'#00ff88', 0.6:'#ffcc00', 0.8:'#ff6b35', 1:'#ff3355' },
      })
    }

    // Strategic context ───────────────────────────────────────────────────
    const stratGroup = L.layerGroup()
    const stratMks = []
    const stratDefs = [
      { coords:SBFZ_POLY,    clr:ZONE_CLR.sbfz,  label:'⬡ SBFZ',     latlng:[14.840,120.290], labelCol:'#00b4ff', zoneKey:'SBFZ' },
      { coords:FAB_POLY,     clr:ZONE_CLR.afab,  label:'⬡ FAB',      latlng:[14.449,120.470], labelCol:'#ffcc00', zoneKey:'AFAB' },
      { coords:HERMOSA_POLY, clr:ZONE_CLR.heip,  label:'⬡ HEIP',     latlng:[14.833,120.513], labelCol:'#00ff88', zoneKey:'HEIP' },
      { coords:CLARK_POLY,   clr:ZONE_CLR.clark, label:'⬡ CLARK FZ', latlng:[15.183,120.533], labelCol:'#9c44ff', zoneKey:'CLARK' },
    ]
    stratDefs.forEach(s => {
      L.polygon(s.coords, {
        fillColor:s.clr.fill, fillOpacity:1,
        color:s.clr.stroke, weight:1.5, dashArray:'8,5',
      })
        .on('click', e => { if (!placing.current.active) cb.current.onZoneSelect?.(s.zoneKey) })
        .addTo(stratGroup)

      const mk = L.marker(s.latlng, {
        icon: dIcon(`<div style="font-family:Orbitron,monospace;font-size:8px;color:${s.labelCol};text-shadow:0 0 8px ${s.labelCol},0 1px 3px #000;white-space:nowrap;letter-spacing:.07em;display:none">${s.label}</div>`, [30, 5]),
        interactive: false,
      }).addTo(stratGroup)
      stratMks.push(mk)
    })

    // BCIB corridor line
    L.polyline(BCIB_LINE, { color:'#ffcc00', weight:3, dashArray:'12,7', opacity:0.80 }).addTo(stratGroup)

    // SFS airport
    const sfsIcon = `<div class="strat-airport" style="border-color:#ffcc00;color:#ffcc00;display:none">✈ SFS</div>`
    const sfsMk = L.marker([14.796,120.270], { icon: dIcon(sfsIcon, [25, 10]) })
      .bindPopup(`<div class="pt">✈ Subic Bay International Airport (SFS)</div><div class="pnote">Within SBFZ — handles cargo + charter flights. Key logistics node for container equipment imports into the Subic-Clark-Bataan triangle.</div>`, { maxWidth:260, className:'mpop' })
      .addTo(stratGroup)
    stratMks.push(sfsMk)

    // CRK airport
    const crkIcon = `<div class="strat-airport" style="border-color:#9c44ff;color:#9c44ff;display:none">✈ CRK</div>`
    const crkMk = L.marker([15.187,120.560], { icon: dIcon(crkIcon, [25, 10]) })
      .bindPopup(`<div class="pt">✈ Clark International Airport (CRK)</div><div class="pnote">Clark Freeport Zone, Pampanga. Second international gateway of Metro Manila area. ~45 km from Bataan's northern border.</div>`, { maxWidth:260, className:'mpop' })
      .addTo(stratGroup)
    stratMks.push(crkMk)

    // BCIB midpoint label
    const bcibMk = L.marker([14.376,120.618], {
      icon: dIcon(`<div style="font-family:Orbitron,monospace;font-size:8px;color:#ffcc00;text-shadow:0 0 10px #ffcc00,0 1px 3px #000;white-space:nowrap;letter-spacing:.07em;background:rgba(0,0,0,.55);padding:2px 5px;border-radius:3px;border:1px solid rgba(255,204,0,.3);display:none">⊶ BCIB 2029</div>`, [30, 10]),
    })
      .bindPopup(`<div class="pt" style="color:#ffcc00">🌉 Bataan-Cavite Interlink Bridge (BCIB)</div>
        <div class="pr"><span class="pk">Route</span><span class="pv">Mariveles → Naic, Cavite</span></div>
        <div class="pr"><span class="pk">Length</span><span class="pv">32.15 km</span></div>
        <div class="pr"><span class="pk">Completion</span><span class="pv" style="color:#ffcc00">December 2029</span></div>
        <div class="pnote">Connects Mariveles to CALAX/CAVITEX, cutting Manila–Bataan travel by 3–4 hours. Key land appreciation trigger along the Manila Bay corridor.</div>`, { maxWidth:300, className:'mpop' })
      .addTo(stratGroup)
    stratMks.push(bcibMk)

    layerGroups.current.strategic = stratGroup
    markerLists.current.strategic = stratMks

    // Sovereign engagement rings ──────────────────────────────────────────
    const sovGroup = L.layerGroup()
    LAND_OPPS.forEach(p => {
      const sp = SOVEREIGN_PROFILES[p.id]
      if (!sp) return
      const col     = sp.readiness >= 75 ? '#00ff88' : sp.readiness >= 45 ? PRIORITY.medium : PRIORITY.high
      const ringCol = Object.values(sp.alignment).some(v => v === 'opposed') ? PRIORITY.high : col
      L.circle([p.lat, p.lng], {
        radius:650,
        fillColor:`${ringCol}10`, fillOpacity:1,
        color:ringCol, weight:2.5, dashArray:'6,4',
      })
        .bindPopup(buildSovereignPopup(p, sp), { maxWidth:330, className:'mpop' })
        .addTo(sovGroup)
    })
    layerGroups.current.sovereign = sovGroup

    // OmniMesh network ────────────────────────────────────────────────────
    const omniGroup = L.layerGroup()
    const omniMks = []
    const activeNodes = OMNIMESH_NODES.filter(n => n.status === 'active')
    activeNodes.forEach((a, i) => {
      activeNodes.forEach((b, j) => {
        if (j <= i) return
        L.polyline([[a.lat,a.lng],[b.lat,b.lng]], {
          color:'rgba(0,180,255,0.22)', weight:1.5, dashArray:'3,6',
        }).addTo(omniGroup)
      })
    })
    OMNIMESH_NODES.forEach(node => {
      const col = OMNIMESH_COLORS[node.type] || '#fff'
      const opc = node.status === 'active' ? 1 : node.status === 'planned' ? 0.55 : 0.30
      const popHtml = `<div class="pt" style="color:${col}">📡 ${node.label}</div>
        <div class="pr"><span class="pk">Type</span><span class="pv">${node.type}</span></div>
        <div class="pr"><span class="pk">Status</span><span class="pv" style="color:${node.status==='active'?'#00ff88':node.status==='planned'?'#ffcc00':'#4a6278'}">${node.status.toUpperCase()}</span></div>
        <div class="pnote">${node.note}</div>`
      const mk = L.marker([node.lat,node.lng], {
        icon: dIcon(`<div class="mesh-marker" style="--mc:${col};opacity:${opc};display:none"><div class="mesh-dot"></div><div class="mesh-ring"></div><div class="mesh-lbl">${node.type}</div></div>`, [8, 8]),
      }).bindPopup(popHtml, { maxWidth:280, className:'mpop' }).addTo(omniGroup)
      omniMks.push(mk)
    })
    layerGroups.current.omnimesh = omniGroup
    markerLists.current.omnimesh = omniMks

    // Solar Farms ──────────────────────────────────────────────────────────────
    const solarGroup = L.layerGroup()
    SOLAR_FARMS.forEach(sf => {
      const col = sf.status === 'operational' ? '#fde68a' : '#fb923c'
      L.circleMarker([sf.lat, sf.lng], { radius:10, fillColor:col, fillOpacity:0.25, color:col, weight:2 })
        .addTo(solarGroup)
      L.marker([sf.lat, sf.lng], {
        icon: dIcon(`<div style="font-family:Orbitron,monospace;font-size:8px;color:${col};text-shadow:0 0 8px ${col},0 1px 3px #000;background:rgba(0,0,0,.8);border:1px solid ${col}44;border-radius:3px;padding:3px 7px;white-space:nowrap;cursor:pointer">☀ ${sf.label}</div>`),
      })
        .bindPopup(`<div class="pt">☀ ${sf.label}</div>
          <div class="pr"><span class="pk">Capacity</span><span class="pv">${sf.mw}</span></div>
          <div class="pr"><span class="pk">Status</span><span class="pv" style="color:${col}">${sf.status.toUpperCase().replace('_',' ')}</span></div>
          <div class="pr"><span class="pk">Developer</span><span class="pv">${sf.developer}</span></div>
          <div class="pnote">${sf.note}</div>`, { maxWidth:300, className:'mpop' })
        .addTo(solarGroup)
    })
    layerGroups.current.solar = solarGroup

    // Ports & Terminals ────────────────────────────────────────────────────────
    const portsGroup = L.layerGroup()
    PORTS_VERIFIED.forEach(pt => {
      const col = '#38bdf8'
      L.circleMarker([pt.lat, pt.lng], { radius:10, fillColor:col, fillOpacity:0.20, color:col, weight:2 })
        .addTo(portsGroup)
      L.marker([pt.lat, pt.lng], {
        icon: dIcon(`<div style="font-family:Orbitron,monospace;font-size:8px;color:${col};text-shadow:0 0 8px ${col},0 1px 3px #000;background:rgba(0,0,0,.8);border:1px solid ${col}44;border-radius:3px;padding:3px 7px;white-space:nowrap;cursor:pointer">⚓ ${pt.label}</div>`),
      })
        .bindPopup(`<div class="pt">⚓ ${pt.label}</div>
          <div class="pr"><span class="pk">Type</span><span class="pv">${pt.type}</span></div>
          <div class="pr"><span class="pk">Berths</span><span class="pv">${pt.berths}</span></div>
          <div class="pr"><span class="pk">Capacity</span><span class="pv">${pt.capacity}</span></div>
          <div class="pr"><span class="pk">Authority</span><span class="pv">${pt.authority}</span></div>
          <div class="pnote">${pt.note}</div>`, { maxWidth:300, className:'mpop' })
        .addTo(portsGroup)
    })
    layerGroups.current.ports = portsGroup

    // Aviation Sites ───────────────────────────────────────────────────────────
    const aviationGroup = L.layerGroup()
    AVIATION_SITES.forEach(av => {
      const col = '#a78bfa'
      L.circleMarker([av.lat, av.lng], { radius:12, fillColor:col, fillOpacity:0.18, color:col, weight:2 })
        .addTo(aviationGroup)
      L.marker([av.lat, av.lng], {
        icon: dIcon(`<div style="font-family:Orbitron,monospace;font-size:8px;color:${col};text-shadow:0 0 8px ${col},0 1px 3px #000;background:rgba(0,0,0,.8);border:1px solid ${col}44;border-radius:3px;padding:3px 7px;white-space:nowrap;cursor:pointer">✈ ${av.icao}</div>`),
      })
        .bindPopup(`<div class="pt">✈ ${av.label}</div>
          <div class="pr"><span class="pk">ICAO</span><span class="pv">${av.icao}</span></div>
          <div class="pr"><span class="pk">Type</span><span class="pv">${av.type}</span></div>
          <div class="pr"><span class="pk">Runway</span><span class="pv">${av.runway}</span></div>
          <div class="pr"><span class="pk">Distance</span><span class="pv">${av.distance}</span></div>
          <div class="pnote">${av.notes}</div>`, { maxWidth:300, className:'mpop' })
        .addTo(aviationGroup)
    })
    layerGroups.current.aviation = aviationGroup

    // Construction Zones ───────────────────────────────────────────────────────
    const constructGroup = L.layerGroup()
    CONSTRUCTION_ZONES.forEach(cz => {
      const col = '#fb923c'
      L.circleMarker([cz.lat, cz.lng], { radius:14, fillColor:col, fillOpacity:0.14, color:col, weight:2, dashArray:'6,4' })
        .addTo(constructGroup)
      L.marker([cz.lat, cz.lng], {
        icon: dIcon(`<div style="font-family:Orbitron,monospace;font-size:8px;color:${col};text-shadow:0 0 8px ${col},0 1px 3px #000;background:rgba(0,0,0,.8);border:1px solid ${col}44;border-radius:3px;padding:3px 7px;white-space:nowrap;cursor:pointer">🏗 ${cz.label}</div>`),
      })
        .bindPopup(`<div class="pt" style="color:#fb923c">🏗 ${cz.label}</div>
          <div class="pr"><span class="pk">Project</span><span class="pv" style="font-size:9px">${cz.project}</span></div>
          <div class="pr"><span class="pk">Completion</span><span class="pv" style="color:#fb923c">${cz.completion}</span></div>
          <div class="pr"><span class="pk">Value</span><span class="pv">${cz.value}</span></div>
          <div class="pr"><span class="pk">Agency</span><span class="pv">${cz.agency}</span></div>`, { maxWidth:300, className:'mpop' })
        .addTo(constructGroup)
    })
    layerGroups.current.construction = constructGroup

    // FAB Extension Areas ──────────────────────────────────────────────────────
    const fabGroup = L.layerGroup()
    FAB_EXTENSIONS.forEach(fab => {
      const col = fab.type === 'Main Zone' ? '#ffcc00' : '#FFD166'
      const radius = fab.type === 'Main Zone' ? 13 : 9
      L.circleMarker(fab.coords, { radius, fillColor:col, fillOpacity:0.18, color:col, weight:1.5, dashArray:'4,3' })
        .addTo(fabGroup)
      L.marker(fab.coords, {
        icon: dIcon(`<div style="font-family:Orbitron,monospace;font-size:7.5px;color:${col};text-shadow:0 0 6px ${col},0 1px 3px #000;background:rgba(0,0,0,.8);border:1px solid ${col}44;border-radius:3px;padding:2px 6px;white-space:nowrap;cursor:pointer">⬡ ${fab.id}</div>`),
      })
        .bindPopup(`<div class="pt" style="color:#ffcc00">⬡ ${fab.name}</div>
          <div class="pr"><span class="pk">ID</span><span class="pv">${fab.id}</span></div>
          <div class="pr"><span class="pk">Municipality</span><span class="pv">${fab.municipality}</span></div>
          <div class="pr"><span class="pk">Type</span><span class="pv" style="color:#ffcc00">${fab.type}</span></div>
          ${fab.area ? `<div class="pr"><span class="pk">Area</span><span class="pv">${fab.area}</span></div>` : ''}
          <div class="pnote">${fab.activity}</div>`, { maxWidth:300, className:'mpop' })
        .addTo(fabGroup)
    })
    layerGroups.current.fab = fabGroup
    map.addLayer(fabGroup) // FAB extensions always visible (part of strategic layer)

    // Hazard + CLUP lazy-loaded — fetched only when user first toggles them ON

    // City / district hover (PH municipalities GeoJSON) ───────────────────
    let hoveredLayer = null
    fetch('https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/municities/lowres/municities.0.001.json')
      .then(r => r.json())
      .then(geojson => {
        if (!map$.current) return
        L.geoJSON(geojson, {
          style: () => ({ fillColor:'#4A90D9', fillOpacity:0, color:'#4A90D9', weight:0 }),
          onEachFeature: (feature, lyr) => {
            lyr.on('mouseover', e => {
              if (placing.current.active) return
              const label = hoverLabelRef.current
              if (label) {
                const p = feature.properties
                label.innerHTML = `<strong>${p.ADM3_EN || p.NAME || '—'}</strong><span>${p.ADM2_EN || p.PROVINCE || ''}</span>`
                label.style.display = 'block'
              }
              if (hoveredLayer) hoveredLayer.setStyle({ fillOpacity:0, weight:0 })
              lyr.setStyle({ fillOpacity:0.14, weight:1.8 })
              hoveredLayer = lyr
              map.getContainer().style.cursor = 'pointer'
            })
            lyr.on('mouseout', () => {
              const label = hoverLabelRef.current
              if (label) label.style.display = 'none'
              lyr.setStyle({ fillOpacity:0, weight:0 })
              if (hoveredLayer === lyr) hoveredLayer = null
              map.getContainer().style.cursor = ''
            })
            lyr.on('mousemove', e => {
              const label = hoverLabelRef.current
              if (!label) return
              const pt = map.latLngToContainerPoint(e.latlng)
              label.style.left = (pt.x + 14) + 'px'
              label.style.top  = (pt.y - 38) + 'px'
            })
          },
        }).addTo(map)
      })
      .catch(() => {})
  }

  // ── csvParcels sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded.current || !csvParcels?.length || !csvLayer.current) return
    csvLayer.current.clearLayers()
    csvParcels.forEach(p => {
      const lat = parseFloat(p.lat), lng = parseFloat(p.lng)
      if (isNaN(lat) || isNaN(lng)) return
      const col = { forge:'#ff6b35', hq:'#00b4ff', haven:'#00ff88', solar:'#ffcc00' }[p.asset_class] || '#9c44ff'
      L.circleMarker([lat, lng], { radius:6, fillColor:col, fillOpacity:0.85, color:col, weight:2 })
        .bindPopup(`<div class="pt">${p.parcel_id} — ${p.municipality}</div>
          <div class="pr"><span class="pk">Asset Class</span><span class="pv">${p.asset_class}</span></div>
          <div class="pr"><span class="pk">BIR Value</span><span class="pv">₱${Number(p.bir_value_sqm).toLocaleString()}/sqm</span></div>
          <div class="pr"><span class="pk">Zoning</span><span class="pv">${p.zoning}</span></div>
          <div class="pr"><span class="pk">Status</span><span class="pv">${p.status}</span></div>
          <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}" target="_blank" style="display:block;margin-top:8px;padding:6px 10px;background:rgba(0,200,100,.15);border:1px solid rgba(0,200,100,.4);border-radius:4px;color:#00ff88;text-decoration:none;font-size:10px;text-align:center">📍 Open Street View</a>`,
          { maxWidth:280, className:'mpop' })
        .addTo(csvLayer.current)
    })
  }, [csvParcels])

  // ── LAYER TOGGLES ─────────────────────────────────────────────────────────
  useEffect(() => { toggle('zones',     zonesOn)    }, [zonesOn])
  useEffect(() => { toggle('infra',     infraOn)    }, [infraOn])
  useEffect(() => { toggle('recs',      recsOn)     }, [recsOn])
  useEffect(() => { toggle('land',      landOn)     }, [landOn])
  useEffect(() => { toggle('heatmap',   heatmapOn)  }, [heatmapOn])
  useEffect(() => { toggle('sovereign',    sovereignOn)   }, [sovereignOn])
  useEffect(() => { toggle('omnimesh',     omnimeshOn)    }, [omnimeshOn])
  useEffect(() => { toggle('strategic',    strategicOn)   }, [strategicOn])
  useEffect(() => { toggle('solar',        solarOn)       }, [solarOn])
  useEffect(() => { toggle('ports',        portsOn)       }, [portsOn])
  useEffect(() => { toggle('aviation',     aviationOn)    }, [aviationOn])
  useEffect(() => { toggle('construction', constructionOn)}, [constructionOn])

  // External layer control (hazard/clup from page.js)
  useEffect(() => {
    if (typeof window !== 'undefined')
      window.__blisToggleLayer = (name, on) => toggle(name, on)
  }, [])

  // Pin removal hook
  useEffect(() => {
    window.__blisRemovePin = id => {
      const mk = pinMks.current.get(id)
      if (mk) mk.remove()
      pinMks.current.delete(id)
      cb.current.onPinRemove?.(id)
    }
  }, [])

  // ── FLY TARGET ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (flyTarget && map$.current)
      map$.current.flyTo([flyTarget.lat, flyTarget.lng], 15)
  }, [flyTarget])

  // ── ASSET / PLACING MODE ──────────────────────────────────────────────────
  useEffect(() => {
    placing.current = { active:!!selectedAsset, assetId:selectedAsset }
    if (divRef.current) divRef.current.style.cursor = selectedAsset ? 'crosshair' : ''
  }, [selectedAsset])

  // ── SYNC SIDEBAR DELETIONS ────────────────────────────────────────────────
  useEffect(() => {
    if (!deployedPins) return
    const ids = new Set(deployedPins.map(p => p.id))
    pinMks.current.forEach((mk, id) => {
      if (!ids.has(id)) { mk.remove(); pinMks.current.delete(id) }
    })
  }, [deployedPins])

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex:1, position:'relative', minHeight:0, overflow:'hidden' }}>
      <div ref={divRef} style={{ width:'100%', height:'100%' }} />

      {/* Floating city/district hover label */}
      <div id="map-hover-label" ref={hoverLabelRef} />

      <div className="map-coords">
        <span className="cl">LAT</span> <span>{coords.lat}°N</span>
        <span className="cl" style={{marginLeft:8}}>LNG</span> <span>{coords.lng}°E</span>
      </div>

      <div className="map-legend">
        <button className="mleg-toggle" onClick={() => setLegendOpen(v => !v)}>
          <span>⬡</span> MAP LEGEND <span className="mleg-arrow">{legendOpen ? '▾' : '▸'}</span>
        </button>
        {legendOpen && (
          <div className="mleg-body">
            <div className="mleg-section">PROVINCE BOUNDARY</div>
            <div className="mleg-row"><div className="mleg-line dashed" style={{borderColor:'rgba(0,180,255,.7)'}} /><span>Bataan province border</span></div>

            <div className="mleg-section" style={{marginTop:8}}>ZONAL VALUE ZONES</div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#00ff88'}} /><span>Low — ₱800–2,500/sqm</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ffcc00'}} /><span>Mid — ₱2,500–5,000/sqm</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff6b35'}} /><span>High — ₱5,000–8,500/sqm</span></div>

            <div className="mleg-section" style={{marginTop:8}}>INFRASTRUCTURE</div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#00b4ff'}} /><span>Port / Freeport</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff6b35'}} /><span>Power grid</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#9c44ff'}} /><span>Fiber / connectivity</span></div>

            <div className="mleg-section" style={{marginTop:8}}>LAND PARCELS</div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:PRIORITY.high,  borderRadius:2}} /><span>HIGH urgency</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:PRIORITY.medium,borderRadius:2}} /><span>MEDIUM urgency</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:PRIORITY.low,   borderRadius:2}} /><span>LOW urgency</span></div>

            <div className="mleg-section" style={{marginTop:8}}>DEPLOYED ASSETS</div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#00b4ff'}} /><span>🏛️ Firma HQ</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#00ff88'}} /><span>🏘️ Haven Village</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff6b35'}} /><span>⛏️ Steel Forge</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ffcc00'}} /><span>☀️ Solar Farm</span></div>
            <div className="mleg-row" style={{fontSize:8,color:'var(--dim)',paddingLeft:14}}><span>Score badge = composite 0–100</span></div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── POPUP BUILDERS ────────────────────────────────────────────────────────────
function buildLandPopup(p) {
  const muni = MUNICIPALITIES.find(m => m.id === p.muniId)?.name
  return `<div class="pt" style="color:#ffcc00">🏗 ${p.name}</div>
    <div class="pr"><span class="pk">Municipality</span><span class="pv">${muni}</span></div>
    <div class="pr"><span class="pk">Class</span><span class="pv">${p.class}</span></div>
    <div class="pr"><span class="pk">Price Range</span><span class="pv">₱${p.priceMin.toLocaleString()}–₱${p.priceMax.toLocaleString()}/sqm</span></div>
    <div class="pr"><span class="pk">Urgency</span><span class="pv">${p.urgency}</span></div>
    <div class="pr"><span class="pk">Legal</span><span class="pv" style="font-size:9px">${p.legal}</span></div>
    <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}" target="_blank" style="display:block;margin:10px 16px 6px;padding:7px 10px;background:rgba(79,70,229,0.07);border:1px solid rgba(132,167,247,0.35);border-radius:7px;color:#4f46e5;text-decoration:none;font-size:10px;font-weight:600;text-align:center">📍 Open Street View</a>
    <div class="pnote" style="border-top:1px solid rgba(132,167,247,0.08);padding-top:8px">${p.why.slice(0,180)}…</div>`
}

function buildSovereignPopup(p, sp) {
  const statusColor = { engaged:'#00ff88', pending:'#ffcc00', not_started:'#4a6278', opposed:'#ff3355' }
  const statusIcon  = { engaged:'✓', pending:'◌', not_started:'—', opposed:'✕' }
  const tiers       = [['Barangay','barangay'],['Municipality','municipality'],['Province','province'],['National','national']]
  const readCol     = sp.readiness >= 75 ? '#00ff88' : sp.readiness >= 45 ? '#ffcc00' : '#ff3355'
  return `<div class="pt" style="color:#00ff88">🏛 SOVEREIGN PROFILE — ${p.name}</div>
    <div class="pr"><span class="pk">Pathway Readiness</span><span class="pv" style="color:${readCol};font-family:Orbitron,monospace;font-weight:700">${sp.readiness}%</span></div>
    <div style="height:4px;background:rgba(255,255,255,.06);border-radius:2px;margin:4px 0 8px"><div style="height:100%;width:${sp.readiness}%;background:${readCol};border-radius:2px"></div></div>
    <div style="font-family:Orbitron,monospace;font-size:7.5px;letter-spacing:.12em;color:#4a6278;margin-bottom:5px">LGU ALIGNMENT TIERS</div>
    ${tiers.map(([label,key]) => `<div class="pr"><span class="pk">${label}</span><span class="pv" style="color:${statusColor[sp.alignment[key]]}"><span style="font-family:Orbitron,monospace">${statusIcon[sp.alignment[key]]}</span> ${sp.alignment[key].replace('_',' ').toUpperCase()}</span></div>`).join('')}
    <div style="font-family:Orbitron,monospace;font-size:7.5px;letter-spacing:.12em;color:#4a6278;margin:8px 0 5px">NEXT ACTION</div>
    <div style="font-size:10px;color:#374151;line-height:1.5;background:rgba(79,70,229,0.05);border-left:2px solid rgba(132,167,247,0.4);padding:6px 8px;border-radius:0 5px 5px 0;margin:0 4px">${sp.nextStep}</div>
    <div style="font-size:8px;color:#4a6278;margin-top:7px">LGU: ${sp.lgu.municipality} · ${sp.lgu.province}</div>`
}

function buildScorePopup(la, lo, assetId, score, pinId) {
  const a = ASSETS[assetId]
  return `<div class="pt" style="color:${a.color}">${a.icon} ${a.label} — Score ${score.total}</div>
    <div class="pr"><span class="pk">Port</span><span class="pv">${score.port}</span></div>
    <div class="pr"><span class="pk">Power</span><span class="pv">${score.power}</span></div>
    <div class="pr"><span class="pk">Road</span><span class="pv">${score.road}</span></div>
    <div class="pr"><span class="pk">Zoning</span><span class="pv">${score.zoning}</span></div>
    <div class="pr"><span class="pk">Cost</span><span class="pv">${score.cost}</span></div>
    <div class="pr"><span class="pk">Coords</span><span class="pv">${la.toFixed(4)}°N, ${lo.toFixed(4)}°E</span></div>
    <div style="display:flex;gap:6px;margin:10px 16px 14px">
      <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${la},${lo}" target="_blank" style="flex:1;padding:7px 10px;background:rgba(79,70,229,0.07);border:1px solid rgba(132,167,247,0.35);border-radius:7px;color:#4f46e5;text-decoration:none;font-size:10px;font-weight:600;text-align:center">📍 Street View</a>
      <button onclick="window.__blisRemovePin('${pinId}')" style="flex:0 0 auto;padding:7px 10px;background:rgba(255,51,85,0.07);border:1px solid rgba(255,133,92,0.35);border-radius:7px;color:#f6718d;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit">✕ Remove</button>
    </div>`
}
