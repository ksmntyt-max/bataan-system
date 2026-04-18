'use client'

export default function CompareTable({ municipalities }) {
  return (
    <div className="compare-wrap">
      <div className="compare-header">
        <h1 className="compare-title">MUNICIPALITY COMPARISON</h1>
        <p className="compare-sub">Province of Bataan · All 12 Municipalities · BIR SMV 2024–2026</p>
      </div>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Municipality</th>
              <th>Avg BIR Value</th>
              <th>Risk Score</th>
              <th>Grid Access</th>
              <th>SEZ Status</th>
              <th>Parcels Available</th>
            </tr>
          </thead>
          <tbody>
            {municipalities.map((m, i) => (
              <tr key={i} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                <td className="td-muni">{m.municipality}</td>
                <td className="td-bir">₱{Number(m.avg_bir_sqm).toLocaleString()}/sqm</td>
                <td>
                  <div className="td-score-wrap">
                    <div className="td-score-bar" style={{
                      width: `${m.risk_score}%`,
                      background: m.risk_score >= 85 ? '#00ff88' : m.risk_score >= 70 ? '#ffcc00' : '#ff6b35'
                    }} />
                    <span className="td-score-num">{m.risk_score}</span>
                  </div>
                </td>
                <td>
                  <div className="td-score-wrap">
                    <div className="td-score-bar" style={{
                      width: `${m.grid_access}%`,
                      background: '#ff6b35'
                    }} />
                    <span className="td-score-num">{m.grid_access}</span>
                  </div>
                </td>
                <td>
                  {m.sez_status !== 'None'
                    ? <span className="td-sez active">{m.sez_status}</span>
                    : <span className="td-sez none">—</span>}
                </td>
                <td className="td-parcels">{m.parcels_available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="compare-footer">
        Sources: BIR Zonal Values 2024 · SBMA / BCDA Registry · PSA 2020 · RA 11453 · LGU Bataan Infrastructure Database
      </div>
    </div>
  )
}
