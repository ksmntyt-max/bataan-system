import { Orbitron, Space_Grotesk, Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const orbitron     = Orbitron({ subsets: ['latin'], weight: ['400','600','700','900'], variable: '--font-orbitron' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-space' })
const playfair     = Playfair_Display({ subsets: ['latin'], weight: ['700','800'], variable: '--font-playfair' })
const inter        = Inter({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-inter' })

export const metadata = {
  title: 'BLESS · Bataan Land Evaluation for Sustainable Settlements · Firma',
  description: 'Firma · BLESS — Bataan Land Evaluation for Sustainable Settlements · Sovereign network mapping land, settlements, and sustainable infrastructure across Bataan Province, Philippines.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${spaceGrotesk.variable} ${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
