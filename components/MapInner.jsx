'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MUNICIPALITIES, INFRA, ASSETS, RECS, LAND_OPPS, BATAAN_OUTLINE, CORREGIDOR, SOVEREIGN_PROFILES, OMNIMESH_NODES } from '@/lib/data'
import { calcScore, landCompatScore, scoreColor, zonalColor } from '@/lib/scoring'

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const OMNIMESH_COLORS = { Node:'#00b4ff', Sentinel:'#00ff88', Pulse:'#ff6b35', Whisper:'#9c44ff' }

// Visual Hierarchy — priority colors (mirrors CSS --priority-* vars)
const PRIORITY = { high:'#E63946', medium:'#F4A261', low:'#A8DADC' }

// Visual Hierarchy — zone fill + stroke colors (Layer 2)
const ZONE_CLR = {
  sbfz:  { fill:'rgba(50,180,255,0.15)',  stroke:'rgba(255,255,255,0.60)' },
  afab:  { fill:'rgba(255,200,50,0.18)',  stroke:'rgba(255,255,255,0.60)' },
  heip:  { fill:'rgba(0,255,136,0.12)',   stroke:'rgba(255,255,255,0.55)' },
  clark: { fill:'rgba(156,68,255,0.12)',  stroke:'rgba(255,255,255,0.55)' },
}

const SBFZ_POLY    = [[14.830,120.252],[14.857,120.258],[14.878,120.278],[14.882,120.303],[14.862,120.326],[14.838,120.322],[14.812,120.312],[14.798,120.290],[14.803,120.265],[14.820,120.252]]
const FAB_POLY     = [[14.438,120.456],[14.453,120.460],[14.462,120.474],[14.456,120.486],[14.441,120.483],[14.434,120.469]]
const HERMOSA_POLY = [[14.826,120.500],[14.840,120.504],[14.845,120.518],[14.836,120.527],[14.823,120.522],[14.818,120.508]]
const CLARK_POLY   = [[15.155,120.490],[15.165,120.520],[15.190,120.575],[15.210,120.578],[15.215,120.555],[15.215,120.530],[15.200,120.510],[15.178,120.490]]
const BCIB_LINE    = [[14.425,120.488],[14.392,120.572],[14.355,120.650],[14.325,120.756]]

// GeoJSON layer IDs per toggle group
const GEO_IDS = {
  zones:     ['zones-outer-fill','zones-inner-fill','zones-line'],
  heatmap:   ['heatmap-layer'],
  strategic: ['strat-fills','strat-lines','strat-bcib'],
  sovereign: ['sov-fill','sov-line'],
  omnimesh:  ['omni-lines'],
  hazard:    ['hazard-layer'],
  clup:      ['clup-layer'],
}

// Zoom range for HTML marker groups — outside range markers auto-hide
const MARKER_ZOOM = {
  zones:    { min: 8,   max: 14.5 },  // municipality labels — basemap takes over at z15
  infra:    { min: 9.5, max: 18   },
  recs:     { min: 9,   max: 18   },
  land:     { min: 9,   max: 18   },
  omnimesh: { min: 9,   max: 18   },
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const xy  = ([lat, lng]) => [lng, lat]
const xys = arr => arr.map(xy)

function circleRing(lat, lng, radiusM, steps = 48) {
  const R = 6371000, pts = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI
    const dLat = (radiusM * Math.cos(a)) / R * (180 / Math.PI)
    const dLng = (radiusM * Math.sin(a)) / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI)
    pts.push([lng + dLng, lat + dLat])
  }
  return pts
}

function mkEl(html) {
  const d = document.createElement('div')
  d.innerHTML = html
  return d.firstChild
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function MapInner({
  selectedAsset,
  heatmapOn, zonesOn, infraOn, recsOn, landOn,
  sovereignOn, omnimeshOn, strategicOn,
  onParcelSelect, onScoreUpdate,
  csvParcels, deployedPins, onPinDeploy, onPinRemove,
  flyTarget,
}) {
  const divRef      = useRef(null)
  const map$        = useRef(null)
  const loaded      = useRef(false)
  const mkGroups    = useRef({})          // name -> Marker[]
  const placing     = useRef({ active: false, assetId: null })
  const pinMks      = useRef(new Map())   // pinId -> Marker
  const cb          = useRef({ onParcelSelect, onPinDeploy, onPinRemove, onScoreUpdate })
  const groupOn     = useRef({})          // name -> boolean (user's desired on/off)
  const lazyLoaded  = useRef({ hazard: false, clup: false })
  const [coords, setCoords] = useState({ lat:'14.6560', lng:'120.4900' })
  const [legendOpen, setLegendOpen] = useState(false)

  useEffect(() => { cb.current = { onParcelSelect, onPinDeploy, onPinRemove, onScoreUpdate } },
    [onParcelSelect, onPinDeploy, onPinRemove, onScoreUpdate])

  // ── TOGGLE ────────────────────────────────────────────────────────────────
  function toggle(name, on) {
    const map = map$.current
    if (!map) return

    groupOn.current[name] = on

    // Lazy-load hazard / CLUP on first enable — fetch only when user actually wants them
    if (on && !lazyLoaded.current[name] && (name === 'hazard' || name === 'clup')) {
      lazyLoadLayer(name, map)
      return
    }

    // GeoJSON layers
    for (const id of (GEO_IDS[name] || [])) {
      if (loaded.current && map.getLayer(id))
        map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
    }

    // HTML markers — respect both user toggle and current zoom range
    const zm = MARKER_ZOOM[name]
    const z  = map.getZoom()
    for (const mk of (mkGroups.current[name] || [])) {
      const show = on && (!zm || (z >= zm.min && z <= zm.max))
      mk.getElement().style.display = show ? '' : 'none'
    }
  }

  // ── LAZY LAYER LOADER ─────────────────────────────────────────────────────
  function lazyLoadLayer(name, map) {
    const url = name === 'hazard' ? '/data/hazard-zones.geojson' : '/data/clup-zoning.geojson'
    fetch(url).then(r => r.json()).then(data => {
      if (!map$.current?.getStyle()) return
      if (name === 'hazard') {
        map.addSource('hazard-data', { type:'geojson', data })
        map.addLayer({
          id:'hazard-layer', type:'fill', source:'hazard-data',
          minzoom: 9, layout:{ visibility:'visible' },
          paint:{
            'fill-color':['match',['get','type'],
              'flood',      ['match',['get','level'],'low','rgba(0,120,255,.35)','mid','rgba(0,60,200,.5)', 'rgba(0,0,200,.65)'],
              'liquefaction',['match',['get','level'],'low','rgba(255,150,0,.30)','mid','rgba(255,100,0,.45)','rgba(255,50,0,.62)'],
              ['match',['get','level'],'low','rgba(180,0,255,.28)','mid','rgba(140,0,220,.44)','rgba(100,0,200,.60)']],
            'fill-opacity':1,
          },
        })
        map.on('click','hazard-layer', e => {
          if (placing.current.active) return
          const p = e.features[0].properties
          new maplibregl.Popup({ className:'mpop' }).setLngLat(e.lngLat)
            .setHTML(`<div class="pt">⚠ ${p.type.replace('_',' ').toUpperCase()} — ${p.level.toUpperCase()}</div><div style="font-size:10px;color:#ccd8e8;line-height:1.5">${p.description}</div>`)
            .addTo(map)
        })
      } else {
        map.addSource('clup-data', { type:'geojson', data })
        map.addLayer({
          id:'clup-layer', type:'fill', source:'clup-data',
          minzoom: 9, layout:{ visibility:'visible' },
          paint:{
            'fill-color':['match',['get','zone'],'Industrial','rgba(255,107,53,0.45)','Commercial','rgba(0,180,255,0.40)','Agricultural','rgba(0,255,136,0.35)','Protected','rgba(255,51,85,0.42)','rgba(180,180,180,0.3)'],
            'fill-opacity':1,
          },
        })
        map.on('click','clup-layer', e => {
          if (placing.current.active) return
          const p   = e.features[0].properties
          const col = { Industrial:'rgba(255,107,53,1)', Commercial:'rgba(0,180,255,1)', Agricultural:'rgba(0,255,136,1)', Protected:'rgba(255,51,85,1)' }[p.zone] || '#fff'
          new maplibregl.Popup({ className:'mpop' }).setLngLat(e.lngLat)
            .setHTML(`<div class="pt" style="color:${col}">⬡ ${p.zone.toUpperCase()} — ${p.municipality}</div><div style="font-size:10px;color:#ccd8e8;line-height:1.5">${p.description}</div>`)
            .addTo(map)
        })
      }
      lazyLoaded.current[name] = true
    }).catch(() => {})
  }

  // ── INIT MAP ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (map$.current) return

    const map = new maplibregl.Map({
      container: divRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [120.47, 14.65],
      zoom: 11,
      minZoom: 6,
      maxZoom: 18,
      maxBounds: [[116.0, 4.5], [127.0, 21.5]],
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({
      customAttribution: '© OpenStreetMap · PSA · SBMA · AFAB · BLIS v2'
    }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    }), 'top-right')
    map$.current = map

    map.on('mousemove', e =>
      setCoords({ lat: e.lngLat.lat.toFixed(4), lng: e.lngLat.lng.toFixed(4) }))

    map.on('click', e => {
      const { active, assetId } = placing.current
      if (!active || !assetId) return
      deployPin(e.lngLat.lat, e.lngLat.lng, assetId)
    })

    // Zoom-based HTML marker visibility — auto-hide at irrelevant zoom levels
    map.on('zoom', () => {
      const z = map.getZoom()
      Object.entries(MARKER_ZOOM).forEach(([name, { min, max }]) => {
        if (groupOn.current[name] === false) return  // user toggled off — leave hidden
        for (const mk of (mkGroups.current[name] || [])) {
          mk.getElement().style.display = (z >= min && z <= max) ? '' : 'none'
        }
      })
    })

    map.on('load', () => {
      loaded.current = true
      buildLayers(map)
    })

    const onResize = () => map.resize()
    window.addEventListener('resize', onResize)
    setTimeout(() => map.flyTo({ center: [120.47, 14.62], zoom: 11, duration: 2000 }), 300)
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
    }, { d: Infinity }).m?.name || 'Bataan'

    const el = mkEl(`<div class="amark" style="color:${asset.color};background:rgba(0,0,0,.85);border-color:${asset.color}">${asset.icon}<div class="score-badge" style="color:${sc}">${score.total}</div></div>`)
    const popup = new maplibregl.Popup({ className:'mpop', maxWidth:'280px' })
      .setHTML(buildScorePopup(lat, lng, assetId, score, pinId))
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map)
    marker.togglePopup()
    pinMks.current.set(pinId, marker)
    cb.current.onPinDeploy?.({ id: pinId, lat, lng, assetId, score, muni })
    cb.current.onScoreUpdate?.(score.total)
  }

  // ── BUILD ALL LAYERS ──────────────────────────────────────────────────────
  function buildLayers(map) {

    // Province outline ────────────────────────────────────────────────────
    const provRing = xys(BATAAN_OUTLINE); provRing.push(provRing[0])
    map.addSource('province', { type:'geojson', data:{ type:'Feature', geometry:{ type:'Polygon', coordinates:[provRing] } } })
    map.addLayer({ id:'province-fill', type:'fill',   source:'province', minzoom:7, paint:{ 'fill-color':'rgba(0,100,255,0.04)', 'fill-opacity':1 } })
    map.addLayer({ id:'province-line', type:'line',   source:'province', minzoom:7, paint:{ 'line-color':'rgba(0,180,255,0.55)', 'line-width':1.8, 'line-dasharray':[6,4] } })
    map.on('click', 'province-fill', e => {
      if (placing.current.active) return
      new maplibregl.Popup({ className:'mpop' }).setLngLat(e.lngLat)
        .setHTML('<div class="pt">PROVINCE OF BATAAN</div>').addTo(map)
    })

    // Corregidor ring + label ──────────────────────────────────────────────
    const corrRing = circleRing(CORREGIDOR.lat, CORREGIDOR.lng, CORREGIDOR.radius, 64)
    map.addSource('corregidor', { type:'geojson', data:{ type:'Feature', geometry:{ type:'LineString', coordinates:corrRing } } })
    map.addLayer({ id:'corregidor-ring', type:'line', source:'corregidor', minzoom:9, paint:{ 'line-color':'rgba(0,180,255,0.40)', 'line-width':1.2, 'line-dasharray':[5,4] } })
    const corrEl = document.createElement('div')
    corrEl.style.cssText = 'font-family:Orbitron,monospace;font-size:7.5px;color:rgba(0,180,255,.7);text-shadow:0 0 6px rgba(0,180,255,.5),0 1px 3px #000;white-space:nowrap;letter-spacing:.07em;text-align:center;pointer-events:none;line-height:1.3'
    corrEl.innerHTML = 'CORREGIDOR<br>ISLAND'
    new maplibregl.Marker({ element: corrEl }).setLngLat([CORREGIDOR.lng, CORREGIDOR.lat]).addTo(map)

    // Municipality zone circles ───────────────────────────────────────────
    const outerFt = [], innerFt = []
    MUNICIPALITIES.forEach(m => {
      const col   = zonalColor((m.zonalMin + m.zonalMax) / 2)
      const props = { name:m.name, col, zonalMin:m.zonalMin, zonalMax:m.zonalMax, pop:m.pop, areaHa:m.areaHa, zoning:m.zoning.join(', '), features:m.features.join(' · ') }
      outerFt.push({ type:'Feature', properties:props, geometry:{ type:'Polygon', coordinates:[circleRing(m.lat, m.lng, m.r * 1000)] } })
      innerFt.push({ type:'Feature', properties:props, geometry:{ type:'Polygon', coordinates:[circleRing(m.lat, m.lng, m.r * 350)] } })
    })
    map.addSource('zones-outer', { type:'geojson', data:{ type:'FeatureCollection', features:outerFt } })
    map.addSource('zones-inner', { type:'geojson', data:{ type:'FeatureCollection', features:innerFt } })
    map.addLayer({ id:'zones-outer-fill', type:'fill', source:'zones-outer', minzoom:8, paint:{ 'fill-color':['get','col'], 'fill-opacity':0.10 } })
    map.addLayer({ id:'zones-inner-fill', type:'fill', source:'zones-inner', minzoom:8, paint:{ 'fill-color':['get','col'], 'fill-opacity':0.20 } })
    map.addLayer({ id:'zones-line',       type:'line', source:'zones-outer', minzoom:8, paint:{ 'line-color':['get','col'], 'line-width':1 } })
    map.on('click', 'zones-outer-fill', e => {
      if (placing.current.active) return
      const p = e.features[0].properties
      new maplibregl.Popup({ className:'mpop', maxWidth:'290px' }).setLngLat(e.lngLat)
        .setHTML(`<div class="pt">${p.name.toUpperCase()}</div>
          <div class="pr"><span class="pk">BIR Zonal Range</span><span class="pv">₱${Number(p.zonalMin).toLocaleString()}–₱${Number(p.zonalMax).toLocaleString()}/sqm</span></div>
          <div class="pr"><span class="pk">Avg Zonal Value</span><span class="pv">₱${Math.round((Number(p.zonalMin)+Number(p.zonalMax))/2).toLocaleString()}/sqm</span></div>
          <div class="pr"><span class="pk">Population</span><span class="pv">${Number(p.pop).toLocaleString()}</span></div>
          <div class="pr"><span class="pk">Area</span><span class="pv">${Number(p.areaHa).toLocaleString()} ha</span></div>
          <div class="pr"><span class="pk">Zoning</span><span class="pv">${p.zoning}</span></div>
          <div class="pr"><span class="pk">Key Features</span><span class="pv" style="font-size:9px">${p.features}</span></div>`)
        .addTo(map)
    })
    map.on('mouseenter', 'zones-outer-fill', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'zones-outer-fill', () => { map.getCanvas().style.cursor = '' })

    mkGroups.current.zones = MUNICIPALITIES.map(m => {
      const col = zonalColor((m.zonalMin + m.zonalMax) / 2)
      const el  = document.createElement('div')
      el.style.cssText = `font-family:'Orbitron',monospace;font-size:8.5px;letter-spacing:.07em;color:${col};text-shadow:0 0 8px ${col},0 1px 3px #000;text-align:center;white-space:nowrap;pointer-events:none`
      el.textContent = m.name.toUpperCase()
      return new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map)
    })

    // Infrastructure markers ──────────────────────────────────────────────
    const infCols = { port:'#00b4ff', freeport:'#ffcc00', power:'#ff6b35', road:'rgba(255,255,255,.5)', fiber:'#9c44ff' }
    mkGroups.current.infra = Object.values(INFRA).map(inf => {
      const col = infCols[inf.type] || '#fff'
      const el  = mkEl(`<div class="infra-ic" style="border-color:${col}45;color:${col}"><span>${inf.icon}</span><span class="infra-lb">${inf.label}</span></div>`)
      return new maplibregl.Marker({ element: el }).setLngLat([inf.lng, inf.lat]).addTo(map)
    })

    // Recommendation markers ──────────────────────────────────────────────
    mkGroups.current.recs = []
    Object.entries(RECS).forEach(([assetId, recs]) => {
      const cfg = ASSETS[assetId]
      recs.forEach((rec, i) => {
        const sc  = scoreColor(rec.score)
        const el  = mkEl(`<div class="amark rec-marker" style="color:${cfg.color};background:rgba(0,0,0,.78);border-color:${cfg.color}"><div class="rec-badge">#${i+1}</div>${cfg.icon}<div class="score-badge" style="color:${sc}">${rec.score}</div></div>`)
        const pop = new maplibregl.Popup({ className:'mpop', maxWidth:'300px' })
          .setHTML(`<div class="pt" style="color:${cfg.color}">${cfg.icon} ${rec.name}</div>
            <div class="pr"><span class="pk">Score</span><span class="pv" style="color:${sc}">${rec.score}/100</span></div>
            <div class="pr"><span class="pk">Tag</span><span class="pv">${rec.tag}</span></div>
            <div style="font-size:9px;color:#ccd8e8;line-height:1.55;margin-top:6px">${rec.note}</div>`)
        mkGroups.current.recs.push(
          new maplibregl.Marker({ element: el }).setLngLat([rec.lng, rec.lat]).setPopup(pop).addTo(map)
        )
      })
    })

    // Land opportunity markers ────────────────────────────────────────────
    mkGroups.current.land = LAND_OPPS.map(p => {
      const urgColor = p.urgency === 'HIGH' ? PRIORITY.high : p.urgency === 'MEDIUM' ? PRIORITY.medium : PRIORITY.low
      const el  = mkEl(`<div class="land-mk"><div class="land-mk-score">${landCompatScore(p, null)}</div><div class="land-mk-inner" style="border-color:${urgColor}"><span class="land-mk-icon">🏗</span></div><div class="land-mk-urg" style="background:${urgColor}20;border:1px solid ${urgColor}50;color:${urgColor}">${p.urgency}</div></div>`)
      const pop = new maplibregl.Popup({ className:'mpop', maxWidth:'300px' }).setHTML(buildLandPopup(p))
      const mk  = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(pop).addTo(map)
      el.addEventListener('click', () => cb.current.onParcelSelect?.(p))
      return mk
    })

    // CSV parcel circles — clustered for performance at scale ────────────
    map.addSource('csv-parcels', {
      type:'geojson', data:{ type:'FeatureCollection', features:[] },
      cluster: true, clusterMaxZoom: 13, clusterRadius: 50,
    })
    // Cluster bubbles (scaled + colored by count)
    map.addLayer({
      id:'csv-clusters', type:'circle', source:'csv-parcels',
      filter:['has','point_count'], minzoom: 9,
      paint:{
        'circle-color':  ['step',['get','point_count'],'#00b4ff',10,PRIORITY.medium,50,PRIORITY.high],
        'circle-radius': ['step',['get','point_count'],15,10,20,50,26],
        'circle-stroke-width':2,
        'circle-stroke-color':['step',['get','point_count'],'#00b4ff',10,PRIORITY.medium,50,PRIORITY.high],
        'circle-opacity':0.88,
      },
    })
    // Cluster count label
    map.addLayer({
      id:'csv-cluster-count', type:'symbol', source:'csv-parcels',
      filter:['has','point_count'], minzoom: 9,
      layout:{
        'text-field':['get','point_count_abbreviated'],
        'text-font':['Open Sans Bold','Arial Unicode MS Bold'],
        'text-size':11,
      },
      paint:{ 'text-color':'#000' },
    })
    // Individual (unclustered) points
    map.addLayer({
      id:'csv-circles', type:'circle', source:'csv-parcels',
      filter:['!',['has','point_count']], minzoom: 9,
      paint:{
        'circle-radius':6,
        'circle-color':['match',['get','asset_class'],'forge','#ff6b35','hq','#00b4ff','haven','#00ff88','solar','#ffcc00','#9c44ff'],
        'circle-stroke-width':2,
        'circle-stroke-color':['match',['get','asset_class'],'forge','#ff6b35','hq','#00b4ff','haven','#00ff88','solar','#ffcc00','#9c44ff'],
        'circle-opacity':0.85,
      },
    })
    // Click cluster → zoom to expand
    map.on('click', 'csv-clusters', e => {
      const feat = map.queryRenderedFeatures(e.point, { layers:['csv-clusters'] })[0]
      map.getSource('csv-parcels').getClusterExpansionZoom(feat.properties.cluster_id)
        .then(zoom => map.easeTo({ center: feat.geometry.coordinates, zoom: zoom + 0.5 }))
        .catch(() => {})
    })
    map.on('mouseenter', 'csv-clusters', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'csv-clusters', () => { map.getCanvas().style.cursor = '' })
    map.on('click', 'csv-circles', e => {
      if (placing.current.active) return
      const p = e.features[0].properties
      new maplibregl.Popup({ className:'mpop', maxWidth:'280px' }).setLngLat(e.lngLat)
        .setHTML(`<div class="pt">${p.parcel_id} — ${p.municipality}</div>
          <div class="pr"><span class="pk">Asset Class</span><span class="pv">${p.asset_class}</span></div>
          <div class="pr"><span class="pk">BIR Value</span><span class="pv">₱${Number(p.bir_value_sqm).toLocaleString()}/sqm</span></div>
          <div class="pr"><span class="pk">Zoning</span><span class="pv">${p.zoning}</span></div>
          <div class="pr"><span class="pk">Status</span><span class="pv">${p.status}</span></div>
          <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}" target="_blank" style="display:block;margin-top:8px;padding:6px 10px;background:rgba(0,200,100,.15);border:1px solid rgba(0,200,100,.4);border-radius:4px;color:#00ff88;text-decoration:none;font-size:10px;text-align:center">📍 Open Street View</a>`)
        .addTo(map)
    })
    map.on('mouseenter', 'csv-circles', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'csv-circles', () => { map.getCanvas().style.cursor = '' })

    // Heatmap ─────────────────────────────────────────────────────────────
    const heatFts = []
    for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) {
      const la = 14.43 + i * (14.90 - 14.43) / 25
      const lo = 120.25 + j * (120.73 - 120.25) / 25
      heatFts.push({ type:'Feature', geometry:{ type:'Point', coordinates:[lo, la] }, properties:{ w: calcScore(la, lo, 'forge').total / 100 } })
    }
    map.addSource('heatmap-data', { type:'geojson', data:{ type:'FeatureCollection', features:heatFts } })
    map.addLayer({
      id:'heatmap-layer', type:'heatmap', source:'heatmap-data',
      minzoom: 8, layout:{ visibility:'none' },
      paint: {
        'heatmap-weight': ['get','w'],
        'heatmap-intensity': 1.2,
        'heatmap-radius': 35,
        'heatmap-opacity': 0.70,
        'heatmap-color': ['interpolate',['linear'],['heatmap-density'],
          0,'rgba(0,0,0,0)', 0.3,'#00ff88', 0.6,'#ffcc00', 0.8,'#ff6b35', 1,'#ff3355'],
      },
    })

    // Strategic context layer ─────────────────────────────────────────────
    const stratDefs = [
      { coords:SBFZ_POLY,    color:ZONE_CLR.sbfz.stroke,  fill:ZONE_CLR.sbfz.fill,  label:'⬡ SBFZ',     lngLat:[120.290,14.840], labelCol:'#00b4ff' },
      { coords:FAB_POLY,     color:ZONE_CLR.afab.stroke,  fill:ZONE_CLR.afab.fill,  label:'⬡ FAB',      lngLat:[120.470,14.449], labelCol:'#ffcc00' },
      { coords:HERMOSA_POLY, color:ZONE_CLR.heip.stroke,  fill:ZONE_CLR.heip.fill,  label:'⬡ HEIP',     lngLat:[120.513,14.833], labelCol:'#00ff88' },
      { coords:CLARK_POLY,   color:ZONE_CLR.clark.stroke, fill:ZONE_CLR.clark.fill, label:'⬡ CLARK FZ', lngLat:[120.533,15.183], labelCol:'#9c44ff' },
    ]
    const stratPolyFts = stratDefs.map(s => {
      const ring = xys(s.coords); ring.push(ring[0])
      return { type:'Feature', properties:{ color:s.color, fill:s.fill }, geometry:{ type:'Polygon', coordinates:[ring] } }
    })
    map.addSource('strat-polys', { type:'geojson', data:{ type:'FeatureCollection', features:stratPolyFts } })
    map.addSource('strat-line',  { type:'geojson', data:{ type:'Feature', geometry:{ type:'LineString', coordinates:xys(BCIB_LINE) } } })
    map.addLayer({ id:'strat-fills', type:'fill', source:'strat-polys', minzoom:7, layout:{ visibility:'none' }, paint:{ 'fill-color':['get','fill'],  'fill-opacity':1 } })
    map.addLayer({ id:'strat-lines', type:'line', source:'strat-polys', minzoom:7, layout:{ visibility:'none' }, paint:{ 'line-color':['get','color'], 'line-width':1.5, 'line-dasharray':[8,5] } })
    map.addLayer({ id:'strat-bcib',  type:'line', source:'strat-line',  minzoom:7, layout:{ visibility:'none' }, paint:{ 'line-color':'#ffcc00', 'line-width':3, 'line-dasharray':[12,7], 'line-opacity':0.80 } })

    const stratMks = []
    stratDefs.forEach(s => {
      const el = document.createElement('div')
      el.style.cssText = `font-family:Orbitron,monospace;font-size:8px;color:${s.labelCol};text-shadow:0 0 8px ${s.labelCol},0 1px 3px #000;white-space:nowrap;letter-spacing:.07em;display:none`
      el.textContent = s.label
      stratMks.push(new maplibregl.Marker({ element: el }).setLngLat(s.lngLat).addTo(map))
    })
    // SFS airport
    const sfsPop = new maplibregl.Popup({ className:'mpop', maxWidth:'260px' })
      .setHTML(`<div class="pt" style="color:#ffcc00">✈ Subic Bay International Airport (SFS)</div><div style="font-size:10px;color:#ccd8e8;line-height:1.55">Within SBFZ — handles cargo + charter flights. Key logistics node for container equipment imports into the Subic-Clark-Bataan triangle.</div>`)
    const sfsEl = mkEl(`<div class="strat-airport" style="border-color:#ffcc00;color:#ffcc00;display:none">✈ SFS</div>`)
    stratMks.push(new maplibregl.Marker({ element: sfsEl }).setLngLat([120.270,14.796]).setPopup(sfsPop).addTo(map))
    // CRK airport
    const crkPop = new maplibregl.Popup({ className:'mpop', maxWidth:'260px' })
      .setHTML(`<div class="pt" style="color:#9c44ff">✈ Clark International Airport (CRK)</div><div style="font-size:10px;color:#ccd8e8;line-height:1.55">Clark Freeport Zone, Pampanga. Second international gateway of Metro Manila area. ~45 km from Bataan's northern border.</div>`)
    const crkEl = mkEl(`<div class="strat-airport" style="border-color:#9c44ff;color:#9c44ff;display:none">✈ CRK</div>`)
    stratMks.push(new maplibregl.Marker({ element: crkEl }).setLngLat([120.560,15.187]).setPopup(crkPop).addTo(map))
    // BCIB midpoint label
    const bcibPop = new maplibregl.Popup({ className:'mpop', maxWidth:'300px' })
      .setHTML(`<div class="pt" style="color:#ffcc00">🌉 Bataan-Cavite Interlink Bridge (BCIB)</div>
        <div class="pr"><span class="pk">Route</span><span class="pv">Mariveles → Naic, Cavite</span></div>
        <div class="pr"><span class="pk">Length</span><span class="pv">32.15 km</span></div>
        <div class="pr"><span class="pk">Completion</span><span class="pv" style="color:#ffcc00">December 2029</span></div>
        <div style="font-size:9px;color:#ccd8e8;line-height:1.55;margin-top:6px">Connects Mariveles to CALAX/CAVITEX, cutting Manila–Bataan travel by 3–4 hours. Key land appreciation trigger along the Manila Bay corridor.</div>`)
    const bcibEl = mkEl(`<div style="font-family:Orbitron,monospace;font-size:8px;color:#ffcc00;text-shadow:0 0 10px #ffcc00,0 1px 3px #000;white-space:nowrap;letter-spacing:.07em;background:rgba(0,0,0,.55);padding:2px 5px;border-radius:3px;border:1px solid rgba(255,204,0,.3);display:none">⊶ BCIB 2029</div>`)
    stratMks.push(new maplibregl.Marker({ element: bcibEl }).setLngLat([120.618,14.376]).setPopup(bcibPop).addTo(map))
    mkGroups.current.strategic = stratMks

    // Sovereign engagement rings ──────────────────────────────────────────
    const sovFts = LAND_OPPS.flatMap(p => {
      const sp = SOVEREIGN_PROFILES[p.id]
      if (!sp) return []
      const col     = sp.readiness >= 75 ? '#00ff88' : sp.readiness >= 45 ? PRIORITY.medium : PRIORITY.high
      const ringCol = Object.values(sp.alignment).some(v => v === 'opposed') ? PRIORITY.high : col
      const ring    = circleRing(p.lat, p.lng, 650); ring.push(ring[0])
      return [{ type:'Feature', id:p.id, properties:{ fillCol:`${ringCol}10`, lineCol:ringCol, pid:p.id }, geometry:{ type:'Polygon', coordinates:[ring] } }]
    })
    map.addSource('sovereign', { type:'geojson', data:{ type:'FeatureCollection', features:sovFts } })
    map.addLayer({ id:'sov-fill', type:'fill', source:'sovereign', minzoom:10, layout:{ visibility:'none' }, paint:{ 'fill-color':['get','fillCol'], 'fill-opacity':1 } })
    map.addLayer({ id:'sov-line', type:'line', source:'sovereign', minzoom:10, layout:{ visibility:'none' }, paint:{ 'line-color':['get','lineCol'], 'line-width':2.5, 'line-dasharray':[6,4] } })
    map.on('click', 'sov-fill', e => {
      if (placing.current.active) return
      const pid = e.features[0].properties.pid
      const p   = LAND_OPPS.find(x => x.id === pid)
      const sp  = SOVEREIGN_PROFILES[pid]
      if (!p || !sp) return
      new maplibregl.Popup({ className:'mpop', maxWidth:'330px' }).setLngLat(e.lngLat)
        .setHTML(buildSovereignPopup(p, sp)).addTo(map)
    })
    map.on('mouseenter', 'sov-fill', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'sov-fill', () => { map.getCanvas().style.cursor = '' })

    // OmniMesh network ────────────────────────────────────────────────────
    const activeNodes = OMNIMESH_NODES.filter(n => n.status === 'active')
    const omniLineFts = []
    activeNodes.forEach((a, i) => {
      activeNodes.forEach((b, j) => {
        if (j <= i) return
        omniLineFts.push({ type:'Feature', geometry:{ type:'LineString', coordinates:[[a.lng,a.lat],[b.lng,b.lat]] } })
      })
    })
    map.addSource('omnimesh-lines', { type:'geojson', data:{ type:'FeatureCollection', features:omniLineFts } })
    map.addLayer({ id:'omni-lines', type:'line', source:'omnimesh-lines', minzoom:9, layout:{ visibility:'none' }, paint:{ 'line-color':'rgba(0,180,255,0.22)', 'line-width':1.5, 'line-dasharray':[3,6] } })
    mkGroups.current.omnimesh = OMNIMESH_NODES.map(node => {
      const col = OMNIMESH_COLORS[node.type] || '#fff'
      const opc = node.status === 'active' ? 1 : node.status === 'planned' ? 0.55 : 0.30
      const el  = mkEl(`<div class="mesh-marker" style="--mc:${col};opacity:${opc};display:none"><div class="mesh-dot"></div><div class="mesh-ring"></div><div class="mesh-lbl">${node.type}</div></div>`)
      const pop = new maplibregl.Popup({ className:'mpop', maxWidth:'280px' })
        .setHTML(`<div class="pt" style="color:${col}">📡 ${node.label}</div>
          <div class="pr"><span class="pk">Type</span><span class="pv">${node.type}</span></div>
          <div class="pr"><span class="pk">Status</span><span class="pv" style="color:${node.status==='active'?'#00ff88':node.status==='planned'?'#ffcc00':'#4a6278'}">${node.status.toUpperCase()}</span></div>
          <div style="font-size:9px;color:#ccd8e8;line-height:1.55;margin-top:6px">${node.note}</div>`)
      return new maplibregl.Marker({ element: el }).setLngLat([node.lng, node.lat]).setPopup(pop).addTo(map)
    })

    // Hazard + CLUP are lazy-loaded — fetched only when user first toggles them ON
    // See lazyLoadLayer() above

    // ── ENFORCE VISUAL HIERARCHY ──────────────────────────────────────────
    // Strict z-order: Layer2 zone fills → Layer3 parcels → Layer3 lines → Layer4 HTML markers
    // MapLibre layers render in add order; moveLayer() corrects post-add.
    // HTML markers are always DOM-on-top regardless of GeoJSON layer order.
    ;['strat-fills','strat-lines'].forEach(id => {
      // Zone fills must sit BELOW parcel circles (csv-clusters)
      if (map.getLayer(id) && map.getLayer('csv-clusters'))
        map.moveLayer(id, 'csv-clusters')
    })
    ;['zones-outer-fill','zones-inner-fill','zones-line'].forEach(id => {
      // Municipality zone circles also below parcels
      if (map.getLayer(id) && map.getLayer('csv-clusters'))
        map.moveLayer(id, 'csv-clusters')
    })
    // Province outline stays at very bottom of BLIS layers
    ;['province-fill','province-line'].forEach(id => {
      if (map.getLayer(id) && map.getLayer('zones-outer-fill'))
        map.moveLayer(id, 'zones-outer-fill')
    })
  }

  // ── csvParcels sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded.current || !csvParcels?.length) return
    const map = map$.current
    if (!map?.getSource('csv-parcels')) return
    map.getSource('csv-parcels').setData({
      type:'FeatureCollection',
      features: csvParcels.map(p => ({
        type:'Feature',
        properties:{ ...p },
        geometry:{ type:'Point', coordinates:[parseFloat(p.lng), parseFloat(p.lat)] },
      })),
    })
  }, [csvParcels])

  // ── LAYER TOGGLES ─────────────────────────────────────────────────────────
  useEffect(() => { toggle('zones',     zonesOn)    }, [zonesOn])
  useEffect(() => { toggle('infra',     infraOn)    }, [infraOn])
  useEffect(() => { toggle('recs',      recsOn)     }, [recsOn])
  useEffect(() => { toggle('land',      landOn)     }, [landOn])
  useEffect(() => { toggle('heatmap',   heatmapOn)  }, [heatmapOn])
  useEffect(() => { toggle('sovereign', sovereignOn)}, [sovereignOn])
  useEffect(() => { toggle('omnimesh',  omnimeshOn) }, [omnimeshOn])
  useEffect(() => { toggle('strategic', strategicOn)}, [strategicOn])

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
      map$.current.flyTo({ center:[flyTarget.lng, flyTarget.lat], zoom:15, duration:1400 })
  }, [flyTarget])

  // ── ASSET / PLACING MODE ──────────────────────────────────────────────────
  useEffect(() => {
    placing.current = { active: !!selectedAsset, assetId: selectedAsset }
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
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff3355',borderRadius:2}} /><span>HIGH urgency</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#ff6b35',borderRadius:2}} /><span>MEDIUM urgency</span></div>
            <div className="mleg-row"><div className="mleg-dot" style={{background:'#4a6278',borderRadius:2}} /><span>LOW urgency</span></div>

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
    <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}" target="_blank" style="display:block;margin-top:8px;padding:6px 10px;background:rgba(0,200,100,.15);border:1px solid rgba(0,200,100,.4);border-radius:4px;color:#00ff88;text-decoration:none;font-size:10px;text-align:center">📍 Open Street View</a>
    <div style="font-size:9px;color:#ccd8e8;line-height:1.5;margin-top:6px;border-top:1px solid rgba(255,255,255,.06);padding-top:6px">${p.why.slice(0,180)}…</div>`
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
