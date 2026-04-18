'use client'

import { useEffect, useRef, useState } from 'react'

function countUp(el, target, duration) {
  if (!el) return
  const start = Date.now()
  const step = () => {
    const p = Math.min(1, (Date.now() - start) / duration)
    const ease = 1 - Math.pow(1 - p, 3)
    el.textContent = Math.round(ease * target).toLocaleString()
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export default function GlobeScreen({ onEnter }) {
  const canvasRef  = useRef(null)
  const s1Ref = useRef(null); const s2Ref = useRef(null)
  const s3Ref = useRef(null); const s4Ref = useRef(null)
  const [time, setTime] = useState('--:--:-- UTC')
  const [entering, setEntering] = useState(false)

  // UTC clock
  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25) + ' UTC')
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Count-up stats
  useEffect(() => {
    const t = setTimeout(() => {
      countUp(s1Ref.current, 12,   700)
      countUp(s2Ref.current, 1373, 1100)
      countUp(s3Ref.current, 4,    600)
      countUp(s4Ref.current, 12,   800)
    }, 350)
    return () => clearTimeout(t)
  }, [])

  // Starfield + shooting stars
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    let raf, shooters = []
    const resize = () => { c.width = innerWidth; c.height = innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 420 }, () => {
      const layer = Math.floor(Math.random() * 3)
      return {
        x: Math.random(), y: Math.random(),
        r: layer === 0 ? Math.random() * .7 + .15 : layer === 1 ? Math.random() * 1.1 + .35 : Math.random() * 1.7 + .55,
        b: Math.random() * .5 + .2 + layer * .15,
        t: Math.random() * Math.PI * 2,
        s: Math.random() * .0018 + .0003 + layer * .0003,
        hue: Math.random() < .12 ? '255,220,180' : Math.random() < .08 ? '200,255,220' : '180,210,255',
      }
    })

    const newShooter = () => {
      const side = Math.random() < .5
      return { x: side ? 0 : 1, y: Math.random() * .55, vx: (Math.random() * .0025 + .0015) * (side ? 1 : -1), vy: Math.random() * .0018 + .0008, len: Math.random() * 90 + 55, life: 1, decay: Math.random() * .018 + .008 }
    }
    const shootInterval = setInterval(() => { if (shooters.length < 4) shooters.push(newShooter()) }, 3800)

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      stars.forEach(s => {
        s.t += s.s * 55
        const a = .18 + .82 * Math.abs(Math.sin(s.t))
        ctx.beginPath(); ctx.arc(s.x * c.width, s.y * c.height, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${s.hue},${a * s.b})`; ctx.fill()
      })
      shooters = shooters.filter(s => {
        s.x += s.vx; s.y += s.vy; s.life -= s.decay
        if (s.life <= 0 || s.x < -.1 || s.x > 1.1) return false
        const tx = s.x * c.width, ty = s.y * c.height
        const grad = ctx.createLinearGradient(tx - s.vx * s.len * c.width, ty - s.vy * s.len * c.height, tx, ty)
        grad.addColorStop(0, 'rgba(0,180,255,0)')
        grad.addColorStop(1, `rgba(210,235,255,${s.life * .85})`)
        ctx.beginPath(); ctx.moveTo(tx - s.vx * s.len * c.width, ty - s.vy * s.len * c.height); ctx.lineTo(tx, ty)
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.beginPath(); ctx.arc(tx, ty, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.life})`; ctx.fill()
        return true
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); clearInterval(shootInterval); window.removeEventListener('resize', resize) }
  }, [])

  function handleEnter() {
    setEntering(true)
    setTimeout(() => onEnter(), 1100)
  }

  return (
    <div className={`globe-screen${entering ? ' exit' : ''}`}>
      <canvas ref={canvasRef} className="star-canvas" />
      <div className="hex-grid" />
      <div className="scanlines" />
      <div className="sweep" />

      <div className="corner c-tl" /><div className="corner c-tr" />
      <div className="corner c-bl" /><div className="corner c-br" />

      <div className="hud-left">
        <div className="hud-item"><span className="hud-val">12</span><span className="hud-lbl">MUNICIPALITIES</span></div>
        <div className="hud-item"><span className="hud-val" style={{color:'var(--orange)'}}>1,373</span><span className="hud-lbl">KM² AREA</span></div>
        <div className="hud-item"><span className="hud-val" style={{color:'var(--green)'}}>ONLINE</span><span className="hud-lbl">SYS STATUS</span></div>
        <div className="hud-item"><span className="hud-val" style={{color:'var(--gold)'}}>2026</span><span className="hud-lbl">SMV EDITION</span></div>
        <div className="hud-item"><span className="hud-val" style={{color:'var(--purple)'}}>14.65°N</span><span className="hud-lbl">LATITUDE</span></div>
        <div className="hud-item"><span className="hud-val" style={{color:'var(--purple)'}}>120.49°E</span><span className="hud-lbl">LONGITUDE</span></div>
      </div>

      <div className="globe-wrap">
        <div className="atmo-outer" /><div className="atmo-inner" />
        <div className="orbit orbit-3" />
        <div className="orbit orbit-2"><div className="orb-sat" style={{background:'var(--gold)',boxShadow:'0 0 10px var(--gold)'}} /></div>
        <div className="orbit orbit-1"><div className="orb-sat" /></div>
        <div className="globe">
          <div className="globe-grid" /><div className="globe-night" />
          <div className="land" style={{width:84,height:57,top:'21%',left:'51%','--lr':'rotate(-15deg)',background:'rgba(18,52,118,.42)'}} />
          <div className="land" style={{width:54,height:37,top:'26%',left:'36%','--lr':'rotate(20deg)',background:'rgba(14,44,100,.36)'}} />
          <div className="land" style={{width:70,height:43,top:'38%',left:'58%','--lr':'rotate(-5deg)',borderRadius:'40% 60% 70% 30%',background:'rgba(16,48,112,.40)'}} />
          <div className="land" style={{width:94,height:32,top:'58%',left:'14%','--lr':'rotate(10deg)',borderRadius:'70% 30% 40% 60%',background:'rgba(11,36,88,.32)'}} />
          <div className="land" style={{width:58,height:48,top:'48%',left:'39%','--lr':'rotate(-20deg)',background:'rgba(20,55,128,.38)'}} />
          <div className="globe-shine" />
        </div>
        <div className="ph-marker">
          <div className="ph-ring3" /><div className="ph-ring2" /><div className="ph-ring" />
          <div className="ph-dot" /><div className="ph-label">BATAAN · PH</div>
        </div>
      </div>

      <div className="intro-panel">
        <div className="firma-badge">FIRMA STRATEGIC · INTELLIGENCE DIVISION</div>
        <h1 className="main-title">BATAAN<br/>LAND<br/>INTELLIGENCE<br/>SYSTEM</h1>
        <div className="title-sub">Nation of Heaven · EDGE Infrastructure Engine v1.2<br/>Province of Bataan · Central Luzon, Philippines</div>
        <div className="sys-stats">
          <div className="stat"><span className="sv" ref={s1Ref} style={{'--sc':'var(--accent)'}}>0</span><span className="sl">Municipalities</span></div>
          <div className="stat"><span className="sv" ref={s2Ref} style={{'--sc':'var(--orange)'}}>0</span><span className="sl">km² Province</span></div>
          <div className="stat"><span className="sv" ref={s3Ref} style={{'--sc':'var(--green)'}}>0</span><span className="sl">Asset Classes</span></div>
          <div className="stat"><span className="sv" ref={s4Ref} style={{'--sc':'var(--gold)'}}>0</span><span className="sl">Land Parcels</span></div>
        </div>
        <div className="asset-badges">
          {[['🏛️','FIRMA HQ'],['🏘️','HAVEN VILLAGE'],['⛏️','STEEL FORGE'],['☀️','SOLAR FARM']].map(([ic,lb]) => (
            <div key={lb} className="abadge"><span className="bi">{ic}</span> {lb}</div>
          ))}
        </div>
        <div className="status-row">
          <div className="status-dot" />
          <span className="status-txt">ALL SYSTEMS NOMINAL</span>
          <span className="status-sep">·</span>
          <span style={{color:'var(--dim)'}}>BLIS v1.2</span>
          <span className="status-sep">·</span>
          <span style={{color:'var(--dim)'}}>{time}</span>
        </div>
        <button className="enter-btn" onClick={handleEnter} disabled={entering}>
          <span className="btn-arrow">{entering ? '◌' : '▶'}</span>
          <span>{entering ? 'INITIALIZING...' : 'ENTER BATAAN'}</span>
        </button>
        <div className="enter-hint">Click to access the geospatial intelligence platform</div>
      </div>

      <div className="ticker-wrap">
        <div className="ticker-label">LIVE INTEL</div>
        <div className="ticker-track">
          <div className="ticker-inner">
            {[
              'SBFZ Industrial Zone · DUTY-FREE · Mariveles · ₱3,500–8,500/sqm',
              'Steel Forge Score · Mariveles Deepwater · 97/100 OPTIMAL',
              'Samal Solar Belt · 1,373 km² Province Mapped · 12 Municipalities',
              'Hermosa Commercial · HQ Prime Location · ₱4,200/sqm avg BIR',
              'BCDA Dinalupihan SEZ · Mixed-Use · LOW RISK · RA 11453',
              'Lamao Industrial · BTC Mining Optimal · 92MW Grid Access',
              'Orani Coastal · Haven Village · 12 Land Parcels Pre-Ranked',
            ].concat([
              'SBFZ Industrial Zone · DUTY-FREE · Mariveles · ₱3,500–8,500/sqm',
              'Steel Forge Score · Mariveles Deepwater · 97/100 OPTIMAL',
              'Samal Solar Belt · 1,373 km² Province Mapped · 12 Municipalities',
              'Hermosa Commercial · HQ Prime Location · ₱4,200/sqm avg BIR',
              'BCDA Dinalupihan SEZ · Mixed-Use · LOW RISK · RA 11453',
              'Lamao Industrial · BTC Mining Optimal · 92MW Grid Access',
              'Orani Coastal · Haven Village · 12 Land Parcels Pre-Ranked',
            ]).map((t, i) => <span key={i}>{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}
