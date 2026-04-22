// ═══════════════════════════════════════════
//  BLIS Static Data — Bataan Land Intelligence System
// ═══════════════════════════════════════════

export const MUNICIPALITIES = [
  { id:'mariveles',   name:'Mariveles',     lat:14.437, lng:120.488, zonalMin:2000,  zonalMax:15000, pop:120456, areaHa:19650, zoning:['Industrial','Freeport','Residential'],     features:['Port of Mariveles','SBFZ','Bataan Tech Park','RA 11453'], powerScore:.92, portScore:1.0, roadScore:.82, r:8.5, sez:true  },
  { id:'balanga',     name:'Balanga City',  lat:14.676, lng:120.535, zonalMin:5000,  zonalMax:25000, pop:97187,  areaHa:10821, zoning:['Commercial','Residential','Institutional'], features:['Provincial Capitol','City Hall','Commercial Hub'],        powerScore:.95, portScore:.38, roadScore:.95, r:6.0, sez:false },
  { id:'limay',       name:'Limay',         lat:14.558, lng:120.598, zonalMin:1500,  zonalMax:8000,  pop:78534,  areaHa:11460, zoning:['Industrial','Commercial','Residential'],    features:['Limay Industrial Zone','Petrochem Complex','NPC Plant'],  powerScore:.88, portScore:.62, roadScore:.78, r:6.5, sez:false },
  { id:'orion',       name:'Orion',         lat:14.621, lng:120.578, zonalMin:1000,  zonalMax:6000,  pop:55612,  areaHa:10200, zoning:['Residential','Commercial','Agricultural'],  features:['Manila Bay Coast','Calumpang Point'],                     powerScore:.75, portScore:.55, roadScore:.70, r:6.0, sez:false },
  { id:'samal',       name:'Samal',         lat:14.768, lng:120.549, zonalMin:300,   zonalMax:2000,  pop:28340,  areaHa:7800,  zoning:['Agricultural','Residential'],               features:['Farmlands','Pampanga River Delta'],                       powerScore:.65, portScore:.30, roadScore:.72, r:5.5, sez:false },
  { id:'abucay',      name:'Abucay',        lat:14.733, lng:120.526, zonalMin:400,   zonalMax:2500,  pop:45670,  areaHa:9100,  zoning:['Agricultural','Residential','Commercial'],  features:['Bataan Shrine','Abucay Bay'],                             powerScore:.68, portScore:.38, roadScore:.68, r:5.5, sez:false },
  { id:'orani',       name:'Orani',         lat:14.802, lng:120.530, zonalMin:600,   zonalMax:4000,  pop:53450,  areaHa:9700,  zoning:['Commercial','Agricultural','Residential'],  features:['Orani Market','Bataan National Highway'],                 powerScore:.72, portScore:.28, roadScore:.80, r:6.0, sez:false },
  { id:'hermosa',     name:'Hermosa',       lat:14.831, lng:120.504, zonalMin:500,   zonalMax:3000,  pop:41230,  areaHa:11300, zoning:['Agricultural','Residential','Industrial'],  features:['Hermosa Eco-Zone','BCDA Subzone'],                        powerScore:.70, portScore:.22, roadScore:.78, r:6.0, sez:true  },
  { id:'dinalupihan', name:'Dinalupihan',   lat:14.876, lng:120.462, zonalMin:800,   zonalMax:5000,  pop:64320,  areaHa:13200, zoning:['Commercial','Industrial','Residential'],    features:['NLEX/SCTEX Gateway','Dinalupihan Technopark'],            powerScore:.78, portScore:.20, roadScore:.88, r:7.0, sez:true  },
  { id:'pilar',       name:'Pilar',         lat:14.6667, lng:120.5500, zonalMin:400,   zonalMax:2500,  pop:22140,  areaHa:5400,  zoning:['Agricultural','Residential'],               features:['Manila Bay Shoreline','Wetland Sanctuary'],               powerScore:.60, portScore:.45, roadScore:.55, r:4.5, sez:false },
  { id:'morong',      name:'Morong',        lat:14.691, lng:120.267, zonalMin:200,   zonalMax:1500,  pop:14890,  areaHa:23700, zoning:['Agricultural','Forest','Residential'],      features:['Morong Nuclear Site','Bataan Natural Park'],              powerScore:.55, portScore:.28, roadScore:.48, r:8.0, sez:false },
  { id:'bagac',       name:'Bagac',         lat:14.593, lng:120.394, zonalMin:200,   zonalMax:1200,  pop:18760,  areaHa:21500, zoning:['Agricultural','Forest','Eco-Tourism'],      features:['Bagac Bay','Mt. Samat Forest','Eco-Resort Zone'],         powerScore:.50, portScore:.55, roadScore:.45, r:8.0, sez:false },
]

export const INFRA = {
  port:   { lat:14.437, lng:120.488, label:'Port of Mariveles',        icon:'⚓', type:'port' },
  sbfz:   { lat:14.448, lng:120.468, label:'SBFZ Freeport',            icon:'🏭', type:'freeport' },
  power1: { lat:14.525, lng:120.548, label:'Bataan 2020 Power Plant',  icon:'⚡', type:'power' },
  power2: { lat:14.688, lng:120.268, label:'BNPP Site',                icon:'⚡', type:'power' },
  nlex:   { lat:14.876, lng:120.462, label:'NLEX/SCTEX Exit',          icon:'🛣', type:'road' },
  hwy1:   { lat:14.556, lng:120.596, label:'N. Highway Jct.',          icon:'🛣', type:'road' },
  cable:  { lat:14.437, lng:120.490, label:'Submarine Cable Hub',      icon:'🌐', type:'fiber' },
}

export const ASSETS = {
  hq: {
    id:'hq', label:'Firma HQ', sub:'SeedBase Hub', icon:'🏛️', color:'#00b4ff',
    weights:{port:.15,power:.20,road:.30,zoning:.20,cost:.15},
    preferred:['commercial','freeport','industrial'],
    desc:'SeedBase Hub · 1Accord Commons · Crypto Onboarding · CIK Mission Staging',
    tooltip:{
      tagline:'Corporate Governance Anchor',
      description:'Central hub for administration, legal entity registration, and brand presence. Houses the 1Accord Commons, SeedBase node, and CIK mission staging area.',
      bestZones:['Prime CBD','SBFZ Freeport','AFAB Industrial'],
      incentive:'Qualifies for ITH under RA 11534 (CREATE Act)',
    },
    sizes:{
      s:{sqm:300,  label:'Starter',  units:'1 × 40ft SeedBase pod + glass fitout',                  containers:1,  build:3800000},
      m:{sqm:750,  label:'Standard', units:'2–3 × 40ft + 1 × 20ft link + café + commons',           containers:3,  build:9500000},
      l:{sqm:2200, label:'Campus',   units:'5+ containers + full EDGE campus amenities',             containers:5,  build:24000000},
    },
    revenue:{s:180000,m:420000,l:900000,note:'Coworking · training · CIK staging fees · crypto onboarding'},
  },
  haven: {
    id:'haven', label:'Haven Village', sub:'Container Housing', icon:'🏘️', color:'#00ff88',
    weights:{port:.10,power:.20,road:.25,zoning:.25,cost:.20},
    preferred:['residential','agricultural','freeport'],
    desc:'MODPOD residential · Haven One/Two/Lux · T0→T1 pathway · FIT team campus',
    tooltip:{
      tagline:'Workforce Residential Cluster',
      description:'Integrated housing and lifestyle community for zone workers and FIT settlers. Includes Haven One/Two/Lux modules, shared commons, and T0→T1 settlement pathway.',
      bestZones:['Mariveles Expansion','Orion Bay Corridor','Coastal Strips'],
      incentive:'Low-cost housing tax exemptions · BOI-registered development',
    },
    sizes:{
      s:{sqm:1400, label:'Starter',  units:'5 × Haven modules + shared amenities',                  containers:5,  build:11500000},
      m:{sqm:3000, label:'Village',  units:'10 × Haven modules + pool + fire pit + commons',        containers:10, build:23000000},
      l:{sqm:6500, label:'Township', units:'20 × Haven One/Two/Lux + full village fitout',          containers:20, build:48000000},
    },
    revenue:{s:125000,m:260000,l:540000,note:'FIT team housing + settler residency + rental income'},
  },
  forge: {
    id:'forge', label:'Steel Forge', sub:'BTC Mining Farm', icon:'⛏️', color:'#ff6b35',
    weights:{port:.20,power:.42,road:.20,zoning:.10,cost:.08},
    preferred:['industrial','freeport'],
    desc:'~500 TH/s per 40ft container · liquid cooling · 85% waste heat recovery · duty-free RA 11453',
    tooltip:{
      tagline:'Bitcoin Mining + Heavy Compute',
      description:'~500 TH/s per 40ft container with liquid cooling and 85% waste heat recovery. Requires M-1/M-2 industrial zoning and high-power grid connectivity.',
      bestZones:['SBFZ Industrial Block','AFAB Mariveles','Limay Corridor'],
      incentive:'Duty-free equipment import · PEZA/AFAB registered operations',
    },
    sizes:{
      s:{sqm:500,  label:'1 Unit',   units:'1 × 40ft Forge container (~500 TH/s)',                  containers:1,  build:5700000},
      m:{sqm:2200, label:'5 Units',  units:'5 × Forge containers (~2.5 PH/s) + cooling plant',     containers:5,  build:28500000},
      l:{sqm:8500, label:'20 Units', units:'20 × containers (~10 PH/s) + industrial cooling + UPS', containers:20, build:114000000},
    },
    revenue:{s:640000,m:3200000,l:12800000,note:'~₱640K/mo net per container @ BTC $68K after power cost'},
  },
  solar: {
    id:'solar', label:'Solar Farm', sub:'Sovereign Energy', icon:'☀️', color:'#ffcc00',
    weights:{port:.05,power:.08,road:.18,zoning:.32,cost:.37},
    preferred:['agricultural','forest','eco-tourism','industrial'],
    desc:'Grid independence · Ion+ sodium-ion battery backup · powers Forge + Haven + Hub',
    tooltip:{
      tagline:'Sovereign Renewable Energy',
      description:'Utility-scale solar + Ion+ sodium-ion battery backup. Powers the Forge, Haven, and HQ nodes for full grid independence. Minimum 5 ha open land required.',
      bestZones:['Morong Open Plateau','Samal Agricultural Flats','Bagac Bay Zone'],
      incentive:'FIT incentives under RA 9513 (Renewable Energy Act)',
    },
    sizes:{
      s:{sqm:1200,  label:'100 kW', units:'~350 panels + Ion+ battery rack + inverter',             containers:0, build:6000000},
      m:{sqm:6000,  label:'500 kW', units:'~1,750 panels + 2 × Ion+ battery racks + SCADA',        containers:0, build:30000000},
      l:{sqm:12000, label:'1 MW',   units:'~3,500 panels + full Ion+ storage bank + grid tie',      containers:0, build:60000000},
    },
    revenue:{s:75000,m:375000,l:750000,note:'Grid feed-in @ ₱4.60/kWh · powers Forge ops (offsets ~₱500K/mo per 5-unit farm)'},
  },
}

export const RECS = {
  hq: [
    { name:'Mariveles CBD (Near TESDA)', lat:14.445, lng:120.495, score:92, muniId:'mariveles', note:'#1 pick: SBFZ duty-free, port, submarine cable proximity, crypto developer community already present', tag:'TOP PICK' },
    { name:'Balanga City Hall District', lat:14.678, lng:120.537, score:81, muniId:'balanga',   note:'Provincial capital: maximum visibility, government relations, highest commercial foot traffic', tag:'VISIBILITY' },
    { name:'Limay Industrial Hub',       lat:14.560, lng:120.600, score:73, muniId:'limay',     note:'Industrial zoning, petrochem proximity, port access, 40% lower land cost than Balanga', tag:'COST-EFFICIENT' },
  ],
  haven: [
    { name:'Mariveles Expansion Area',   lat:14.450, lng:120.478, score:89, muniId:'mariveles', note:'SBFZ RA 11453 T0→T1 fastest settlement pathway, port services, Forge heat recovery adjacency', tag:'TOP PICK' },
    { name:'Limay Residential Corridor', lat:14.555, lng:120.590, score:77, muniId:'limay',     note:'Near industrial employment base, established amenities, 40% lower cost than Mariveles', tag:'WORKFORCE HUB' },
    { name:'Hermosa BCDA Subzone',       lat:14.833, lng:120.512, score:68, muniId:'hermosa',   note:'Cheapest buildable land near NLEX, economic zone incentives, expanding residential demand', tag:'LOW COST' },
  ],
  forge: [
    { name:'SBFZ Industrial Zone',       lat:14.446, lng:120.466, score:97, muniId:'mariveles', note:'#1 globally: duty-free container import, deepwater port, 11m harbor, direct power plant grid, submarine fiber hub', tag:'OPTIMAL' },
    { name:'Limay Petrochem Zone',       lat:14.544, lng:120.594, score:83, muniId:'limay',     note:'Existing industrial grid, 62% port proximity, NPC plant nearby, petrochem zoning = no heat complaints', tag:'INDUSTRIAL' },
    { name:'Dinalupihan Technopark',     lat:14.875, lng:120.455, score:68, muniId:'dinalupihan',note:'NLEX logistics, economic zone, lower land cost — but 58km from port increases container shipping cost', tag:'MAINLAND' },
  ],
  solar: [
    { name:'Morong Open Plateau',        lat:14.695, lng:120.255, score:91, muniId:'morong',    note:'Highest solar hours in province, cheapest open land ₱200–₱1.5K/sqm, unobstructed south-facing terrain', tag:'SOLAR PRIME' },
    { name:'Bagac Agricultural Zone',    lat:14.590, lng:120.380, score:84, muniId:'bagac',     note:'Open bay-facing terrain, minimal shading, agri zoning = lowest cost, eco-compatible development', tag:'ECO FRIENDLY' },
    { name:'Hermosa Economic Zone',      lat:14.828, lng:120.500, score:72, muniId:'hermosa',   note:'BCDA grid tie-in available, Ion+ battery storage logistics via NLEX, BCDA incentives', tag:'GRID CONNECTED' },
  ],
}

export const LAND_OPPS = [
  { id:'l1',  name:'SBFZ Industrial Block A',          lat:14.446, lng:120.465, muniId:'mariveles',   class:'Industrial / Freeport',       sqmMin:1000, sqmMax:10000, priceMin:3500, priceMax:8500,  bestFor:['forge','hq'],       risk:'low',    urgency:'HIGH',   tag:'DUTY-FREE',    legal:'RA 11453 · SBMA Lease · Freeport status',                                  why:'Prime freeport land with duty-free container import rights under RA 11453 — zero import duties on all Forge hardware. Crane-offload access to 11–13m deep Mariveles harbor. Direct industrial power grid tie-in. Submarine cable hub 90km from Manila = best fiber latency in province.', infrastructure:{power:95,port:100,road:85,fiber:90} },
  { id:'l2',  name:'Mariveles CBD — TESDA Vicinity',   lat:14.445, lng:120.496, muniId:'mariveles',   class:'Commercial / Mixed Use',       sqmMin:300,  sqmMax:2000,  priceMin:4000, priceMax:12000, bestFor:['hq','haven'],       risk:'low',    urgency:'HIGH',   tag:'PRIME CBD',    legal:'Fee simple · commercial zoning · SBFZ adjacent',                           why:'Heart of Mariveles commercial district directly adjacent to TESDA vocational campus — built-in tech talent pipeline. Walking distance to Port of Mariveles. Best HQ visibility-to-cost ratio in province.', infrastructure:{power:90,port:95,road:90,fiber:85} },
  { id:'l3',  name:'Mariveles Expansion — RA 11453',   lat:14.452, lng:120.478, muniId:'mariveles',   class:'Residential / Settlement',     sqmMin:2000, sqmMax:20000, priceMin:2500, priceMax:6000,  bestFor:['haven','hq','forge'],risk:'low',    urgency:'HIGH',   tag:'RA 11453',     legal:'RA 11453 Expansion Zone · settlement-eligible · fastest T0→T1',            why:'Officially designated expansion zone under RA 11453 — fastest T0→T1 sovereign settlement pathway in Bataan. Haven Village here qualifies FIT team settlers for Firma residency track directly.', infrastructure:{power:88,port:90,road:80,fiber:78} },
  { id:'l4',  name:'Limay Industrial Corridor',        lat:14.543, lng:120.594, muniId:'limay',       class:'Industrial',                   sqmMin:1500, sqmMax:15000, priceMin:2000, priceMax:5500,  bestFor:['forge','hq','solar'],risk:'low',    urgency:'MEDIUM', tag:'INDUSTRIAL',   legal:'Industrial zone · commercial title · NPC grid access',                     why:'Existing NPC power plant nearby provides reliable heavy-load grid connection critical for Forge. 40% cheaper than SBFZ while still 62% port-proximate.', infrastructure:{power:88,port:65,road:78,fiber:72} },
  { id:'l5',  name:'Morong Open Plateau — South Face', lat:14.693, lng:120.253, muniId:'morong',      class:'Agricultural / Open Land',     sqmMin:5000, sqmMax:50000, priceMin:200,  priceMax:800,   bestFor:['solar','haven'],    risk:'medium', urgency:'MEDIUM', tag:'CHEAPEST',     legal:'Agricultural title · CARP clearance for >5ha · DAR conversion eligible',   why:'Cheapest buildable land in entire Bataan province at ₱200–₱800/sqm. South-facing unobstructed plateau gets maximum solar irradiance. Large contiguous tracts of 5–50 hectares available.', infrastructure:{power:55,port:28,road:48,fiber:35} },
  { id:'l6',  name:'Bagac Bay Agricultural Zone',      lat:14.590, lng:120.375, muniId:'bagac',       class:'Agricultural / Eco-Tourism',   sqmMin:3000, sqmMax:30000, priceMin:200,  priceMax:600,   bestFor:['solar','haven'],    risk:'medium', urgency:'LOW',    tag:'ECO-FRIENDLY', legal:'Agricultural title · eco-zone compatible · agri-tourism permit',           why:'Bay-facing open terrain with zero shading. Second cheapest land in province. Eco-tourism zoning permits Haven Village with agri-tourism overlay.', infrastructure:{power:50,port:55,road:45,fiber:30} },
  { id:'l7',  name:'Hermosa BCDA Economic Zone',       lat:14.829, lng:120.508, muniId:'hermosa',     class:'Industrial / Economic Zone',   sqmMin:1000, sqmMax:10000, priceMin:800,  priceMax:2500,  bestFor:['solar','haven','forge'],risk:'low', urgency:'MEDIUM', tag:'BCDA ZONE',    legal:'BCDA Economic Zone · income tax holiday · zero VAT on imports · NLEX',     why:'BCDA zone: income tax holiday 4–6 years, zero VAT on capital equipment imports. NLEX/SCTEX direct access. Solar grid tie-in infrastructure already present.', infrastructure:{power:70,port:22,road:78,fiber:62} },
  { id:'l8',  name:'Dinalupihan Gateway — NLEX',       lat:14.877, lng:120.458, muniId:'dinalupihan', class:'Commercial / Industrial',      sqmMin:500,  sqmMax:5000,  priceMin:1500, priceMax:4000,  bestFor:['hq','forge'],       risk:'low',    urgency:'MEDIUM', tag:'NLEX GATEWAY', legal:'Commercial title · economic zone incentives · technopark zoning',          why:'Gateway municipality at the mouth of Bataan. NLEX/SCTEX exit: containers from Manila Port to Forge in under 2 hours. HQ here maximizes Manila-Bataan corridor visibility.', infrastructure:{power:78,port:20,road:90,fiber:68} },
  { id:'l9',  name:'Orion Bay Residential Corridor',   lat:14.622, lng:120.575, muniId:'orion',       class:'Residential / Commercial',     sqmMin:800,  sqmMax:5000,  priceMin:1500, priceMax:5000,  bestFor:['haven','hq'],       risk:'low',    urgency:'LOW',    tag:'BAY FRONT',    legal:'Mixed residential-commercial title · Manila Bay shoreline access',          why:'Manila Bay waterfront commands 30–40% rental premium. Proximity to Balanga city services while 35% more affordable than Balanga CBD.', infrastructure:{power:75,port:55,road:70,fiber:65} },
  { id:'l10', name:'Balanga Capitol District',         lat:14.678, lng:120.536, muniId:'balanga',     class:'Commercial / Institutional',   sqmMin:200,  sqmMax:1500,  priceMin:8000, priceMax:20000, bestFor:['hq'],              risk:'low',    urgency:'LOW',    tag:'CAPITAL',      legal:'Commercial title · highest zonal value in province · premium location',    why:'Provincial capital = maximum LGU access, highest commercial foot traffic, strongest media visibility. Essential for RA 11453 expansion territory approval.', infrastructure:{power:95,port:38,road:95,fiber:88} },
  { id:'l11', name:'Samal Agricultural Flats',         lat:14.770, lng:120.545, muniId:'samal',       class:'Agricultural',                 sqmMin:3000, sqmMax:20000, priceMin:300,  priceMax:1200,  bestFor:['solar','haven'],    risk:'medium', urgency:'LOW',    tag:'AGRI-VALUE',   legal:'Agricultural title · DAR conversion eligible <5ha · CARP clearance larger',why:'Flat agricultural land ideal for solar panel arrays. National Highway frontage makes logistics viable.', infrastructure:{power:65,port:30,road:72,fiber:40} },
  { id:'l12', name:'Abucay Coastal Strip',             lat:14.735, lng:120.524, muniId:'abucay',      class:'Residential / Coastal',        sqmMin:500,  sqmMax:4000,  priceMin:600,  priceMax:2200,  bestFor:['haven','solar'],    risk:'medium', urgency:'LOW',    tag:'COASTAL',      legal:'Mixed title · coastal easement compliance required',                       why:'Abucay Bay coastal strip with beach access. Lower cost than Balanga coastal properties. Haven Village with coastal lifestyle premium.', infrastructure:{power:68,port:40,road:68,fiber:48} },
]

// ── SOVEREIGN ENGAGEMENT PROFILES ──────────────────────────────────────────
export const SOVEREIGN_PROFILES = {
  l1:  { lgu:{ barangay:'Bgy. Cabcaben',  municipality:'Mariveles',   province:'Bataan',  national:'SBMA / RA 11453' },
          alignment:{ barangay:'engaged', municipality:'engaged',  province:'engaged',  national:'pending'     },
          permits:{ forge:['SBMA Industrial Permit','ECC (DENR)','Grid Connection Clearance'],
                    hq:['Business Permit','SBMA Endorsement','Building Permit'],
                    haven:['HLURB Approval','SBMA Residential Clearance','Building Permit'],
                    solar:['ECC (DENR)','DOE Grid Connection','Barangay Clearance'] },
          readiness:82, nextStep:'Secure SBMA Board Resolution for Forge container installation' },
  l2:  { lgu:{ barangay:'Bgy. Maligaya',  municipality:'Mariveles',   province:'Bataan',  national:'SBFZ Freeport Auth.' },
          alignment:{ barangay:'engaged', municipality:'engaged',  province:'engaged',  national:'engaged'     },
          permits:{ hq:['Business Permit (City)','Building Permit','Fire Safety Cert.'],
                    haven:['Building Permit','Zoning Clearance','Barangay Clearance'],
                    forge:['Industrial Zoning Variance','ECC (DENR)','SBMA Endorsement'],
                    solar:['Building Permit','DOE Grid Connection','Barangay Clearance'] },
          readiness:88, nextStep:'File SBMA lot lease application and secure barangay resolution' },
  l3:  { lgu:{ barangay:'Bgy. Townsite',  municipality:'Mariveles',   province:'Bataan',  national:'SBMA / RA 11453' },
          alignment:{ barangay:'engaged', municipality:'engaged',  province:'engaged',  national:'pending'     },
          permits:{ haven:['RA 11453 Settlement Clearance','HLURB Approval','Building Permit'],
                    hq:['SBMA Endorsement','Business Permit','Building Permit'],
                    forge:['SBMA Industrial Permit','ECC (DENR)','Grid Connection'],
                    solar:['ECC (DENR)','DOE Grid Connection','Barangay Clearance'] },
          readiness:85, nextStep:'Submit Haven Village RA 11453 T0→T1 pathway application to SBMA' },
  l4:  { lgu:{ barangay:'Bgy. Alangan',   municipality:'Limay',       province:'Bataan',  national:'DENR / NPC' },
          alignment:{ barangay:'pending',  municipality:'engaged',  province:'engaged',  national:'not_started' },
          permits:{ forge:['Industrial Permit (Limay LGU)','ECC (DENR)','NPC Grid Tie-in'],
                    hq:['Business Permit','Building Permit','Zoning Clearance'],
                    solar:['ECC (DENR)','NPC Grid Connection','Barangay Clearance'],
                    haven:['Zoning Variance','Building Permit','HLURB Approval'] },
          readiness:62, nextStep:'Engage barangay captain and file zoning clearance with Limay municipal hall' },
  l5:  { lgu:{ barangay:'Bgy. Mabiga',    municipality:'Morong',      province:'Bataan',  national:'DENR / DAR' },
          alignment:{ barangay:'not_started',municipality:'pending', province:'pending',  national:'not_started' },
          permits:{ solar:['DAR Conversion (>5ha)','ECC (DENR)','DOE Grid Connection','Agri Clearance'],
                    haven:['DAR Conversion','Zoning Variance','Building Permit','ECC (DENR)'],
                    hq:['DAR Conversion','Business Permit','Building Permit'],
                    forge:['DAR Conversion','Industrial Zoning','ECC (DENR)','Grid Connection'] },
          readiness:32, nextStep:'Initiate DAR conversion clearance and barangay engagement meeting' },
  l6:  { lgu:{ barangay:'Bgy. Pag-asa',   municipality:'Bagac',       province:'Bataan',  national:'DENR / BFAR' },
          alignment:{ barangay:'not_started',municipality:'not_started',province:'not_started',national:'not_started' },
          permits:{ solar:['ECC (DENR)','DAR Conversion','Agri-Tourism Permit','DOE Grid Connection'],
                    haven:['Eco-Tourism Permit','HLURB Approval','ECC (DENR)','Building Permit'],
                    hq:['Eco-Tourism Permit','Business Permit','Building Permit'],
                    forge:['Industrial Zoning Variance','ECC (DENR)','Grid Connection'] },
          readiness:20, nextStep:'Begin municipal consultation with Bagac LGU and DENR field office' },
  l7:  { lgu:{ barangay:'Bgy. Palihan',   municipality:'Hermosa',     province:'Bataan',  national:'BCDA / BOI' },
          alignment:{ barangay:'engaged', municipality:'engaged',  province:'engaged',  national:'pending'     },
          permits:{ solar:['BCDA Zone Clearance','ECC (DENR)','Grid Tie-in','Building Permit'],
                    haven:['BCDA Residential Clearance','Building Permit','HLURB Approval'],
                    hq:['BCDA Business Clearance','Building Permit','Fire Safety'],
                    forge:['BCDA Industrial Permit','ECC (DENR)','Grid Connection','BOI Registration'] },
          readiness:72, nextStep:'Secure BOI registration for ITH (Income Tax Holiday) incentives' },
  l8:  { lgu:{ barangay:'Bgy. Pinulot',   municipality:'Dinalupihan', province:'Bataan',  national:'BCDA / BOI' },
          alignment:{ barangay:'pending',  municipality:'engaged',  province:'engaged',  national:'not_started' },
          permits:{ hq:['Technopark Clearance','Business Permit','Building Permit'],
                    forge:['Technopark Industrial Clearance','ECC (DENR)','Grid Connection'],
                    solar:['Building Permit','ECC (DENR)','DOE Grid Connection'],
                    haven:['Residential Zoning Clearance','Building Permit','HLURB Approval'] },
          readiness:58, nextStep:'Engage Dinalupihan Technopark admin for lot allocation and BOI pre-registration' },
  l9:  { lgu:{ barangay:'Bgy. Calungusan',municipality:'Orion',       province:'Bataan',  national:'DENR' },
          alignment:{ barangay:'pending',  municipality:'pending',  province:'pending',  national:'not_started' },
          permits:{ haven:['Building Permit','HLURB Approval','Zoning Clearance','Coastal Easement Compliance'],
                    hq:['Business Permit','Building Permit','Zoning Clearance'],
                    solar:['ECC (DENR)','DOE Grid Connection','Barangay Clearance'],
                    forge:['Industrial Zoning Variance','ECC (DENR)','Grid Connection'] },
          readiness:42, nextStep:'Schedule consultation with Orion mayor and submit letter of intent for HQ / Haven site' },
  l10: { lgu:{ barangay:'Bgy. Poblacion', municipality:'Balanga City', province:'Bataan', national:'DTI / LGU' },
          alignment:{ barangay:'engaged', municipality:'engaged',  province:'engaged',  national:'engaged'     },
          permits:{ hq:['Business Permit (City)','Building Permit','Occupancy Permit','Fire Safety Cert.'],
                    haven:['Building Permit','HLURB Approval','Zoning Clearance'],
                    forge:['Industrial Zoning Variance','ECC (DENR)','Grid Connection','Business Permit'],
                    solar:['Building Permit','ECC (DENR)','DOE Grid Connection'] },
          readiness:90, nextStep:'File business permit application at Balanga City Hall and coordinate with Provincial Governor' },
  l11: { lgu:{ barangay:'Bgy. San Juan',  municipality:'Samal',       province:'Bataan',  national:'DAR / DENR' },
          alignment:{ barangay:'not_started',municipality:'not_started',province:'not_started',national:'not_started' },
          permits:{ solar:['DAR Conversion','ECC (DENR)','DOE Grid Connection','Building Permit'],
                    haven:['DAR Conversion','Building Permit','HLURB Approval','ECC (DENR)'],
                    hq:['DAR Conversion','Business Permit','Building Permit'],
                    forge:['DAR Conversion','Industrial Zoning','ECC (DENR)','Grid Connection'] },
          readiness:22, nextStep:'Initiate DAR conversion clearance and barangay consultation in Samal' },
  l12: { lgu:{ barangay:'Bgy. Bangkal',   municipality:'Abucay',      province:'Bataan',  national:'DENR / BFAR' },
          alignment:{ barangay:'not_started',municipality:'not_started',province:'pending', national:'not_started' },
          permits:{ haven:['Building Permit','Coastal Easement Compliance','HLURB Approval','ECC (DENR)'],
                    solar:['ECC (DENR)','Building Permit','DOE Grid Connection'],
                    hq:['Business Permit','Building Permit','Coastal Easement Compliance'],
                    forge:['Industrial Zoning Variance','ECC (DENR)','Grid Connection'] },
          readiness:30, nextStep:'Contact Abucay municipal planning office and file coastal zone compliance assessment' },
}

// ── OMNIMESH NETWORK NODES ──────────────────────────────────────────────────
export const OMNIMESH_NODES = [
  { id:'mn1',  type:'Node',     label:'Mariveles Prime Hub',   lat:14.445, lng:120.490, status:'active',  note:'Primary OmniMesh anchor — submarine cable adjacency, SBFZ power grid tie-in' },
  { id:'ms1',  type:'Sentinel', label:'SBFZ Sentinel',         lat:14.448, lng:120.468, status:'active',  note:'Security sentinel for Forge + HQ cluster — encrypted mesh tunnel to Mariveles Prime' },
  { id:'mp1',  type:'Pulse',    label:'Limay Industrial Relay', lat:14.543, lng:120.595, status:'planned', note:'Relay node bridging Limay industrial zone to Mariveles Prime mesh ring' },
  { id:'ms2',  type:'Sentinel', label:'Balanga Citadel Node',  lat:14.676, lng:120.535, status:'planned', note:'Provincial capital sentinel — government relations + commercial district coverage' },
  { id:'mn2',  type:'Node',     label:'Dinalupihan Gateway',   lat:14.876, lng:120.462, status:'planned', note:'NLEX/SCTEX mesh gateway — connects Bataan mesh ring to Manila Metropolitan OmniNet' },
  { id:'mw1',  type:'Whisper',  label:'Morong Dark Node',      lat:14.691, lng:120.260, status:'future',  note:'Low-profile dark node for solar farm telemetry and off-grid mesh extension' },
  { id:'mw2',  type:'Whisper',  label:'Bagac Bay Node',        lat:14.590, lng:120.380, status:'future',  note:'Coastal whisper node — eco-tourism monitoring + Haven Village remote connectivity' },
]

// Bataan Province polygon — clockwise from SW cape, matched to actual PSA boundary
// West coast = South China Sea / Subic Bay side; East coast = Manila Bay side
export const BATAAN_OUTLINE = [
  // SW cape — Cape Capuluan / Mariveles headland
  [14.392,120.451],[14.404,120.444],[14.418,120.437],[14.436,120.429],
  [14.454,120.421],[14.475,120.414],[14.498,120.407],[14.521,120.401],
  [14.544,120.395],[14.565,120.388],
  // Bagac Bay indentation
  [14.582,120.376],[14.598,120.360],[14.616,120.339],[14.634,120.316],
  [14.652,120.294],[14.668,120.276],
  // BNPP / Morong — westernmost point of province
  [14.684,120.263],[14.700,120.259],[14.716,120.263],[14.733,120.274],
  [14.752,120.295],[14.773,120.326],[14.795,120.355],
  [14.817,120.383],[14.838,120.404],[14.857,120.419],
  // NW shoulder toward Subic Bay / Zambales border
  [14.873,120.432],[14.887,120.443],
  // Northern border — Zambales (west) to Pampanga (east)
  [14.898,120.454],[14.907,120.464],[14.913,120.477],
  [14.916,120.491],[14.912,120.507],[14.902,120.522],[14.885,120.537],
  // NE coast — Manila Bay heading south
  [14.865,120.548],[14.840,120.550],[14.815,120.549],
  [14.790,120.546],[14.766,120.551],[14.743,120.554],
  [14.720,120.545],[14.698,120.542],[14.678,120.539],
  // Pilar peninsula — eastward protrusion into Manila Bay
  // (Pilar municipality juts significantly east at ~14.66°N)
  [14.670,120.550],[14.664,120.575],[14.658,120.620],
  [14.651,120.672],[14.645,120.706],[14.638,120.716], // Pilar easternmost tip
  [14.630,120.710],[14.620,120.680],[14.611,120.643],
  // Orion coast — re-joins main Manila Bay shore
  [14.601,120.624],[14.587,120.628],[14.570,120.616],
  [14.553,120.600],[14.535,120.581],[14.516,120.559],
  [14.497,120.538],[14.477,120.519],[14.458,120.504],
  // SE — back to Mariveles / Manila Bay side tip
  [14.441,120.491],[14.429,120.478],[14.418,120.463],
  [14.407,120.454],[14.392,120.451],
]

// Corregidor Island center + radius — used as L.circle in MapInner (no polygon needed)
// Center: 14.3823°N, 120.5727°E  Radius: ~3200m (covers the main island mass)
export const CORREGIDOR = { lat: 14.3823, lng: 120.5727, radius: 3200 }

// ── ZONE INFO CARDS ──────────────────────────────────────────────────────────
// Used by ZonePanel — shown when user clicks AFAB or SBFZ zone on the map
export const ZONE_DATA = {
  SBFZ: {
    fullName: 'Subic Bay Freeport Zone (SBFZ)',
    authority: 'Subic Bay Metropolitan Authority (SBMA)',
    color: '#4ECDC4',
    badge: 'DUTY-FREE · SEAPORT · AIRPORT',
    center: { lat: 14.840, lng: 120.290 },
    pros: [
      { icon: '✈️', title: 'Air + Sea + Road Access',       detail: '4,100-hectare zone with Subic Bay International Airport, deep-water seaport, and SCTEX highway access.' },
      { icon: '🏢', title: 'Multinational Ecosystem',        detail: 'Home to Hanjin, FedEx, Isuzu, and 500+ registered enterprises across all industries.' },
      { icon: '💸', title: 'Tax-Free Business Environment',  detail: 'Full duty-free imports, zero local taxes for SBMA-registered companies.' },
      { icon: '🏫', title: 'World-Class Amenities',          detail: 'International schools, hospitals, malls, hotels — full live-work-play infrastructure.' },
      { icon: '🌊', title: 'Tourism + Lifestyle Magnet',     detail: 'Beaches, dive sites, casinos, theme parks driving foot traffic and workforce retention.' },
      { icon: '⚖️', title: 'Proven SEZ Track Record',        detail: 'Redeveloped from US Naval Base since 1992 — 30+ years of institutional maturity.' },
    ],
  },
  AFAB: {
    fullName: 'Freeport Area of Bataan (AFAB)',
    authority: 'Authority of the Freeport Area of Bataan',
    color: '#FFD166',
    badge: 'DUTY-FREE · FREEPORT',
    center: { lat: 14.449, lng: 120.470 },
    pros: [
      { icon: '🏠', title: 'Property Ownership Rights',   detail: 'Only freeport in the Philippines where investors can own real property outright.' },
      { icon: '⚓', title: 'Manila Bay Gateway',           detail: 'Prime transhipment position for domestic, ASEAN, and global shipping routes.' },
      { icon: '📋', title: 'Streamlined Compliance',       detail: 'AFAB authority provides one-stop-shop business registration and permits.' },
      { icon: '💰', title: 'Fiscal Incentives',            detail: 'Income tax holidays (4–6 yrs), duty-free imports, VAT zero-rating on local purchases.' },
      { icon: '🏭', title: 'Mixed-Use Zoning',             detail: 'Industrial, commercial, residential and logistics all allowed within zone boundaries.' },
      { icon: '🔌', title: 'Power Infrastructure',         detail: 'Adjacent to Bataan 2020 Power Plant — reliable industrial-grade electricity supply.' },
    ],
  },
}

// ── VERIFIED ASSET LAYERS ─────────────────────────────────────────────────────

export const SOLAR_FARMS = [
  { id:'sf1', label:'Bataan Solar Ph1+Ph3a',          lat:14.8302,lng:120.5086, mw:'34 MWac', status:'operational', developer:'Provincial Gov + GGGI',           note:'Operating since 2022; largest provincial solar project' },
  { id:'sf2', label:'Bataan Solar Ph2',               lat:14.7950,lng:120.3660, mw:'22 MWp',  status:'operational', developer:'Provincial Gov + GGGI',           note:'Operating since 2021; second phase of provincial program' },
  { id:'sf3', label:'Solana Solar Beta Project',      lat:14.8200,lng:120.4900, mw:'22.785 MWp',status:'under_development',developer:'Meralco PowerGen / MGreen', note:'32.8 GWh/yr projected output' },
  { id:'sf4', label:'Hermosa Ecozone Solar Cluster',  lat:14.8253,lng:120.4417, mw:'~80 MWp',  status:'operational', developer:'Multiple operators',             note:'Aggregate cluster; Hermosa FAB corridor with active solar permits' },
]

export const PORTS_VERIFIED = [
  { id:'p1', label:'Mariveles Port (SNPSI)',     lat:14.4333,lng:120.4833, type:'Multipurpose dry bulk',    berths:5, capacity:'₱3B development; Phase 1 = 5.9 ha', authority:'SNPSI / PMO Bataan', note:'Handles coal, clinker, steel, fertilizer' },
  { id:'p2', label:'PAFC Pier / Oilink Terminal',lat:14.5200,lng:120.5950, type:'Petroleum / LPG',          berths:2, capacity:'LPG + petroleum products',      authority:'PMO Bataan/Aurora',  note:'Lucanin, Limay' },
  { id:'p3', label:'Petron Bataan Refinery Berths',lat:14.5600,lng:120.6020,type:'Crude / petroleum SBM',   berths:3, capacity:'Crude oil + refined products',    authority:'Petron Corp',        note:'Limay FAB Extension zone' },
  { id:'p4', label:'Port of Manila (MICT)',       lat:14.5833,lng:120.9667, type:'International container', berths:12,capacity:'~4.5M TEU/yr',                    authority:'ICTSI / PPA',        note:'~55 km via Manila Bay fast ferry' },
]

export const AVIATION_SITES = [
  { id:'av1', label:'Subic Bay Intl Airport (SFS)', lat:14.7944,lng:120.2714, icao:'RPLB', type:'International',    runway:'3,381 m', distance:'~31 km from Balanga', notes:'Closest airport; FedEx cargo hub; serves SBFZ and Bataan/Zambales corridor' },
  { id:'av2', label:'NAIA — Ninoy Aquino Intl',    lat:14.5086,lng:121.0194, icao:'MNL',  type:'International',    runway:'3,737 m', distance:'~55 km from Balanga', notes:'Main international hub via Manila Bay expressway' },
  { id:'av3', label:'Clark International Airport', lat:15.1860,lng:120.5600, icao:'CRK',  type:'International',    runway:'3,200 m', distance:'~57 km from Balanga', notes:'Major international hub; Clark Freeport Zone; SCTEX-direct' },
  { id:'av4', label:'Long Beach Airstrip (Morong)', lat:14.7200,lng:120.2600, icao:'—',    type:'General aviation',  runway:'~900 m',  distance:'~10 km from SBFZ',   notes:'Small airstrip in Morong, Bataan Province' },
]

export const CONSTRUCTION_ZONES = [
  { id:'cz1', label:'BCIB Mariveles Approach Zone',   lat:14.430, lng:120.488, project:'Bataan-Cavite Interlink Bridge (BCIB)',     completion:'Dec 2029', value:'₱175B', agency:'DPWH' },
  { id:'cz2', label:'AFAB Phase 3 Expansion',         lat:14.453, lng:120.475, project:'AFAB Industrial Zone Phase 3 Build-Out',    completion:'2027',     value:'₱12B',  agency:'AFAB Authority' },
  { id:'cz3', label:'Dinalupihan Connector Road',     lat:14.876, lng:120.462, project:'NLEX/SCTEX Dinalupihan Industrial Connector', completion:'2026',   value:'₱8.5B', agency:'DPWH / NLEX Corp' },
]

export const FAB_EXTENSIONS = [
  { id:'MAR-01', name:'AFAB Main Zone',                    municipality:'Mariveles',   coords:[14.4350,120.4833], type:'Main Zone', activity:'Heavy/light industrial, port, warehousing' },
  { id:'MAR-02', name:'Mariveles FEA 2',                   municipality:'Mariveles',   coords:[14.4400,120.4900], type:'FEA',       activity:'Manufacturing, logistics' },
  { id:'MAR-03', name:'Mariveles FEA 3',                   municipality:'Mariveles',   coords:[14.4280,120.4800], type:'FEA',       activity:'Industrial' },
  { id:'MAR-04', name:'Mariveles FEA 4',                   municipality:'Mariveles',   coords:[14.4450,120.4750], type:'FEA',       activity:'Port operations' },
  { id:'MAR-05', name:'Mariveles FEA 5',                   municipality:'Mariveles',   coords:[14.4320,120.4950], type:'FEA',       activity:'Warehousing' },
  { id:'MAR-06', name:'Mariveles FEA 6',                   municipality:'Mariveles',   coords:[14.4500,120.5000], type:'FEA',       activity:'Manufacturing' },
  { id:'MAR-07', name:'Mariveles FEA 7',                   municipality:'Mariveles',   coords:[14.4200,120.4700], type:'FEA',       activity:'Light industrial' },
  { id:'DIN-01', name:'Dinalupihan Woodlands Ecozone',     municipality:'Dinalupihan', coords:[14.8780,120.4620], type:'FEA',       activity:'Light/medium industrial, agri-tech, green energy', area:'389 ha' },
  { id:'DIN-02', name:'Brgy. San Benito Industrial Zone',  municipality:'Dinalupihan', coords:[14.8650,120.4700], type:'FEA',       activity:'Warehousing, manufacturing', area:'60 ha' },
  { id:'HER-01', name:'Hermosa Ecozone Industrial Park',   municipality:'Hermosa',     coords:[14.8300,120.5086], type:'FEA',       activity:'Light industrial, logistics' },
  { id:'ORA-01', name:'Orani Manila Bay Ecozone',          municipality:'Orani',       coords:[14.8020,120.5333], type:'FEA',       activity:'Commercial, agri-industrial, aquaculture' },
  { id:'SAM-01', name:'Samal Ecozone (High Tech Global)',  municipality:'Samal',       coords:[14.7667,120.4833], type:'FEA',       activity:'Agri-industrial, light manufacturing', area:'27.53 ha' },
  { id:'ABC-01', name:'Abucay Manila Bay FEA',             municipality:'Abucay',      coords:[14.7333,120.5333], type:'FEA',       activity:'Agri-industrial' },
  { id:'BAL-01', name:'Balanga City Commercial FEA',       municipality:'Balanga',     coords:[14.6761,120.5361], type:'FEA',       activity:'Real estate, BPO, IT, leisure' },
  { id:'PIL-01', name:'Pilar Heritage & Tourism FEA',      municipality:'Pilar',       coords:[14.6614,120.5531], type:'FEA',       activity:'Tourism, heritage (Mt. Samat / Dambana ng Kagitingan)' },
  { id:'ORI-01', name:'Orion Port FEA',                    municipality:'Orion',       coords:[14.6167,120.5833], type:'FEA',       activity:'Port services, industrial' },
  { id:'LIM-01', name:'Petron Bataan Refinery Complex',    municipality:'Limay',       coords:[14.5600,120.6020], type:'FEA',       activity:'Power generation, heavy industrial, oil refinery', area:'238 ha' },
  { id:'BAG-01', name:'Bagac Heritage & Tourism FEA',      municipality:'Bagac',       coords:[14.5950,120.3950], type:'FEA',       activity:'Tourism, Las Casas Filipinas de Acuzar' },
]
