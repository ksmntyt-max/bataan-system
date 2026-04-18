'use client'

const FACTORS = [
  { key: 'gridAccess',    label: 'Grid Access',    max: 25, color: '#ff6b35' },
  { key: 'roadProximity', label: 'Road Proximity', max: 25, color: '#00b4ff' },
  { key: 'zoningMatch',   label: 'Zoning Match',   max: 25, color: '#00ff88' },
  { key: 'floodRisk',     label: 'Flood Safety',   max: 25, color: '#ffcc00' },
]

export default function ScoreBreakdown({ scores }) {
  if (!scores) return null
  const total = Object.values(scores).reduce((a, b) => a + b, 0)

  return (
    <div className="sb-wrap">
      <div className="sb-header">
        <span className="sb-title">SCORE BREAKDOWN</span>
        <span className="sb-total" style={{ color: total >= 80 ? '#00ff88' : total >= 60 ? '#ffcc00' : '#ff6b35' }}>
          {total}/100
        </span>
      </div>
      {FACTORS.map(f => {
        const val = scores[f.key] ?? 0
        const pct = (val / f.max) * 100
        return (
          <div key={f.key} className="sb-row">
            <span className="sb-label">{f.label}</span>
            <div className="sb-bar-wrap">
              <div className="sb-bar" style={{ width: `${pct}%`, background: f.color, boxShadow: `0 0 6px ${f.color}60` }} />
            </div>
            <span className="sb-val" style={{ color: f.color }}>{val}<span className="sb-max">/{f.max}</span></span>
          </div>
        )
      })}
    </div>
  )
}
