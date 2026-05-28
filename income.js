// ── INCOME SPLITTER PAGE ──
window._incSplits = [];
window._paycheckHistory = [];
// splitterChart declared globally in app.js
let connectedToBudget = true;

function getActiveSplits() {
  if (connectedToBudget) {
    return cats.map((c, i) => ({ name: c.name, pct: c.pct, color: colors[i % colors.length] }));
  }
  return window._incSplits;
}

function renderSplitter() {
  const pg = document.getElementById('page-splitter');
  // Always rebuild so latest data (cats, colors) is reflected
  if(splitterChart){ splitterChart.destroy(); splitterChart = null; }
  pg.innerHTML = `
    <div class="phdr">
      <div>
        <div class="ptitle">Income splitter</div>
        <div class="psub">Enter any paycheck amount and see exactly where it goes</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:13px;color:var(--txm)">Connect to budget</span>
        <div id="budgetToggle" class="sp-toggle ${connectedToBudget ? 'on' : ''}" onclick="toggleBudgetConnect()">
          <div class="sp-thumb"></div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
      <!-- LEFT: PAYCHECK ENTRY + BREAKDOWN -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="cc">
          <div class="cctitle">Enter paycheck</div>
          <div class="ccsub">Type in what you got paid</div>
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
            <div class="iwrap" style="flex:1;margin-bottom:0">
              <span class="isym">${cur}</span>
              <input type="text" style="display:none" aria-hidden="true">
              <input type="text" id="spAmount" placeholder="0" oninput="calcSplit(this.value)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" readonly onfocus="this.removeAttribute('readonly')" style="font-size:24px">
            </div>
            <select id="spSource" style="font-family:'DM Sans',sans-serif;font-size:13px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);color:var(--tx);padding:8px 11px;outline:none;cursor:pointer">
              <option value="Main job">Main job</option>
              <option value="Side hustle">Side hustle</option>
              <option value="Freelance">Freelance</option>
              <option value="Passive">Passive income</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <!-- BILLS ALLOCATION SECTION -->
          <div id="spBillsSection" style="display:none;margin-bottom:12px">
            <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txm);margin-bottom:7px;display:flex;align-items:center;justify-content:space-between">
              <span><i class="ti ti-alert-circle" style="color:var(--am)"></i> Set aside for bills</span>
              <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--am)" id="spBillsTotal"></span>
            </div>
            <div id="spBillsList" style="display:flex;flex-direction:column;gap:6px"></div>
            <div style="height:1px;background:var(--bdr);margin:10px 0"></div>
            <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txm);margin-bottom:7px">
              <i class="ti ti-percentage" style="color:var(--ac)"></i> Remaining to split
            </div>
          </div>
          <div id="spBreakdown" style="display:flex;flex-direction:column;gap:7px">
            <div style="text-align:center;color:var(--txf);font-size:13px;padding:20px 0">Enter an amount above to see your breakdown</div>
          </div>
          <div id="spTotalRow" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600;color:var(--tx)">Total</span>
            <span style="font-family:'DM Mono',monospace;font-size:18px;font-weight:600;color:var(--ac)" id="spTotalAmt"></span>
          </div>
          <button onclick="savePaycheck()" style="margin-top:14px;width:100%;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:10px;border-radius:var(--rs);border:none;background:var(--ac);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px">
            <i class="ti ti-device-floppy"></i> Save paycheck to history
          </button>
        </div>

        <!-- CUSTOM SPLITS (shown when disconnected) -->
        <div class="cc" id="customSplitsCard" style="display:${connectedToBudget ? 'none' : 'block'}">
          <div class="cctitle">Custom splits</div>
          <div class="ccsub">Set your own percentages for splitting paychecks</div>
          <div id="customSplitList" style="display:flex;flex-direction:column;gap:7px"></div>
          <div id="customSplitWarn" style="font-size:12px;margin-top:8px;min-height:16px"></div>
          <button onclick="addCustomSplit()" style="margin-top:8px;width:100%;font-family:'DM Sans',sans-serif;font-size:13px;padding:8px;border-radius:var(--rs);border:1px dashed var(--bdrh);background:transparent;color:var(--txm);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
            <i class="ti ti-plus"></i> Add split
          </button>
        </div>

        <!-- CONNECTED NOTICE -->
        <div class="cc" id="connectedNotice" style="display:${connectedToBudget ? 'block' : 'none'}">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:9px;background:var(--acd);border:1px solid var(--acb);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--ac);flex-shrink:0"><i class="ti ti-link"></i></div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--tx)">Using your budget splits</div>
              <div style="font-size:12px;color:var(--txm)">Splits mirror your budget page categories. Toggle off to customize.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: DONUT + HISTORY -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="cc">
          <div class="cctitle">Split breakdown</div>
          <div class="ccsub">Visual breakdown of this paycheck</div>
          <div class="dwrap" style="height:190px">
            <canvas id="splitterDonut" style="max-height:170px;max-width:170px"></canvas>
            <div class="dcenter">
              <div class="dval" id="spDonutVal" style="font-size:18px">—</div>
              <div class="dlbl">paycheck</div>
            </div>
          </div>
          <div id="spLegend" class="lgrid" style="margin-top:10px"></div>
        </div>

        <div class="cc">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
            <div class="cctitle">Paycheck history</div>
            <button onclick="clearHistory()" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--txf)">Clear all</button>
          </div>
          <div class="ccsub">Your saved paychecks</div>
          <div id="spHistory" style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto"></div>
        </div>
      </div>
    </div>
  `;

  // inject toggle styles if not already there
  if (!document.getElementById('splitterStyles')) {
    const style = document.createElement('style');
    style.id = 'splitterStyles';
    style.textContent = `.sp-toggle{width:40px;height:22px;border-radius:11px;background:var(--surf2);border:1px solid var(--bdr);cursor:pointer;position:relative;transition:all .2s;flex-shrink:0}.sp-toggle.on{background:var(--ac);border-color:var(--ac)}.sp-thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--txm);transition:all .2s}.sp-toggle.on .sp-thumb{left:20px;background:#fff}.sp-split-row{display:flex;align-items:center;gap:8px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);padding:8px 11px}.sp-split-name{flex:1;background:transparent;border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--tx)}.sp-split-pct{width:50px;text-align:right;background:rgba(255,255,255,0.05);border:1px solid var(--bdr);border-radius:5px;padding:3px 5px;font-family:'DM Mono',monospace;font-size:13px;color:var(--tx);outline:none}.sp-split-del{background:none;border:none;cursor:pointer;color:var(--txf);font-size:14px;padding:0}.sp-split-del:hover{color:var(--rd)}.sp-bd-row{display:flex;align-items:center;gap:10px;background:var(--surf2);border-radius:var(--rs);padding:10px 13px}.sp-bd-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0}.sp-bd-name{font-size:13px;color:var(--tx);flex:1}.sp-bd-pct{font-size:11px;color:var(--txm)}.sp-bd-amt{font-family:'DM Mono',monospace;font-size:14px;font-weight:500;color:var(--tx)}.sp-hist-row{display:flex;align-items:center;gap:10px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);padding:10px 13px;cursor:pointer}.sp-hist-row:hover{border-color:var(--bdrh)}.sp-hist-src{font-size:12px;font-weight:500;color:var(--tx);flex:1}.sp-hist-date{font-size:11px;color:var(--txm)}.sp-hist-amt{font-family:'DM Mono',monospace;font-size:14px;font-weight:500;color:var(--ac)}`;
    document.head.appendChild(style);
  }

  buildCustomSplitList();
  renderHistory();
  if (window._incSplits.length === 0) seedDefaultCustomSplits();
}

function seedDefaultCustomSplits() {
  window._incSplits = [
    { name: 'Savings', pct: 20, color: '#34d399' },
    { name: 'Bills & rent', pct: 35, color: '#60a5fa' },
    { name: 'Food', pct: 15, color: '#fbbf24' },
    { name: 'Spending money', pct: 20, color: '#f472b6' },
    { name: 'Emergency fund', pct: 10, color: '#a78bfa' }
  ];
}

function toggleBudgetConnect() {
  connectedToBudget = !connectedToBudget;
  renderSplitter();
}

function buildCustomSplitList() {
  const el = document.getElementById('customSplitList'); if (!el) return;
  el.innerHTML = '';
  window._incSplits.forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'sp-split-row';
    row.innerHTML = `<input type="color" style="width:22px;height:22px;border-radius:5px;border:1px solid var(--bdr);cursor:pointer;padding:2px;flex-shrink:0" value="${s.color}">
      <input class="sp-split-name" type="text" value="${s.name}">
      <input class="sp-split-pct" type="number" min="0" max="200" value="${s.pct}">
      <span style="font-size:11px;color:var(--txm)">%</span>
      <button class="sp-split-del"><i class="ti ti-x"></i></button>`;
    el.appendChild(row);
    row.querySelector('input[type=color]').addEventListener('input', function() { window._incSplits[i].color = this.value; recalcSplit(); });
    row.querySelector('.sp-split-name').addEventListener('input', function() { window._incSplits[i].name = this.value; recalcSplit(); });
    row.querySelector('.sp-split-pct').addEventListener('input', function() { window._incSplits[i].pct = parseFloat(this.value) || 0; recalcSplit(); updateCustomWarn(); });
    row.querySelector('.sp-split-del').addEventListener('click', () => { window._incSplits.splice(i, 1); buildCustomSplitList(); recalcSplit(); });
  });
  updateCustomWarn();
}

function addCustomSplit() {
  window._incSplits.push({ name: 'New split', pct: 0, color: '#E8472A' });
  buildCustomSplitList(); recalcSplit();
}

function updateCustomWarn() {
  const el = document.getElementById('customSplitWarn'); if (!el) return;
  const tot = window._incSplits.reduce((s, x) => s + (parseFloat(x.pct) || 0), 0);
  if (tot > 100) { el.style.color = 'var(--rd)'; el.textContent = 'Total is ' + Math.round(tot) + '% — over by ' + Math.round(tot - 100) + '%'; }
  else if (tot === 100) { el.style.color = 'var(--gr)'; el.textContent = 'Perfectly balanced at 100%'; }
  else { el.style.color = 'var(--txf)'; el.textContent = Math.round(100 - tot) + '% unallocated'; }
}

function calcSplit(val) {
  const amt = parseFloat(String(val).replace(/,/g, '')) || 0;
  window._currentSplitAmt = amt;
  recalcSplit();
}

function recalcSplit() {
  const amt = window._currentSplitAmt || 0;
  const splits = getActiveSplits();
  const bd = document.getElementById('spBreakdown');
  const totalRow = document.getElementById('spTotalRow');
  const totalAmt = document.getElementById('spTotalAmt');
  const donutVal = document.getElementById('spDonutVal');
  const legend = document.getElementById('spLegend');
  const billsSection = document.getElementById('spBillsSection');
  const billsList = document.getElementById('spBillsList');
  const billsTotal = document.getElementById('spBillsTotal');

  if (!amt) {
    if (bd) bd.innerHTML = '<div style="text-align:center;color:var(--txf);font-size:13px;padding:20px 0">Enter an amount above to see your breakdown</div>';
    if (totalRow) totalRow.style.display = 'none';
    if (donutVal) donutVal.textContent = '—';
    if (billsSection) billsSection.style.display = 'none';
    updateSplitterDonut([], []);
    return;
  }

  // ── BILLS ALLOCATION ──
  const bills = window._bills || [];
  const today = new Date();
  const upcoming = bills.filter(b => {
    if (b.paid) return false;
    const due = nextDueDate(b);
    const daysUntil = Math.ceil((due - today) / (1000*60*60*24));
    return daysUntil <= 45; // show bills due within 45 days
  }).sort((a,b) => nextDueDate(a) - nextDueDate(b));

  let billsReserve = 0;
  if (upcoming.length > 0 && billsSection) {
    billsSection.style.display = 'block';
    billsList.innerHTML = upcoming.map(b => {
      const due = nextDueDate(b);
      const daysUntil = Math.ceil((due - today) / (1000*60*60*24));
      const urgency = daysUntil <= 3 ? 'var(--rd)' : daysUntil <= 7 ? 'var(--am)' : 'var(--gr)';
      const setAside = calcSetAside(b, amt);
      billsReserve += setAside;
      return `<div class="sp-bd-row" style="border-left:3px solid ${urgency}">
        <div class="sp-bd-dot" style="background:${urgency}"></div>
        <div style="flex:1">
          <div class="sp-bd-name">${b.name}</div>
          <div style="font-size:10px;color:var(--txm)">Due ${formatDueDate(due)} · ${daysUntil <= 0 ? 'Overdue!' : daysUntil === 1 ? 'Tomorrow' : 'in '+daysUntil+' days'}</div>
        </div>
        <span class="sp-bd-amt" style="color:${urgency}">${cur}${Math.round(setAside).toLocaleString()}</span>
      </div>`;
    }).join('');
    if (billsTotal) billsTotal.textContent = cur + Math.round(billsReserve).toLocaleString();
  } else if (billsSection) {
    billsSection.style.display = 'none';
  }

  // ── SPLITS (on remaining after bills) ──
  const remaining = Math.max(amt - billsReserve, 0);
  if (splits.length > 0) {
    if (bd) {
      bd.innerHTML = splits.map(s => {
        const portion = remaining * (parseFloat(s.pct) || 0) / 100;
        return `<div class="sp-bd-row">
          <div class="sp-bd-dot" style="background:${s.color}"></div>
          <span class="sp-bd-name">${s.name}</span>
          <span class="sp-bd-pct">${Math.round(parseFloat(s.pct)||0)}%</span>
          <span class="sp-bd-amt">${cur}${Math.round(portion).toLocaleString()}</span>
        </div>`;
      }).join('');
    }
  } else {
    if (bd) bd.innerHTML = '<div style="text-align:center;color:var(--txf);font-size:13px;padding:12px 0">No splits configured</div>';
  }

  const allocatedTotal = billsReserve + splits.reduce((s,x) => s + remaining*(parseFloat(x.pct)||0)/100, 0);
  if (totalRow) totalRow.style.display = 'flex';
  if (totalAmt) totalAmt.textContent = cur + Math.round(allocatedTotal).toLocaleString();
  if (donutVal) donutVal.textContent = cur + Math.round(amt).toLocaleString();

  // Donut includes bills as a segment
  const donutData = [];
  const donutColors = [];
  const donutLabels = [];
  if (billsReserve > 0) {
    donutData.push(Math.round(billsReserve/amt*100));
    donutColors.push('#f87171');
    donutLabels.push('Bills reserve');
  }
  splits.forEach(s => {
    donutData.push(Math.max(parseFloat(s.pct)||0,0) * remaining/amt);
    donutColors.push(s.color);
    donutLabels.push(s.name);
  });
  updateSplitterDonut(donutData, donutColors, donutLabels);

  if (legend) {
    const items = [];
    if (billsReserve > 0) items.push(`<div class="li"><span class="ldot" style="background:#f87171"></span><span>Bills reserve</span><span class="lval">${cur}${Math.round(billsReserve).toLocaleString()}</span></div>`);
    splits.forEach(s => {
      const portion = remaining*(parseFloat(s.pct)||0)/100;
      items.push(`<div class="li"><span class="ldot" style="background:${s.color}"></span><span>${s.name}</span><span class="lval">${cur}${Math.round(portion).toLocaleString()}</span></div>`);
    });
    legend.innerHTML = items.join('');
  }
}

function nextDueDate(bill) {
  const today = new Date();
  const day = parseInt(bill.dueDay) || 1;
  let d = new Date(today.getFullYear(), today.getMonth(), day);
  if (d <= today) d = new Date(today.getFullYear(), today.getMonth()+1, day);
  return d;
}

function formatDueDate(d) {
  return d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
}

function calcSetAside(bill, paycheck) {
  // How much of this paycheck should go toward this bill?
  const due = nextDueDate(bill);
  const today = new Date();
  const daysUntil = Math.ceil((due - today) / (1000*60*60*24));
  const amt = parseFloat(bill.amount) || 0;
  // If due within 7 days, reserve the full amount
  if (daysUntil <= 7) return Math.min(amt, paycheck);
  // If bi-weekly pay frequency, split across 2 paychecks
  if (freq === 'biweekly') return amt / 2;
  // Otherwise reserve full amount
  return amt;
}

function updateSplitterDonut(data, bgColors, labels) {
  const canvas = document.getElementById('splitterDonut'); if (!canvas) return;
  // If no data, clear chart
  if (!data.length) {
    if (splitterChart) { splitterChart.destroy(); splitterChart = null; }
    return;
  }
  if (splitterChart) {
    // Update in place — never destroy/recreate unless canvas changed
    splitterChart.data.labels = labels || [];
    splitterChart.data.datasets[0].data = data;
    splitterChart.data.datasets[0].backgroundColor = bgColors;
    splitterChart.update('none'); // 'none' = no animation on update, prevents flicker
  } else {
    splitterChart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: labels || [], datasets: [{ data, backgroundColor: bgColors, borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '67%',
        animation: { duration: 400 },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + Math.round(ctx.parsed) + '%' } } }
      }
    });
  }
}

function savePaycheck() {
  const amt = window._currentSplitAmt || 0;
  if (!amt) { toast('Enter an amount first'); return; }
  const source = document.getElementById('spSource')?.value || 'Other';
  const splits = getActiveSplits();
  const breakdown = splits.map(s => ({ name: s.name, pct: parseFloat(s.pct) || 0, amount: Math.round(amt * (parseFloat(s.pct) || 0) / 100), color: s.color }));
  const entry = { id: Date.now(), amount: amt, source, breakdown, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), ts: Date.now() };
  if (!window._paycheckHistory) window._paycheckHistory = [];
  window._paycheckHistory.unshift(entry);
  if (window._paycheckHistory.length > 50) window._paycheckHistory = window._paycheckHistory.slice(0, 50);
  // Stamp timestamp so onSnapshot doesn't re-render and override our new entry
  window._lastSaveTs = Date.now();
  window._cacheTs = window._lastSaveTs;
  renderHistory();
  scheduleSave();
  toast('Paycheck saved!');
}

function renderHistory() {
  const el = document.getElementById('spHistory'); if (!el) return;
  if (!window._paycheckHistory || window._paycheckHistory.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--txf);font-size:13px;padding:16px 0">No paychecks saved yet</div>';
    return;
  }
  el.innerHTML = window._paycheckHistory.map(p => `
    <div class="sp-hist-row" onclick="expandHistory(${p.id})">
      <div>
        <div class="sp-hist-src">${p.source}</div>
        <div class="sp-hist-date">${p.date}</div>
      </div>
      <div class="sp-hist-amt">${cur}${Math.round(p.amount).toLocaleString()}</div>
    </div>
    <div id="hist-${p.id}" style="display:none;background:var(--surf2);border-radius:var(--rs);padding:10px;margin-top:-4px;margin-bottom:4px">
      ${p.breakdown.map(b => `<div style="display:flex;align-items:center;gap:8px;padding:3px 0"><span style="width:7px;height:7px;border-radius:2px;background:${b.color};flex-shrink:0;display:inline-block"></span><span style="font-size:12px;color:var(--txm);flex:1">${b.name}</span><span style="font-size:11px;color:var(--txm)">${b.pct}%</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--tx)">${cur}${Math.round(b.amount).toLocaleString()}</span></div>`).join('')}
    </div>
  `).join('');
}

function expandHistory(id) {
  const el = document.getElementById('hist-' + id); if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function clearHistory() {
  if (!confirm('Clear all paycheck history?')) return;
  window._paycheckHistory = [];
  // Mark timestamp so onSnapshot knows this clear was intentional and doesn't reload
  window._lastSaveTs = Date.now();
  window._cacheTs = window._lastSaveTs;
  renderHistory();
  scheduleSave();
  toast('History cleared');
}
