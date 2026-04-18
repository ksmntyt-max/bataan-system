import { readFileSync } from 'fs'
import path from 'path'
import CompareTable from '@/components/CompareTable'
import Link from 'next/link'

function parseCSV(text) {
  const [header, ...rows] = text.trim().split('\n')
  const keys = header.split(',').map(k => k.trim())
  return rows.map(row => {
    const vals = row.split(',').map(v => v.trim())
    return Object.fromEntries(keys.map((k, i) => [k, vals[i] ?? '']))
  })
}

export const metadata = {
  title: 'Municipality Comparison · BLIS Bataan',
}

export default function ComparePage() {
  const csvPath = path.join(process.cwd(), 'public', 'data', 'municipalities.csv')
  const csv     = readFileSync(csvPath, 'utf-8')
  const data    = parseCSV(csv)

  return (
    <div className="compare-page">
      <div className="compare-nav">
        <Link href="/" className="compare-back">← Back to Map</Link>
        <div className="compare-nav-title">FIRMA STRATEGIC · BLIS v1.2</div>
      </div>
      <CompareTable municipalities={data} />
    </div>
  )
}
