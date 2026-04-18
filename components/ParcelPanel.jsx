'use client'

import { useRef } from 'react'
import StreetViewButton from './StreetViewButton'
import ScoreBreakdown from './ScoreBreakdown'
import { calcScoreBreakdown, formatPHP } from '@/lib/scoring'
import { ASSETS, MUNICIPALITIES } from '@/lib/data'

function getMuni(muniId) {
  return MUNICIPALITIES.find(m => m.id === muniId) || MUNICIPALITIES[0]
}

function getScores(parcel) {
  return calcScoreBreakdown(parcel)
}

export default function ParcelPanel({ parcel, onClose }) {
  const printRef = useRef(null)
  if (!parcel) return null

  const muni   = getMuni(parcel.muniId)
  const scores = getScores(parcel)
  const avgBIR = Math.round((muni.zonalMin + muni.zonalMax) / 2)
  const avgSqm = Math.round((parcel.sqmMin + parcel.sqmMax) / 2)
  const landCost = avgSqm * avgBIR
  const compat = parcel.bestFor.length
    ? parcel.bestFor.map(a => ASSETS[a]?.icon).join(' ')
    : '—'

  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Print styles injected inline so they scope to this panel */}
      <style>{`
        @media print {
          body > *:not(#parcel-print-target) { display: none !important; }
          #parcel-print-target { display: block !important; position: static !important;
            width: 100% !important; max-width: 720px !important; margin: 0 auto; color: #000 !important;
            background: #fff !important; }
          .panel-close-btn, .sv-btn, .print-btn { display: none !important; }
          .sb-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="parcel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="parcel-panel" id="parcel-print-target" ref={printRef}>
          {/* Header */}
          <div className="pp-header">
            <div className="pp-urgency-badge urg-{parcel.urgency?.toLowerCase()}">
              <span className={`urg-dot ${parcel.urgency === 'HIGH' ? 'urg-high' : parcel.urgency === 'MEDIUM' ? 'urg-med' : 'urg-low'}`} />
              {parcel.urgency}
            </div>
            <div className="pp-title-wrap">
              <h2 className="pp-title">{parcel.name}</h2>
              <div className="pp-sub">{muni.name} · {parcel.class}</div>
            </div>
            {parcel.tag && <div className="pp-tag">{parcel.tag}</div>}
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Coords + legal */}
          <div className="pp-meta-row">
            <span className="pp-coord">{parcel.lat.toFixed(4)}°N, {parcel.lng.toFixed(4)}°E</span>
            <span className="pp-sep">·</span>
            <span className="pp-legal">{parcel.legal}</span>
          </div>

          {/* Score breakdown */}
          <ScoreBreakdown scores={scores} />

          {/* Land valuation */}
          <div className="pp-section">
            <div className="pp-section-title">LAND VALUATION</div>
            <div className="pp-row"><span>BIR Zonal Value (avg)</span><span className="pp-val">₱{avgBIR.toLocaleString()}/sqm</span></div>
            <div className="pp-row"><span>Area Range</span><span className="pp-val">{parcel.sqmMin.toLocaleString()}–{parcel.sqmMax.toLocaleString()} sqm</span></div>
            <div className="pp-row"><span>Price Range / sqm</span><span className="pp-val">₱{parcel.priceMin.toLocaleString()}–₱{parcel.priceMax.toLocaleString()}</span></div>
            <div className="pp-row highlight"><span>Est. Land Acquisition (avg sqm)</span><span className="pp-val accent">{formatPHP(landCost)}</span></div>
            <div className="pp-row"><span>Best For</span><span className="pp-val">{compat}</span></div>
          </div>

          {/* Infrastructure scores */}
          <div className="pp-section">
            <div className="pp-section-title">INFRASTRUCTURE SCORES</div>
            <div className="pp-infra-grid">
              {Object.entries(parcel.infrastructure).map(([k, v]) => (
                <div key={k} className="pp-infra-item">
                  <div className="pp-infra-val" style={{ color: v >= 80 ? '#00ff88' : v >= 60 ? '#ffcc00' : '#ff6b35' }}>{v}</div>
                  <div className="pp-infra-label">{k.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Why buy here */}
          <div className="pp-section">
            <div className="pp-section-title">WHY BUY HERE</div>
            <p className="pp-why">{parcel.why}</p>
          </div>

          {/* Actions */}
          <div className="pp-actions">
            <StreetViewButton lat={parcel.lat} lng={parcel.lng} />
            <button className="print-btn" onClick={handlePrint}>🖨 Export Report</button>
          </div>
        </div>
      </div>
    </>
  )
}
