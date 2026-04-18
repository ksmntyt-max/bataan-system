# BLIS — Bataan Land Intelligence System

**Firma Strategic · Nation of Heaven EDGE Infrastructure Engine v1.2**

A geospatial land intelligence platform for the Province of Bataan, Central Luzon, Philippines. Built for Firma Strategic to identify, score, and compare land acquisition opportunities for sovereign infrastructure deployment.

Live: [firma-blis.vercel.app](https://firma-blis.vercel.app)

---

## What It Does

BLIS maps and scores every municipality in Bataan for four asset types:

| Asset | Description |
|-------|-------------|
| 🏛️ Firma HQ | SeedBase command hub |
| 🏘️ Haven Village | Container housing community |
| ⛏️ Steel Forge | BTC mining / industrial facility |
| ☀️ Solar Farm | Sovereign energy generation |

Click any point on the map to deploy an asset and instantly get a **composite score (0–100)** based on proximity to ports, power infrastructure, roads, zoning compatibility, and land cost.

---

## Features

- **Interactive Leaflet map** — dark tile base, province outline, zonal value overlays
- **Composite scoring engine** — weighted haversine scoring across 5 infrastructure factors
- **12 municipality profiles** — BIR zonal values, population, SEZ status, key features
- **Hazard Zones overlay** — flood, storm surge, liquefaction (GeoJSON)
- **CLUP Zoning overlay** — Agricultural, Industrial, Commercial, Protected zones (GeoJSON)
- **CSV parcel database** — 12 pre-ranked land parcels with asset class, zoning, BIR value
- **AI Land Scanner** — auto-ranks parcels by asset compatibility with scan animation
- **Investment Calculator** — Side A vs Side B scenario comparison with ROI, break-even, revenue
- **Municipality Comparison** — all 12 municipalities side-by-side at `/compare`
- **Google Street View** — deep-link from any pin, parcel, or recommendation
- **Pin management** — deploy assets, view scores, remove pins from map or sidebar
- **Print to PDF** — browser-native export of parcel detail panels

---

## Stack

- **Next.js 16** (App Router, static export)
- **React 19**
- **Leaflet 1.9** (client-side only, `ssr: false`)
- **Orbitron + Space Grotesk** (Google Fonts)
- **Vercel** (deployment)

No external APIs. No database. All data is static (CSV + GeoJSON in `/public/data/`).

---

## Project Structure

```
bataan-lis/
├── app/
│   ├── page.js              # Main map interface
│   ├── layout.js            # Root layout + fonts
│   ├── globals.css          # All styles
│   └── compare/
│       └── page.js          # Municipality comparison table
├── components/
│   ├── GlobeScreen.jsx      # Animated entry screen
│   ├── MapWrapper.jsx       # Dynamic import wrapper (ssr:false)
│   ├── MapInner.jsx         # Leaflet map, layers, scoring
│   ├── Sidebar.jsx          # 5-tab sidebar (Layers/Pins/Recs/Land/Data)
│   ├── ParcelPanel.jsx      # Parcel detail slide-in panel
│   ├── ScoreBreakdown.jsx   # 4-factor score bars
│   ├── InvestmentCalc.jsx   # Investment comparison modal
│   ├── CompareTable.jsx     # Municipality comparison table
│   └── StreetViewButton.jsx # Google Street View deep-link button
├── lib/
│   ├── data.js              # All static data (municipalities, assets, recs, parcels)
│   └── scoring.js           # Haversine scoring engine
└── public/
    └── data/
        ├── parcels.csv
        ├── municipalities.csv
        ├── hazard-zones.geojson
        └── clup-zoning.geojson
```

---

## Data Sources

- BIR Zonal Values 2024 / Bataan 2026 SMV
- PSA Census 2020
- SBMA / SBFZ industrial zone data
- RA 11453 (New Clark City / BCDA)
- Bataan CLUP municipal zoning records
- PHIVOLCS / MGB hazard mapping

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy

```bash
npx vercel --prod
```

---

Built by **Firma Strategic** · Nation of Heaven EDGE Infrastructure Engine
