/* ============================================================
   PMS 443 — Surface Fleet Cyber RMF Command Dashboard
   Application Logic (eMASS / NIST RMF demo HUD)
   ============================================================ */

let state = {
  shipClass: 'all',
  hull: 'all',
  activeTab: 'portfolio',
  assetSubTab: 'hardware',
  charts: {},
  selectedCompartment: null,
};

// ---------- Helpers ----------
function toast(msg, ms = 3200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function riskColor(r) {
  const m = { critical: '#ff3b5c', high: '#ffb800', moderate: '#00e5ff', low: '#00ff9d' };
  return m[r] || '#7a8ba8';
}

function riskClass(r) {
  return r || 'moderate';
}

function hullById(id) {
  return HULLS.find((h) => h.id === id);
}

function hullByHullNum(num) {
  return HULLS.find((h) => h.hull === num);
}

function classById(id) {
  return SHIP_CLASSES.find((c) => c.id === id);
}

function filteredHulls() {
  return HULLS.filter((h) => {
    if (state.shipClass !== 'all' && h.classId !== state.shipClass) return false;
    if (state.hull !== 'all' && h.id !== state.hull) return false;
    return true;
  });
}

function filteredPoams() {
  const hullIds = new Set(filteredHulls().map((h) => h.id));
  return POAMS.filter((p) => {
    if (!hullIds.has(p.hullId)) return false;
    if (state.selectedCompartment && p.compartment !== state.selectedCompartment) return false;
    return true;
  });
}

function filteredHardware() {
  const hullIds = new Set(filteredHulls().map((h) => h.id));
  return HARDWARE.filter((a) => {
    if (a.hullId === 'all') return true;
    if (!hullIds.has(a.hullId)) return false;
    if (state.selectedCompartment && a.compartment !== state.selectedCompartment) return false;
    return true;
  });
}

function filteredSoftware() {
  const hullIds = new Set(filteredHulls().map((h) => h.id));
  return SOFTWARE.filter((a) => {
    if (a.hullId === 'all') return true;
    return hullIds.has(a.hullId);
  });
}

function filteredControls() {
  const hullIds = new Set(filteredHulls().map((h) => h.id));
  return CONTROLS.filter((c) => {
    if (c.hulls.includes('all')) return true;
    return c.hulls.some((id) => hullIds.has(id));
  });
}

function filteredAlerts() {
  const hulls = new Set(filteredHulls().map((h) => h.hull));
  return ALERTS.filter((a) => hulls.has(a.hull));
}

function destroyCharts() {
  Object.values(state.charts).forEach((c) => {
    try { c.destroy(); } catch (_) {}
  });
  state.charts = {};
}

function updateClock() {
  const el = document.getElementById('hudClock');
  if (!el) return;
  const now = new Date();
  const zulu = now.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
  el.innerHTML = zulu + '<br><span style="color:var(--text-dim);font-size:0.6rem">PMS 443 DEMO</span>';
}

// ---------- Filters UI ----------
function populateFilters() {
  const classSel = document.getElementById('shipClassFilter');
  const hullSel = document.getElementById('hullFilter');
  classSel.innerHTML = '<option value="all">ALL CLASSES</option>' +
    SHIP_CLASSES.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  classSel.value = state.shipClass;
  refreshHullFilter();
}

function refreshHullFilter() {
  const hullSel = document.getElementById('hullFilter');
  const hulls = HULLS.filter((h) => state.shipClass === 'all' || h.classId === state.shipClass);
  hullSel.innerHTML = '<option value="all">ALL HULLS</option>' +
    hulls.map((h) => `<option value="${h.id}">${h.hull} — ${escapeHtml(h.name)}</option>`).join('');
  if (!hulls.some((h) => h.id === state.hull)) state.hull = 'all';
  hullSel.value = state.hull;
}

// ---------- RMF Pipeline ----------
function renderRmfPipeline() {
  const el = document.getElementById('rmfPipeline');
  const hulls = filteredHulls();
  const total = hulls.length || 1;
  const parts = [];
  RMF_STEPS.forEach((step, i) => {
    const count = hulls.filter((h) => h.rmfStep.toLowerCase() === step.name.toLowerCase()).length;
    const pct = Math.round((count / total) * 100);
    let cls = '';
    if (count > 0) cls = 'active';
    if (step.id === 'monitor' && count > 0) cls += ' complete';
    if (step.id === 'assess' && count > 0) cls += ' warning';
    if ((step.id === 'authorize' || step.id === 'categorize') && count > 0) cls += ' danger';
    parts.push(`
      <div class="rmf-step ${cls}">
        <div class="step-name">${step.short} · ${escapeHtml(step.name)}</div>
        <div class="step-count">${count}</div>
        <div class="step-bar"><div class="step-bar-fill" style="width:${pct}%"></div></div>
      </div>`);
    if (i < RMF_STEPS.length - 1) {
      parts.push('<div class="rmf-arrow"><i class="fas fa-chevron-right"></i></div>');
    }
  });
  el.innerHTML = parts.join('');
}

// ---------- KPIs ----------
function renderKpis() {
  const poams = filteredPoams();
  const open = poams.filter((p) => p.status !== 'Closed');
  const critical = open.filter((p) => p.risk === 'critical').length;
  const high = open.filter((p) => p.risk === 'high').length;
  const overdue = open.filter((p) => new Date(p.due) < new Date('2026-09-07')).length;
  const controls = filteredControls();
  const approved = controls.filter((c) => c.status === 'Approved').length;
  const controlScore = controls.length ? Math.round((approved / controls.length) * 100) : 0;
  const assets = filteredHardware();
  const critAssets = assets.filter((a) => a.risk === 'critical' || a.status === 'EOL' || a.status === 'Degraded').length;
  const avgRisk = (() => {
    const map = { critical: 4, high: 3, moderate: 2, low: 1 };
    const hs = filteredHulls();
    if (!hs.length) return 0;
    return Math.round((hs.reduce((s, h) => s + (map[h.risk] || 2), 0) / hs.length) * 25);
  })();

  const kpis = [
    { key: 'open', label: 'Open POA&Ms', value: open.length, sub: `${critical} critical`, risk: critical ? 'critical' : high ? 'high' : 'moderate' },
    { key: 'overdue', label: 'Overdue / Due Soon', value: overdue, sub: 'before 07 SEP 26', risk: overdue ? 'high' : 'low' },
    { key: 'highrisk', label: 'High+Critical', value: critical + high, sub: 'open findings', risk: critical ? 'critical' : 'high' },
    { key: 'control', label: 'Control Score', value: controlScore + '%', sub: `${approved}/${controls.length} approved`, risk: controlScore > 70 ? 'low' : controlScore > 40 ? 'moderate' : 'high' },
    { key: 'assets', label: 'At-Risk Assets', value: critAssets, sub: 'HW degraded/EOL', risk: critAssets > 2 ? 'critical' : 'high' },
    { key: 'riskidx', label: 'Fleet Risk Index', value: avgRisk, sub: 'composite 0–100', risk: avgRisk > 70 ? 'critical' : avgRisk > 50 ? 'high' : 'moderate' },
  ];

  document.getElementById('kpiStrip').innerHTML = kpis.map((k) => `
    <div class="kpi-card risk-${k.risk}" onclick="onKPIClick('${k.key}')">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
    </div>`).join('');
}

function onKPIClick(key) {
  if (key === 'open' || key === 'overdue' || key === 'highrisk') {
    state.activeTab = 'poam';
  } else if (key === 'control') {
    state.activeTab = 'poam';
  } else if (key === 'assets') {
    state.activeTab = 'assets';
  } else {
    state.activeTab = 'analytics';
  }
  setActiveTab(state.activeTab);
  showExplore(`<div class="detail-block"><h4>KPI: ${escapeHtml(key)}</h4>
    <p style="color:var(--text-dim);font-size:0.75rem">Filtered to current class/hull/zone. Click rows in the main panel for drill-down.</p></div>`);
}

// ---------- Left panel ----------
function renderStatusTracker() {
  const el = document.getElementById('statusTracker');
  const hulls = filteredHulls();
  el.innerHTML = hulls.map((h) => {
    const open = POAMS.filter((p) => p.hullId === h.id && p.status !== 'Closed').length;
    return `<div class="tracker-item" onclick="onHullSelect('${h.id}')">
      <div class="hull-name">${h.hull} <span class="risk-badge ${h.risk}">${h.risk}</span></div>
      <div class="meta"><span>${escapeHtml(h.status)} · ${h.authStatus}</span><span>${open} POA&M</span></div>
      <div class="meta"><span>${escapeHtml(h.rmfStep)}</span><span>${escapeHtml(h.homeport)}</span></div>
    </div>`;
  }).join('') || '<div class="empty-state"><p>No hulls in filter</p></div>';
}

function renderAlerts() {
  const el = document.getElementById('alertsList');
  const alerts = filteredAlerts();
  el.innerHTML = alerts.map((a) => `
    <div class="alert-item ${a.severity}" onclick="onAlertClick('${a.id}')">
      <div class="alert-title">${escapeHtml(a.title)}</div>
      <div class="alert-meta">${a.hull} · ${a.time} · ${a.poamId || ''}</div>
    </div>`).join('') || '<div class="empty-state"><p>No alerts</p></div>';
}

// ---------- Explore / Modal ----------
function showExplore(html) {
  document.getElementById('exploreContent').innerHTML = html;
  document.getElementById('rightPanel').classList.add('open');
}

function showModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').classList.add('show');
}

function onHullSelect(id) {
  state.hull = id;
  document.getElementById('hullFilter').value = id;
  const h = hullById(id);
  if (!h) return;
  const poams = POAMS.filter((p) => p.hullId === id);
  const cls = classById(h.classId);
  showExplore(`
    <div class="detail-block">
      <h4>${h.hull} — ${escapeHtml(h.name)}</h4>
      <div class="detail-row"><span class="k">Class</span><span class="v">${escapeHtml(cls ? cls.name : h.classId)}</span></div>
      <div class="detail-row"><span class="k">Homeport</span><span class="v">${escapeHtml(h.homeport)}</span></div>
      <div class="detail-row"><span class="k">Status</span><span class="v">${escapeHtml(h.status)}</span></div>
      <div class="detail-row"><span class="k">Risk</span><span class="v"><span class="risk-badge ${h.risk}">${h.risk}</span></span></div>
      <div class="detail-row"><span class="k">RMF Step</span><span class="v">${escapeHtml(h.rmfStep)}</span></div>
      <div class="detail-row"><span class="k">Auth</span><span class="v">${escapeHtml(h.authStatus)}</span></div>
      <div class="detail-row"><span class="k">Open POA&Ms</span><span class="v">${poams.filter((p) => p.status !== 'Closed').length}</span></div>
    </div>
    <div class="detail-block"><h4>Linked POA&Ms</h4>
      ${poams.map((p) => `<div class="detail-row" style="cursor:pointer" onclick="onPOAMClick('${p.id}')">
        <span class="k">${p.id}</span><span class="v risk-badge ${p.risk}">${p.risk}</span></div>`).join('') || '<p style="color:var(--text-dim)">None</p>'}
    </div>`);
  refreshAll();
}

function onAlertClick(id) {
  const a = ALERTS.find((x) => x.id === id);
  if (!a) return;
  if (a.poamId) onPOAMClick(a.poamId);
  else showExplore(`<div class="detail-block"><h4>${escapeHtml(a.title)}</h4>
    <div class="detail-row"><span class="k">Hull</span><span class="v">${a.hull}</span></div>
    <div class="detail-row"><span class="k">Severity</span><span class="v">${a.severity}</span></div>
    <div class="detail-row"><span class="k">Time</span><span class="v">${a.time}</span></div></div>`);
}

function onPOAMClick(id) {
  const p = POAMS.find((x) => x.id === id);
  if (!p) return;
  const h = hullById(p.hullId);
  const mits = MITIGATIONS.filter((m) => m.poamId === id).sort((a, b) => a.step - b.step);
  const body = `
    <div class="detail-block">
      <h4>${escapeHtml(p.title)}</h4>
      <div class="detail-row"><span class="k">ID</span><span class="v">${p.id}</span></div>
      <div class="detail-row"><span class="k">Hull</span><span class="v">${h ? h.hull : p.hullId}</span></div>
      <div class="detail-row"><span class="k">Control</span><span class="v">${p.control}</span></div>
      <div class="detail-row"><span class="k">Status</span><span class="v">${p.status}</span></div>
      <div class="detail-row"><span class="k">Risk</span><span class="v"><span class="risk-badge ${p.risk}">${p.risk}</span></span></div>
      <div class="detail-row"><span class="k">Due</span><span class="v">${p.due}</span></div>
      <div class="detail-row"><span class="k">Owner</span><span class="v">${escapeHtml(p.owner)}</span></div>
      <div class="detail-row"><span class="k">Compartment</span><span class="v">${p.compartment}</span></div>
      <div class="detail-row"><span class="k">Progress</span><span class="v">${p.progress}%</span></div>
      <div style="margin-top:0.5rem"><div class="progress-bar"><div class="fill ${p.progress >= 100 ? 'done' : p.risk}" style="width:${p.progress}%"></div></div></div>
      <p style="margin-top:0.75rem;color:var(--text-dim)"><strong style="color:var(--cyan)">Mitigation strategy:</strong> ${escapeHtml(p.mitigation)}</p>
    </div>
    <div class="detail-block"><h4>Mitigation Steps</h4>
      ${mits.map((m) => {
        const st = m.status === 'Done' ? 'done' : m.status === 'In Progress' ? 'in-progress' : 'planned';
        return `<div class="mitigation-step ${st}" onclick="onMitigationClick('${m.id}')">
          <span style="font-family:var(--mono);color:var(--cyan)">#${m.step}</span>
          <div><strong>${escapeHtml(m.title)}</strong><br>
          <span style="font-size:0.65rem;color:var(--text-dim)">${m.status} · due ${m.due} · ${escapeHtml(m.owner)}</span></div>
        </div>`;
      }).join('') || '<p style="color:var(--text-dim)">No step tracker yet</p>'}
    </div>`;
  showModal(p.id, body);
  showExplore(body);
}

function onControlClick(id) {
  const c = CONTROLS.find((x) => x.id === id);
  if (!c) return;
  const related = POAMS.filter((p) => p.control === id);
  const stClass = c.status === 'Approved' ? 'control-status-approved'
    : c.status === 'Non-Compliant' ? 'control-status-non' : 'control-status-conditional';
  showExplore(`
    <div class="detail-block">
      <h4>${c.id} — ${escapeHtml(c.title)}</h4>
      <div class="detail-row"><span class="k">Family</span><span class="v">${escapeHtml(c.family)}</span></div>
      <div class="detail-row"><span class="k">Status</span><span class="v ${stClass}">${escapeHtml(c.status)}</span></div>
      <div class="detail-row"><span class="k">Inheritance</span><span class="v">${escapeHtml(c.inheritance)}</span></div>
      <div class="detail-row"><span class="k">Risk</span><span class="v"><span class="risk-badge ${c.risk}">${c.risk}</span></span></div>
      <div class="detail-row"><span class="k">Hulls</span><span class="v">${c.hulls.join(', ')}</span></div>
    </div>
    <div class="detail-block"><h4>Related POA&Ms</h4>
      ${related.map((p) => `<div class="detail-row" style="cursor:pointer" onclick="onPOAMClick('${p.id}')">
        <span class="k">${p.id}</span><span class="v">${p.status}</span></div>`).join('') || '<p style="color:var(--text-dim)">None</p>'}
    </div>`);
}

function onAssetClick(id) {
  const hw = HARDWARE.find((x) => x.id === id);
  const sw = SOFTWARE.find((x) => x.id === id);
  const a = hw || sw;
  if (!a) return;
  const h = a.hullId === 'all' ? null : hullById(a.hullId);
  showExplore(`
    <div class="detail-block">
      <h4>${a.id} — ${escapeHtml(a.name)}</h4>
      <div class="detail-row"><span class="k">Type</span><span class="v">${escapeHtml(a.type)}</span></div>
      <div class="detail-row"><span class="k">Hull</span><span class="v">${h ? h.hull : a.hullId}</span></div>
      ${a.compartment ? `<div class="detail-row"><span class="k">Compartment</span><span class="v">${a.compartment}</span></div>` : ''}
      <div class="detail-row"><span class="k">Status</span><span class="v">${escapeHtml(a.status)}</span></div>
      <div class="detail-row"><span class="k">Risk</span><span class="v"><span class="risk-badge ${a.risk}">${a.risk}</span></span></div>
      ${a.ip ? `<div class="detail-row"><span class="k">IP / Net</span><span class="v">${escapeHtml(a.ip)}</span></div>` : ''}
      ${a.os ? `<div class="detail-row"><span class="k">OS</span><span class="v">${escapeHtml(a.os)}</span></div>` : ''}
      ${a.version ? `<div class="detail-row"><span class="k">Version</span><span class="v">${escapeHtml(a.version)}</span></div>` : ''}
      ${a.vendor ? `<div class="detail-row"><span class="k">Vendor</span><span class="v">${escapeHtml(a.vendor)}</span></div>` : ''}
    </div>`);
}

function onMitigationClick(id) {
  const m = MITIGATIONS.find((x) => x.id === id);
  if (!m) return;
  showExplore(`
    <div class="detail-block">
      <h4>Step ${m.step}: ${escapeHtml(m.title)}</h4>
      <div class="detail-row"><span class="k">ID</span><span class="v">${m.id}</span></div>
      <div class="detail-row"><span class="k">POA&M</span><span class="v" style="cursor:pointer;color:var(--cyan)" onclick="onPOAMClick('${m.poamId}')">${m.poamId}</span></div>
      <div class="detail-row"><span class="k">Status</span><span class="v">${m.status}</span></div>
      <div class="detail-row"><span class="k">Due</span><span class="v">${m.due}</span></div>
      <div class="detail-row"><span class="k">Owner</span><span class="v">${escapeHtml(m.owner)}</span></div>
    </div>`);
}

function onCompartmentClick(compId) {
  state.selectedCompartment = compId;
  const c = COMPARTMENTS.find((x) => x.id === compId);
  const banner = document.getElementById('zoneFilterBanner');
  const btnClear = document.getElementById('btnClearZone');
  if (c) {
    banner.style.display = 'flex';
    banner.innerHTML = `<i class="fas fa-map-marker-alt"></i> Zone filter: <strong>${escapeHtml(c.name)}</strong>
      <button type="button" onclick="clearZoneFilter()">CLEAR</button>`;
    btnClear.style.display = 'inline-flex';
  }
  const poams = filteredPoams();
  const assets = filteredHardware();
  showExplore(`
    <div class="detail-block">
      <h4>Compartment: ${escapeHtml(c ? c.name : compId)}</h4>
      <div class="detail-row"><span class="k">Deck</span><span class="v">${c ? c.deck : '—'}</span></div>
      <div class="detail-row"><span class="k">Risk</span><span class="v"><span class="risk-badge ${c ? c.risk : 'moderate'}">${c ? c.risk : ''}</span></span></div>
      <div class="detail-row"><span class="k">Systems</span><span class="v">${c ? c.systems.join(', ') : ''}</span></div>
    </div>
    <div class="detail-block"><h4>POA&Ms in zone (${poams.length})</h4>
      ${poams.map((p) => `<div class="detail-row" style="cursor:pointer" onclick="onPOAMClick('${p.id}')">
        <span class="k">${p.id}</span><span class="v risk-badge ${p.risk}">${p.risk}</span></div>`).join('') || '<p style="color:var(--text-dim)">None</p>'}
    </div>
    <div class="detail-block"><h4>Assets (${assets.length})</h4>
      ${assets.map((a) => `<div class="detail-row" style="cursor:pointer" onclick="onAssetClick('${a.id}')">
        <span class="k">${escapeHtml(a.name)}</span><span class="v">${a.risk}</span></div>`).join('') || '<p style="color:var(--text-dim)">None</p>'}
    </div>`);
  refreshAll();
  toast(`Zone filter: ${c ? c.name : compId}`);
}

function clearZoneFilter() {
  state.selectedCompartment = null;
  document.getElementById('zoneFilterBanner').style.display = 'none';
  document.getElementById('btnClearZone').style.display = 'none';
  refreshAll();
  toast('Zone filter cleared');
}

function filterByClass(classId) {
  state.shipClass = classId;
  state.hull = 'all';
  document.getElementById('shipClassFilter').value = classId;
  refreshHullFilter();
  refreshAll();
}

// ---------- Tabs ----------
function setActiveTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderTab();
}

function renderTab() {
  destroyCharts();
  const el = document.getElementById('tabContent');
  switch (state.activeTab) {
    case 'portfolio': el.innerHTML = renderPortfolio(); break;
    case 'hullmap': el.innerHTML = renderHullMap(); break;
    case 'poam': el.innerHTML = renderPoamControls(); break;
    case 'analytics': el.innerHTML = renderAnalytics(); setTimeout(buildAnalyticsCharts, 30); break;
    case 'assets': el.innerHTML = renderAssets(); break;
    case 'mitigation': el.innerHTML = renderMitigations(); break;
    default: el.innerHTML = renderPortfolio();
  }
}

// ---------- Smart ship silhouettes (class-type SVGs) ----------
// Compact side-profile hulls for cards / topology. Risk stroke drives glow.
function shipStroke(risk) {
  return riskColor(risk || 'moderate');
}

/** Inline smart SVG for a ship class — hover/click via parent .smart-ship */
function shipSilhouetteSVG(classId, risk, opts = {}) {
  const stroke = shipStroke(risk);
  const w = opts.w || 200;
  const h = opts.h || 70;
  const label = opts.label !== false;
  const title = (classById(classId)?.type || classId).toUpperCase();
  // viewBox hull geometry keyed by class (bow left, stern right)
  const hulls = {
    ddg: {
      // destroyer long sleek
      body: 'M8 48 L22 32 L40 28 L155 28 L185 36 L195 48 L180 54 L20 54 Z',
      super: 'M70 28 L75 12 L95 6 L125 6 L140 16 L145 28 Z',
      extras: `
        <rect x="48" y="22" width="18" height="6" fill="#111b2a" stroke="${stroke}" stroke-width="0.8"/>
        <rect x="78" y="14" width="8" height="8" fill="none" stroke="#00ff9d" stroke-width="0.9"/>
        <rect x="108" y="14" width="8" height="8" fill="none" stroke="#00ff9d" stroke-width="0.9"/>
        <line x1="100" y1="6" x2="100" y2="-4" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="100" cy="-4" r="2.2" fill="none" stroke="${stroke}" stroke-width="1"/>
        <rect x="150" y="22" width="14" height="6" fill="#111b2a" stroke="${stroke}" stroke-width="0.8"/>
        <line x1="30" y1="34" x2="18" y2="32" stroke="#7a8ba8" stroke-width="1.5"/>`,
    },
    cg: {
      body: 'M6 48 L20 30 L38 26 L160 26 L188 38 L198 48 L180 55 L18 55 Z',
      super: 'M68 26 L72 8 L90 2 L140 2 L155 14 L160 26 Z',
      extras: `
        <rect x="45" y="20" width="20" height="6" fill="#111b2a" stroke="${stroke}" stroke-width="0.8"/>
        <rect x="85" y="10" width="10" height="10" fill="none" stroke="#00ff9d" stroke-width="1"/>
        <rect x="120" y="10" width="10" height="10" fill="none" stroke="#00ff9d" stroke-width="1"/>
        <rect x="100" y="8" width="6" height="18" fill="#152233" stroke="#7a8ba8" stroke-width="0.7"/>
        <rect x="110" y="8" width="6" height="18" fill="#152233" stroke="#7a8ba8" stroke-width="0.7"/>
        <line x1="100" y1="2" x2="100" y2="-8" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="100" cy="-8" r="2.2" fill="none" stroke="${stroke}" stroke-width="1"/>
        <rect x="162" y="20" width="16" height="6" fill="#111b2a" stroke="${stroke}" stroke-width="0.8"/>
        <line x1="28" y1="32" x2="14" y2="30" stroke="#7a8ba8" stroke-width="1.5"/>
        <line x1="180" y1="32" x2="192" y2="30" stroke="#7a8ba8" stroke-width="1.5"/>`,
    },
    lpd: {
      body: 'M10 50 L28 22 L50 18 L155 18 L180 28 L192 50 L175 56 L22 56 Z',
      super: 'M55 18 L58 0 L75 -6 L110 -6 L125 6 L128 18 Z',
      extras: `
        <rect x="130" y="12" width="40" height="6" fill="#111b2a" stroke="${stroke}" stroke-width="0.8"/>
        <rect x="140" y="40" width="35" height="10" fill="none" stroke="#00a8b8" stroke-width="0.8" stroke-dasharray="2 1.5"/>
        <line x1="90" y1="-6" x2="90" y2="-16" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="90" cy="-16" r="2" fill="none" stroke="${stroke}" stroke-width="1"/>
        <circle cx="48" cy="12" r="3" fill="none" stroke="#00ff9d" stroke-width="1"/>`,
    },
    lcs: {
      body: 'M30 48 L50 30 L70 26 L150 26 L175 36 L185 48 L170 52 L40 52 Z',
      super: 'M85 26 L90 8 L105 2 L130 2 L145 12 L150 26 Z',
      extras: `
        <line x1="118" y1="2" x2="118" y2="-10" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="118" cy="-10" r="2" fill="none" stroke="${stroke}" stroke-width="1"/>
        <line x1="55" y1="32" x2="42" y2="30" stroke="#7a8ba8" stroke-width="1.4"/>
        <rect x="155" y="20" width="18" height="6" fill="#111b2a" stroke="${stroke}" stroke-width="0.8"/>`,
    },
    lhd: {
      body: 'M8 52 L22 22 L45 16 L185 16 L198 36 L200 52 L185 58 L18 58 Z',
      super: 'M130 16 L132 -2 L150 -8 L175 -2 L180 16 Z',
      extras: `
        <rect x="30" y="12" width="150" height="5" fill="#111b2a" stroke="${stroke}" stroke-width="1"/>
        <line x1="155" y1="-8" x2="155" y2="-18" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="155" cy="-18" r="2" fill="none" stroke="${stroke}" stroke-width="1"/>
        <rect x="60" y="12" width="10" height="5" fill="none" stroke="#00ff9d" stroke-width="0.8"/>
        <rect x="170" y="12" width="10" height="5" fill="none" stroke="#00ff9d" stroke-width="0.8"/>`,
    },
    ffg: {
      body: 'M12 48 L28 32 L48 28 L155 28 L180 38 L190 48 L172 54 L24 54 Z',
      super: 'M75 28 L80 10 L95 4 L125 4 L140 14 L145 28 Z',
      extras: `
        <rect x="52" y="22" width="16" height="6" fill="#111b2a" stroke="${stroke}" stroke-width="0.8"/>
        <line x1="110" y1="4" x2="110" y2="-8" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="110" cy="-8" r="2.2" fill="none" stroke="${stroke}" stroke-width="1"/>
        <rect x="135" y="16" width="8" height="12" fill="#152233" stroke="#7a8ba8" stroke-width="0.7"/>
        <rect x="155" y="22" width="16" height="6" fill="#111b2a" stroke="${stroke}" stroke-width="0.8"/>
        <line x1="34" y1="34" x2="20" y2="32" stroke="#7a8ba8" stroke-width="1.4"/>`,
    },
  };
  const geo = hulls[classId] || hulls.ddg;
  const lbl = label
    ? `<text x="100" y="68" text-anchor="middle" fill="#7a8ba8" font-size="9" font-family="JetBrains Mono,monospace">${title}</text>`
    : '';
  return `<svg class="ship-smart-svg" viewBox="0 -22 200 92" width="${w}" height="${h}"
      role="img" aria-label="${title} silhouette" data-class="${classId}">
    <title>${title}</title>
    <line x1="0" y1="50" x2="200" y2="50" stroke="#1a3a50" stroke-width="0.6" stroke-dasharray="3 3"/>
    <path d="${geo.body}" fill="#111b2a" stroke="${stroke}" stroke-width="1.8" class="ship-hull"/>
    <path d="${geo.super}" fill="#152233" stroke="${stroke}" stroke-width="1.3" class="ship-super"/>
    ${geo.extras}
    ${lbl}
  </svg>`;
}

function shipIconMini(classId, risk) {
  // tiny for topology nodes
  return shipSilhouetteSVG(classId, risk, { w: 72, h: 28, label: false });
}


function renderPortfolio() {
  const hulls = filteredHulls();
  const byClass = {};
  SHIP_CLASSES.forEach((c) => { byClass[c.id] = hulls.filter((h) => h.classId === c.id); });

  const cards = SHIP_CLASSES.map((c) => {
    const list = byClass[c.id] || [];
    if (state.shipClass !== 'all' && state.shipClass !== c.id) return '';
    const risks = list.map((h) => h.risk);
    const worst = risks.includes('critical') ? 'critical' : risks.includes('high') ? 'high' : risks.includes('moderate') ? 'moderate' : list.length ? 'low' : 'moderate';
    const open = POAMS.filter((p) => list.some((h) => h.id === p.hullId) && p.status !== 'Closed').length;
    const active = state.shipClass === c.id ? ' active' : '';
    return `<div class="card portfolio-ship smart-ship risk-${worst}${active}" onclick="filterByClass('${c.id}')" title="Filter fleet to ${escapeHtml(c.name)}">
      <div class="ship-svg-container">${shipSilhouetteSVG(c.id, worst, { w: 220, h: 78 })}</div>
      <h3>${escapeHtml(c.name)}</h3>
      <div class="class-name">${escapeHtml(c.type)} · ${list.length} hull(s)</div>
      <div class="ship-stats">
        <span class="risk-badge ${worst}">${worst}</span>
        <span>${open} open POA&M</span>
        <span>${c.id.toUpperCase()}</span>
      </div>
    </div>`;
  }).join('');

  // Topology
  const nodes = SHIP_CLASSES.map((c, i) => {
    const list = byClass[c.id] || [];
    const n = list.length;
    const risks = list.map((h) => h.risk);
    const worst = risks.includes('critical') ? 'critical' : risks.includes('high') ? 'high' : risks.includes('moderate') ? 'moderate' : n ? 'low' : 'moderate';
    const angle = (i / SHIP_CLASSES.length) * Math.PI * 2 - Math.PI / 2;
    const cx = 280 + Math.cos(angle) * 160;
    const cy = 200 + Math.sin(angle) * 130;
    return { c, cx, cy, n, worst };
  });

  // topology uses foreignObject ship silhouettes as smart SVGs
  const topo = `
    <div class="topology-wrap" style="margin-top:1rem">
      <h3 class="section-title">Fleet Risk Topology <span class="section-hint">smart ship SVGs · click to filter</span></h3>
      <div class="topology-smart">
        <svg viewBox="0 0 640 420" width="100%" role="img" aria-label="Fleet risk topology with ship silhouettes" class="topo-svg">
          <defs>
            <filter id="topoGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <circle cx="320" cy="210" r="42" fill="#111b2a" stroke="#00e5ff" stroke-width="2.5" filter="url(#topoGlow)"/>
          <text x="320" y="204" text-anchor="middle" fill="#00e5ff" font-size="12" font-family="Orbitron,sans-serif" font-weight="700">PMS 443</text>
          <text x="320" y="222" text-anchor="middle" fill="#7a8ba8" font-size="9">SURFACE</text>
          ${nodes.map((n) => {
            const col = riskColor(n.worst);
            // remap coords from 560x400 center 280,200 → 640x420 center 320,210
            const cx = 320 + (n.cx - 280) * 1.05;
            const cy = 210 + (n.cy - 200) * 1.05;
            return `
            <line x1="320" y1="210" x2="${cx}" y2="${cy}" stroke="#1a2d45" stroke-width="1.5" class="topo-spoke"/>
            <g class="topo-node smart-ship" onclick="filterByClass('${n.c.id}')" style="cursor:pointer">
              <circle cx="${cx}" cy="${cy}" r="52" fill="#0a1220" stroke="${col}" stroke-width="1.5" opacity="0.9"/>
              <foreignObject x="${cx - 48}" y="${cy - 28}" width="96" height="40">
                <div xmlns="http://www.w3.org/1999/xhtml" class="topo-ship-wrap" style="width:96px;height:40px;pointer-events:none">
                  ${shipSilhouetteSVG(n.c.id, n.worst, { w: 96, h: 36, label: false })}
                </div>
              </foreignObject>
              <text x="${cx}" y="${cy + 38}" text-anchor="middle" fill="#e8f0ff" font-size="11" font-weight="700">${n.c.id.toUpperCase()}</text>
              <text x="${cx}" y="${cy + 50}" text-anchor="middle" fill="#7a8ba8" font-size="9">${n.n} hull · ${n.worst}</text>
            </g>`;
          }).join('')}
        </svg>
      </div>
    </div>`;

  const hullTable = `
    <h3 class="section-title" style="margin-top:1.25rem">Hull Portfolio</h3>
    <div style="overflow:auto">
      <table class="data-table">
        <thead><tr>
          <th>Hull</th><th>Name</th><th>Class</th><th>Status</th><th>Risk</th><th>RMF</th><th>Auth</th><th>Homeport</th>
        </tr></thead>
        <tbody>
          ${hulls.map((h) => {
            const cls = classById(h.classId);
            return `<tr onclick="onHullSelect('${h.id}')">
              <td style="font-family:var(--mono)">${h.hull}</td>
              <td>${escapeHtml(h.name)}</td>
              <td>${cls ? escapeHtml(cls.type) : h.classId}</td>
              <td>${escapeHtml(h.status)}</td>
              <td><span class="risk-badge ${h.risk}">${h.risk}</span></td>
              <td>${escapeHtml(h.rmfStep)}</td>
              <td>${escapeHtml(h.authStatus)}</td>
              <td>${escapeHtml(h.homeport)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  return `<h3 class="section-title">Ship Classes</h3><div class="card-grid">${cards}</div>${topo}${hullTable}`;
}

function renderHullMap() {
  const comps = COMPARTMENTS;
  // Top-down destroyer-like silhouette with clickable compartments
  const layout = [
    { id: 'bridge', x: 220, y: 30, w: 80, h: 36, label: 'BRIDGE' },
    { id: 'cic', x: 200, y: 80, w: 120, h: 50, label: 'CIC' },
    { id: 'radio', x: 330, y: 80, w: 70, h: 40, label: 'RADIO' },
    { id: 'fwd_equip', x: 100, y: 90, w: 90, h: 45, label: 'FWD EQ' },
    { id: 'sonar', x: 50, y: 150, w: 70, h: 40, label: 'SONAR' },
    { id: 'server', x: 200, y: 145, w: 100, h: 45, label: 'SERVER' },
    { id: 'admin', x: 310, y: 145, w: 80, h: 40, label: 'ADMIN' },
    { id: 'magazine', x: 160, y: 210, w: 90, h: 40, label: 'MAG' },
    { id: 'enginerm', x: 260, y: 210, w: 110, h: 45, label: 'MACH' },
    { id: 'helo', x: 390, y: 190, w: 90, h: 55, label: 'HANGAR' },
  ];

  const hullLabel = state.hull === 'all'
    ? (state.shipClass === 'all' ? 'FLEET COMPOSITE' : (classById(state.shipClass)?.name || state.shipClass))
    : (hullById(state.hull)?.hull || state.hull);

  const rects = layout.map((r) => {
    const c = comps.find((x) => x.id === r.id);
    const risk = c ? c.risk : 'moderate';
    const fill = risk === 'critical' ? 'rgba(255,59,92,0.35)'
      : risk === 'high' ? 'rgba(255,184,0,0.28)'
      : risk === 'low' ? 'rgba(0,255,157,0.2)'
      : 'rgba(0,229,255,0.2)';
    const stroke = riskColor(risk);
    const sel = state.selectedCompartment === r.id ? 'stroke-width="3"' : 'stroke-width="1.5"';
    return `<g class="compartment-hot" onclick="onCompartmentClick('${r.id}')">
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="4"
        fill="${fill}" stroke="${stroke}" ${sel}/>
      <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 4}" text-anchor="middle"
        fill="#e8f0ff" font-size="10" font-family="JetBrains Mono,monospace" pointer-events="none">${r.label}</text>
    </g>`;
  }).join('');

  return `
    <h3 class="section-title">Hull Compartment Map — ${escapeHtml(hullLabel)}</h3>
    <p style="color:var(--text-dim);font-size:0.75rem;margin-bottom:0.75rem">
      Click a compartment to filter POA&Ms and assets for that zone.
    </p>
    <div class="hull-map-wrap">
      <svg viewBox="0 0 520 280" width="100%" role="img" aria-label="Hull map">
        <!-- Hull outline -->
        <path d="M40,160 L90,60 L200,40 L340,40 L430,70 L500,150 L480,230 L300,250 L120,250 L40,200 Z"
          fill="rgba(17,27,42,0.9)" stroke="#00a8b8" stroke-width="2"/>
        ${rects}
      </svg>
    </div>
    <div class="card-grid" style="margin-top:1rem">
      ${comps.map((c) => `
        <div class="panel-card" onclick="onCompartmentClick('${c.id}')">
          <h3 style="font-size:0.8rem;font-family:var(--mono)">${escapeHtml(c.name)}</h3>
          <div class="class-name">Deck ${c.deck}</div>
          <div class="stats">
            <span class="risk-badge ${c.risk}">${c.risk}</span>
            <span class="stat-chip">${c.systems.length} systems</span>
          </div>
        </div>`).join('')}
    </div>`;
}

function renderPoamControls() {
  const poams = filteredPoams();
  const controls = filteredControls();

  const poamRows = poams.map((p) => {
    const h = hullById(p.hullId);
    return `<tr onclick="onPOAMClick('${p.id}')">
      <td style="font-family:var(--mono);font-size:0.68rem">${p.id}</td>
      <td>${escapeHtml(p.title)}</td>
      <td>${h ? h.hull : p.hullId}</td>
      <td>${p.control}</td>
      <td>${p.status}</td>
      <td><span class="risk-badge ${p.risk}">${p.risk}</span></td>
      <td>${p.due}</td>
      <td><div class="progress-bar"><div class="fill ${p.progress >= 100 ? 'done' : p.risk}" style="width:${p.progress}%"></div></div></td>
      <td class="poam-mitigation-cell" title="${escapeHtml(p.mitigation)}">${escapeHtml(p.mitigation)}</td>
    </tr>`;
  }).join('');

  const controlRows = controls.map((c) => {
    const stClass = c.status === 'Approved' ? 'control-status-approved'
      : c.status === 'Non-Compliant' ? 'control-status-non' : 'control-status-conditional';
    return `<tr onclick="onControlClick('${c.id}')">
      <td style="font-family:var(--mono)">${c.id}</td>
      <td>${escapeHtml(c.family)}</td>
      <td>${escapeHtml(c.title)}</td>
      <td class="${stClass}">${escapeHtml(c.status)}</td>
      <td>${escapeHtml(c.inheritance)}</td>
      <td><span class="risk-badge ${c.risk}">${c.risk}</span></td>
    </tr>`;
  }).join('');

  // Control radar SVG
  const families = {};
  CONTROLS.forEach((c) => {
    if (!families[c.family]) families[c.family] = { total: 0, approved: 0 };
    families[c.family].total++;
    if (c.status === 'Approved') families[c.family].approved++;
  });
  const famKeys = Object.keys(families);
  const cx = 140, cy = 140, R = 100;
  const radarPts = famKeys.map((f, i) => {
    const score = families[f].total ? families[f].approved / families[f].total : 0;
    const angle = (i / famKeys.length) * Math.PI * 2 - Math.PI / 2;
    const r = 30 + score * R;
    return { f, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, lx: cx + Math.cos(angle) * (R + 22), ly: cy + Math.sin(angle) * (R + 22), score };
  });
  const poly = radarPts.map((p) => `${p.x},${p.y}`).join(' ');

  return `
    <div class="two-col">
      <div>
        <h3 class="section-title">POA&M Register (${poams.length})</h3>
        <div style="overflow:auto;max-height:420px">
          <table class="data-table">
            <thead><tr>
              <th>ID</th><th>Title</th><th>Hull</th><th>Ctrl</th><th>Status</th><th>Risk</th><th>Due</th><th>%</th><th>Mitigation</th>
            </tr></thead>
            <tbody>${poamRows || '<tr><td colspan="9">No POA&Ms in filter</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 class="section-title">NIST SP 800-53 Controls</h3>
        <div class="hull-map-wrap" style="margin-bottom:0.75rem">
          <svg viewBox="0 0 280 280" width="260" height="260">
            <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#1a2d45"/>
            <circle cx="${cx}" cy="${cy}" r="${R * 0.66}" fill="none" stroke="#1a2d45"/>
            <circle cx="${cx}" cy="${cy}" r="${R * 0.33}" fill="none" stroke="#1a2d45"/>
            <polygon points="${poly}" fill="rgba(0,229,255,0.15)" stroke="#00e5ff" stroke-width="1.5"/>
            ${radarPts.map((p) => `
              <circle cx="${p.x}" cy="${p.y}" r="4" fill="#00e5ff" style="cursor:pointer"/>
              <text x="${p.lx}" y="${p.ly}" text-anchor="middle" fill="#7a8ba8" font-size="8">${escapeHtml(p.f.split(' ')[0])}</text>
            `).join('')}
          </svg>
        </div>
        <div style="overflow:auto;max-height:280px">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Family</th><th>Title</th><th>Status</th><th>Inherit</th><th>Risk</th></tr></thead>
            <tbody>${controlRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function renderAnalytics() {
  return `
    <h3 class="section-title">Trend & Predictive Risk</h3>
    <div class="two-col">
      <div class="chart-box"><h4>Open POA&Ms (6 mo)</h4><canvas id="chartOpen"></canvas></div>
      <div class="chart-box"><h4>Risk Index + Forecast</h4><canvas id="chartRisk"></canvas>
        <p class="pred-risk-text">Predictive model (demo): risk dips mid-cycle then rises into Oct–Nov if OT scan gaps and IA-2 remain open on DDG-51/78.</p>
      </div>
      <div class="chart-box"><h4>Vulnerability Count</h4><canvas id="chartVuln"></canvas></div>
      <div class="chart-box"><h4>Control Implementation %</h4><canvas id="chartCtrl"></canvas></div>
    </div>
    <div class="card-grid" style="margin-top:1rem">
      <div class="panel-card">
        <h3 style="font-size:0.8rem">Hotspots</h3>
        <p style="font-size:0.72rem;color:var(--text-dim);margin-top:0.4rem;line-height:1.4">
          DDG-78 (Aegis CVE + OT scan), DDG-51 (IA-2 machinery), LHD-1 (EOL ISNS), CG-56 (TLS certs), LPD-17 (firewall drift).
        </p>
      </div>
      <div class="panel-card">
        <h3 style="font-size:0.8rem">Burn-down</h3>
        <p style="font-size:0.72rem;color:var(--text-dim);margin-top:0.4rem">
          Monthly closed: ${TREND_DATA.closedPoams.join(', ')}. Avg lag patch days: ${TREND_DATA.patchLagDays[TREND_DATA.patchLagDays.length - 1]}.
        </p>
      </div>
      <div class="panel-card">
        <h3 style="font-size:0.8rem">Critical assets trend</h3>
        <p style="font-size:0.72rem;color:var(--text-dim);margin-top:0.4rem">
          ${TREND_DATA.criticalAssets.join(' → ')} over period (improving slowly).
        </p>
      </div>
    </div>`;
}

function buildAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;
  const grid = 'rgba(26,45,69,0.8)';
  const tick = '#7a8ba8';
  const common = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { labels: { color: tick, font: { size: 10 } } } },
    scales: {
      x: { ticks: { color: tick, font: { size: 10 } }, grid: { color: grid } },
      y: { ticks: { color: tick, font: { size: 10 } }, grid: { color: grid } },
    },
  };

  const openCtx = document.getElementById('chartOpen');
  if (openCtx) {
    state.charts.open = new Chart(openCtx, {
      type: 'line',
      data: {
        labels: TREND_DATA.labels,
        datasets: [
          { label: 'Open', data: TREND_DATA.openPoams, borderColor: '#00e5ff', tension: 0.3, fill: false },
          { label: 'Closed', data: TREND_DATA.closedPoams, borderColor: '#00ff9d', tension: 0.3, fill: false },
        ],
      },
      options: common,
    });
  }

  const riskCtx = document.getElementById('chartRisk');
  if (riskCtx) {
    state.charts.risk = new Chart(riskCtx, {
      type: 'line',
      data: {
        labels: TREND_DATA.predictedLabels,
        datasets: [
          { label: 'Actual', data: [...TREND_DATA.riskScore, null, null], borderColor: '#ffb800', tension: 0.3, spanGaps: false },
          { label: 'Predicted', data: TREND_DATA.predictedRisk, borderColor: '#ff3b5c', borderDash: [6, 4], tension: 0.3, spanGaps: true },
        ],
      },
      options: common,
    });
  }

  const vulnCtx = document.getElementById('chartVuln');
  if (vulnCtx) {
    state.charts.vuln = new Chart(vulnCtx, {
      type: 'bar',
      data: {
        labels: TREND_DATA.labels,
        datasets: [{ label: 'Vulns', data: TREND_DATA.vulnCounts, backgroundColor: 'rgba(0,229,255,0.35)', borderColor: '#00e5ff', borderWidth: 1 }],
      },
      options: common,
    });
  }

  const ctrlCtx = document.getElementById('chartCtrl');
  if (ctrlCtx) {
    state.charts.ctrl = new Chart(ctrlCtx, {
      type: 'line',
      data: {
        labels: TREND_DATA.labels,
        datasets: [{ label: 'Impl %', data: TREND_DATA.controlImpl, borderColor: '#00ff9d', backgroundColor: 'rgba(0,255,157,0.1)', fill: true, tension: 0.3 }],
      },
      options: common,
    });
  }
}

function setAssetSub(sub) {
  state.assetSubTab = sub;
  renderTab();
}

function renderAssets() {
  const hw = filteredHardware();
  const sw = filteredSoftware();
  const sub = state.assetSubTab;

  const hwRows = hw.map((a) => {
    const h = a.hullId === 'all' ? null : hullById(a.hullId);
    return `<tr onclick="onAssetClick('${a.id}')">
      <td style="font-family:var(--mono)">${a.id}</td>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.type)}</td>
      <td>${h ? h.hull : a.hullId}</td>
      <td>${a.compartment || '—'}</td>
      <td>${escapeHtml(a.status)}</td>
      <td><span class="risk-badge ${a.risk}">${a.risk}</span></td>
      <td style="font-family:var(--mono);font-size:0.65rem">${escapeHtml(a.os || '')}</td>
    </tr>`;
  }).join('');

  const swRows = sw.map((a) => {
    const h = a.hullId === 'all' ? null : hullById(a.hullId);
    return `<tr onclick="onAssetClick('${a.id}')">
      <td style="font-family:var(--mono)">${a.id}</td>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.type)}</td>
      <td>${h ? h.hull : 'Fleet'}</td>
      <td>${escapeHtml(a.version)}</td>
      <td>${escapeHtml(a.status)}</td>
      <td><span class="risk-badge ${a.risk}">${a.risk}</span></td>
      <td>${escapeHtml(a.vendor)}</td>
    </tr>`;
  }).join('');

  return `
    <div class="sub-tabs">
      <button class="sub-tab ${sub === 'hardware' ? 'active' : ''}" onclick="setAssetSub('hardware')">Hardware (${hw.length})</button>
      <button class="sub-tab ${sub === 'software' ? 'active' : ''}" onclick="setAssetSub('software')">Software (${sw.length})</button>
      <button class="sub-tab ${sub === 'artifacts' ? 'active' : ''}" onclick="setAssetSub('artifacts')">Package Artifacts</button>
    </div>
    ${sub === 'hardware' ? `
      <div style="overflow:auto">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Hull</th><th>Zone</th><th>Status</th><th>Risk</th><th>OS</th></tr></thead>
          <tbody>${hwRows}</tbody>
        </table>
      </div>` : ''}
    ${sub === 'software' ? `
      <div style="overflow:auto">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Hull</th><th>Ver</th><th>Status</th><th>Risk</th><th>Vendor</th></tr></thead>
          <tbody>${swRows}</tbody>
        </table>
      </div>` : ''}
    ${sub === 'artifacts' ? `
      <div class="split-inventory">
        <div>
          <h3 class="section-title">eMASS Exports</h3>
          <div class="artifact-list">
            ${ARTIFACTS.map((a) => `
              <div class="artifact-item">
                <i class="fas fa-file"></i>
                <span class="name">${escapeHtml(a.name)}</span>
                <span class="meta">${a.type} · ${a.uploaded} · ${a.size}</span>
              </div>`).join('')}
          </div>
        </div>
        <div>
          <h3 class="section-title">RAG Corpus</h3>
          <div class="artifact-list">
            ${packageArtifacts.map((a) => `
              <div class="artifact-item">
                <i class="fas fa-book"></i>
                <span class="name">${escapeHtml(a.name)}</span>
                <span class="meta">${a.type} · ${a.uploaded}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>` : ''}
  `;
}

function renderMitigations() {
  const poamIds = new Set(filteredPoams().map((p) => p.id));
  const mits = MITIGATIONS.filter((m) => poamIds.has(m.poamId)).sort((a, b) => a.poamId.localeCompare(b.poamId) || a.step - b.step);
  const byPoam = {};
  mits.forEach((m) => {
    if (!byPoam[m.poamId]) byPoam[m.poamId] = [];
    byPoam[m.poamId].push(m);
  });

  return `
    <h3 class="section-title">Mitigation Tracker</h3>
    ${Object.keys(byPoam).map((pid) => {
      const p = POAMS.find((x) => x.id === pid);
      const steps = byPoam[pid];
      const done = steps.filter((s) => s.status === 'Done').length;
      return `<div class="panel-card" style="margin-bottom:0.75rem;cursor:default">
        <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="onPOAMClick('${pid}')">
          <strong style="font-family:var(--mono);color:var(--cyan)">${pid}</strong>
          <span style="font-size:0.7rem;color:var(--text-dim)">${done}/${steps.length} steps · ${p ? p.progress + '%' : ''}</span>
        </div>
        <div style="font-size:0.72rem;color:var(--text-dim);margin:0.35rem 0">${p ? escapeHtml(p.title) : ''}</div>
        ${steps.map((m) => {
          const st = m.status === 'Done' ? 'done' : m.status === 'In Progress' ? 'in-progress' : 'planned';
          return `<div class="mitigation-step ${st}" onclick="onMitigationClick('${m.id}')">
            <span style="font-family:var(--mono);color:var(--cyan)">#${m.step}</span>
            <div><strong>${escapeHtml(m.title)}</strong><br>
            <span style="font-size:0.65rem;color:var(--text-dim)">${m.status} · ${m.due} · ${escapeHtml(m.owner)}</span></div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('') || '<div class="empty-state"><p>No mitigations in current filter</p></div>'}`;
}

// ---------- AI Chat (keyword RAG) ----------
function ragAnswer(q) {
  const lower = q.toLowerCase();
  const lines = [];

  if (/ia-2|ddg-51|machinery|mfa|plc/.test(lower)) {
    const p = POAMS.find((x) => x.id === 'POAM-2025-0240') || POAMS.find((x) => x.control === 'IA-2');
    const mits = MITIGATIONS.filter((m) => m.poamId === (p && p.poamId ? p.id : 'POAM-2025-0240') || m.poamId === 'POAM-2024-0187' || m.poamId === 'POAM-2025-0240');
    lines.push('<strong>IA-2 / DDG-51 machinery authentication</strong>');
    if (p) {
      lines.push(`${p.id}: ${escapeHtml(p.title)} — <em>${p.status}</em>, risk <span class="risk-badge ${p.risk}">${p.risk}</span>, due ${p.due}.`);
      lines.push(`Strategy: ${escapeHtml(p.mitigation)}`);
    }
    const m240 = MITIGATIONS.filter((m) => m.poamId === 'POAM-2025-0240');
    if (m240.length) {
      lines.push('Steps: ' + m240.map((m) => `#${m.step} ${escapeHtml(m.title)} (${m.status})`).join('; '));
    }
    lines.push('Related artifact: <code>IA-2_Mitigation_Strategy_DDG51.pdf</code> (RAG corpus).');
  } else if (/critical|open poam|poam/.test(lower)) {
    const crit = filteredPoams().filter((p) => p.risk === 'critical' && p.status !== 'Closed');
    lines.push(`<strong>Critical open POA&Ms (${crit.length})</strong>`);
    crit.forEach((p) => {
      const h = hullById(p.hullId);
      lines.push(`• ${p.id} — ${escapeHtml(p.title)} [${h ? h.hull : p.hullId}] due ${p.due}`);
    });
  } else if (/predict|forecast|risk/.test(lower)) {
    lines.push('<strong>Predictive risk forecast (demo model)</strong>');
    lines.push(`Current index ~${TREND_DATA.riskScore[TREND_DATA.riskScore.length - 1]}; projected Oct/Nov: ${TREND_DATA.predictedRisk.slice(-2).join(' → ')}.`);
    lines.push('Drivers: OT vulnerability scan gap (DDG-78), IA-2 HMI auth (DDG-51), patch lag rebounding to ' + TREND_DATA.patchLagDays.slice(-1)[0] + ' days.');
  } else if (/artifact|package|ssp|upload|rag/.test(lower)) {
    lines.push('<strong>Package artifacts (RAG corpus)</strong>');
    packageArtifacts.forEach((a) => lines.push(`• ${escapeHtml(a.name)} (${a.type}, ${a.uploaded})`));
    lines.push('<strong>eMASS exports</strong>');
    ARTIFACTS.forEach((a) => lines.push(`• ${escapeHtml(a.name)} — ${a.type}`));
  } else if (/aegis|ddg-78|cve|display/.test(lower)) {
    const p = POAMS.find((x) => x.id === 'POAM-2024-0142');
    lines.push('<strong>Aegis / DDG-78 exposure</strong>');
    if (p) lines.push(`${p.id}: ${escapeHtml(p.mitigation)}`);
    lines.push('Artifact: Aegis_Security_Architecture.pdf · SSP_DDG78_Aegis.pdf');
  } else if (/control|800-53|nist/.test(lower)) {
    const bad = filteredControls().filter((c) => c.status !== 'Approved');
    lines.push(`<strong>Non-fully-approved controls (${bad.length})</strong>`);
    bad.slice(0, 8).forEach((c) => lines.push(`• ${c.id} ${escapeHtml(c.title)} — ${escapeHtml(c.status)} (${c.risk})`));
  } else {
    lines.push('I can help with POA&Ms, NIST controls, hull assets, mitigations, predictive risk, and package artifacts.');
    lines.push('Try: <em>"Show critical open POAMs"</em>, <em>"IA-2 DDG-51"</em>, <em>"Predictive risk forecast"</em>, or <em>"List package artifacts"</em>.');
    const open = filteredPoams().filter((p) => p.status !== 'Closed').length;
    lines.push(`Current filter: ${filteredHulls().length} hulls, ${open} open POA&Ms.`);
  }
  return lines.join('<br>');
}

function sendChat(q) {
  q = (q || '').trim();
  if (!q) return;
  const msgs = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  msgs.innerHTML += `<div class="msg user">${escapeHtml(q)}</div>`;
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    msgs.innerHTML += `<div class="msg bot">${ragAnswer(q)}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }, 400);
}

// ---------- Upload simulation ----------
function handleDataUpload(files) {
  if (!files || !files.length) return;
  const names = [...files].map((f) => f.name).join(', ');
  toast(`Ingested demo data: ${names} (simulated refresh)`);
  // Nudge a couple POAM progress numbers for demo feel
  POAMS.forEach((p, i) => {
    if (p.status !== 'Closed' && i % 3 === 0) p.progress = Math.min(100, p.progress + 5);
  });
  refreshAll();
}

function handleArtifactUpload(files) {
  if (!files || !files.length) return;
  [...files].forEach((f) => {
    packageArtifacts.unshift({
      name: f.name,
      type: 'Upload',
      uploaded: new Date().toISOString().slice(0, 10),
      forRAG: true,
    });
  });
  toast(`Added ${files.length} artifact(s) to RAG corpus`);
  if (state.activeTab === 'assets') renderTab();
}

// ---------- Refresh / Init ----------
function refreshAll() {
  renderRmfPipeline();
  renderKpis();
  renderStatusTracker();
  renderAlerts();
  renderTab();
}

function init() {
  populateFilters();

  document.getElementById('shipClassFilter').addEventListener('change', (e) => {
    state.shipClass = e.target.value;
    state.hull = 'all';
    refreshHullFilter();
    refreshAll();
  });
  document.getElementById('hullFilter').addEventListener('change', (e) => {
    state.hull = e.target.value;
    refreshAll();
  });

  document.getElementById('btnClearZone').addEventListener('click', clearZoneFilter);

  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => setActiveTab(t.dataset.tab));
  });

  document.getElementById('btnToggleChat').addEventListener('click', () => {
    document.getElementById('chatDrawer').classList.toggle('open');
  });
  document.getElementById('closeChat').addEventListener('click', () => {
    document.getElementById('chatDrawer').classList.remove('open');
  });
  document.getElementById('chatSend').addEventListener('click', () => sendChat(document.getElementById('chatInput').value));
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat(e.target.value);
  });
  document.querySelectorAll('.chat-suggestions button').forEach((b) => {
    b.addEventListener('click', () => sendChat(b.dataset.q));
  });

  document.getElementById('btnUploadData').addEventListener('click', () => document.getElementById('fileData').click());
  document.getElementById('btnUploadArtifact').addEventListener('click', () => document.getElementById('fileArtifact').click());
  document.getElementById('fileData').addEventListener('change', (e) => handleDataUpload(e.target.files));
  document.getElementById('fileArtifact').addEventListener('change', (e) => handleArtifactUpload(e.target.files));

  const drop = document.getElementById('dropZone');
  drop.addEventListener('click', () => document.getElementById('fileData').click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('dragover');
    handleDataUpload(e.dataTransfer.files);
  });

  document.getElementById('closeRight').addEventListener('click', () => {
    document.getElementById('rightPanel').classList.remove('open');
    document.getElementById('exploreContent').innerHTML = `
      <div class="empty-state"><i class="fas fa-mouse-pointer"></i>
      <p>Click any KPI, ship, hull compartment, POA&M, control, or asset to drill deeper.</p></div>`;
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modalOverlay').classList.remove('show');
  });
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') e.target.classList.remove('show');
  });

  updateClock();
  setInterval(updateClock, 1000);

  refreshAll();
  toast('PMS 443 Cyber RMF Dashboard online — Surface Fleet HUD ready');
}

document.addEventListener('DOMContentLoaded', init);

// Expose handlers for inline onclick
window.onKPIClick = onKPIClick;
window.onHullSelect = onHullSelect;
window.onCompartmentClick = onCompartmentClick;
window.onPOAMClick = onPOAMClick;
window.onControlClick = onControlClick;
window.onAssetClick = onAssetClick;
window.onAlertClick = onAlertClick;
window.onMitigationClick = onMitigationClick;
window.filterByClass = filterByClass;
window.setAssetSub = setAssetSub;
window.clearZoneFilter = clearZoneFilter;
