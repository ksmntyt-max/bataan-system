# BLIS — Bataan Land Intelligence System

**Firma Strategic · Nation of Heaven EDGE Infrastructure Engine v1.2**

A geospatial land intelligence platform for the Province of Bataan, Central Luzon, Philippines. Built for Firma Strategic to identify, score, and compare land acquisition opportunities for sovereign infrastructure deployment.

Live: [firma-blis.vercel.app](https://firma-blis.vercel.app) · GitHub: [ksmntyt-max/bataan-system](https://github.com/ksmntyt-max/bataan-system)

---

## What It Does

BLIS maps and scores every municipality in Bataan for eight Firma asset types:

| Asset | Description |
|-------|-------------|
| 🏛️ HQ | SeedBase command hub |
| 🏘️ Haven | Sovereign housing community |
| ⛏️ Forge | Industrial compute facility |
| ☀️ Solar | Renewable energy generation |
| 📡 Pulse | Compute node / edge cluster |
| 🎙️ Whisper | Comms relay / broadcast node |
| 🛰️ Sentinel | Sensor / earth observation hub |
| ⚡ Grid | Power distribution / microgrid |

Click any point on the map to deploy an asset and instantly get a **composite score (0–100)** based on proximity to ports, power infrastructure, roads, zoning compatibility, land cost, and Firma sovereign readiness.

---

## Features

### Map & Visualization
- **Globe intro screen** — animated entry before main app
- **MapLibre GL JS v5 map** — OpenFreeMap vector tiles (liberty style), 5-layer visual hierarchy
- **City/District hover** — municipality GeoJSON from GitHub CDN, hover shows name + zonal value + population
- **Composite Heatmap** — province-wide investment score heat overlay
- **13 map layers** (toggleable):
  - Zone Layers — BIR zonal value zones color-coded by municipality
  - Infrastructure Layer — ports, power grids, freeports, roads, fiber nodes
  - Recommendations Layer — top-ranked deployment sites per asset type
  - Land Parcels Layer — pre-screened acquisition targets with urgency ratings
  - Hazard Zones Layer — PHIVOLCS flood, storm surge & liquefaction risk (GeoJSON)
  - CLUP Zoning Layer — Agri, Industrial, Commercial, Protected zones (GeoJSON)
  - Sovereign Layer — LGU alignment status & permit pathway readiness per parcel
  - OmniMesh Network Layer — Node/Sentinel/Pulse/Whisper topology
  - Strategic Context Layer — SBFZ, Clark FZ, FAB, Hermosa Ecozone, BCIB 2029 overlays

### Asset Deployment
- **Firma Asset Deploy System** — 8 asset types, click map to deploy pins, composite scoring
- **Asset hover tooltips** — rich tooltip on toolbar hover showing tagline, description, best zones, incentive
- **Pin management** — deploy, view score breakdown, remove from map or sidebar
- **Deployed pin cards** — score breakdown per pin in PINS sidebar tab

### Intelligence & Analysis
- **Composite scoring engine** — weighted haversine scoring across infrastructure, zoning, cost, sovereignty factors
- **Parcel Detail Panel** — slide-in panel when clicking CSV parcel circles
- **Zone Panel** — click zone polygon → slide-in with investment intelligence, pros, authority, "Deploy Asset Here" CTA
- **AI Land Scanner** — auto-ranks parcels by asset compatibility with scan animation
- **Municipality Comparison** — all 12 municipalities side-by-side at `/compare`
- **Investment Calculator modal** — scenario analysis with composite scoring

### Data & Intelligence
- **12 municipality profiles** — BIR zonal values, population, SEZ status, key features
- **CSV parcel database** — pre-ranked land parcels with asset class, zoning, urgency
- **Recommendations per asset type** — top-ranked sites with fly-to + Street View

### UX & Navigation
- **Sidebar redesign** — light card system (#F7F8FA bg, white cards, pill tabs)
- **6 sidebar tabs**: LAYERS, PINS, RECS, LAND, DATA, ECO
- **Google Street View** — deep-link from pins, parcels, recommendations
- **Map Legend** — collapsible on-map legend with color reference
- **Layer descriptions** — each toggle shows what it represents

### Governance & Compliance
- **Sovereignty Ladder** — 5-step pathway with compliance checklists
- **NS Simulator Mode** — Nation of Heaven Simulator integration
- **Firma Product Grid** — 8 asset types + grid of infrastructure options
- **Firmamint Chain Status** — tokenomics & blockchain readiness
- **OmniMesh Status** — network node topology & deployment readiness

### Accessibility & Export
- **WCAG AA compliance** — map canvas role, layer switch toggles, keyboard nav, aria-live score updates
- **Print to PDF** — browser-native export of detail panels
- **Toast notifications** — role="status" for user feedback

---

## Map Visual Hierarchy

### Zone Colors (Zonal Value)
| Color | Value Range | Meaning |
|-------|-------------|---------|
| 🟢 Green | ₱800–2,500/sqm | Low zonal value — agricultural/rural |
| 🟡 Yellow | ₱2,500–5,000/sqm | Mid zonal value — emerging zones |
| 🟠 Orange | ₱5,000–8,500/sqm | High zonal value — industrial/ecozone |
| 🔴 Red | ₱8,500+/sqm | Critical zonal value — premium sites |

### Infrastructure Icons
| Icon | Meaning |
|------|---------|
| 🔵 Blue | Port / Freeport (SBFZ/SBMA) |
| 🟠 Orange | Power grid / substation |
| 🟡 Yellow | Road / highway node |
| 🟣 Purple | Fiber / connectivity hub |

### Parcel Urgency Badges
| Badge | Meaning |
|-------|---------|
| 🔴 RED | HIGH urgency — deploy now |
| 🟠 ORANGE | MEDIUM urgency — good opportunity |
| ⚫ GREY | LOW urgency — monitor & watch |

### Deployed Asset Pins
- Score badge displays composite investment score (0–100)
- Color indicates asset type (HQ, Haven, Forge, Solar, Pulse, Whisper, Sentinel, Grid)
- Click pin to view detailed score breakdown

Open the **⬡ MAP LEGEND** button (bottom-left of map) for a full in-app reference with all indicators and definitions.

---

## Map Layers (13 Total)

Toggled via the **LAYERS** sidebar tab. All layers are vector tiles (MapLibre GL JS) except where noted.

| Layer | Type | Description |
|-------|------|-------------|
| Zone Layers | Vector | BIR zonal value zones color-coded by municipality |
| Infrastructure | Vector | Ports, power grids, freeports, roads, fiber nodes |
| Recommendations | Vector | Top-ranked deployment sites per asset type |
| Land Parcels | CSV circles | Pre-screened parcels with urgency ratings |
| Composite Heatmap | Raster | Province-wide investment score heat overlay |
| Hazard Zones | GeoJSON | PHIVOLCS flood, storm surge, liquefaction risk areas |
| CLUP Zoning | GeoJSON | Municipal land use plan (Agri, Industrial, Commercial, Protected) |
| Sovereign Layer | Vector | LGU alignment status & permit pathway readiness per parcel |
| OmniMesh Network | Vector | Firma EDGE node/sentinel/pulse/whisper topology |
| Strategic Context | Vector | SBFZ, Clark FZ, FAB, Hermosa Ecozone, BCIB 2029 overlays |

All GeoJSON and CSV data source files are in `/public/data/`.

---

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **MapLibre GL JS v5** (client-side only, `ssr: false`)
- **OpenFreeMap vector tiles** (liberty style)
- **Orbitron + Space Grotesk** (Google Fonts)
- **Vercel** (deployment)

No external APIs. No database. No environment variables required. All data is static (CSV + GeoJSON in `/public/data/`).

---

## Project Structure

```
bataan-lis/
├── app/
│   ├── page.js              # Main map interface (uses useBLISState)
│   ├── layout.js            # Root layout (Orbitron + Space Grotesk fonts)
│   ├── globals.css          # All styles (card system, tabs, sidebar)
│   └── compare/
│       └── page.js          # Municipality comparison table
├── components/
│   ├── GlobeScreen.jsx      # Animated globe entry screen
│   ├── MapWrapper.jsx       # Dynamic import wrapper (ssr:false)
│   ├── MapInner.jsx         # MapLibre GL JS v5 map, 13 layers, legend
│   ├── Sidebar.jsx          # 6-tab sidebar (LAYERS/PINS/RECS/LAND/DATA/ECO)
│   ├── ParcelPanel.jsx      # Parcel detail slide-in
│   ├── ZonePanel.jsx        # Zone info panel (AFAB/SBFZ)
│   ├── ScoreBreakdown.jsx   # Score breakdown display
│   ├── InvestmentCalc.jsx   # Investment calculator modal
│   ├── CompareTable.jsx     # Municipality comparison table
│   └── StreetViewButton.jsx # Google Street View deep-link
├── lib/
│   ├── data.js              # ASSETS (8 types), MUNICIPALITIES, INFRA, RECS, LAND_OPPS, ZONE_DATA, SOVEREIGN_PROFILES, OMNIMESH_NODES, BATAAN_OUTLINE
│   ├── scoring.js           # calcScore, landCompatScore, scoreColor, zonalColor, formatPHP
│   └── useBLISState.js      # Central useReducer state hook (single source of truth)
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

## Roadmap: firma.quest/map

Features from BLIS worth porting, in priority order:

**Priority 1 — Core Map Intelligence (start here)**
- Composite scoring engine — PORT + POWER + ROAD + ZONE + COST weighted scores per location click
- Province-wide investment heatmap — color-coded heat overlay showing best deployment zones
- BIR zonal value zones — land value bands per municipality, color-coded low→high
- Asset type selector — arm a deployment type before clicking map
- Click-to-score — click any map point → instant composite score + breakdown
- Deployed pin management — save, view, and delete scored locations
- Asset hover tooltips — tagline, best zones, incentive text per asset type

**Priority 2 — Data Layers**
- Hazard overlay — PHIVOLCS flood / storm surge / liquefaction zones (GeoJSON)
- CLUP zoning — municipal land use: Agri / Industrial / Commercial / Protected
- Infrastructure markers — ports, power grids, freeport boundaries, roads, fiber
- Sovereign readiness layer — LGU alignment status per parcel
- Strategic zones — SBFZ, AFAB, Clark FZ, Hermosa Ecozone, BCIB corridor

**Priority 3 — Land Intelligence**
- Pre-screened parcel database — urgency-rated (HIGH/MED/LOW), price range, compatibility score
- AI land scanner — auto-ranks parcels by asset compatibility on demand
- Sovereign profile per parcel — pathway readiness %, LGU tier alignment

**Priority 4 — Zone & Investment Panels**
- SBFZ & AFAB click panels — investment case, pros, authority, duty-free status, "Deploy Here" CTA
- Investment calculator modal — ROI / capex comparison tool
- Side-by-side compare table

**Priority 5 — Governance & Ecosystem (deepest moat)**
- Sovereignty Ladder — 5-step pathway (Land → LGU → Shard → Settlement → Sovereignty) with compliance checklists
- NS Simulator mode switcher — Sandbox / Sim / Mint / Settle states
- Firmamint chain status — shard ID, validators, $CIK staked, next milestone
- Three-currency economy display — FIG Cash → $CIK → Local FIG flow
- OmniMesh node topology map

**UX (apply throughout)**
- Street View links on every pin, rec, and parcel card
- Fly-to navigation — click any rec or parcel → map animates to location
- WCAG AA accessibility — keyboard nav, ARIA roles, aria-live score display

---

Built by **Firma Strategic** · Nation of Heaven EDGE Infrastructure Engine
