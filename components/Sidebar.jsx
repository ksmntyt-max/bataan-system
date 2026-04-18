'use client'

import { useState } from 'react'
import { ASSETS, RECS, LAND_OPPS, MUNICIPALITIES } from '@/lib/data'
import { landCompatScore, scoreColor, zonalColor, formatPHP } from '@/lib/scoring'

const TABS = ['LAYERS', 'PINS', 'RECS', 'LAND', 'DATA']

export default function Sidebar({
  selectedAsset, onAssetChange,
  heatmapOn, zonesOn, infraOn, recsOn, landOn,
  onToggleHeatmap, onToggleZones, onToggleInfra, onToggleRecs, onToggleLand,
  hazardOn, clupOn, onToggleHazard, onToggleClup,
  deployedPins, onPinDelete, onFlyToRec,
  onOpenCalc,
}) {
  const [tab, setTab]           = useState(0)
  const [recAsset, setRecAsset] = useState('hq')
  const [landFilter, setLandFilter] = useState({ asset: 'all', budget: 'all', sort: 'compat' })
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg]   = useState('Select an asset type first to enable asset-specific scan')
  const [scanDone, setScanDone] = useState(false)

  function filteredParcels() {
    let list = [...LAND_OPPS]
    if (landFilter.asset !== 'all') list = list.filter(p => p.bestFor.includes(landFilter.asset))
    if (landFilter.budget === '5m')  list = list.filter(p => (p.sqmMin * p.priceMin) < 5_000_000)
    if (landFilter.budget === '20m') list = list.filter(p => (p.sqmMin * p.priceMin) >= 5_000_000 && (p.sqmMax * p.priceMax) <= 20_000_000)
    if (landFilter.budget === '50m') list = list.filter(p => (p.sqmMax * p.priceMax) >= 20_000_000 && (p.sqmMax * p.priceMax) <= 50_000_000)
    if (landFilter.budget === '100m')list = list.filter(p => (p.sqmMax * p.priceMax) > 50_000_000)
    const assetId = landFilter.asset !== 'all' ? landFilter.asset : selectedAsset
    list = list.map(p => ({ ...p, _compat: landCompatScore(p, assetId) }))
    if (landFilter.sort === 'compat')     list.sort((a, b) => b._compat - a._compat)
    if (landFilter.sort === 'price_asc')  list.sort((a, b) => a.priceMin - b.priceMin)
    if (landFilter.sort === 'price_desc') list.sort((a, b) => b.priceMax - a.priceMax)
    if (landFilter.sort === 'urgency')    list.sort((a, b) => ['HIGH','MEDIUM','LOW'].indexOf(a.urgency) - ['HIGH','MEDIUM','LOW'].indexOf(b.urgency))
    return list
  }

  function autoScan() {
    if (!selectedAsset) { setScanMsg('⚠ Select an asset type first'); return }
    setScanning(true); setScanDone(false)
    const phases = [
      'Scanning Bataan province grid...',
      'Checking power & port infrastructure...',
      'Analyzing zoning compatibility...',
      'Calculating BIR cost factors...',
      'Ranking parcel opportunities...',
      'Identifying optimal acquisition target...',
    ]
    let i = 0
    const id = setInterval(() => {
      setScanMsg(phases[i] || phases[phases.length - 1])
      i++
      if (i >= phases.length) {
        clearInterval(id)
        setScanning(false); setScanDone(true)
        setLandFilter(f => ({ ...f, asset: selectedAsset, sort: 'compat' }))
        const top = LAND_OPPS.filter(p => p.bestFor.includes(selectedAsset))
          .sort((a, b) => landCompatScore(b, selectedAsset) - landCompatScore(a, selectedAsset))[0]
        setScanMsg(top ? `✓ Best buy: ${top.name} (${MUNICIPALITIES.find(m => m.id === top.muniId)?.name})` : 'Scan complete')
      }
    }, 420)
  }

  return (
    <div id="sidebar">
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={t} className={`tab-btn${tab === i ? ' on' : ''}${t === 'LAND' ? ' land-tab' : ''}`} onClick={() => setTab(i)}>
            {t}{t === 'PINS' && deployedPins?.length ? <span className="pin-count">{deployedPins.length}</span> : null}
          </button>
        ))}
      </div>

      {/* LAYERS */}
      {tab === 0 && (
        <div className="tc on">
          <div className="shd">SELECT ASSET TYPE</div>
          <div className="asset-grid">
            {Object.values(ASSETS).map(a => (
              <div key={a.id} className={`a-tile${selectedAsset === a.id ? ' sel' : ''}`}
                style={{'--tc': a.color}} onClick={() => onAssetChange(selectedAsset === a.id ? null : a.id)}>
                <span className="a-tile-icon">{a.icon}</span>
                <div className="a-tile-name">{a.label}</div>
                <div className="a-tile-sub" style={{color: a.color}}>{a.sub}</div>
              </div>
            ))}
          </div>

          <div className="shd" style={{marginTop:6}}>MAP LAYERS</div>
          {[
            { label:'Zonal Value Zones',  on: zonesOn,   toggle: onToggleZones,   dot: '#ffcc00' },
            { label:'Infrastructure',     on: infraOn,   toggle: onToggleInfra,   dot: '#00b4ff' },
            { label:'Recommendations',    on: recsOn,    toggle: onToggleRecs,    dot: '#00ff88' },
            { label:'Land Parcels',       on: landOn,    toggle: onToggleLand,    dot: '#ffcc00' },
            { label:'Composite Heatmap',  on: heatmapOn, toggle: onToggleHeatmap, dot: '#ff6b35' },
          ].map(l => (
            <div key={l.label} className="lrow" onClick={l.toggle}>
              <div className={`tsw${l.on ? ' on' : ''}`}><div className="tth" /></div>
              <div className="ldot" style={{background: l.dot}} />
              <span className="lname">{l.label}</span>
            </div>
          ))}

          <div className="shd" style={{marginTop:6}}>NEW DATA LAYERS</div>
          {[
            { label:'Hazard Zones (Flood/Surge)',  on: hazardOn, toggle: onToggleHazard, dot: '#ff3355' },
            { label:'CLUP Zoning (Agri/Ind/Com)',  on: clupOn,   toggle: onToggleClup,   dot: '#9c44ff' },
          ].map(l => (
            <div key={l.label} className="lrow" onClick={l.toggle}>
              <div className={`tsw${l.on ? ' on' : ''}`}><div className="tth" /></div>
              <div className="ldot" style={{background: l.dot}} />
              <span className="lname">{l.label}</span>
            </div>
          ))}

          <div className="shd" style={{marginTop:6}}>LEGEND</div>
          <div className="leg-bar" />
          <div className="leg-lbl"><span>Low Value</span><span>High Value</span></div>
          <div style={{marginTop:8}}>
            {[['⚠ Flood Zone','#0060ff'],['⚠ Storm Surge','#8800ff'],['⚠ Liquefaction','#ff6600'],
              ['Industrial (CLUP)','#ff6b35'],['Commercial (CLUP)','#00b4ff'],['Agricultural (CLUP)','#00ff88'],['Protected (CLUP)','#ff3355']].map(([lb,co]) => (
              <div key={lb} className="sband"><div className="ssw" style={{background:co}} /><span style={{fontSize:9}}>{lb}</span></div>
            ))}
          </div>

          <button className="calc-open-btn" onClick={onOpenCalc}>⚖ Investment Calculator</button>
        </div>
      )}

      {/* PINS */}
      {tab === 1 && (
        <div className="tc on">
          {deployedPins?.length ? deployedPins.map((pin, i) => (
            <div key={i} className="pin-card">
              <div className="pch">
                <span className="pci">{ASSETS[pin.assetId]?.icon}</span>
                <span className="pcn">{ASSETS[pin.assetId]?.label}<br/><span style={{color:'var(--dim)',fontWeight:400}}>{pin.muni}</span></span>
                <span className="pcs" style={{color: scoreColor(pin.score.total)}}>{pin.score.total}</span>
                <span className="pdel" onClick={() => onPinDelete(pin.id)}>✕</span>
              </div>
              <div className="psb"><div className="psf" style={{width:`${pin.score.total}%`,background:scoreColor(pin.score.total)}} /></div>
              <div className="pcomps">
                {[['PORT',pin.score.port],['POWER',pin.score.power],['ROAD',pin.score.road],['ZONE',pin.score.zoning],['COST',pin.score.cost]].map(([k,v]) => (
                  <div key={k} className="cr"><span className="ck">{k}</span><span className="cv">{v}</span></div>
                ))}
              </div>
            </div>
          )) : (
            <div className="no-pins">No assets deployed yet.<br/>Select an asset type,<br/>then click the map.</div>
          )}
        </div>
      )}

      {/* RECS */}
      {tab === 2 && (
        <div className="tc on">
          <div className="rec-asset-tabs">
            {Object.values(ASSETS).map(a => (
              <button key={a.id} className={`rat${recAsset === a.id ? ' on' : ''}`}
                style={{'--rc': a.color}} onClick={() => setRecAsset(a.id)}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
          {RECS[recAsset]?.map((rec, i) => (
            <div key={i} className="rec-card">
              <div className="rec-rank">{i + 1}</div>
              <div className="rec-header">
                <span className="rec-icon">{ASSETS[recAsset].icon}</span>
                <span className="rec-name">{rec.name}</span>
                <span className="rec-score" style={{color: scoreColor(rec.score)}}>{rec.score}</span>
              </div>
              <div className="rec-muni">📍 {MUNICIPALITIES.find(m => m.id === rec.muniId)?.name}</div>
              <div className="rec-note">{rec.note}</div>
              <div className="rec-btns">
                <button className="rbtn primary" onClick={() => onFlyToRec?.(rec)}>Fly to Location</button>
                <a className="rbtn" href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${rec.lat},${rec.lng}`} target="_blank" rel="noopener noreferrer">📍 Street View</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LAND */}
      {tab === 3 && (
        <div className="tc on">
          <div className="auto-scan-box">
            <div className="as-title">AI LAND SCANNER</div>
            <div className="as-sub">Auto-ranks all available parcels by asset compatibility.</div>
            <button id="auto-scan-btn" className={`${scanning ? 'scanning' : scanDone ? 'done' : ''}`} onClick={autoScan} disabled={scanning}>
              <span>{scanning ? '◌' : '⬡'}</span>
              <span>{scanning ? 'SCANNING...' : scanDone ? 'SCAN COMPLETE' : 'AUTO-SCAN FOR LAND'}</span>
            </button>
            <div className={`scan-status${scanning ? ' active' : ''}`}>{scanMsg}</div>
          </div>

          <div className="shd">FILTER PARCELS</div>
          <div className="land-filters">
            <div className="filter-row">
              <span className="filter-label">ASSET</span>
              <div className="fpills">
                {['all','hq','haven','forge','solar'].map(v => (
                  <div key={v} className={`fpill${landFilter.asset === v ? ' on' : ''}`}
                    onClick={() => setLandFilter(f => ({...f, asset: v}))}>
                    {v === 'all' ? 'ALL' : ASSETS[v]?.icon}
                  </div>
                ))}
              </div>
            </div>
            <div className="filter-row">
              <span className="filter-label">SORT</span>
              <select className="fsel" value={landFilter.sort} onChange={e => setLandFilter(f => ({...f, sort: e.target.value}))}>
                <option value="compat">Compatibility Score ↓</option>
                <option value="price_asc">Price Low → High</option>
                <option value="price_desc">Price High → Low</option>
                <option value="urgency">Urgency (HIGH first)</option>
              </select>
            </div>
          </div>

          <div className="shd" style={{marginTop:4}}>
            PARCELS <span style={{color:'var(--accent)'}}>{filteredParcels().length}</span>
          </div>
          {filteredParcels().map((p, i) => {
            const urgClass = p.urgency === 'HIGH' ? 'urg-high' : p.urgency === 'MEDIUM' ? 'urg-med' : 'urg-low'
            return (
              <div key={p.id} className={`land-card${i === 0 && scanDone ? ' top-match' : ''}`}>
                <div className="lc-header">
                  <div className={`lc-urgency ${urgClass}`}>{p.urgency}</div>
                  <div className="lc-name">{p.name}</div>
                  {p.tag && <div className="lc-tag">{p.tag}</div>}
                </div>
                <div className="lc-meta">
                  <span className="lc-muni">{MUNICIPALITIES.find(m => m.id === p.muniId)?.name}</span>
                  <span className="lc-class">{p.class}</span>
                  <span className="lc-price">₱{p.priceMin.toLocaleString()}–{p.priceMax.toLocaleString()}/sqm</span>
                </div>
                <div className="lc-compat">
                  COMPAT: <span style={{color: scoreColor(p._compat)}}>{p._compat}/100</span>
                </div>
                <div className="lc-score-bar">
                  <div className="lc-score-fill" style={{width:`${p._compat}%`, background: scoreColor(p._compat)}} />
                </div>
                <div className="lc-why collapsed">{p.why}</div>
                <div className="lc-btns">
                  <a className="lbtn" href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer">📍 Street View</a>
                  <button className="lbtn primary" onClick={() => onFlyToRec?.({lat: p.lat, lng: p.lng})}>Fly To</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DATA */}
      {tab === 4 && (
        <div className="tc on">
          <div className="shd">MUNICIPALITY PROFILES</div>
          {MUNICIPALITIES.map(m => {
            const avg = Math.round((m.zonalMin + m.zonalMax) / 2)
            return (
              <div key={m.id} className="muni-card">
                <div className="mn">{m.name.toUpperCase()}</div>
                <div className="mm">
                  <span>Pop: {m.pop.toLocaleString()}</span>
                  <span className="mz" style={{color: zonalColor(avg)}}>₱{avg.toLocaleString()}/sqm</span>
                </div>
                <div className="ds">{m.features.join(' · ')}</div>
              </div>
            )
          })}
          <div className="ds" style={{marginTop:8}}>Sources: BIR Zonal Values 2024 · Bataan 2026 SMV · PSA Census 2020 · SBMA/SBFZ · RA 11453</div>
        </div>
      )}
    </div>
  )
}
