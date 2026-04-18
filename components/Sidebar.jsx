'use client'

import { useState } from 'react'
import { ASSETS, RECS, LAND_OPPS, MUNICIPALITIES, SOVEREIGN_PROFILES, OMNIMESH_NODES } from '@/lib/data'
import { landCompatScore, scoreColor, zonalColor, formatPHP } from '@/lib/scoring'

const TABS = ['LAYERS', 'PINS', 'RECS', 'LAND', 'DATA', 'ECO']

const SIM_MODES = {
  sandbox: { label:'01·SANDBOX', color:'#00b4ff', desc:'Explore & recon mode — map analysis, parcel scanning, feasibility. Build your intel picture before committing capital.' },
  sim:     { label:'02·SIM',     color:'#00ff88', desc:'Simulation mode — deploy assets, run composite scoring, compare site scenarios across the province. No commitments.' },
  mint:    { label:'03·MINT',    color:'#ffcc00', desc:'Firmamint prep — register the Bataan shard, stake $CIK, initiate Proof of Sowing sequence and validator onboarding.' },
  settle:  { label:'04·SETTLE',  color:'#9c44ff', desc:'Settlement mode — T0→T1 pathway, LGU engagement tracking, permit submission, first Haven settlers onboarded.' },
}

const LADDER_STEPS = [
  { icon:'🏗', label:'Land Secured',       sub:'Identify & acquire target parcels',                status:'target'  },
  { icon:'🤝', label:'LGU Alignment',      sub:'Engage barangay → municipality → province',         status:'locked'  },
  { icon:'⛓', label:'Shard Registration', sub:'Bataan Firmamint node initialization + $CIK stake', status:'locked'  },
  { icon:'🏘', label:'Settlement T1',      sub:'First Haven settlers onboarded (Firma residency)',  status:'locked'  },
  { icon:'🏛', label:'Full Sovereignty',   sub:'Nation of Heaven EDGE node recognized',             status:'locked'  },
]

const LADDER_DETAILS = [
  { // Step 1: Land Secured
    summary:'Secure a physical base in Bataan — leased or owned. This is the foundation of the sovereign EDGE node. Choose between a fast temporary HQ or a permanent land acquisition.',
    pathways:[
      { label:'Option A — Temporary HQ', icon:'🏢', color:'#00b4ff', sub:'Lease commercial space · Deploy SeedBase container · 60–90 days',
        steps:['Identify lease target: Mariveles CBD or Balanga City commercial district','Negotiate 1-year lease with option to renew + expansion clause','File Business Permit at LGU / Mariveles or Balanga City Hall','Deploy 1 × SeedBase HQ container on leased lot (crane-place or truck-place)','Connect to power grid + install first OmniMesh node','Fire Safety Certificate from BFP (Bureau of Fire Protection)','Covenant Chip installed and activated in HQ container','Firmamint shard dry-run attestation — prep for Step 3'] },
      { label:'Option B — Acquire Land + Build HQ', icon:'🏛', color:'#ffcc00', sub:'Buy BLIS top-ranked parcel · Full sovereign node · 6–18 months',
        steps:['Select parcel from BLIS LAND tab (SBFZ Block A or Mariveles RA 11453 Expansion recommended)','Engage licensed real estate broker for due diligence + title search','Obtain BIR Zonal Valuation Certificate for the parcel','DAR Conversion Order if land is agricultural (required for >5 ha)','RA 11453 endorsement letter from SBMA if in Mariveles Freeport zone','Execute Deed of Sale / SBMA Lease Agreement + SBFZ lot reservation','Register title transfer at Registry of Deeds (ROD)','Secure DPWH Building Permit + LGU Engineering Office sign-off','Deploy SeedBase HQ compound — full EDGE build-out (Hub + Forge + 2× Haven)'] },
    ],
    compliance:[
      { label:'SEC / DTI Business Registration', tier:'National' },
      { label:'BIR Tax ID + Certificate of Registration', tier:'National' },
      { label:"Mayor's Business Permit", tier:'Municipal' },
      { label:'SBMA / BCDA Zone Clearance (if applicable)', tier:'National' },
      { label:'Fire Safety Certificate (BFP)', tier:'Municipal' },
      { label:'Building Permit (DPWH / LGU Engineering)', tier:'Municipal' },
      { label:'DENR ECC if structure >1,000 sqm or industrial', tier:'National' },
    ],
  },
  { // Step 2: LGU Alignment
    summary:'Engage all levels of local government — barangay to provincial governor — to secure formal endorsements, resolutions, and regulatory clearances for Firma\'s deployment.',
    pathways:[
      { label:'Option A — Community First', icon:'🤝', color:'#00ff88', sub:'Barangay → Municipality → Province · Grassroots support first',
        steps:['Schedule barangay captain meeting — present Firma mission, job creation, FIT housing plan','Secure Barangay Resolution of Support (simple council majority vote)','Present to Sangguniang Bayan (Municipal Council) — use BLIS scoring data as proof','Secure Municipal Council Resolution + Mayor\'s Endorsement Letter','Brief Provincial Governor at Bataan Capitol (Balanga City) — NS Simulator demo','Secure Provincial Board Resolution + Governor\'s Endorsement','File all resolutions with SBMA Board if in Mariveles SBFZ zone','Submit RA 11453 Expansion Zone application to SBMA Legal Department'] },
      { label:'Option B — Top-Down Engagement', icon:'🏛', color:'#9c44ff', sub:'Governor → Mayor → Barangay · NS Simulator as proof tool',
        steps:['Present NS Simulator to Provincial Governor — show Bataan EDGE Zone economic potential','Secure Governor\'s Letter of Support for Firma Strategic EDGE deployment','Governor\'s office facilitates introductions to all 12 municipality mayors','Mayors of Mariveles + Balanga City briefed first (highest scoring sites)','Mayors issue Executive Orders or formal Endorsement Letters','LGU cascade to barangay captains via existing municipal network','SBMA Board presentation (SBFZ zone) — RA 11453 compliance pathway presented','Provincial Board resolution passed — Bataan officially designated Firma EDGE target'] },
    ],
    compliance:[
      { label:'Barangay Resolution of Support', tier:'Barangay' },
      { label:'Municipal Council Resolution', tier:'Municipal' },
      { label:"Mayor's Endorsement Letter", tier:'Municipal' },
      { label:'Provincial Board Resolution', tier:'Provincial' },
      { label:'SBMA Board Resolution (Mariveles SBFZ)', tier:'National' },
      { label:'DAR Conversion Order (agricultural land)', tier:'National' },
      { label:'DENR/EMB Environmental Screening Certificate', tier:'National' },
      { label:'RA 11453 Expansion Zone Application (if Mariveles)', tier:'National' },
    ],
  },
  { // Step 3: Shard Registration
    summary:'Register the Bataan Firmamint shard on-chain, stake $CIK, complete Proof of Sowing, and activate the economic layer of the sovereign node.',
    pathways:[
      { label:'Option A — Minimal Shard (Fast Start)', icon:'⚡', color:'#ffcc00', sub:'3 validators · Minimal stake · Get chain live fast',
        steps:['Recruit 3 initial validators from Firma team / FIT members already on-site','Stake minimum $CIK requirement per validator slot (consult Firmamint protocol docs)','Deploy Covenant Chip in SeedBase HQ container — hardware attestation recorded','Run Proof of Sowing Phase 1 (attestation of physical site coordinates + conditions)','Register shard ID BATAAN-ALPHA on Firmamint mainnet','OmniMesh connectivity test — minimum 3 nodes online and attested','FIG Cash wallet instantiation + test transaction loop complete','Declare Settlemint T0 — Economic Shard Live'] },
      { label:'Option B — Full Validator Set', icon:'⛓', color:'#9c44ff', sub:'7+ validators · Full stake · Complete Proof of Sowing before T0',
        steps:['Recruit 7+ validators — Firma team, FIT settlers, local Bataan partners, $CIK holders','Full $CIK stake per validator (complete shard capitalization before T0)','Complete full 4-phase Proof of Sowing sequence','Deploy Covenant Chips in all HQ + Haven containers (every unit attested)','Full OmniMesh activation: Mariveles Prime Hub + SBFZ Sentinel + ≥2 relay nodes','BSP VASP registration pre-cleared before T0 declaration','FIG Cash + $CIK → local exchange pair tested and active','Declare T0 with Firma Alliance announcement + press release'] },
    ],
    compliance:[
      { label:'BSP VASP Registration (Virtual Asset Service Provider)', tier:'National' },
      { label:'RA 8799 Securities Regulation Code compliance check', tier:'National' },
      { label:'Proof of Sowing — all phases completed', tier:'Protocol' },
      { label:'Covenant Chip hardware attestation (all deployed units)', tier:'Protocol' },
      { label:'OmniMesh ≥3 nodes live + peer-connected', tier:'Protocol' },
      { label:'FIG Cash wallet activation + KYC flow live', tier:'Protocol' },
      { label:'Firmamint on-chain shard ID registration', tier:'Protocol' },
    ],
  },
  { // Step 4: Settlement T1
    summary:'Onboard first Haven settlers to the Bataan node, activating Settlemint T0→T1 governance and proving the sovereign community model with living residents.',
    pathways:[
      { label:'Option A — FIT Team Soft Launch', icon:'🏘', color:'#00ff88', sub:'Firma Impact Team settlers only · Controlled T1 · 3–6 months',
        steps:['Dedicate 3–5 Haven pods to FIT (Firma Impact Team) members + families','FIT members sign Settlemint Covenant — T0→T1 governance obligations accepted','Deploy Edge Forge (Steel Forge container) — BTC mining revenue from day one','Solar + Ion+ battery bank live — full energy independence established','OmniMesh network operational — all FIT devices connected and attested','FIG Cash flows: Forge BTC → FIG → local purchasing power for settlers','Covenant Chips issued to all residents — sovereign on-chain identity active','Weekly team council meetings — pre-Governmint governance training begins'] },
      { label:'Option B — Open Settlement Recruitment', icon:'🌍', color:'#9c44ff', sub:'Public Haven applications · Full T1 community · 6–12 months',
        steps:['Launch Haven Bataan public application portal — open to global applicants','Applicant screening through Firma Covenant alignment process','Site tours + NS Simulator access for accepted applicants','Commission first 10–20 Haven units — fully furnished and attested','Community Charter drafted and ratified by founding settlers together','Governmint council elected — rotating 5-seat settler council','Local council formally interfaces with SBMA/LGU as community representative','FIG Cash + $CIK economy live — full economic integration','Media event: "Bataan Sovereign Node Goes Live" — Firma Alliance coverage'] },
    ],
    compliance:[
      { label:'DHSUD (HLURB) Subdivision Plan Approval', tier:'National' },
      { label:'Occupancy Certificate (LGU Engineering Office)', tier:'Municipal' },
      { label:'Fire Safety Certificate — residential (BFP)', tier:'Municipal' },
      { label:'Water / Sanitation Permit (LWUA or LGU)', tier:'Municipal' },
      { label:'DOLE Employer Registration (if employing settlers)', tier:'National' },
      { label:'PhilHealth / SSS / Pag-IBIG employer registration', tier:'National' },
      { label:'Community Charter filed with LGU + Firmamint', tier:'Protocol' },
      { label:'Governmint council formation + charter ratified on-chain', tier:'Protocol' },
    ],
  },
  { // Step 5: Full Sovereignty
    summary:'Bataan EDGE node achieves full Nation of Heaven recognition — active Firmamint shard, inter-node trade, full $CIK + FIG economy, PEZA recognition, and Firma Alliance membership.',
    pathways:[
      { label:'Option A — Firma Alliance Declaration', icon:'🏛', color:'#ffcc00', sub:'Network State declaration · $CIK + FIG live · Freedom of movement',
        steps:['Submit Bataan node proof stack to Firma Alliance Council (land docs, LGU resolutions, settler count, shard metrics)','Firma Alliance Council review and ratification vote','Atonemint + Figmint protocols activated for cross-node trade','$CIK circulating supply enters Bataan shard reserve (T2 threshold crossed)','Freedom of movement between Firma EDGE nodes activated for all settlers','Nation of Heaven sovereign ID issued to every Bataan settler','Bataan node listed on global Firma Alliance EDGE map','Bataan achieves Settlemint T3 — sovereign currency milestone'] },
      { label:'Option B — Philippines EDGE SEZ', icon:'🇵🇭', color:'#00b4ff', sub:'PEZA / BOI EDGE Zone · RA 7916 SEZ Act · Formal PH sovereign status',
        steps:['Prepare PEZA Zone Proclamation application (LGU endorsement + feasibility study required)','Submit to BOI for Pioneer Status — first sovereign containerized modular EDGE zone in PH','Engage SBMA for Bataan Technology Park expansion designation under RA 11453','RA 7042 Foreign Investment Act clearance for foreign equity in Forge + Solar ops','BSP full VASP License upgrade (from provisional to full license)','PEZA proclamation endorsed by President of the Philippines (long-term milestone)','$CIK recognized as BSP-regulated digital asset within Bataan SEZ perimeter','Bataan declared Firma APAC Sovereign EDGE Zone flagship — global announcement'] },
    ],
    compliance:[
      { label:'PEZA Registration / BOI Pioneer Status application', tier:'National' },
      { label:'RA 7042 Foreign Investment Act clearance', tier:'National' },
      { label:'BSP Full VASP License (upgrade from provisional)', tier:'National' },
      { label:'SEC crypto asset classification clearance', tier:'National' },
      { label:'Firma Alliance Charter ratification', tier:'Protocol' },
      { label:'Atonemint + Figmint protocol activation', tier:'Protocol' },
      { label:'Settlemint T3 metrics met and verified on-chain', tier:'Protocol' },
      { label:'Inter-node trade + freedom of movement agreement', tier:'Protocol' },
    ],
  },
]

const FIRMA_PRODUCTS = [
  { id:'seedbase', label:'SeedBase HQ',    icon:'🏛', status:'planned', color:'#00b4ff' },
  { id:'haven',    label:'Haven Village',  icon:'🏘', status:'planned', color:'#00ff88' },
  { id:'forge',    label:'Steel Forge',    icon:'⛏', status:'planned', color:'#ff6b35' },
  { id:'solar',    label:'Solar Grid',     icon:'☀', status:'planned', color:'#ffcc00' },
  { id:'mesh',     label:'OmniMesh Node',  icon:'📡', status:'future',  color:'#9c44ff' },
  { id:'elemint',  label:'Elemint XPLR',   icon:'💎', status:'future',  color:'#00ff88' },
  { id:'shard',    label:'Firmamint Shard',icon:'⛓', status:'future',  color:'#ffcc00' },
  { id:'figcash',  label:'FIG Cash',       icon:'💳', status:'future',  color:'#00b4ff' },
]

export default function Sidebar({
  selectedAsset, onAssetChange,
  heatmapOn, zonesOn, infraOn, recsOn, landOn,
  onToggleHeatmap, onToggleZones, onToggleInfra, onToggleRecs, onToggleLand,
  hazardOn, clupOn, onToggleHazard, onToggleClup,
  sovereignOn, omnimeshOn, onToggleSovereign, onToggleOmnimesh,
  deployedPins, onPinDelete, onFlyToRec,
  onOpenCalc,
}) {
  const [tab, setTab]               = useState(0)
  const [recAsset, setRecAsset]     = useState('hq')
  const [simMode, setSimMode]       = useState('sandbox')
  const [activeLadderStep, setActiveLadderStep] = useState(null)
  const [activeLadderPath, setActiveLadderPath] = useState(0)
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
          <button key={t} className={`tab-btn${tab === i ? ' on' : ''}${t === 'LAND' ? ' land-tab' : ''}${t === 'ECO' ? ' eco-tab' : ''}`} onClick={() => setTab(i)}>
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
            { label:'Zonal Value Zones',  desc:'BIR land values per sqm — color-coded by municipality', on: zonesOn,   toggle: onToggleZones,   dot: '#ffcc00' },
            { label:'Infrastructure',     desc:'Ports, power grids, freeports, roads & fiber nodes',    on: infraOn,   toggle: onToggleInfra,   dot: '#00b4ff' },
            { label:'Recommendations',    desc:'Top-ranked deployment sites per Firma asset type',       on: recsOn,    toggle: onToggleRecs,    dot: '#00ff88' },
            { label:'Land Parcels',       desc:'Pre-screened acquisition targets with urgency ratings',  on: landOn,    toggle: onToggleLand,    dot: '#ffcc00' },
            { label:'Composite Heatmap',  desc:'Province-wide investment score heat by location',        on: heatmapOn, toggle: onToggleHeatmap, dot: '#ff6b35' },
          ].map(l => (
            <div key={l.label} className="lrow" onClick={l.toggle}>
              <div className={`tsw${l.on ? ' on' : ''}`}><div className="tth" /></div>
              <div className="ldot" style={{background: l.dot}} />
              <div className="lname-wrap">
                <span className="lname">{l.label}</span>
                <span className="ldesc">{l.desc}</span>
              </div>
            </div>
          ))}

          <div className="shd" style={{marginTop:6}}>NEW DATA LAYERS</div>
          {[
            { label:'Hazard Zones',     desc:'PHIVOLCS flood, storm surge & liquefaction risk areas',              on: hazardOn,    toggle: onToggleHazard,    dot: '#ff3355' },
            { label:'CLUP Zoning',      desc:'Municipal land use plan — Agri, Industrial, Commercial, Protected',   on: clupOn,      toggle: onToggleClup,      dot: '#9c44ff' },
            { label:'Sovereign Layer',  desc:'LGU alignment status & permit pathway readiness per parcel',          on: sovereignOn, toggle: onToggleSovereign, dot: '#00ff88' },
            { label:'OmniMesh Network', desc:'Node/Sentinel/Pulse/Whisper topology — planned mesh coverage map',   on: omnimeshOn,  toggle: onToggleOmnimesh,  dot: '#00b4ff' },
          ].map(l => (
            <div key={l.label} className="lrow" onClick={l.toggle}>
              <div className={`tsw${l.on ? ' on' : ''}`}><div className="tth" /></div>
              <div className="ldot" style={{background: l.dot}} />
              <div className="lname-wrap">
                <span className="lname">{l.label}</span>
                <span className="ldesc">{l.desc}</span>
              </div>
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
            const sp = SOVEREIGN_PROFILES[p.id]
            const readColor = sp ? (sp.readiness >= 75 ? '#00ff88' : sp.readiness >= 45 ? '#ffcc00' : '#ff3355') : null
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
                  {sp && <span className="lc-pathway" style={{color: readColor}}>· PATH: {sp.readiness}%</span>}
                </div>
                <div className="lc-score-bar">
                  <div className="lc-score-fill" style={{width:`${p._compat}%`, background: scoreColor(p._compat)}} />
                </div>
                {sp && (
                  <div className="lc-sovereign-row">
                    {Object.entries(sp.alignment).map(([tier, status]) => {
                      const ic = status === 'engaged' ? '✓' : status === 'pending' ? '◌' : status === 'opposed' ? '✕' : '—'
                      const cl = status === 'engaged' ? '#00ff88' : status === 'pending' ? '#ffcc00' : status === 'opposed' ? '#ff3355' : '#4a6278'
                      return <span key={tier} className="lc-sov-chip" style={{color: cl}}>{ic} {tier.slice(0,3).toUpperCase()}</span>
                    })}
                  </div>
                )}
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

      {/* ECOSYSTEM */}
      {tab === 5 && (
        <div className="tc on">

          {/* NS Sim Mode Bar */}
          <div className="shd">NS SIM MODE</div>
          <div className="sim-mode-bar">
            {Object.entries(SIM_MODES).map(([k, m]) => (
              <button key={k} className={`smode-btn${simMode === k ? ' on' : ''}`}
                style={{'--smc': m.color}} onClick={() => setSimMode(k)}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="sim-mode-desc" style={{borderColor: SIM_MODES[simMode].color + '44', color: SIM_MODES[simMode].color}}>
            {SIM_MODES[simMode].desc}
          </div>

          {/* Sovereignty Ladder */}
          <div className="shd" style={{marginTop:8}}>SOVEREIGNTY LADDER <span style={{color:'var(--accent)',fontSize:8,marginLeft:4}}>BATAAN — TARGETING STEP 1</span></div>
          <div className="ladder-hint">Click any step to view pathway options + compliance checklist</div>
          <div className="ladder-wrap">
            {LADDER_STEPS.map((step, i) => {
              const isOpen = activeLadderStep === i
              const det = LADDER_DETAILS[i]
              return (
                <div key={i}>
                  <div className={`ladder-step ${step.status}${isOpen ? ' expanded' : ''}`}
                    onClick={() => { setActiveLadderStep(isOpen ? null : i); setActiveLadderPath(0) }}>
                    <div className="ladder-num">{i + 1}</div>
                    <div className="ladder-icon">{step.icon}</div>
                    <div className="ladder-info">
                      <div className="ladder-label">{step.label}
                        {step.status === 'target' && <span className="ladder-target-badge">TARGETING</span>}
                      </div>
                      <div className="ladder-sub">{step.sub}</div>
                    </div>
                    {step.status === 'target' && <div className="ladder-target-dot" />}
                    <div className="ladder-chevron">{isOpen ? '▾' : '▸'}</div>
                  </div>
                  {isOpen && det && (
                    <div className="ladder-detail">
                      <div className="ld-summary">{det.summary}</div>
                      <div className="ld-path-tabs">
                        {det.pathways.map((p, pi) => (
                          <button key={pi}
                            className={`ld-path-tab${activeLadderPath === pi ? ' on' : ''}`}
                            style={{'--ptc': p.color}}
                            onClick={e => { e.stopPropagation(); setActiveLadderPath(pi) }}>
                            <span>{p.icon}</span> {p.label}
                          </button>
                        ))}
                      </div>
                      {det.pathways[activeLadderPath] && (
                        <div className="ld-path-content">
                          <div className="ld-path-sub">{det.pathways[activeLadderPath].sub}</div>
                          <div className="ld-steps">
                            {det.pathways[activeLadderPath].steps.map((s, si) => (
                              <div key={si} className="ld-step-item">
                                <span className="ld-step-num">{si + 1}</span>
                                <span className="ld-step-text">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="ld-compliance-title">COMPLIANCE REQUIREMENTS</div>
                      <div className="ld-compliance-list">
                        {det.compliance.map((c, ci) => (
                          <div key={ci} className="ld-compliance-item">
                            <span className="ld-check">☐</span>
                            <span className="ld-clabel">{c.label}</span>
                            <span className={`ld-tier ld-tier-${c.tier.toLowerCase().replace(' ','')}`}>{c.tier}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Firma Product Grid */}
          <div className="shd" style={{marginTop:8}}>FIRMA PRODUCT ACTIVATION</div>
          <div className="product-grid">
            {FIRMA_PRODUCTS.map(prod => (
              <div key={prod.id} className={`product-tile ${prod.status}`} style={{'--pc': prod.color}}>
                <span className="product-icon">{prod.icon}</span>
                <span className="product-name">{prod.label}</span>
                <span className={`product-status ${prod.status}`}>{prod.status === 'planned' ? 'PLANNED' : 'FUTURE'}</span>
              </div>
            ))}
          </div>

          {/* Firmamint Chain Status */}
          <div className="shd" style={{marginTop:8}}>FIRMAMINT CHAIN STATUS</div>
          <div className="chain-panel">
            <div className="chain-row"><span className="ck">Shard</span><span className="chain-val accent">BATAAN-ALPHA</span></div>
            <div className="chain-row"><span className="ck">Status</span><span className="chain-val" style={{color:'#ffcc00'}}>PRE-MINT</span></div>
            <div className="chain-row"><span className="ck">Validators</span><span className="chain-val">0 / 3 needed</span></div>
            <div className="chain-row"><span className="ck">Proof of Sowing</span><span className="chain-val">Pending</span></div>
            <div className="chain-row"><span className="ck">$CIK Staked</span><span className="chain-val">0</span></div>
            <div className="chain-row"><span className="ck">Est. Mint</span><span className="chain-val" style={{color:'#9c44ff'}}>Q3 2026</span></div>
            <div className="chain-row highlight"><span className="ck">Next Milestone</span><span className="chain-val" style={{color:'#00ff88',fontSize:9}}>LGU Resolution + Site Acquisition</span></div>
          </div>

          {/* Three-Currency Economy */}
          <div className="shd" style={{marginTop:8}}>THREE-CURRENCY ECONOMY</div>
          <div className="currency-flow">
            <div className="currency-node" style={{'--cnc':'#00b4ff'}}>
              <div className="cn-icon">💵</div>
              <div className="cn-label">FIG CASH</div>
              <div className="cn-sub">Fiat In-Gateway</div>
              <div className="cn-status" style={{color:'#ffcc00'}}>SETUP STAGE</div>
            </div>
            <div className="currency-arrow">→</div>
            <div className="currency-node" style={{'--cnc':'#ffcc00'}}>
              <div className="cn-icon">⛓</div>
              <div className="cn-label">$CIK TOKEN</div>
              <div className="cn-sub">Sovereign Utility</div>
              <div className="cn-status" style={{color:'#ff6b35'}}>PRE-DIST.</div>
            </div>
            <div className="currency-arrow">→</div>
            <div className="currency-node" style={{'--cnc':'#00ff88'}}>
              <div className="cn-icon">🏘</div>
              <div className="cn-label">LOCAL FIG</div>
              <div className="cn-sub">Bataan Node</div>
              <div className="cn-status" style={{color:'#4a6278'}}>POST-SHARD</div>
            </div>
          </div>

          {/* OmniMesh Status */}
          <div className="shd" style={{marginTop:8}}>OMNIMESH STATUS <span style={{color:'#00b4ff',fontSize:8,marginLeft:4}}>{OMNIMESH_NODES.filter(n=>n.status==='active').length} ACTIVE</span></div>
          {OMNIMESH_NODES.map(node => {
            const col = {Node:'#00b4ff',Sentinel:'#00ff88',Pulse:'#ff6b35',Whisper:'#9c44ff'}[node.type] || '#fff'
            const stCol = node.status === 'active' ? '#00ff88' : node.status === 'planned' ? '#ffcc00' : '#4a6278'
            return (
              <div key={node.id} className="mesh-card">
                <div className="mesh-card-row">
                  <div className="mesh-card-dot" style={{background: col}} />
                  <div className="mesh-card-info">
                    <span className="mesh-card-name" style={{color: col}}>{node.label}</span>
                    <span className="mesh-card-type">{node.type}</span>
                  </div>
                  <span className="mesh-card-status" style={{color: stCol}}>{node.status.toUpperCase()}</span>
                </div>
              </div>
            )
          })}

          <div className="ds" style={{marginTop:8}}>Firma EDGE Engine v1.2 · Nation of Heaven Infrastructure Protocol · Bataan Alpha Node</div>
        </div>
      )}
    </div>
  )
}
