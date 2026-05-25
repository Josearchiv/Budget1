// ── INCOME SPLITTER PAGE ──
window._incSplits = [];
window._paycheckHistory = [];
let splitterChart = null;
let connectedToBudget = true;

function getActiveSplits() {
  if (connectedToBudget) {
    return cats.map((c, i) => ({ name: c.name, pct: c.pct, color: colors[i % colors.length] }));
  }
  return window._incSplits;
}

function renderSplitter() {
  const pg = document.getElementById('page-splitter');
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
              <input type="text" id="spAmount" name="spAmount" placeholder="0" oninput="calcSplit(this.value)" autocomplete="new-password" autocorrect="off" autocapitalize="off" spellcheck="false" style="font-size:24px">
            </div>
            <select id="spSource" style="font-family:'DM Sans',sans-serif;font-size:13px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);color:var(--tx);padding:8px 11px;outline:none;cursor:pointer">
              <option value="Main job">Main job</option>
              <option value="Side hustle">Side hustle</option>
              <option value="Freelance">Freelance</option>
              <option value="Passive">Passive income</option>
              <option value="Other">Other</option>
            </select>
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

  if (!amt || splits.length === 0) {
    if (bd) bd.innerHTML = '<div style="text-align:center;color:var(--txf);font-size:13px;padding:20px 0">Enter an amount above to see your breakdown</div>';
    if (totalRow) totalRow.style.display = 'none';
    if (donutVal) donutVal.textContent = '—';
    updateSplitterDonut([], []);
    return;
  }

  if (bd) {
    bd.innerHTML = splits.map(s => {
      const portion = amt * (parseFloat(s.pct) || 0) / 100;
      return `<div class="sp-bd-row">
        <div class="sp-bd-dot" style="background:${s.color}"></div>
        <span class="sp-bd-name">${s.name}</span>
        <span class="sp-bd-pct">${Math.round(parseFloat(s.pct) || 0)}%</span>
        <span class="sp-bd-amt">${cur}${Math.round(portion).toLocaleString()}</span>
      </div>`;
    }).join('');
  }

  const allocatedTotal = splits.reduce((s, x) => s + amt * (parseFloat(x.pct) || 0) / 100, 0);
  if (totalRow) totalRow.style.display = 'flex';
  if (totalAmt) totalAmt.textContent = cur + Math.round(allocatedTotal).toLocaleString();
  if (donutVal) donutVal.textContent = cur + Math.round(amt).toLocaleString();

  const data = splits.map(s => Math.max(parseFloat(s.pct) || 0, 0));
  const colors2 = splits.map(s => s.color);
  updateSplitterDonut(data, colors2, splits.map(s => s.name));

  if (legend) {
    legend.innerHTML = splits.map(s => {
      const portion = amt * (parseFloat(s.pct) || 0) / 100;
      return `<div class="li"><span class="ldot" style="background:${s.color}"></span><span>${s.name}</span><span class="lval">${cur}${Math.round(portion).toLocaleString()}</span></div>`;
    }).join('');
  }
}

function updateSplitterDonut(data, bgColors, labels) {
  const canvas = document.getElementById('splitterDonut'); if (!canvas) return;
  if (splitterChart) {
    if (!data.length) { splitterChart.destroy(); splitterChart = null; return; }
    splitterChart.data.labels = labels || [];
    splitterChart.data.datasets[0].data = data;
    splitterChart.data.datasets[0].backgroundColor = bgColors;
    splitterChart.update();
  } else if (data.length) {
    splitterChart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: labels || [], datasets: [{ data, backgroundColor: bgColors, borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '67%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + Math.round(ctx.parsed) + '%' } } } }
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
  renderHistory();
  scheduleSave();
  toast('History cleared');
}
