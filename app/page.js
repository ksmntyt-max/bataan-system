'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import GlobeScreen from '@/components/GlobeScreen'
import Sidebar from '@/components/Sidebar'
import ParcelPanel from '@/components/ParcelPanel'
import InvestmentCalc from '@/components/InvestmentCalc'
import { ASSETS } from '@/lib/data'
import { scoreColor } from '@/lib/scoring'

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
  const [entered,       setEntered]       = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('blis_entered') === '1'
    return false
  })
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [heatmapOn,     setHeatmapOn]     = useState(false)
  const [zonesOn,       setZonesOn]       = useState(true)
  const [infraOn,       setInfraOn]       = useState(true)
  const [recsOn,        setRecsOn]        = useState(true)
  const [landOn,        setLandOn]        = useState(true)
  const [hazardOn,      setHazardOn]      = useState(false)
  const [clupOn,        setClupOn]        = useState(false)
  const [sovereignOn,   setSovereignOn]   = useState(false)
  const [omnimeshOn,    setOmnimeshOn]    = useState(false)
  const [strategicOn,   setStrategicOn]   = useState(false)
  const [deployedPins,  setDeployedPins]  = useState([])
  const [lastScore,     setLastScore]     = useState(null)
  const [selectedParcel,setSelectedParcel]= useState(null)
  const [showCalc,      setShowCalc]      = useState(false)
  const [csvParcels,    setCsvParcels]    = useState([])
  const [flyTarget,     setFlyTarget]     = useState(null)
  const [mapRef,        setMapRef]        = useState(null)

  // Load CSV parcels
  useEffect(() => {
    fetch('/data/parcels.csv').then(r => r.text()).then(t => setCsvParcels(parseCSV(t))).catch(() => {})
  }, [])

  // Hazard / CLUP / Sovereign / OmniMesh layer pass-through
  useEffect(() => { if (typeof window !== 'undefined') window.__blisToggleLayer?.('hazard',    hazardOn)    }, [hazardOn])
  useEffect(() => { if (typeof window !== 'undefined') window.__blisToggleLayer?.('clup',      clupOn)      }, [clupOn])

  const handleFlyToRec = useCallback((rec) => {
    setFlyTarget({ lat: rec.lat, lng: rec.lng })
  }, [])

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
          <button className={`tb-btn${heatmapOn ? ' on' : ''}`} onClick={() => setHeatmapOn(v => !v)}>⬡ HEATMAP</button>
          <button className={`tb-btn${zonesOn   ? ' on' : ''}`} onClick={() => setZonesOn(v => !v)}>⬡ ZONES</button>
          <button className={`tb-btn${infraOn   ? ' on' : ''}`} onClick={() => setInfraOn(v => !v)}>⬡ INFRA</button>
          <button className={`tb-btn${hazardOn  ? ' on' : ''}`} onClick={() => setHazardOn(v => !v)} style={{borderColor:'rgba(255,51,85,.35)',color:'#ff3355'}}>⚠ HAZARD</button>
          <button className={`tb-btn${clupOn    ? ' on' : ''}`} onClick={() => setClupOn(v => !v)} style={{borderColor:'rgba(156,68,255,.35)',color:'#9c44ff'}}>⬡ CLUP</button>
          <div className="sdots">
            <div className="sdot live" /><div className="sdot live" /><div className="sdot" />
          </div>
        </div>

        <div id="body-wrap">
          <Sidebar
            selectedAsset={selectedAsset}
            onAssetChange={setSelectedAsset}
            heatmapOn={heatmapOn} zonesOn={zonesOn} infraOn={infraOn} recsOn={recsOn} landOn={landOn}
            hazardOn={hazardOn}     clupOn={clupOn}
            sovereignOn={sovereignOn} omnimeshOn={omnimeshOn} strategicOn={strategicOn}
            onToggleHeatmap={() => setHeatmapOn(v => !v)}
            onToggleZones={()   => setZonesOn(v => !v)}
            onToggleInfra={()   => setInfraOn(v => !v)}
            onToggleRecs={()    => setRecsOn(v => !v)}
            onToggleLand={()    => setLandOn(v => !v)}
            onToggleHazard={()  => setHazardOn(v => !v)}
            onToggleClup={()    => setClupOn(v => !v)}
            onToggleSovereign={() => setSovereignOn(v => !v)}
            onToggleOmnimesh={() => setOmnimeshOn(v => !v)}
            onToggleStrategic={() => setStrategicOn(v => !v)}
            deployedPins={deployedPins}
            onPinDelete={id => {
              setDeployedPins(p => p.filter(pin => pin.id !== id))
              window.__blisRemovePin?.(id)
            }}
            onFlyToRec={handleFlyToRec}
            onOpenCalc={() => setShowCalc(true)}
          />

          <div id="map-wrap">
            <MapWrapper
              selectedAsset={selectedAsset}
              heatmapOn={heatmapOn} zonesOn={zonesOn} infraOn={infraOn} recsOn={recsOn} landOn={landOn}
              sovereignOn={sovereignOn} omnimeshOn={omnimeshOn} strategicOn={strategicOn}
              onParcelSelect={setSelectedParcel}
              onScoreUpdate={setLastScore}
              csvParcels={csvParcels}
              flyTarget={flyTarget}
              deployedPins={deployedPins}
              onPinDeploy={pin => setDeployedPins(prev => [...prev, pin])}
              onPinRemove={id => setDeployedPins(prev => prev.filter(p => p.id !== id))}
            />
          </div>
        </div>

        {/* Bottom toolbar */}
        <div id="toolbar">
          <div className="tool-lbl">DEPLOY<br/>ASSET</div>
          <div className="tsep" />
          <div className="tool-assets">
            {Object.values(ASSETS).map(a => (
              <div key={a.id} className={`tab-btn2${selectedAsset === a.id ? ' on' : ''}`}
                style={{'--bc': a.color}} onClick={() => setSelectedAsset(selectedAsset === a.id ? null : a.id)}>
                <span className="ti2">{a.icon}</span>
                <span className="tn2">{a.label}</span>
              </div>
            ))}
          </div>
          <div className="tsep" />
          <div className="tool-hint-wrap">
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
      {selectedParcel && (
        <ParcelPanel parcel={selectedParcel} onClose={() => setSelectedParcel(null)} />
      )}

      {/* Investment comparison modal */}
      {showCalc && <InvestmentCalc onClose={() => setShowCalc(false)} />}

      {/* Toast */}
      <div id="toast"><div className="tt" id="tt" /><div id="tb" /></div>
    </>
  )
}
