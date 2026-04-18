'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MUNICIPALITIES, INFRA, ASSETS, RECS, LAND_OPPS, BATAAN_OUTLINE, SOVEREIGN_PROFILES, OMNIMESH_NODES } from '@/lib/data'
import { calcScore, landCompatScore, scoreColor, zonalColor, formatPHP } from '@/lib/scoring'

const HAZARD_COLORS = {
  flood:       { low: 'rgba(0,120,255,.35)',    mid: 'rgba(0,60,200,.5)',    high: 'rgba(0,0,200,.65)'   },
  liquefaction:{ low: 'rgba(255,150,0,.30)',    mid: 'rgba(255,100,0,.45)',  high: 'rgba(255,50,0,.62)'  },
  storm_surge: { low: 'rgba(180,0,255,.28)',    mid: 'rgba(140,0,220,.44)',  high: 'rgba(100,0,200,.60)' },
}
const ZONE_COLORS = {
  Industrial:  'rgba(255,107,53,.45)',
  Commercial:  'rgba(0,180,255,.40)',
  Agricultural:'rgba(0,255,136,.35)',
  Protected:   'rgba(255,51,85,.42)',
}

const OMNIMESH_COLORS = { Node:'#00b4ff', Sentinel:'#00ff88', Pulse:'#ff6b35', Whisper:'#9c44ff' }

export default function MapInner({
  selectedAsset,
  heatmapOn, zonesOn, infraOn, recsOn, landOn,
  sovereignOn, omnimeshOn,
  onParcelSelect, onScoreUpdate,
  csvParcels, deployedPins, onPinDeploy, onPinRemove,
  flyTarget,
}) {
  const mapRef          = useRef(null)
  const mapInstance     = useRef(null)
  const layers          = useRef({})
  const placing         = useRef(false)
  const pinMarkers      = useRef(new Map()) // id -> L.Marker
  const [coords, setCoords] = useState({ lat: '14.6560', lng: '120.4900' })
  const [legendOpen, setLegendOpen] = useState(false)

  useEffect(() => {
    if (mapInstance.current) return
    try { require('leaflet.heat') } catch (_) {}

    const map = L.map(mapRef.current, {
      center: [14.65, 120.47], zoom: 11, minZoom: 8, zoomControl: true, attributionControl: false,
      maxBounds: [[13.2, 118.8], [16.5, 122.2]], maxBoundsViscosity: 0.85,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map)
    L.control.attribution({ prefix: '<span style="color:#3a5268;font-size:9px">© CartoDB · BIR SMV · PSA · SBMA · BLIS v1.2</span>' }).addTo(map)
    mapInstance.current = map

    // Province outline
    L.polygon(BATAAN_OUTLINE, { color: 'rgba(0,180,255,.5)', weight: 1.5, fillColor: 'rgba(0,100,255,.03)', fillOpacity: 1, dashArray: '6,4' }).addTo(map)
      .bindTooltip('<span style="font-family:Orbitron,monospace;font-size:9px;letter-spacing:.1em">PROVINCE OF BATAAN</span>', { className: 'mpop' })

    // Zones layer
    const zonesLayer = L.layerGroup()
    MUNICIPALITIES.forEach(m => {
      const avg = (m.zonalMin + m.zonalMax) / 2
      const col = zonalColor(avg)
      const popup = buildMuniPopup(m)
      L.circle([m.lat, m.lng], { radius: m.r * 1000, color: col, weight: 1, fillColor: col, fillOpacity: .10 }).bindPopup(popup, { className: 'mpop', maxWidth: 290 }).addTo(zonesLayer)
      L.circle([m.lat, m.lng], { radius: m.r * 350,  color: col, weight: 1, fillColor: col, fillOpacity: .20 }).bindPopup(popup, { className: 'mpop', maxWidth: 290 }).addTo(zonesLayer)
      const lbl = L.divIcon({ html: `<div style="font-family:'Orbitron',monospace;font-size:8.5px;letter-spacing:.07em;color:${col};text-shadow:0 0 8px ${col},0 1px 3px #000;text-align:center;white-space:nowrap">${m.name.toUpperCase()}</div>`, className: '', iconSize: [120, 18], iconAnchor: [60, 9] })
      L.marker([m.lat, m.lng], { icon: lbl, zIndexOffset: 100 }).addTo(zonesLayer)
    })
    layers.current.zones = zonesLayer
    zonesLayer.addTo(map)

    // Infrastructure layer
    const infraLayer = L.layerGroup()
    const infCols = { port: '#00b4ff', freeport: '#ffcc00', power: '#ff6b35', road: 'rgba(255,255,255,.5)', fiber: '#9c44ff' }
    Object.values(INFRA).forEach(inf => {
      const col = infCols[inf.type] || '#fff'
      const ic = L.divIcon({ html: `<div class="infra-ic" style="border-color:${col}45;color:${col}"><span>${inf.icon}</span><span class="infra-lb">${inf.label}</span></div>`, className: '', iconSize: [1, 1], iconAnchor: [0, 0] })
      L.marker([inf.lat, inf.lng], { icon: ic, zIndexOffset: 200 }).addTo(infraLayer)
    })
    layers.current.infra = infraLayer
    infraLayer.addTo(map)

    // Recommendation markers
    const recsLayer = L.layerGroup()
    Object.entries(RECS).forEach(([assetId, recs]) => {
      const cfg = ASSETS[assetId]
      recs.forEach((rec, i) => {
        const sc = scoreColor(rec.score)
        const icon = L.divIcon({
          html: `<div class="amark rec-marker" style="color:${cfg.color};background:rgba(0,0,0,.78);border-color:${cfg.color}">
            <div class="rec-badge">#${i + 1}</div>${cfg.icon}
            <div class="score-badge" style="color:${sc}">${rec.score}</div>
          </div>`,
          className: '', iconSize: [38, 38], iconAnchor: [19, 19],
        })
        L.marker([rec.lat, rec.lng], { icon, zIndexOffset: 300 })
          .bindPopup(buildRecPopup(rec, cfg), { className: 'mpop', maxWidth: 300 })
          .addTo(recsLayer)
      })
    })
    layers.current.recs = recsLayer
    recsLayer.addTo(map)

    // Land opportunity markers
    const landLayer = L.layerGroup()
    LAND_OPPS.forEach(p => {
      const urgColor = p.urgency === 'HIGH' ? '#ff3355' : p.urgency === 'MEDIUM' ? '#ff6b35' : '#4a6278'
      const icon = L.divIcon({
        html: `<div class="land-mk">
          <div class="land-mk-score">${landCompatScore(p, null)}</div>
          <div class="land-mk-inner" style="border-color:${urgColor}"><span class="land-mk-icon">🏗</span></div>
          <div class="land-mk-urg" style="background:${urgColor}20;border:1px solid ${urgColor}50;color:${urgColor}">${p.urgency}</div>
        </div>`,
        className: '', iconSize: [28, 28], iconAnchor: [14, 14],
      })
      L.marker([p.lat, p.lng], { icon, zIndexOffset: 250 })
        .on('click', () => onParcelSelect?.(p))
        .bindPopup(buildLandPopup(p), { className: 'mpop', maxWidth: 300 })
        .addTo(landLayer)
    })
    layers.current.land = landLayer
    landLayer.addTo(map)

    // CSV parcel pins (color by asset_class)
    if (csvParcels?.length) {
      const csvLayer = L.layerGroup()
      const csvColors = { forge: '#ff6b35', hq: '#00b4ff', haven: '#00ff88', solar: '#ffcc00', default: '#9c44ff' }
      csvParcels.forEach(p => {
        const col = csvColors[p.asset_class] || csvColors.default
        const icon = L.divIcon({
          html: `<div style="width:12px;height:12px;border-radius:50%;background:${col};border:2px solid ${col};box-shadow:0 0 8px ${col};"></div>`,
          className: '', iconSize: [12, 12], iconAnchor: [6, 6],
        })
        L.marker([parseFloat(p.lat), parseFloat(p.lng)], { icon, zIndexOffset: 150 })
          .bindPopup(`<div class="pt">${p.parcel_id} — ${p.municipality}</div>
            <div class="pr"><span class="pk">Asset Class</span><span class="pv">${p.asset_class}</span></div>
            <div class="pr"><span class="pk">BIR Value</span><span class="pv">₱${Number(p.bir_value_sqm).toLocaleString()}/sqm</span></div>
            <div class="pr"><span class="pk">Zoning</span><span class="pv">${p.zoning}</span></div>
            <div class="pr"><span class="pk">Status</span><span class="pv">${p.status}</span></div>
            <div class="pr"><span class="pk">Notes</span><span class="pv" style="font-size:9px">${p.notes}</span></div>
            <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}" target="_blank" style="display:block;margin-top:8px;padding:6px 10px;background:rgba(0,200,100,.15);border:1px solid rgba(0,200,100,.4);border-radius:4px;color:#00ff88;text-decoration:none;font-size:10px;text-align:center">📍 Open Street View</a>`,
          { className: 'mpop', maxWidth: 280 })
          .addTo(csvLayer)
      })
      layers.current.csvParcels = csvLayer
      csvLayer.addTo(map)
    }

    // Heatmap
    const heatPoints = []
    for (let i = 0; i < 26; i++) {
      for (let j = 0; j < 26; j++) {
        const la = 14.43 + i * (14.90 - 14.43) / 25
        const lo = 120.25 + j * (120.73 - 120.25) / 25
        const nearMuni = MUNICIPALITIES.reduce((b, m) => { const d = Math.hypot(la - m.lat, lo - m.lng); return d < b.d ? { m, d } : b }, { d: Infinity }).m
        if (!nearMuni) continue
        const sc = calcScore(la, lo, 'forge').total
        heatPoints.push([la, lo, sc / 100])
      }
    }
    if (L.heatLayer) {
      layers.current.heatmap = L.heatLayer(heatPoints, { radius: 35, blur: 22, maxZoom: 13, gradient: { 0: '#00ff88', .4: '#ffcc00', .7: '#ff6b35', 1: '#ff3355' } })
    }

    // Sovereign Engagement layer
    const sovereignLayer = L.layerGroup()
    LAND_OPPS.forEach(p => {
      const sp = SOVEREIGN_PROFILES[p.id]
      if (!sp) return
      const col = sp.readiness >= 75 ? '#00ff88' : sp.readiness >= 45 ? '#ffcc00' : '#ff3355'
      const alignEntries = Object.entries(sp.alignment)
      const opposed = alignEntries.some(([,v]) => v === 'opposed')
      const ringCol = opposed ? '#ff3355' : col
      L.circle([p.lat, p.lng], {
        radius: 650, color: ringCol, weight: 2.5, fillColor: ringCol, fillOpacity: 0.06, dashArray: '6,4',
      }).bindPopup(buildSovereignPopup(p, sp), { className: 'mpop', maxWidth: 330 }).addTo(sovereignLayer)
    })
    layers.current.sovereign = sovereignLayer

    // OmniMesh Network layer
    const omnimeshLayer = L.layerGroup()
    const activeNodes = OMNIMESH_NODES.filter(n => n.status === 'active')
    activeNodes.forEach((a, i) => {
      activeNodes.forEach((b, j) => {
        if (j <= i) return
        L.polyline([[a.lat, a.lng], [b.lat, b.lng]], {
          color: 'rgba(0,180,255,.22)', weight: 1.5, dashArray: '3,6',
        }).addTo(omnimeshLayer)
      })
    })
    OMNIMESH_NODES.forEach(node => {
      const col = OMNIMESH_COLORS[node.type] || '#fff'
      const opacity = node.status === 'active' ? 1 : node.status === 'planned' ? 0.55 : 0.30
      const icon = L.divIcon({
        html: `<div class="mesh-marker" style="--mc:${col};opacity:${opacity}">
          <div class="mesh-dot"></div>
          <div class="mesh-ring"></div>
          <div class="mesh-lbl">${node.type}</div>
        </div>`,
        className: '', iconSize: [36, 36], iconAnchor: [18, 18],
      })
      L.marker([node.lat, node.lng], { icon, zIndexOffset: 350 })
        .bindPopup(`<div class="pt" style="color:${col}">📡 ${node.label}</div>
          <div class="pr"><span class="pk">Type</span><span class="pv">${node.type}</span></div>
          <div class="pr"><span class="pk">Status</span><span class="pv" style="color:${node.status === 'active' ? '#00ff88' : node.status === 'planned' ? '#ffcc00' : '#4a6278'}">${node.status.toUpperCase()}</span></div>
          <div style="font-size:9px;color:#ccd8e8;line-height:1.55;margin-top:6px">${node.note}</div>`, { className: 'mpop', maxWidth: 280 })
        .addTo(omnimeshLayer)
    })
    layers.current.omnimesh = omnimeshLayer

    // Load GeoJSON layers
    fetch('/data/hazard-zones.geojson').then(r => r.json()).then(data => {
      const hazLayer = L.geoJSON(data, {
        style: f => {
          const hc = HAZARD_COLORS[f.properties.type] || {}
          return { color: hc[f.properties.level] || 'rgba(255,0,0,.4)', weight: 1, fillColor: hc[f.properties.level] || 'rgba(255,0,0,.3)', fillOpacity: .55, dashArray: f.properties.type === 'flood' ? '' : '4,3' }
        },
        onEachFeature: (f, layer) => {
          layer.bindPopup(`<div class="pt">⚠ ${f.properties.type.replace('_', ' ').toUpperCase()} — ${f.properties.level.toUpperCase()}</div><div style="font-size:10px;color:#ccd8e8;line-height:1.5">${f.properties.description}</div>`, { className: 'mpop' })
        },
      })
      layers.current.hazard = hazLayer
    }).catch(() => {})

    fetch('/data/clup-zoning.geojson').then(r => r.json()).then(data => {
      const clupLayer = L.geoJSON(data, {
        style: f => {
          const col = ZONE_COLORS[f.properties.zone] || 'rgba(180,180,180,.3)'
          return { color: col, weight: 1.5, fillColor: col, fillOpacity: .5 }
        },
        onEachFeature: (f, layer) => {
          const col = ZONE_COLORS[f.properties.zone] || '#fff'
          layer.bindPopup(`<div class="pt" style="color:${col}">⬡ ${f.properties.zone.toUpperCase()} — ${f.properties.municipality}</div><div style="font-size:10px;color:#ccd8e8;line-height:1.5">${f.properties.description}</div>`, { className: 'mpop' })
        },
      })
      layers.current.clup = clupLayer
    }).catch(() => {})

    // Mouse coords
    map.on('mousemove', e => setCoords({ lat: e.latlng.lat.toFixed(4), lng: e.latlng.lng.toFixed(4) }))

    // Map click to deploy
    map.on('click', e => {
      if (!placing.current || !placing.assetId) return
      const { lat, lng } = e.latlng
      const score = calcScore(lat, lng, placing.assetId)
      const sc = scoreColor(score.total)
      const asset = ASSETS[placing.assetId]
      const pinId = Date.now().toString()
      const muni = MUNICIPALITIES.reduce((b, m) => { const d = Math.hypot(lat - m.lat, lng - m.lng); return d < b.d ? { m, d } : b }, { d: Infinity }).m?.name || 'Bataan'
      const icon = L.divIcon({
        html: `<div class="amark" style="color:${asset.color};background:rgba(0,0,0,.85);border-color:${asset.color}">${asset.icon}<div class="score-badge" style="color:${sc}">${score.total}</div></div>`,
        className: '', iconSize: [34, 34], iconAnchor: [17, 17],
      })
      const marker = L.marker([lat, lng], { icon })
        .bindPopup(buildScorePopup(lat, lng, placing.assetId, score, pinId), { className: 'mpop', maxWidth: 280 })
        .addTo(map)
        .openPopup()
      pinMarkers.current.set(pinId, marker)
      onPinDeploy?.({ id: pinId, lat, lng, assetId: placing.assetId, score, muni })
      onScoreUpdate?.(score.total)
    })

    setTimeout(() => map.flyTo([14.62, 120.47], 11, { duration: 2.0 }), 300)

    // Invalidate size on window resize so map fills container correctly
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Layer toggles
  useEffect(() => { toggleLayer('zones',   zonesOn)   }, [zonesOn])
  useEffect(() => { toggleLayer('infra',   infraOn)   }, [infraOn])
  useEffect(() => { toggleLayer('recs',    recsOn)    }, [recsOn])
  useEffect(() => { toggleLayer('land',    landOn)    }, [landOn])
  useEffect(() => { toggleLayer('heatmap', heatmapOn) }, [heatmapOn])
  useEffect(() => { toggleLayer('hazard',   false)     }, []) // off by default, controlled externally
  useEffect(() => { toggleLayer('clup',    false)     }, []) // off by default
  useEffect(() => { toggleLayer('sovereign', sovereignOn) }, [sovereignOn])
  useEffect(() => { toggleLayer('omnimesh',  omnimeshOn)  }, [omnimeshOn])

  // Fly to target when requested from sidebar
  useEffect(() => {
    if (flyTarget && mapInstance.current) {
      mapInstance.current.flyTo([flyTarget.lat, flyTarget.lng], 15, { duration: 1.4 })
    }
  }, [flyTarget])

  useEffect(() => {
    placing.current = !!selectedAsset
    placing.assetId = selectedAsset
    if (mapRef.current) {
      mapRef.current.style.cursor = selectedAsset ? 'crosshair' : ''
    }
  }, [selectedAsset])

  function toggleLayer(name, on) {
    const map = mapInstance.current
    const layer = layers.current[name]
    if (!map || !layer) return
    if (on) map.addLayer(layer)
    else     map.removeLayer(layer)
  }

  // Expose toggle for external layers (hazard/clup/sovereign/omnimesh)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__blisToggleLayer = (name, on) => toggleLayer(name, on)
      window.__blisRemovePin = (id) => {
        const marker = pinMarkers.current.get(id)
        if (marker && mapInstance.current) mapInstance.current.removeLayer(marker)
        pinMarkers.current.delete(id)
        onPinRemove?.(id)
      }
    }
  }, [])

  // Sync sidebar deletions → remove markers from map
  useEffect(() => {
    if (!deployedPins) return
    const ids = new Set(deployedPins.map(p => p.id))
    pinMarkers.current.forEach((marker, id) => {
      if (!ids.has(id)) {
        if (mapInstance.current) mapInstance.current.removeLayer(marker)
        pinMarkers.current.delete(id)
      }
    })
  }, [deployedPins])

  return (
    <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div className="map-coords">
        <span className="cl">LAT</span> <span>{coords.lat}°N</span>
        <span className="cl" style={{marginLeft:8}}>LNG</span> <span>{coords.lng}°E</span>
      </div>

      {/* Map Legend */}
      <div className="map-legend">
        <button className="mleg-toggle" onClick={() => setLegendOpen(v => !v)}>
          <span>⬡</span> MAP LEGEND <span className="mleg-arrow">{legendOpen ? '▾' : '▸'}</span>
        </button>
        {legendOpen && (
          <div className="mleg-body">
            <div className="mleg-section">PROVINCE BOUNDARY</div>
            <div className="mleg-row">
              <div className="mleg-line dashed" style={{borderColor:'rgba(0,180,255,.7)'}} />
              <span>Bataan province border outline</span>
            </div>

            <div className="mleg-section" style={{marginTop:8}}>ZONAL VALUE ZONES</div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#00ff88'}} /><span>Low value — ₱800–2,500/sqm</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ffcc00'}} /><span>Mid value — ₱2,500–5,000/sqm</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff6b35'}} /><span>High value — ₱5,000–8,500/sqm</span></div>
            <div className="mleg-row" style={{fontSize:8,color:'var(--dim)',marginTop:2,paddingLeft:14}}>
              <span>Dot size = municipality zone radius · Click for details</span>
            </div>

            <div className="mleg-section" style={{marginTop:8}}>INFRASTRUCTURE</div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#00b4ff'}} /><span>Port / Freeport (SBFZ/SBMA)</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff6b35'}} /><span>Power grid / substation</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ffcc00'}} /><span>Road / highway node</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#9c44ff'}} /><span>Fiber / connectivity hub</span></div>

            <div className="mleg-section" style={{marginTop:8}}>LAND PARCELS</div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff3355',borderRadius:2}} /><span>HIGH urgency — act now</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff6b35',borderRadius:2}} /><span>MEDIUM — good opportunity</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#4a6278',borderRadius:2}} /><span>LOW — monitor & watch</span></div>

            <div className="mleg-section" style={{marginTop:8}}>DEPLOYED ASSETS</div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#00b4ff'}} /><span>🏛️ Firma HQ pin</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#00ff88'}} /><span>🏘️ Haven Village pin</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff6b35'}} /><span>⛏️ Steel Forge pin</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ffcc00'}} /><span>☀️ Solar Farm pin</span></div>
            <div className="mleg-row" style={{fontSize:8,color:'var(--dim)',marginTop:2,paddingLeft:14}}>
              <span>Score badge = composite 0–100 · Click pin to remove</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function buildMuniPopup(m) {
  const avg = Math.round((m.zonalMin + m.zonalMax) / 2)
  return `<div class="pt">${m.name.toUpperCase()}</div>
    <div class="pr"><span class="pk">BIR Zonal Range</span><span class="pv">₱${m.zonalMin.toLocaleString()}–₱${m.zonalMax.toLocaleString()}/sqm</span></div>
    <div class="pr"><span class="pk">Avg Zonal Value</span><span class="pv">₱${avg.toLocaleString()}/sqm</span></div>
    <div class="pr"><span class="pk">Population</span><span class="pv">${m.pop.toLocaleString()}</span></div>
    <div class="pr"><span class="pk">Area</span><span class="pv">${m.areaHa.toLocaleString()} ha</span></div>
    <div class="pr"><span class="pk">Zoning</span><span class="pv">${m.zoning.join(', ')}</span></div>
    <div class="pr"><span class="pk">Key Features</span><span class="pv" style="font-size:9px">${m.features.join(' · ')}</span></div>`
}

function buildRecPopup(rec, cfg) {
  return `<div class="pt" style="color:${cfg.color}">${cfg.icon} ${rec.name}</div>
    <div class="pr"><span class="pk">Score</span><span class="pv" style="color:${scoreColor(rec.score)}">${rec.score}/100</span></div>
    <div class="pr"><span class="pk">Tag</span><span class="pv">${rec.tag}</span></div>
    <div style="font-size:9px;color:#ccd8e8;line-height:1.55;margin-top:6px">${rec.note}</div>`
}

function buildLandPopup(p) {
  return `<div class="pt" style="color:#ffcc00">🏗 ${p.name}</div>
    <div class="pr"><span class="pk">Municipality</span><span class="pv">${MUNICIPALITIES.find(m => m.id === p.muniId)?.name}</span></div>
    <div class="pr"><span class="pk">Class</span><span class="pv">${p.class}</span></div>
    <div class="pr"><span class="pk">Price Range</span><span class="pv">₱${p.priceMin.toLocaleString()}–₱${p.priceMax.toLocaleString()}/sqm</span></div>
    <div class="pr"><span class="pk">Urgency</span><span class="pv">${p.urgency}</span></div>
    <div class="pr"><span class="pk">Legal</span><span class="pv" style="font-size:9px">${p.legal}</span></div>
    <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}" target="_blank" style="display:block;margin-top:8px;padding:6px 10px;background:rgba(0,200,100,.15);border:1px solid rgba(0,200,100,.4);border-radius:4px;color:#00ff88;text-decoration:none;font-size:10px;text-align:center">📍 Open Street View</a>
    <div style="font-size:9px;color:#ccd8e8;line-height:1.5;margin-top:6px;border-top:1px solid rgba(255,255,255,.06);padding-top:6px">${p.why.slice(0, 180)}…</div>`
}

function buildSovereignPopup(p, sp) {
  const statusColor = { engaged:'#00ff88', pending:'#ffcc00', not_started:'#4a6278', opposed:'#ff3355' }
  const statusIcon  = { engaged:'✓', pending:'◌', not_started:'—', opposed:'✕' }
  const tiers = [['Barangay','barangay'],['Municipality','municipality'],['Province','province'],['National','national']]
  const readCol = sp.readiness >= 75 ? '#00ff88' : sp.readiness >= 45 ? '#ffcc00' : '#ff3355'
  return `<div class="pt" style="color:#00ff88">🏛 SOVEREIGN PROFILE — ${p.name}</div>
    <div class="pr"><span class="pk">Pathway Readiness</span><span class="pv" style="color:${readCol};font-family:Orbitron,monospace;font-weight:700">${sp.readiness}%</span></div>
    <div style="height:4px;background:rgba(255,255,255,.06);border-radius:2px;margin:4px 0 8px"><div style="height:100%;width:${sp.readiness}%;background:${readCol};border-radius:2px;transition:.6s"></div></div>
    <div style="font-family:Orbitron,monospace;font-size:7.5px;letter-spacing:.12em;color:#4a6278;margin-bottom:5px">LGU ALIGNMENT TIERS</div>
    ${tiers.map(([label,key]) => `<div class="pr"><span class="pk">${label}</span><span class="pv" style="color:${statusColor[sp.alignment[key]]}"><span style="font-family:Orbitron,monospace">${statusIcon[sp.alignment[key]]}</span> ${sp.alignment[key].replace('_',' ').toUpperCase()}</span></div>`).join('')}
    <div style="font-family:Orbitron,monospace;font-size:7.5px;letter-spacing:.12em;color:#4a6278;margin:8px 0 5px">NEXT ACTION</div>
    <div style="font-size:9px;color:#ccd8e8;line-height:1.5;background:rgba(0,255,136,.05);border-left:2px solid rgba(0,255,136,.3);padding:6px 8px;border-radius:0 3px 3px 0">${sp.nextStep}</div>
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
    <div style="display:flex;gap:6px;margin-top:8px">
      <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${la},${lo}" target="_blank" style="flex:1;padding:6px 10px;background:rgba(0,200,100,.15);border:1px solid rgba(0,200,100,.4);border-radius:4px;color:#00ff88;text-decoration:none;font-size:10px;text-align:center">📍 Street View</a>
      <button onclick="window.__blisRemovePin('${pinId}')" style="flex:0 0 auto;padding:6px 10px;background:rgba(255,51,85,.15);border:1px solid rgba(255,51,85,.4);border-radius:4px;color:#ff3355;font-size:10px;cursor:pointer;font-family:inherit">✕ Remove</button>
    </div>`
}
