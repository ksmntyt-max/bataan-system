'use client'

import { useState } from 'react'
import { ASSETS, MUNICIPALITIES } from '@/lib/data'
import { formatPHP } from '@/lib/scoring'

const ASSET_IDS = ['hq', 'haven', 'forge', 'solar']
const SIZES = ['s', 'm', 'l']

function calcSide(assetId, sizeKey, muniId) {
  if (!assetId || !sizeKey || !muniId) return null
  const asset = ASSETS[assetId]
  const muni  = MUNICIPALITIES.find(m => m.id === muniId) || MUNICIPALITIES[0]
  const sz    = asset.sizes[sizeKey]
  const avgBIR = Math.round((muni.zonalMin + muni.zonalMax) / 2)
  const land  = sz.sqm * avgBIR
  const build = sz.build
  const total = land + build
  const rev   = asset.revenue[sizeKey]
  const months = Math.ceil(total / rev)
  return { asset, sz, land, build, total, rev, months, muni }
}

function SidePanel({ label, onUpdate }) {
  const [assetId, setAssetId] = useState('')
  const [sizeKey, setSizeKey] = useState('m')
  const [muniId,  setMuniId]  = useState('mariveles')

  const result = calcSide(assetId, sizeKey, muniId)

  function update(a, s, m) {
    const r = calcSide(a, s, m)
    onUpdate(r)
  }

  return (
    <div className="inv-side">
      <div className="inv-side-label">{label}</div>

      <div className="inv-field">
        <label className="inv-label">ASSET TYPE</label>
        <div className="inv-asset-grid">
          {ASSET_IDS.map(id => (
            <button key={id} className={`inv-asset-btn ${assetId === id ? 'on' : ''}`}
              style={{ '--ac': ASSETS[id].color }}
              onClick={() => { setAssetId(id); update(id, sizeKey, muniId) }}>
              <span>{ASSETS[id].icon}</span>
              <span className="inv-asset-name">{ASSETS[id].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="inv-field">
        <label className="inv-label">SCALE</label>
        <div className="inv-size-row">
          {assetId && SIZES.map(s => (
            <button key={s} className={`inv-size-btn ${sizeKey === s ? 'on' : ''}`}
              onClick={() => { setSizeKey(s); update(assetId, s, muniId) }}>
              {ASSETS[assetId].sizes[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="inv-field">
        <label className="inv-label">MUNICIPALITY</label>
        <select className="inv-select" value={muniId}
          onChange={e => { setMuniId(e.target.value); update(assetId, sizeKey, e.target.value) }}>
          {MUNICIPALITIES.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {result ? (
        <div className="inv-results">
          <div className="inv-result-row"><span>Land Area</span><span>{result.sz.sqm.toLocaleString()} sqm</span></div>
          <div className="inv-result-row"><span>Land Cost</span><span>{formatPHP(result.land)}</span></div>
          <div className="inv-result-row"><span>Build Cost</span><span>{formatPHP(result.build)}</span></div>
          <div className="inv-result-total"><span>TOTAL</span><span>{formatPHP(result.total)}</span></div>
          <div className="inv-result-rev"><span>Monthly Revenue</span><span className="green">{formatPHP(result.rev)}/mo</span></div>
          <div className="inv-result-row"><span>Break-even</span><span className="gold">{result.months} months</span></div>
          <div className="inv-result-note">{result.asset.revenue.note}</div>
        </div>
      ) : (
        <div className="inv-placeholder">Select asset type to calculate</div>
      )}
    </div>
  )
}

export default function InvestmentCalc({ onClose }) {
  const [sideA, setSideA] = useState(null)
  const [sideB, setSideB] = useState(null)

  return (
    <div className="inv-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="inv-modal">
        <div className="inv-modal-header">
          <div className="inv-modal-title">⚖ INVESTMENT SCENARIO COMPARISON</div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="inv-modal-body">
          <SidePanel label="SCENARIO A" onUpdate={setSideA} />
          <div className="inv-divider" />
          <SidePanel label="SCENARIO B" onUpdate={setSideB} />
        </div>

        {sideA && sideB && (
          <div className="inv-compare-row">
            <div className="inv-compare-title">SIDE-BY-SIDE COMPARISON</div>
            <table className="inv-table">
              <thead>
                <tr><th>Metric</th><th>Scenario A</th><th>Scenario B</th><th>Delta</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Investment</td>
                  <td>{formatPHP(sideA.total)}</td>
                  <td>{formatPHP(sideB.total)}</td>
                  <td className={sideA.total < sideB.total ? 'green' : 'red'}>
                    {sideA.total < sideB.total ? '▼' : '▲'} {formatPHP(Math.abs(sideA.total - sideB.total))}
                  </td>
                </tr>
                <tr>
                  <td>Monthly Revenue</td>
                  <td className="green">{formatPHP(sideA.rev)}</td>
                  <td className="green">{formatPHP(sideB.rev)}</td>
                  <td className={sideA.rev > sideB.rev ? 'green' : 'red'}>
                    {sideA.rev > sideB.rev ? '▲' : '▼'} {formatPHP(Math.abs(sideA.rev - sideB.rev))}
                  </td>
                </tr>
                <tr>
                  <td>Break-even</td>
                  <td className="gold">{sideA.months} mo</td>
                  <td className="gold">{sideB.months} mo</td>
                  <td className={sideA.months < sideB.months ? 'green' : 'red'}>
                    {sideA.months < sideB.months ? '▼' : '▲'} {Math.abs(sideA.months - sideB.months)} mo
                  </td>
                </tr>
                <tr>
                  <td>Annual ROI %</td>
                  <td className="accent">{((sideA.rev * 12 / sideA.total) * 100).toFixed(1)}%</td>
                  <td className="accent">{((sideB.rev * 12 / sideB.total) * 100).toFixed(1)}%</td>
                  <td className={sideA.rev/sideA.total > sideB.rev/sideB.total ? 'green' : 'red'}>
                    {sideA.rev/sideA.total > sideB.rev/sideB.total ? 'A wins' : 'B wins'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
