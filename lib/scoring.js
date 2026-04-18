import { MUNICIPALITIES, INFRA, ASSETS } from './data'

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function ds(la, lo, tla, tlo, maxKm) {
  return Math.max(0, 1 - haversine(la, lo, tla, tlo) / maxKm)
}

function nearestMuni(la, lo) {
  return MUNICIPALITIES.reduce((best, m) => {
    const d = haversine(la, lo, m.lat, m.lng)
    return d < best.d ? { m, d } : best
  }, { m: MUNICIPALITIES[0], d: Infinity }).m
}

function roadSc(la, lo) {
  const scores = MUNICIPALITIES.map(m => ds(la, lo, m.lat, m.lng, 12) * m.roadScore)
  return Math.max(...scores)
}

function zonSc(la, lo, preferred) {
  const muni = nearestMuni(la, lo)
  const muniZones = muni.zoning.map(z => z.toLowerCase())
  return preferred.some(p => muniZones.some(z => z.includes(p))) ? 0.85 : 0.45
}

function costSc(la, lo) {
  const muni = nearestMuni(la, lo)
  const avg = (muni.zonalMin + muni.zonalMax) / 2
  return Math.max(0, 1 - avg / 20000)
}

export function calcScore(la, lo, assetId) {
  const w = ASSETS[assetId].weights
  const port  = ds(la, lo, INFRA.port.lat, INFRA.port.lng, 28)
  const power = Math.max(
    ds(la, lo, INFRA.power1.lat, INFRA.power1.lng, 22),
    ds(la, lo, INFRA.power2.lat, INFRA.power2.lng, 22) * 0.65
  )
  const road  = roadSc(la, lo)
  const zon   = zonSc(la, lo, ASSETS[assetId].preferred)
  const cost  = costSc(la, lo)
  const total = w.port*port + w.power*power + w.road*road + w.zoning*zon + w.cost*cost
  return {
    total:  Math.round(total * 100),
    port:   Math.round(port  * 100),
    power:  Math.round(power * 100),
    road:   Math.round(road  * 100),
    zoning: Math.round(zon   * 100),
    cost:   Math.round(cost  * 100),
  }
}

export function calcScoreBreakdown(parcel) {
  // Sub-factor breakdown (0–25 each = 100 total)
  const gridAccess    = Math.round((parcel.infrastructure.power / 100) * 25)
  const roadProximity = Math.round((parcel.infrastructure.road  / 100) * 25)
  const zoningMatch   = parcel.bestFor.length > 0 ? Math.round(18 + Math.random() * 7) : Math.round(8 + Math.random() * 10)
  const floodRisk     = parcel.risk === 'low' ? Math.round(20 + Math.random() * 5) : parcel.risk === 'medium' ? Math.round(12 + Math.random() * 6) : Math.round(4 + Math.random() * 8)
  return { gridAccess, roadProximity, zoningMatch, floodRisk }
}

export function landCompatScore(parcel, assetId) {
  if (!assetId) return 50
  const w = ASSETS[assetId].weights
  const baseMatch = parcel.bestFor.includes(assetId) ? 32 : 0
  const powerComp = parcel.infrastructure.power * w.power
  const portComp  = parcel.infrastructure.port  * w.port
  const roadComp  = parcel.infrastructure.road  * w.road
  const avgPrice  = (parcel.priceMin + parcel.priceMax) / 2
  const costComp  = Math.max(0, 1 - avgPrice / 25000) * w.cost * 100
  return Math.min(100, Math.round(baseMatch + powerComp*.45 + portComp*.45 + roadComp*.45 + costComp*.45))
}

export function nearestMuniToParcel(parcel) {
  return nearestMuni(parcel.lat, parcel.lng)
}

export function scoreColor(score) {
  if (score >= 90) return '#00ff88'
  if (score >= 75) return '#88ff44'
  if (score >= 60) return '#ffcc00'
  if (score >= 45) return '#ff6b35'
  return '#ff3355'
}

export function zonalColor(avg) {
  if (avg > 10000) return '#ff3355'
  if (avg > 5000)  return '#ff6b35'
  if (avg > 2000)  return '#ffcc00'
  if (avg > 1000)  return '#88ff44'
  return '#00ff88'
}

export function formatPHP(n) {
  if (n >= 1e9) return `₱${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `₱${(n/1e6).toFixed(1)}M`
  if (n >= 1e3) return `₱${(n/1e3).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}
