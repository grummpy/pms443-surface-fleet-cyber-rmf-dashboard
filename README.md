# Cyber RMF eMASS Dashboard — Surface Fleet HUD (PMS 443)

Interactive, offline frontend for a **fictional, unclassified RMF training scenario**. It is not connected to eMASS, Navy networks, mission systems, or government data sources.

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
| **Synthetic data import** | Validates one offline CSV/JSON training snapshot, then shows record counts and a deterministic diff against the current snapshot |
| **Demo replay** | Restores the built-in synthetic training snapshot explicitly; it is separate from import |
| **Artifact registry** | Records synthetic artifact metadata and SHA-256 values; uploaded files are metadata-only and never parsed or executed |
| **Training navigator** | Searches synthetic POA&Ms plus only explicitly listed synthetic passages, with source/passage IDs |
| **Reproducible snapshot** | Exports filters, scenario date, counts, source IDs, artifact hashes, data, and a snapshot SHA-256 for offline replay |

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

## Offline training controls

The dashboard is deliberately constrained to synthetic, offline training data:

- `IMPORT SYNTHETIC` accepts only `.json` or `.csv` files marked `training=true`, `classification=UNCLASSIFIED`, and a `SYN-` source ID. It also requires source version, offline/fixture locator, reviewer, as-of date, and freshness confidence.
- CSV imports require the metadata comment block and exact header documented in [`fixtures/synthetic-poams.csv`](fixtures/synthetic-poams.csv). JSON imports follow [`fixtures/synthetic-poams.json`](fixtures/synthetic-poams.json).
- Freshness confidence is shown as provenance. The dashboard’s selected-hull risk score is shown separately as **scenario posture** and must not be read as a freshness claim.
- Uploaded artifact files must use a `SYN-` or `SYN_` filename. Their bytes are hashed only; text, macros, embedded instructions, and links are never parsed, indexed, displayed, or executed. Only the built-in curated synthetic excerpt has a searchable passage.
- `SNAPSHOT` saves the complete offline scenario, filters, counts, source IDs, metadata-only/explicit-passage artifact registry, and SHA-256. Re-import checks the schema and SHA-256, restores the saved filters and registry, and refuses a snapshot whose reconstructed inventory does not reproduce the signed hash.

Run the parser regression tests with:

```bash
node --test test/offline-import.test.js
```

Do not use this project to ingest real government data, contact/scan mission systems, or represent current fleet posture.

---
Demo package id: `SYN-PMS443-TRAINING-Q3` · All data is fictional for UI prototyping. UNCLASSIFIED // SYNTHETIC TRAINING USE ONLY.

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
