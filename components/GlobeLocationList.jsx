'use client'
import { useEffect, useState } from 'react'

const LOCATIONS = [
  { name: 'Philippines, Bataan', detail: 'SeedBase · Forge · Haven',       color: '#FF855C', dotId: 'dot-ph'       },
  { name: 'Dallas, TX',          detail: 'DFW Embassy · Ranch · SeedBase', color: '#F6718D', dotId: 'dot-dallas'   },
  { name: 'Africa Corridor',     detail: 'Durban · Mombasa · Lagos',        color: '#84A7F7', dotId: 'dot-africa'   },
  { name: 'San Francisco, CA',   detail: 'Four Seasons · Bay Ops',          color: '#84A7F7', dotId: 'dot-sf'       },
  { name: 'Puerto Rico',         detail: 'Bahía Beach · Act 60',            color: '#F6718D', dotId: 'dot-pr'       },
  { name: 'Panama',              detail: 'Canal Zone · Subsea Logistics',   color: '#A78BFA', dotId: 'dot-panama'   },
  { name: 'Mauritius',           detail: 'IFC · Africa Gateway',            color: '#34D399', dotId: 'dot-mauritius'},
]

export default function GlobeLocationList() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 0 0 8px' }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
        color: '#9ca3af', textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif', marginBottom: 4,
      }}>
        Active Territories
      </div>

      {LOCATIONS.map((loc, i) => (
        <div key={loc.name} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-12px)',
          transition: `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`,
        }}>
          {/* Beaming pulse dot */}
          <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              background: loc.color, opacity: 0.25,
              animation: `beam-pulse 2s ease-in-out infinite ${i * 0.3}s`,
            }} />
            <div style={{
              position: 'absolute', inset: -1, borderRadius: '50%',
              background: loc.color, opacity: 0.4,
              animation: `beam-pulse 2s ease-in-out infinite ${i * 0.3 + 0.3}s`,
            }} />
            <div
              id={loc.dotId}
              style={{
                width: 12, height: 12, borderRadius: '50%',
                background: loc.color, position: 'relative', zIndex: 1,
                boxShadow: `0 0 6px ${loc.color}99`,
              }}
            />
          </div>

          {/* Text */}
          <div>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#1e1b4b',
              fontFamily: 'Inter, sans-serif', lineHeight: 1.2,
            }}>{loc.name}</div>
            <div className="loc-detail" style={{
              fontSize: 11, color: '#9ca3af',
              fontFamily: 'Inter, sans-serif', marginTop: 1,
            }}>{loc.detail}</div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes beam-pulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          50%  { transform: scale(1.8); opacity: 0;   }
          100% { transform: scale(1);   opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
