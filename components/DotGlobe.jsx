'use client'
import { useEffect, useRef, useState } from 'react'
import createGlobe from 'cobe'

const THETA = 0.15
const GLOBE_R = 0.8
const MARKER_ELEV = 0.05
const ARC_HEIGHT  = 0.28

// Convert lat/lng → unit-sphere 3D point (matches COBE's U())
function ll3(lat, lng) {
  const D = Math.PI / 180
  const r = lat * D, a = lng * D - Math.PI, o = Math.cos(r)
  return [-o * Math.cos(a), Math.sin(r), o * Math.sin(a)]
}

// Project an arbitrary 3D point → normalised screen coords
function proj3(vx, vy, vz, phi) {
  const cp = Math.cos(phi), sp = Math.sin(phi)
  const ct = Math.cos(THETA), st = Math.sin(THETA)
  const cx =  cp * vx + sp * vz
  const cy =  sp * st * vx + ct * vy - cp * st * vz
  const cz = -sp * ct * vx + st * vy + cp * ct * vz
  return { nx: (cx + 1) / 2, ny: (-cy + 1) / 2, cz }
}

// Sample a quadratic bezier arc in 3D (matches COBE's arc vertex shader)
function arcPt(from3, to3, t) {
  const e  = GLOBE_R + MARKER_ELEV          // endpoint elevation
  const p1 = from3.map(v => v * e)
  const p3 = to3.map(v => v * e)
  const s  = [from3[0]+to3[0], from3[1]+to3[1], from3[2]+to3[2]]
  const sL = Math.sqrt(s[0]**2 + s[1]**2 + s[2]**2)
  const m  = sL > 0.001 ? s.map(v => v / sL) : [0, 1, 0]
  const me = GLOBE_R + ARC_HEIGHT + MARKER_ELEV
  const p2 = m.map(v => v * me)
  const b  = 1 - t
  return p1.map((v, i) => b*b*v + 2*b*t*p2[i] + t*t*p3[i])
}

// ── Data ───────────────────────────────────────────────────────────────────────

const MARKERS = [
  { location: [14.65,   120.49], size: 0.055, color: [1,    0.52, 0.36] }, // Philippines  #FF855C
  { location: [32.78,  -96.80],  size: 0.045, color: [0.96, 0.44, 0.55] }, // Dallas       #F6718D
  { location: [0.0,     20.0],   size: 0.050, color: [0.52, 0.65, 0.97] }, // Africa       #84A7F7
  { location: [37.77, -122.41],  size: 0.045, color: [0.52, 0.65, 0.97] }, // SF           #84A7F7
  { location: [18.47,  -66.11],  size: 0.045, color: [0.96, 0.44, 0.55] }, // Puerto Rico  #F6718D
  { location: [8.99,   -79.52],  size: 0.045, color: [0.67, 0.55, 0.98] }, // Panama       #A78BFA
  { location: [-20.16,  57.50],  size: 0.045, color: [0.20, 0.83, 0.60] }, // Mauritius    #34D399
]

// Philippines as hub + key regional connections
const ARCS = [
  { from: [14.65, 120.49], to: [32.78, -96.80],  c1: [1,0.52,0.36],    c2: [0.96,0.44,0.55] },
  { from: [14.65, 120.49], to: [0.0,   20.0],    c1: [1,0.52,0.36],    c2: [0.52,0.65,0.97] },
  { from: [14.65, 120.49], to: [37.77,-122.41],  c1: [1,0.52,0.36],    c2: [0.52,0.65,0.97] },
  { from: [14.65, 120.49], to: [18.47, -66.11],  c1: [1,0.52,0.36],    c2: [0.96,0.44,0.55] },
  { from: [14.65, 120.49], to: [8.99,  -79.52],  c1: [1,0.52,0.36],    c2: [0.67,0.55,0.98] },
  { from: [14.65, 120.49], to: [-20.16, 57.50],  c1: [1,0.52,0.36],    c2: [0.20,0.83,0.60] },
  { from: [32.78, -96.80], to: [37.77,-122.41],  c1: [0.96,0.44,0.55], c2: [0.52,0.65,0.97] },
  { from: [32.78, -96.80], to: [18.47, -66.11],  c1: [0.96,0.44,0.55], c2: [0.96,0.44,0.55] },
  { from: [32.78, -96.80], to: [8.99,  -79.52],  c1: [0.96,0.44,0.55], c2: [0.67,0.55,0.98] },
  { from: [0.0,   20.0],   to: [-20.16, 57.50],  c1: [0.52,0.65,0.97], c2: [0.20,0.83,0.60] },
  { from: [37.77,-122.41], to: [8.99,  -79.52],  c1: [0.52,0.65,0.97], c2: [0.67,0.55,0.98] },
]

// ── Drawing helpers ────────────────────────────────────────────────────────────

function drawMarkers(ctx, phi, px) {
  const markerElev = GLOBE_R + MARKER_ELEV
  for (const m of MARKERS) {
    const [vx, vy, vz] = ll3(m.location[0], m.location[1])
    const { nx, ny, cz } = proj3(vx * markerElev, vy * markerElev, vz * markerElev, phi)
    if (cz < 0) continue
    const [r, g, b] = m.color
    const rgb = `${r * 255 | 0},${g * 255 | 0},${b * 255 | 0}`
    const dotR = m.size * px
    const x = nx * px, y = ny * px
    // Outer glow
    const grd = ctx.createRadialGradient(x, y, dotR * 0.3, x, y, dotR * 3)
    grd.addColorStop(0, `rgba(${rgb},0.35)`)
    grd.addColorStop(1, `rgba(${rgb},0)`)
    ctx.beginPath()
    ctx.arc(x, y, dotR * 3, 0, Math.PI * 2)
    ctx.fillStyle = grd
    ctx.fill()
    // Core dot
    ctx.beginPath()
    ctx.arc(x, y, dotR, 0, Math.PI * 2)
    ctx.fillStyle = `rgb(${rgb})`
    ctx.shadowColor = `rgba(${rgb},0.65)`
    ctx.shadowBlur  = dotR * 2
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

function drawArcs(ctx, phi, px, now) {
  const N       = 56                          // bezier samples per arc
  const dashLen = Math.round(px * 0.055)
  const gapLen  = Math.round(px * 0.040)
  const cycle   = 2200                        // ms per dash cycle
  const offset  = -((now % cycle) / cycle) * (dashLen + gapLen)

  ctx.lineWidth = Math.max(1.2, px * 0.003)
  ctx.setLineDash([dashLen, gapLen])
  ctx.lineDashOffset = offset

  for (const arc of ARCS) {
    const from3 = ll3(arc.from[0], arc.from[1])
    const to3   = ll3(arc.to[0], arc.to[1])

    // Sample 3D arc points and project
    const pts = []
    for (let i = 0; i <= N; i++) {
      const [vx, vy, vz] = arcPt(from3, to3, i / N)
      const p = proj3(vx, vy, vz, phi)
      pts.push({ x: p.nx * px, y: p.ny * px, cz: p.cz })
    }

    // Skip arcs entirely on the back side
    if (!pts.some(p => p.cz >= 0)) continue

    // Gradient from first visible → last visible point
    let first = null, last = null
    for (const p of pts) { if (p.cz >= 0) { if (!first) first = p; last = p } }
    if (!first || !last || (first.x === last.x && first.y === last.y)) continue

    const [r1,g1,b1] = arc.c1
    const [r2,g2,b2] = arc.c2
    const grad = ctx.createLinearGradient(first.x, first.y, last.x, last.y)
    grad.addColorStop(0, `rgba(${r1*255|0},${g1*255|0},${b1*255|0},0.75)`)
    grad.addColorStop(1, `rgba(${r2*255|0},${g2*255|0},${b2*255|0},0.75)`)

    ctx.strokeStyle = grad
    ctx.beginPath()
    let moved = false
    for (const pt of pts) {
      if (pt.cz < -0.05) { moved = false; continue }   // hide back-facing segments
      if (!moved) { ctx.moveTo(pt.x, pt.y); moved = true; continue }
      ctx.lineTo(pt.x, pt.y)
    }
    ctx.stroke()
  }

  ctx.setLineDash([])
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DotGlobe() {
  const canvasRef  = useRef(null)
  const overlayRef = useRef(null)
  const wrapperRef = useRef(null)
  const phiRef     = useRef(2.62)   // Philippines faces viewer on load
  const globeRef   = useRef(null)
  const rafRef     = useRef(null)
  const [size, setSize] = useState(500)

  // Watch container — resize globe to fit
  useEffect(() => {
    if (!wrapperRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const s = Math.max(Math.min(width, height, 660), 260)
        setSize(Math.round(s))
      }
    })
    ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [])

  // Re-create globe + overlay whenever size changes
  useEffect(() => {
    if (!canvasRef.current || size === 0) return

    cancelAnimationFrame(rafRef.current)
    globeRef.current?.destroy()
    globeRef.current = null

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const px  = size * dpr

    canvasRef.current.width  = px
    canvasRef.current.height = px

    const ov = overlayRef.current
    if (ov) { ov.width = px; ov.height = px }

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio:  dpr,
      width:             px,
      height:            px,
      phi:               phiRef.current,
      theta:             THETA,
      dark:              0,
      diffuse:           1.2,
      mapSamples:        16000,
      mapBrightness:     6,
      mapBaseBrightness: 0,
      baseColor:         [1, 1, 1],
      glowColor:         [0.92, 0.90, 1.0],
      markerColor:       [1, 0.52, 0.36],
      markers:           [],  // all drawn on overlay canvas
    })
    globeRef.current = globe

    const animate = () => {
      phiRef.current += 0.003
      globe.update({ phi: phiRef.current })

      if (ov) {
        const ctx = ov.getContext('2d')
        ctx.clearRect(0, 0, px, px)
        const now = Date.now()
        drawArcs(ctx, phiRef.current, px, now)
        drawMarkers(ctx, phiRef.current, px)
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      globe.destroy()
      globeRef.current = null
    }
  }, [size])

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <canvas
          ref={canvasRef}
          className="globe-canvas"
          style={{ width: size, height: size, borderRadius: '50%', display: 'block' }}
          width={size * 2}
          height={size * 2}
        />
        <canvas
          ref={overlayRef}
          style={{
            position: 'absolute', inset: 0,
            width: size, height: size,
            borderRadius: '50%', pointerEvents: 'none',
          }}
          width={size * 2}
          height={size * 2}
        />
      </div>
    </div>
  )
}
