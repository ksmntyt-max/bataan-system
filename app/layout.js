import { Orbitron, Space_Grotesk } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({ subsets: ['latin'], weight: ['400','600','700','900'], variable: '--font-orbitron' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-space' })

export const metadata = {
  title: 'BLIS · Bataan Land Intelligence System · Firma Strategic',
  description: 'Firma Strategic · Nation of Heaven EDGE Infrastructure Engine v1.2 · Province of Bataan, Central Luzon Philippines · Geospatial Land Intelligence Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  )
}
