# Cyber RMF eMASS Dashboard — Surface Fleet HUD (PMS 443)

Interactive frontend dashboard for **DoD RMF / eMASS** artifacts focused on **US Navy surface fleet** cyber posture under **PMS 443 Surface Ship Sustainment**.

## How to run

Open `index.html` in a modern browser (Chrome/Edge/Firefox).  
No build step — pure HTML/CSS/JS with CDN (Chart.js, Font Awesome).

```bash
# optional local server
cd cyber-rmf-dashboard
python3 -m http.server 8080
# → http://localhost:8080
```

## Features

| Area | Description |
|------|-------------|
| **HUD filters** | Ship **class** (DDG, CG, LPD, LCS, LHD, FFG) → **hull** drill-down |
| **RMF pipeline** | Categorize → Select → Implement → Assess → Authorize → Monitor |
| **Portfolio view** | Class cards + interactive fleet risk topology SVG (click nodes) |
| **KPI strip** | Open/overdue/high POA&Ms, control scores, at-risk assets, risk index |
| **Status tracker** | Live hull cards with risk, auth status, open POA&M counts |
| **Risk alerts** | Critical/High/Moderate alerts with deep links to POA&Ms |
| **POA&M & Controls** | eMASS-style register + NIST 800-53 table + control radar |
| **Mitigations** | Step-level remediation tracker linked to POA&Ms |
| **Trend analysis** | Charts: open/closed POA&Ms, vulns, control impl % |
| **Predictive analytics** | Simulated risk forecast (Oct–Nov) + hotspots |
| **Assets** | Hardware / Software / package artifacts (CIC, Aegis, VLS, SATCOM, etc.) |
| **Hull map** | Clickable SVG ship silhouette; compartments map to assets & POA&Ms |
| **Upload data** | Simulate eMASS export ingest → refreshes demo progress |
| **Upload artifacts** | Add package artifacts for **RAG / AI chat** corpus |
| **AI chatbot** | Keyword RAG over live fake data + artifacts (IA-2, critical POAMs, etc.) |

## Smart SVGs

- Fleet risk topology (class nodes)
- NIST control radar (family coverage)
- Hull top-down map (Bridge, CIC, Aegis/Fwd Equip, VLS/Mag, Propulsion, Sonar, Hangar, Server, Radio, Admin)

All use hover glow + click → filter / modal / explore panel.

## Files

| File | Role |
|------|------|
| `index.html` | Shell / HUD layout |
| `styles.css` | Military cyber HUD theme |
| `data.js` | Fake eMASS / fleet dataset |
| `app.js` | Application logic |

## Theme

Military cyber HUD: navy glassmorphism, cyan neon accents, risk color coding (red/amber/green), Orbitron + JetBrains Mono + Inter.

## Next steps (production)

- Wire real eMASS APIs / package exports
- Replace simulated chat with vector RAG over uploaded artifacts
- Auth (CAC / DoD SSO), classification banners
- Persist filters & package selection server-side

---
Demo package id: `SF-RMF-2026-Q3` · All data is fictional for UI prototyping. UNCLASSIFIED // FOR TRAINING & DEMO USE ONLY.

## Standalone SVG kit (exported)

Polished standalone SVGs (+ PNG previews) live in `svg/`:

| File | Purpose |
|------|---------|
| `logo.svg` | PMS 443 HUD mark |
| `fleet-risk-topology.svg` | Class-node risk graph (DDG/CG/LPD/LCS/LHD/FFG) |
| `hull-compartment-map.svg` | Top-down destroyer silhouette with risk zones |
| `nist-control-radar.svg` | NIST 800-53 family approval radar |

PNG companions + full UI screenshots:

- `preview-dashboard-full.png` — Portfolio tab
- `preview-hullmap.png` — Hull Map tab
- `preview-poam.png` — Controls & POA&M tab (radar live in UI)
- `svg/*.png` — raster exports of each SVG

Open `index.html` for the interactive version (hover glow + click filters).

## Smart ship silhouettes

Class-type side-profile SVGs are first-class **smart SVGs** in the live UI:

- **Portfolio cards** — each class card shows a risk-colored hull silhouette (`shipSilhouetteSVG` in `app.js`)
- **Fleet Risk Topology** — nodes are ship silhouettes inside risk rings (click → filter class)
- Hover glow + stroke intensify; risk palette matches POA&M colors
- Standalone art still in `svg/ships/*.svg` for export / design

Click any smart ship → filters hulls / POA&Ms / assets to that class.
