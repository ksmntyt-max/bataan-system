'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import GlobeLocationList from '@/components/GlobeLocationList'
import ConnectionLines from '@/components/ConnectionLines'

const DotGlobe = dynamic(() => import('@/components/DotGlobe'), { ssr: false })

export default function GlobeScreen({ onEnter }) {
  const [entering, setEntering] = useState(false)

  function handleEnter() {
    setEntering(true)
    setTimeout(() => onEnter(), 900)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(160deg, #fafafa 0%, #f4f3ff 40%, #fafafa 100%)',
      display: 'flex', flexDirection: 'column',
      opacity: entering ? 0 : 1, transform: entering ? 'scale(1.04)' : 'scale(1)',
      transition: 'opacity 0.85s ease, transform 0.9s ease',
    }}>

      {/* Ambient gradient orbs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '25%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,138,196,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', left: '10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(205,122,107,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64, flexShrink: 0,
        borderBottom: '1px solid rgba(155,138,196,0.10)',
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 11, height: 11, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #FF855C 0%, #F6718D 100%)',
            boxShadow: '0 0 8px 2px rgba(155,138,196,0.55), 0 0 3px 1px rgba(205,122,107,0.45)',
            display: 'inline-block',
          }} />
          <span style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontWeight: 600, fontSize: 16, color: '#1e1b4b', letterSpacing: '.01em',
          }}>firma</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['BLESS', 'Municipalities', 'Assets', 'Intelligence'].map(label => (
            <span key={label} style={{
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontSize: 13, color: '#9ca3af', letterSpacing: '.04em', cursor: 'pointer',
              transition: 'color .2s',
            }}
              onMouseEnter={e => e.target.style.color = '#1e1b4b'}
              onMouseLeave={e => e.target.style.color = '#9ca3af'}
            >{label}</span>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <div className="blis-hero" style={{
        flex: 1, display: 'flex', alignItems: 'center',
        padding: '0 48px 0 72px', overflow: 'hidden', gap: 40,
      }}>

        {/* Left copy */}
        <div style={{ flex: '0 0 auto', maxWidth: 460, zIndex: 2, position: 'relative' }}>

          {/* Eyebrow */}
          <div style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: 11, fontWeight: 600, letterSpacing: '.18em',
            color: '#9ca3af', textTransform: 'uppercase', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 24, height: 1.5,
              background: 'linear-gradient(90deg, #FF855C, #F6718D)',
              display: 'inline-block', borderRadius: 1,
            }} />
            Land Intelligence System
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
            fontWeight: 800, lineHeight: 1.04, margin: '0 0 24px',
            fontSize: 'clamp(56px, 7vw, 88px)',
          }}>
            <span style={{
              display: 'block',
              background: 'linear-gradient(135deg, #FF855C 0%, #F6718D 55%, #84A7F7 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Bataan</span>
            <span style={{
              display: 'block', color: '#1e1b4b',
              WebkitTextFillColor: '#1e1b4b',
            }}>Strategy.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: 17, lineHeight: 1.7, color: '#6b7280',
            margin: '0 0 36px', maxWidth: 420,
          }}>
            A sovereign network mapping land, settlements, and sustainable
            infrastructure across Bataan Province, Philippines.
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 32, marginBottom: 40,
          }}>
            {[
              { val: '12',    label: 'Municipalities' },
              { val: '1,373', label: 'km² Mapped' },
              { val: '4',     label: 'Asset Classes' },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontFamily: 'var(--font-playfair), serif',
                  fontSize: 28, fontWeight: 700, color: '#1e1b4b', lineHeight: 1,
                  background: 'linear-gradient(135deg, #FF855C, #F6718D)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{s.val}</div>
                <div style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontSize: 11, color: '#9ca3af', letterSpacing: '.06em',
                  textTransform: 'uppercase', marginTop: 4,
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA + coordinate badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <button
              onClick={handleEnter}
              disabled={entering}
              style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: 14, fontWeight: 600, letterSpacing: '.04em',
                color: '#fff', border: 'none', cursor: entering ? 'default' : 'pointer',
                padding: '14px 32px', borderRadius: 9999,
                background: 'linear-gradient(135deg, #FF855C 0%, #F6718D 55%, #84A7F7 100%)',
                boxShadow: '0 8px 28px rgba(155,138,196,0.35)',
                transition: 'transform .2s, box-shadow .2s',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: entering ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!entering) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(155,138,196,0.45)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 28px rgba(155,138,196,0.35)' }}
            >
              {entering ? 'Loading…' : 'Enter Map'} {!entering && <span style={{ fontSize: 16 }}>→</span>}
            </button>

            <div style={{
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#FF855C', display: 'inline-block',
                boxShadow: '0 0 6px rgba(205,122,107,0.6)',
              }} />
              14.65°N, 120.49°E
            </div>
          </div>

          {/* System tag */}
          <div style={{
            marginTop: 28,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: 10, letterSpacing: '.14em', color: '#c4b8d8',
            textTransform: 'uppercase',
          }}>
            BLESS · Bataan Land Evaluation for Sustainable Settlements · v1.3
          </div>
        </div>

        {/* Right section — location list + globe */}
        <div className="blis-globe-wrapper" style={{
          flex: '1 1 auto',
          height: 'min(100vh, 680px)',
          minWidth: 280,
          display: 'flex', flexDirection: 'row',
          alignItems: 'center', justifyContent: 'flex-end',
          gap: 24, paddingRight: 48, overflow: 'hidden',
          position: 'relative',
        }}>
          <ConnectionLines />
          <div className="globe-locations" style={{ flexShrink: 0, position: 'relative', zIndex: 2 }}><GlobeLocationList /></div>
          <div style={{ flexShrink: 0, alignSelf: 'stretch', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center' }}><DotGlobe /></div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{
        height: 48, flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '0 48px', gap: 24,
        borderTop: '1px solid rgba(155,138,196,0.08)',
        background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)',
      }}>
        {[
          '🏛️ Firma HQ · Mariveles',
          '🏘️ Haven Village · Orani',
          '⛏️ Steel Forge · SBFZ',
          '☀️ Hermosa Solar · 28 MW',
          '⚓ Port of Mariveles · 6 Berths',
        ].map((t, i) => (
          <span key={i} style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: 11, color: '#9ca3af', letterSpacing: '.04em', whiteSpace: 'nowrap',
            paddingRight: 24, borderRight: i < 4 ? '1px solid rgba(155,138,196,0.12)' : 'none',
          }}>{t}</span>
        ))}
      </div>
    </div>
  )
}
