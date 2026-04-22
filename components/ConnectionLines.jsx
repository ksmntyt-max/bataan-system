'use client'
import { useEffect, useRef, useCallback } from 'react'

const DOT_IDS = [
  { id: 'dot-ph',        color: '#FF855C' },
  { id: 'dot-dallas',    color: '#F6718D' },
  { id: 'dot-africa',    color: '#84A7F7' },
  { id: 'dot-sf',        color: '#84A7F7' },
  { id: 'dot-pr',        color: '#F6718D' },
  { id: 'dot-panama',    color: '#A78BFA' },
  { id: 'dot-mauritius', color: '#34D399' },
]

export default function ConnectionLines() {
  const svgRef = useRef(null)

  const draw = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    const canvas = document.querySelector('.globe-canvas')
    if (!canvas) return

    const svgRect  = svg.getBoundingClientRect()
    const globeRect = canvas.getBoundingClientRect()

    // Globe center
    const gx = globeRect.left + globeRect.width  / 2 - svgRect.left
    const gy = globeRect.top  + globeRect.height / 2 - svgRect.top

    // Clear previous paths + defs
    svg.innerHTML = ''

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    svg.appendChild(defs)

    DOT_IDS.forEach(({ id, color }, i) => {
      const dot = document.getElementById(id)
      if (!dot) return

      const dotRect = dot.getBoundingClientRect()
      const dx = dotRect.left + dotRect.width  / 2 - svgRect.left
      const dy = dotRect.top  + dotRect.height / 2 - svgRect.top

      // Midpoint control point — curve gently inward
      const mx = (dx + gx) / 2 + (gx - dx) * 0.08
      const my = (dy + gy) / 2 - Math.abs(gx - dx) * 0.12

      const gradId = `lg-${id}`

      // LinearGradient: color at dot end, transparent at globe end
      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
      grad.setAttribute('id', gradId)
      grad.setAttribute('gradientUnits', 'userSpaceOnUse')
      grad.setAttribute('x1', dx)
      grad.setAttribute('y1', dy)
      grad.setAttribute('x2', gx)
      grad.setAttribute('y2', gy)

      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop1.setAttribute('offset', '0%')
      stop1.setAttribute('stop-color', color)
      stop1.setAttribute('stop-opacity', '0.55')

      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop2.setAttribute('offset', '100%')
      stop2.setAttribute('stop-color', color)
      stop2.setAttribute('stop-opacity', '0')

      grad.appendChild(stop1)
      grad.appendChild(stop2)
      defs.appendChild(grad)

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', `M ${dx} ${dy} Q ${mx} ${my} ${gx} ${gy}`)
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', `url(#${gradId})`)
      path.setAttribute('stroke-width', '1.5')
      path.setAttribute('stroke-dasharray', '4 3')
      path.setAttribute('stroke-linecap', 'round')
      svg.appendChild(path)
    })
  }, [])

  useEffect(() => {
    // Delay to let DOM settle after mount animations
    const t = setTimeout(draw, 600)
    window.addEventListener('resize', draw)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', draw)
    }
  }, [draw])

  return (
    <svg
      ref={svgRef}
      className="connection-lines"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible',
      }}
    />
  )
}
