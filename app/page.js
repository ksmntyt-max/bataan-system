'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import GlobeScreen from '@/components/GlobeScreen'
import Sidebar from '@/components/Sidebar'
import ParcelPanel from '@/components/ParcelPanel'
import ZonePanel from '@/components/ZonePanel'
import InvestmentCalc from '@/components/InvestmentCalc'
import { ASSETS, ZONE_DATA } from '@/lib/data'
import { scoreColor } from '@/lib/scoring'
import { useBLISState } from '@/lib/useBLISState'

const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { ssr: false })

function parseCSV(text) {
  const [header, ...rows] = text.trim().split('\n')
  const keys = header.split(',').map(k => k.trim())
  return rows.map(row => {
    const vals = row.split(',').map(v => v.trim())
    return Object.fromEntries(keys.map((k, i) => [k, vals[i] ?? '']))
  })
}

export default function Home() {
  // ── Central map state (single source of truth) ──────────────────────────
  const { state, actions } = useBLISState()
  const {
    activeAsset, activeLayers, deployedPins, lastScore,
    flyTarget, openPanel, activeParcel, selectedZone,
  } = state
  const {
    heatmap: heatmapOn, zones: zonesOn, infra: infraOn, recs: recsOn, land: landOn,
    hazard: hazardOn, clup: clupOn, sovereign: sovereignOn,
    omnimesh: omnimeshOn, strategic: strategicOn,
  } = activeLayers

  // ── UI-only state (not shared across components) ─────────────────────────
  const [entered,      setEntered]      = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('blis_entered') === '1'
    return false
  })
  const [csvParcels,   setCsvParcels]   = useState([])
  const [hoveredAsset, setHoveredAsset] = useState(null)
  const [tooltipX,     setTooltipX]     = useState(0)
  const toolbarRef = useRef(null)

  // Load CSV parcels
  useEffect(() => {
    fetch('/data/parcels.csv').then(r => r.text()).then(t => setCsvParcels(parseCSV(t))).catch(() => {})
  }, [])

  // Hazard / CLUP layer pass-through to MapLibre (imperative bridge)
  useEffect(() => { if (typeof window !== 'undefined') window.__blisToggleLayer?.('hazard', hazardOn) }, [hazardOn])
  useEffect(() => { if (typeof window !== 'undefined') window.__blisToggleLayer?.('clup',   clupOn)   }, [clupOn])

  const handleFlyToRec = useCallback(rec => actions.flyTo({ lat: rec.lat, lng: rec.lng }), [actions.flyTo])

  if (!entered) return <GlobeScreen onEnter={() => { sessionStorage.setItem('blis_entered', '1'); setEntered(true) }} />

  return (
    <>
      <div id="main-interface" className="visible">
        {/* Topbar */}
        <div id="topbar">
          <div className="tb-logo">
            <span className="lf">FIRMA</span><span className="ls">·</span><span className="lb">BLIS</span>
          </div>
          <div className="tb-title">Bataan Land Intelligence System v1.2</div>
          <div className="tbsp" />
          <Link href="/compare" className="tb-btn" style={{textDecoration:'none'}}>📊 COMPARE</Link>
          <button className={`tb-btn${heatmapOn ? ' on' : ''}`} onClick={() => actions.toggleLayer('heatmap')}>⬡ HEATMAP</button>
          <button className={`tb-btn${zonesOn   ? ' on' : ''}`} onClick={() => actions.toggleLayer('zones')}>⬡ ZONES</button>
          <button className={`tb-btn${infraOn   ? ' on' : ''}`} onClick={() => actions.toggleLayer('infra')}>⬡ INFRA</button>
          <button className={`tb-btn${hazardOn  ? ' on' : ''}`} onClick={() => actions.toggleLayer('hazard')} style={{borderColor:'rgba(255,51,85,.35)',color:'#ff3355'}}>⚠ HAZARD</button>
          <button className={`tb-btn${clupOn    ? ' on' : ''}`} onClick={() => actions.toggleLayer('clup')} style={{borderColor:'rgba(156,68,255,.35)',color:'#9c44ff'}}>⬡ CLUP</button>
          <div className="sdots">
            <div className="sdot live" /><div className="sdot live" /><div className="sdot" />
          </div>
        </div>

        <div id="body-wrap">
          <Sidebar
            selectedAsset={activeAsset}
            onAssetChange={actions.selectAsset}
            heatmapOn={heatmapOn} zonesOn={zonesOn} infraOn={infraOn} recsOn={recsOn} landOn={landOn}
            hazardOn={hazardOn}     clupOn={clupOn}
            sovereignOn={sovereignOn} omnimeshOn={omnimeshOn} strategicOn={strategicOn}
            onToggleHeatmap={() => actions.toggleLayer('heatmap')}
            onToggleZones={()   => actions.toggleLayer('zones')}
            onToggleInfra={()   => actions.toggleLayer('infra')}
            onToggleRecs={()    => actions.toggleLayer('recs')}
            onToggleLand={()    => actions.toggleLayer('land')}
            onToggleHazard={()  => actions.toggleLayer('hazard')}
            onToggleClup={()    => actions.toggleLayer('clup')}
            onToggleSovereign={() => actions.toggleLayer('sovereign')}
            onToggleOmnimesh={() => actions.toggleLayer('omnimesh')}
            onToggleStrategic={() => actions.toggleLayer('strategic')}
            deployedPins={deployedPins}
            onPinDelete={id => { actions.removePin(id); window.__blisRemovePin?.(id) }}
            onFlyToRec={handleFlyToRec}
            onOpenCalc={actions.openCalc}
          />

          <div id="map-wrap">
            <MapWrapper
              selectedAsset={activeAsset}
              heatmapOn={heatmapOn} zonesOn={zonesOn} infraOn={infraOn} recsOn={recsOn} landOn={landOn}
              sovereignOn={sovereignOn} omnimeshOn={omnimeshOn} strategicOn={strategicOn}
              onParcelSelect={actions.selectParcel}
              onZoneSelect={actions.selectZone}
              onScoreUpdate={actions.setScore}
              csvParcels={csvParcels}
              flyTarget={flyTarget}
              deployedPins={deployedPins}
              onPinDeploy={actions.addPin}
              onPinRemove={actions.removePin}
            />
          </div>
        </div>

        {/* Bottom toolbar */}
        <div id="toolbar" ref={toolbarRef}>
          <div className="tool-lbl">DEPLOY<br/>ASSET</div>
          <div className="tsep" />
          <div className="tool-assets" role="radiogroup" aria-label="Select asset type to deploy">
            {Object.values(ASSETS).map(a => (
              <div key={a.id}
                className={`tab-btn2${activeAsset === a.id ? ' on' : ''}`}
                style={{'--bc': a.color}}
                role="radio"
                aria-checked={activeAsset === a.id}
                tabIndex={0}
                aria-label={`${a.label}: ${a.tooltip?.tagline ?? ''}`}
                onClick={() => actions.selectAsset(a.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') actions.selectAsset(a.id) }}
                onMouseEnter={e => {
                  const btnRect = e.currentTarget.getBoundingClientRect()
                  const tbRect  = toolbarRef.current.getBoundingClientRect()
                  const x = btnRect.left - tbRect.left + btnRect.width / 2 - 140
                  setTooltipX(Math.max(8, Math.min(x, tbRect.width - 296)))
                  setHoveredAsset(a.id)
                }}
                onMouseLeave={() => setHoveredAsset(null)}
              >
                <span className="ti2">{a.icon}</span>
                <span className="tn2">{a.label}</span>
              </div>
            ))}
          </div>

          {/* Asset hover tooltip */}
          {hoveredAsset && (() => {
            const a = ASSETS[hoveredAsset]
            const t = a.tooltip
            return (
              <div id="asset-tooltip" style={{ left: tooltipX }} role="tooltip">
                <div className="tip-header" style={{ background: a.color }}>
                  <span className="tip-icon">{a.icon}</span>
                  <div>
                    <strong>{a.label}</strong>
                    <small>{t.tagline}</small>
                  </div>
                </div>
                <div className="tip-body">
                  <p className="tip-desc">{t.description}</p>
                  <div className="tip-meta"><span>📍 Best Zones</span> · {t.bestZones.join(', ')}</div>
                  <div className="tip-incentive">💰 {t.incentive}</div>
                </div>
              </div>
            )
          })()}

          <div className="tsep" />
          <div className="tool-hint-wrap" aria-live="polite" aria-atomic="true">
            {lastScore ? (
              <>
                <div className="score-big">LAST COMPOSITE SCORE</div>
                <div className="score-num" style={{color: scoreColor(lastScore)}}>{lastScore}</div>
              </>
            ) : (
              <div className="tool-hint">Select an asset · click the map to deploy · click pins for Street View</div>
            )}
          </div>
        </div>
      </div>

      {/* Parcel detail panel */}
      {openPanel === 'parcel' && activeParcel && (
        <ParcelPanel parcel={activeParcel} onClose={actions.closePanel} />
      )}

      {/* Zone info panel — AFAB / SBFZ */}
      {openPanel === 'zone' && selectedZone && ZONE_DATA[selectedZone] && (
        <ZonePanel
          zoneKey={selectedZone}
          onClose={actions.closePanel}
          onDeployHere={key => {
            const z = ZONE_DATA[key]
            if (z?.center) actions.flyTo({ lat: z.center.lat, lng: z.center.lng })
          }}
        />
      )}

      {/* Investment comparison modal */}
      {openPanel === 'calc' && <InvestmentCalc onClose={actions.closePanel} />}

      {/* Toast */}
      <div id="toast" role="status" aria-live="polite"><div className="tt" id="tt" /><div id="tb" /></div>
    </>
  )
}
