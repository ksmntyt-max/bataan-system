'use client'

import { ZONE_DATA } from '@/lib/data'

export default function ZonePanel({ zoneKey, onClose, onDeployHere }) {
  const z = ZONE_DATA[zoneKey]
  if (!z) return null

  return (
    <div className="zone-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="zone-panel">
        {/* Header */}
        <div className="zp-header" style={{ borderLeftColor: z.color }}>
          <div className="zp-header-top">
            <div>
              <div className="zp-badge" style={{ background: `${z.color}22`, border: `1px solid ${z.color}55`, color: z.color }}>
                {z.badge}
              </div>
              <h2 className="zp-title">{z.fullName}</h2>
              <div className="zp-authority">Managed by: {z.authority}</div>
            </div>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Pros list */}
        <div className="zp-body">
          <div className="zp-section-label">WHY DEPLOY HERE</div>
          <ul className="zp-pros">
            {z.pros.map((p, i) => (
              <li key={i} className="zp-pro-row">
                <span className="zp-pro-icon">{p.icon}</span>
                <div className="zp-pro-text">
                  <strong className="zp-pro-title">{p.title}</strong>
                  <p className="zp-pro-detail">{p.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="zp-footer">
          <button
            className="zp-deploy-btn"
            style={{ background: `${z.color}18`, border: `1px solid ${z.color}55`, color: z.color }}
            onClick={() => { onDeployHere(zoneKey); onClose() }}
          >
            ⚡ Deploy Asset Here
          </button>
        </div>
      </div>
    </div>
  )
}
