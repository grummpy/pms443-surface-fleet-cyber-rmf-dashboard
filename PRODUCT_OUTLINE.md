# PMS 443 Surface Fleet Cyber RMF Dashboard
## Product Outline — Buttons, Analytics, Data Feeds & Predictive Roadmap

**Package:** `SF-RMF-2026-Q3` · Demo / training UI (UNCLASSIFIED fake eMASS data)  
**Audience:** ISSO / ISSM / PMS 443 / NAVSEA cyber risk owners  
**Stack:** Pure HTML/CSS/JS · Chart.js · Font Awesome · Smart SVGs  

---

## 1. What is already built (publishable MVP)

| Area | Status | Notes |
|------|--------|-------|
| Classification banner | Done | UNCLASSIFIED training banner |
| Ship class + hull filters | Done | Cascading selects |
| RMF 6-step pipeline | Done | Live hull counts per step |
| KPI strip (6 tiles) | Done | Click → drill tab |
| Fleet status tracker | Done | Per-hull risk / auth / POA&M |
| Risk alerts list | Done | Critical/high/moderate deep-links |
| Portfolio + smart ship SVGs | Done | Class silhouettes + topology |
| Hull compartment map SVG | Done | Zone filter on click |
| POA&M register + NIST radar | Done | eMASS-style tables |
| Trend & Risk charts | Done | Open/closed, risk, vulns, control % |
| Asset inventory HW/SW/artifacts | Done | Sub-tabs |
| Mitigation tracker | Done | Step-level per POA&M |
| eMASS AI chat (keyword RAG) | Done | Demo corpus |
| Upload DATA / ARTIFACTS | Done | Simulated ingest |
| Standalone SVG kit | Done | Topology, hull map, radar, ship types |

---

## 2. Buttons & controls — what exists and what each does

### 2.1 Top HUD bar

| Control | ID / class | Type | Action today | Production intent |
|---------|------------|------|--------------|-------------------|
| **SHIP CLASS** select | `#shipClassFilter` | Dropdown | Filters hulls, KPIs, POA&Ms, assets, alerts, charts to class | Bind to eMASS system packages / hull inventory API |
| **HULL NUMBER** select | `#hullFilter` | Dropdown | Further scopes to one hull | Bind to single Authorization package / ATO record |
| **CLEAR ZONE** | `#btnClearZone` | Button (hidden until zone set) | Clears compartment filter from hull map | Same; clear URL/query state |
| **Clock** | `#hudClock` | Display | Zulu demo clock | Real NTP / package last-sync time |
| **User profile** | `.user-profile` | Display | Shows ISSO/ISSM Admin · PMS 443 | CAC / DoD SSO identity + role claims |
| **DATA** | `#btnUploadData` | Button | Opens file picker; simulates eMASS Excel/XML ingest; bumps POA&M % | POST multipart → eMASS import service / ETL job; validate schema |
| **ARTIFACTS** | `#btnUploadArtifact` | Button | Adds files to RAG corpus list | Object store + vector index for true RAG |
| **eMASS AI** | `#btnToggleChat` | Button | Opens AI drawer | Same; wire to LLM + retrieval |
| **LIVE** | `.status-indicator` | Badge | Visual “live” pulse | WebSocket / poll health of data feeds |

Hidden inputs:
- `#fileData` — accept `.xlsx,.xls,.csv,.json,.xml,.pdf`
- `#fileArtifact` — accept docs for RAG

### 2.2 RMF pipeline strip

| Control | Action today | Production |
|---------|--------------|------------|
| Step cards (CAT→MON) | Display counts of hulls in each RMF step | Click → filter hulls by step; link to eMASS workflow stage |
| Progress bars | % of filtered hulls in that step | SLA heat (stalled packages red) |

**Suggested new buttons on pipeline:**
| Button | Does |
|--------|------|
| **View stalled** | Hulls > N days in Assess / Authorize without transition |
| **Export RMF status** | CSV/PDF of step × hull matrix |
| **Compare baseline** | Diff vs last ATO package snapshot |

### 2.3 KPI strip (clickable cards)

| KPI key | Label | Click → | Data inputs |
|---------|-------|---------|-------------|
| `open` | Open POA&Ms | POA&M tab | `POAMS` status ≠ Closed |
| `overdue` | Overdue / Due Soon | POA&M tab | due date vs as-of date |
| `highrisk` | High+Critical | POA&M tab | risk ∈ {high,critical} |
| `control` | Control Score | POA&M tab | Approved / total CONTROLS |
| `assets` | At-Risk Assets | Assets tab | HW degraded/EOL/critical |
| `riskidx` | Fleet Risk Index | Analytics tab | Weighted avg hull risk |

**Suggested new KPI buttons:**
| Button / tile | Does | Data |
|---------------|------|------|
| **MTTR** | Mean time to remediate closed POA&Ms | close_date − open_date |
| **Patch lag** | Avg days behind IAVA | ACAS / patch management feed |
| **cATO / ATO mix** | Auth status pie | hull.authStatus |
| **Scan coverage %** | Assets scanned last 30d | RA-5 continuous monitoring |

### 2.4 Left panel

| Control | Action |
|---------|--------|
| Hull rows in **Fleet Status** | `onHullSelect` → set hull filter + Explore detail + linked POA&Ms |
| **Risk Alerts** items | Deep-link to POA&M modal/explore |
| **Drop zone** | Same as DATA upload (drag-drop) |

**Suggested new buttons:**
| Button | Does |
|--------|------|
| **Pin hull** | Keep hull in watchlist across sessions |
| **Escalate alert** | Create ticket (Jira/ServiceNow) from alert |
| **Acknowledge** | Mark alert seen (audit log) |
| **Refresh feeds** | Force pull eMASS / ACAS / HBSS |

### 2.5 Center tabs

| Tab | `data-tab` | Purpose |
|-----|------------|---------|
| Portfolio | `portfolio` | Class cards (smart ships) + topology + hull table |
| Hull Map | `hullmap` | Compartment SVG → zone filter |
| Controls & POA&M | `poam` | Register + NIST radar + control table |
| Trend & Risk | `analytics` | Charts + hotspots |
| Asset Inventory | `assets` | HW / SW / Artifacts sub-tabs |
| Mitigations | `mitigation` | Step tracker |

**Within tabs — interactive elements**

| Element | Action |
|---------|--------|
| Class / smart ship card | `filterByClass` |
| Topology node (ship SVG) | `filterByClass` |
| Hull table row | `onHullSelect` |
| Compartment rect | `onCompartmentClick` → zone banner |
| POA&M row | `onPOAMClick` → modal + mitigation steps |
| Control row | `onControlClick` |
| Asset row | `onAssetClick` |
| Mitigation step | `onMitigationClick` |
| Asset sub-tabs HW/SW/Artifacts | `setAssetSub` |

**Suggested new tab buttons:**
| Button | Tab | Does |
|--------|-----|------|
| **Export POA&M CSV** | poam | Download filtered register |
| **Export SSP summary** | poam | PDF one-pager for ATO package |
| **Bulk assign owner** | poam | Multi-select POA&Ms → owner |
| **Compare packages** | portfolio | Side-by-side two hulls |
| **Print hull map** | hullmap | Printable SVG |
| **Add mitigation step** | mitigation | CRUD (today read-only demo) |
| **Run ACAS import** | assets | Map scan results → assets/POA&Ms |
| **Forecast panel** | analytics | Dedicated predictive view (see §4) |

### 2.6 Right Explore panel

| Control | Action |
|---------|--------|
| **× close** | `#closeRight` hides panel |
| Deep-link rows | Nested clicks to POA&M / control / asset |

**Suggested:** **Open in eMASS**, **Copy link**, **Add to brief**

### 2.7 Modal

| Control | Action |
|---------|--------|
| **×** `#closeModal` | Close detail modal |
| Body links | Mitigation steps, related entities |

### 2.8 AI chat drawer

| Control | Action today |
|---------|--------------|
| `#btnToggleChat` / `#closeChat` | Open/close |
| Suggestion chips | Pre-canned queries (IA-2, critical POAMs, forecast, artifacts) |
| `#chatSend` + Enter | Keyword RAG answer |
| `#chatInput` | Free text |

**Suggested buttons:**
| Button | Does |
|--------|------|
| **Cite sources** | Show which POA&M/control/artifact IDs grounded the answer |
| **Create POA&M draft** | From chat → form prefilled |
| **Explain control** | NIST 800-53 text + inheritance status |
| **What changed since last ATO?** | Diff package snapshots |

### 2.9 Smart SVGs (interactive graphics = buttons)

| Smart SVG | Click | Hover |
|-----------|-------|-------|
| Ship class silhouette (cards) | Filter class | Glow + scale |
| Topology ship nodes | Filter class | Glow |
| Hull compartments | Zone filter | Brightness |
| NIST radar points | (suggested) filter family | — |
| KPI cards | Navigate tab | Glow |

---

## 3. Analytics to add — types, purpose, and data inputs

### 3.1 Descriptive (what happened)

| Analytic | Visualization | Data required | Source systems |
|----------|---------------|---------------|----------------|
| POA&M burndown | Cumulative open vs closed by week | poam_id, open_date, close_date, status | eMASS |
| Risk heat map by class × control family | Matrix | hull.class, control.family, residual_risk | eMASS |
| Compartment risk density | Hull map intensity | poam.compartment, asset.compartment | eMASS + CMDB |
| Auth status mix | Stacked bar ATO/cATO/Pending/None | hull.authStatus, package_id | eMASS |
| Inheritance breakdown | Donut System/Hybrid/Common | control.inheritance | eMASS |
| Owner workload | Bar by owner open POA&Ms | poam.owner | eMASS |
| Asset EOL runway | Timeline to EOS/EOL | asset.eos_date, status | CMDB / ISEA |

### 3.2 Diagnostic (why)

| Analytic | Question answered | Data required |
|----------|-------------------|---------------|
| Control failure correlation | Which families co-occur with critical POA&Ms? | control status × poam risk |
| Scan gap attribution | Unscanned OT vs IT | last_scan_at by network enclave |
| Patch lag drivers | Platforms with longest lag | CVE age, IAVA, OS version |
| Recurring findings | Same control reopened post-ATO | poam history versions |
| Zone concentration | % critical in CIC/SERVER/MACH | compartment tags |

### 3.3 Operational / real-time

| Analytic | Refresh | Data feed |
|----------|---------|-----------|
| Live alert stream | <5 min | SIEM / HBSS / eMASS notifications |
| Continuous monitoring score | Daily | CA-7 sensor heartbeats |
| Link-16 / SATCOM crypto status | Daily | COMSEC / crypto inventory |
| OT passive scan windows | Weekly | ISEA schedule + results |

### 3.4 Comparative / portfolio

| Analytic | Data |
|----------|------|
| Hull peer ranking (risk index) | All hull metrics normalized |
| Class median vs outlier | Per-class distributions |
| Homeport / theater risk | homeport × deployed flag |
| Flight / baseline version risk | Aegis BL, CANES baseline |

### 3.5 Charts already in UI (extend these)

| Chart id | Current series | Add |
|----------|----------------|-----|
| Open POA&Ms | open + closed | backlog age bands |
| Risk Index + Forecast | actual + predicted | confidence band |
| Vulnerability Count | monthly vulns | critical-only overlay |
| Control Implementation % | impl % | approved vs conditional split |

---

## 4. Predictive analytics — what you can add

### 4.1 Already demo’d
- Risk score path with **Oct–Nov forecast** (linear/heuristic demo)
- Hotspot narrative (DDG-78 OT scan, DDG-51 IA-2, LHD-1 EOL ISNS)

### 4.2 Recommended predictive models (production)

| Model | Predicts | Features (inputs) | Output for UI | Cadence |
|-------|----------|-------------------|---------------|---------|
| **A. Risk index forecast** | Fleet/hull risk 30–90 days | open critical count, patch lag, scan age, control non-compliance, days-to-due | Line + confidence interval on Analytics tab | Weekly |
| **B. POA&M slip risk** | P(miss due date) | progress %, days remaining, owner load, historical slip rate, severity | Badge on POA&M row “slip risk High” | Daily |
| **C. ATO/cATO jeopardy** | P(auth delayed) | open critical POA&Ms, assess duration, control non-compliant count | Pipeline warning on Authorize step | Weekly |
| **D. Vulnerability surge** | Expected new critical CVEs on key stacks | product versions (Aegis, CANES, RHEL, Win Server), public CVE velocity | “Watchlist” panel | Weekly |
| **E. Asset failure / EOL impact** | Risk if EOL host remains | EOS date, network exposure, data classification | Assets tab “EOL impact score” | Monthly |
| **F. Recurrence model** | P(finding returns after close) | control family, mitigation type, inheritance | Mitigation quality score | On close |
| **G. OT scan window optimizer** | Best maintenance window for passive scan | underways schedule, mission calendar, past scan success | Calendar suggestion | Mission-dependent |
| **H. Resource demand** | Analyst hours needed next quarter | open POA&M × effort coefficients | Capacity planning card | Monthly |

### 4.3 Data you must feed predictive layer

| Domain | Minimum fields | Example sources |
|--------|----------------|-----------------|
| **POA&M history** | id, hull, control, risk, status, opened, due, closed, progress, owner, mitigation_type | eMASS exports |
| **Controls** | id, family, status, inheritance, residual_risk, assessment_date | eMASS |
| **Assets** | id, type, hull, compartment, OS/version, status, last_scan, EOL/EOS | CMDB / CANES inventory / ISEA |
| **Vulns / scans** | plugin_id, CVE, severity, first_found, last_found, fixed, asset_id | ACAS / Nessus / OT tools |
| **Patch / IAVA** | bulletin_id, released, installed_on, lag_days | WSUS / IAVA trackers |
| **Auth packages** | package_id, hull, rmf_step, auth_status, ATO_date, cATO_conditions | eMASS |
| **Ops schedule** | hull, underway/inport, homeport, maintenance_avail | Navy schedules (as available) |
| **Tickets** | linked_poam, opened, resolved, queue | ServiceNow / Jira |
| **Artifacts** | name, type, package_id, uploaded_at, text extract | SSP, PPSM, architecture PDFs |

### 4.4 Predictive UI buttons to create

| Button | Location | Behavior |
|--------|----------|----------|
| **Run forecast** | Analytics | Recompute 30/60/90 day risk paths for current filter |
| **Scenario: close top 5 critical** | Analytics | What-if — re-score if selected POA&Ms closed |
| **Scenario: delay IA-2 30 days** | Analytics | Show risk delta |
| **Show slip risks only** | POA&M | Filter rows with P(slip) > threshold |
| **Export forecast brief** | Analytics | PDF for leadership (charts + top drivers) |
| **Tune model weights** | Admin (future) | Adjust feature weights (ISSM only) |
| **Compare forecast vs actual** | Analytics | Backtest last quarter accuracy |
| **Alert if forecast risk > 70** | Settings | Email/Teams subscription |

### 4.5 Simple first algorithms (no heavy ML required)

1. **Weighted risk index**  
   `0.35*critical_open + 0.2*high_open + 0.15*overdue + 0.15*(100-control_score) + 0.15*at_risk_assets` → 0–100  
2. **Slip score**  
   `if progress < expected_linear_progress(due) → flag`  
3. **Exponential smoothing** on monthly risk series for short forecast  
4. **Rule engine** for hotspots (e.g., critical + compartment ∈ {cic,server,enginerm} + due < 14d)

Upgrade path: logistic regression / gradient boosting on historical closed packages once you have 12+ months of eMASS history.

---

## 5. Buttons still to create (prioritized backlog)

### P0 — Core UX / trust
1. **Export filtered POA&M CSV**  
2. **Export KPI snapshot PDF**  
3. **Reset all filters** (class + hull + zone)  
4. **Refresh data** (re-fetch last eMASS package)  
5. **Deep link copy** (share hull + tab state)

### P1 — Workflow
6. **Create / edit mitigation step**  
7. **Mark POA&M status** (Open → Ongoing → Closed) with audit  
8. **Assign owner**  
9. **Link ticket** (ServiceNow URL)  
10. **Acknowledge alert**

### P2 — Analytics power
11. **Run forecast** + **What-if scenario**  
12. **Date range picker** for trend charts  
13. **Control family filter** on radar click  
14. **Compare two hulls**  
15. **Heat map view** (class × family)

### P3 — AI & integration
16. **True RAG chat** with citations  
17. **Generate mitigation draft** from control + asset context  
18. **Push to eMASS** (API write-back — careful)  
19. **Schedule report** (email weekly brief)  
20. **Admin: map data sources**

---

## 6. Data contracts (what goes into the system)

### 6.1 Entities (already in `data.js` as demo shapes)

```
SHIP_CLASSES { id, name, type }
HULLS { id, hull, name, classId, homeport, status, risk, rmfStep, authStatus }
COMPARTMENTS { id, name, deck, systems[], risk }
POAMS { id, title, hullId, control, status, risk, due, progress, owner, compartment, mitigation }
CONTROLS { id, family, title, status, inheritance, risk, hulls[] }
HARDWARE / SOFTWARE { id, name, type, hullId, compartment?, status, risk, os/version, vendor }
MITIGATIONS { id, poamId, step, title, status, due, owner }
ALERTS { id, title, hull, severity, time, poamId? }
TREND_DATA { labels, openPoams, closedPoams, riskScore, predictedRisk, vulnCounts, controlImpl, ... }
ARTIFACTS / packageArtifacts { name, type, uploaded, size?, forRAG? }
```

### 6.2 Ingest formats to support

| Format | Maps to |
|--------|---------|
| eMASS Excel/CSV POA&M export | POAMS |
| eMASS control implementation export | CONTROLS |
| Hardware/software inventory CSV | HARDWARE/SOFTWARE |
| ACAS .nessus / CSV | vulns → optional POA&M draft |
| SSP / architecture PDF | ARTIFACTS RAG |
| JSON package bundle | Full SF-RMF package |

### 6.3 Security / classification notes
- Banner + handling: demo is UNCLASSIFIED fake data only  
- Production: CAC auth, TLS, classification marking per package, no cross-domain without CDS  
- No write-back to eMASS without explicit AO policy

---

## 7. File map (published package)

```
cyber-rmf-dashboard/
├── index.html              # Shell / HUD
├── styles.css              # Military cyber theme + smart SVG styles
├── app.js                  # Logic, smart ships, RAG chat, charts
├── data.js                 # Fake eMASS / fleet dataset
├── README.md               # Run instructions
├── PRODUCT_OUTLINE.md      # This document
├── preview-*.png / .mp4    # UI captures & animated HUD
└── svg/
    ├── logo.svg
    ├── fleet-risk-topology.svg
    ├── hull-compartment-map.svg
    ├── nist-control-radar.svg
    └── ships/              # DDG, CG, LPD, LCS, LHD, FFG silhouettes
```

---

## 8. How to run

```bash
cd cyber-rmf-dashboard
python3 -m http.server 8080
# open http://localhost:8080
```

No build step. Chrome/Edge/Firefox.

---

## 9. Suggested 90-day roadmap

| Phase | Weeks | Deliverables |
|-------|-------|--------------|
| **Connect** | 1–3 | Real eMASS CSV ingest, auth stub, export CSV |
| **Operate** | 4–6 | POA&M status updates, mitigation CRUD, alerts ack |
| **Analyze** | 7–10 | Date-range trends, heat map, slip-risk model, what-if |
| **Predict & AI** | 11–13 | 90-day forecast, true RAG with citations, weekly brief job |

---

*Document version: 2026-09-07 · PMS 443 Surface Fleet Cyber RMF Command Dashboard · FOR TRAINING & DEMO USE ONLY*
