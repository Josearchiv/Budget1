// ── INCOME SPLITTER PAGE ──
window._incSplits = window._incSplits || [];
window._paycheckHistory = window._paycheckHistory || [];
// splitterChart declared globally in app.js
let connectedToBudget = true;

// ── SELF-CONTAINED DATE HELPERS ──
function spNextDueDate(bill) {
  const today = new Date(); today.setHours(0,0,0,0);
  const day = parseInt(bill.dueDay) || 1;
  switch(bill.frequency || 'monthly') {
    case 'daily':    { const d=new Date(today); d.setDate(d.getDate()+1); return d; }
    case 'weekly':   { const d=new Date(today); d.setDate(d.getDate()+7); return d; }
    case 'biweekly': { const d=new Date(today); d.setDate(d.getDate()+14); return d; }
    default: { // monthly / once
      const d=new Date(today.getFullYear(),today.getMonth(),day);
      if(d<=today) d.setMonth(d.getMonth()+1);
      return d;
    }
  }
}

function spDaysUntil(bill) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = spNextDueDate(bill);
  return Math.ceil((due - today) / (1000*60*60*24));
}

function spFmtDate(d) {
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

// ── SPLITS ──
function getActiveSplits() {
  if (connectedToBudget) {
    return cats.map((c,i) => ({ name:c.name, pct:c.pct, color:colors[i%colors.length] }));
  }
  return window._incSplits || [];
}

// ── RENDER SPLITTER PAGE ──
function renderSplitter() {
  const pg = document.getElementById('page-splitter'); if (!pg) return;
  if (splitterChart) { splitterChart.destroy(); splitterChart = null; }

  pg.innerHTML = `
    <div class="phdr">
      <div>
        <div class="ptitle">Income splitter</div>
        <div class="psub">Enter any paycheck — get an instant breakdown</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:13px;color:var(--txm)">Connect to budget</span>
        <div id="budgetToggle" onclick="toggleBudgetConnect(this)"
          style="width:44px;height:24px;border-radius:12px;background:${connectedToBudget?'var(--ac)':'var(--surf2)'};border:1px solid ${connectedToBudget?'var(--ac)':'var(--bdr)'};cursor:pointer;position:relative;transition:all .2s;flex-shrink:0"
          data-on="${connectedToBudget}">
          <div style="position:absolute;top:3px;left:${connectedToBudget?'21px':'3px'};width:16px;height:16px;border-radius:50%;background:${connectedToBudget?'#fff':'var(--txm)'};transition:all .2s"></div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">

      <!-- LEFT: INPUT + BREAKDOWN -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="cc">
          <div class="cctitle">Enter paycheck</div>
          <div class="ccsub" style="margin-bottom:12px">Type what you got paid</div>

          <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px">
            <div class="iwrap" style="flex:1;margin-bottom:0">
              <span class="isym">${cur}</span>
              <input type="text" id="spAmount" placeholder="0"
                autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                readonly onfocus="this.removeAttribute('readonly')"
                oninput="calcSplit(this.value)" style="font-size:24px">
              <input type="text" style="display:none" aria-hidden="true">
            </div>
            <select id="spSource" autocomplete="off"
              style="font-family:'DM Sans',sans-serif;font-size:13px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);color:var(--tx);padding:8px 11px;outline:none;cursor:pointer">
              <option value="Main job">Main job</option>
              <option value="Side hustle">Side hustle</option>
              <option value="Freelance">Freelance</option>
              <option value="Passive income">Passive income</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- BILLS SET-ASIDE -->
          <div id="spBillsSection" style="display:none;margin-bottom:12px">
            <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txm);margin-bottom:7px;display:flex;align-items:center;justify-content:space-between">
              <span style="color:var(--am)"><i class="ti ti-alert-circle"></i> Set aside for bills</span>
              <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--am)" id="spBillsTotal"></span>
            </div>
            <div id="spBillsList" style="display:flex;flex-direction:column;gap:6px"></div>
            <div style="height:1px;background:var(--bdr);margin:10px 0"></div>
            <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txm);margin-bottom:7px">
              <i class="ti ti-percentage" style="color:var(--ac)"></i> Remaining to split
            </div>
          </div>

          <!-- SPLITS BREAKDOWN -->
          <div id="spBreakdown" style="display:flex;flex-direction:column;gap:7px">
            <div style="text-align:center;color:var(--txf);font-size:13px;padding:20px 0">Enter an amount above to see your breakdown</div>
          </div>

          <!-- TOTAL ROW -->
          <div id="spTotalRow" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600;color:var(--tx)">Total allocated</span>
            <span style="font-family:'DM Mono',monospace;font-size:18px;font-weight:600;color:var(--ac)" id="spTotalAmt"></span>
          </div>

          <button onclick="savePaycheck()" style="margin-top:14px;width:100%;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:10px;border-radius:var(--rs);border:none;background:var(--ac);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px">
            <i class="ti ti-device-floppy"></i> Save paycheck to history
          </button>
        </div>

        <!-- CUSTOM SPLITS (when disconnected from budget) -->
        <div class="cc" id="customSplitsCard" style="display:${connectedToBudget?'none':'block'}">
          <div class="cctitle">Custom splits</div>
          <div class="ccsub" style="margin-bottom:10px">Set your own percentages</div>
          <div id="customSplitList" style="display:flex;flex-direction:column;gap:7px"></div>
          <div id="customSplitWarn" style="font-size:12px;margin-top:8px;min-height:16px;color:var(--txm)"></div>
          <button onclick="addCustomSplit()" style="margin-top:8px;width:100%;font-family:'DM Sans',sans-serif;font-size:13px;padding:8px;border-radius:var(--rs);border:1px dashed var(--bdrh);background:transparent;color:var(--txm);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
            <i class="ti ti-plus"></i> Add split
          </button>
        </div>

        <!-- CONNECTED NOTICE -->
        <div class="cc" id="connectedNotice" style="display:${connectedToBudget?'block':'none'}">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:9px;background:var(--acd);border:1px solid var(--acb);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--ac);flex-shrink:0"><i class="ti ti-link"></i></div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--tx)">Using your budget splits</div>
              <div style="font-size:12px;color:var(--txm)">Mirrors your budget page. Toggle off to customize.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: DONUT + HISTORY -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="cc">
          <div class="cctitle">Split breakdown</div>
          <div class="ccsub">Visual breakdown of this paycheck</div>
          <div class="dwrap" style="height:200px">
            <canvas id="splitterDonut" style="max-height:180px;max-width:180px"></canvas>
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
            <button onclick="clearPaycheckHistory()" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--txf)">Clear all</button>
          </div>
          <div class="ccsub">Your saved paychecks</div>
          <div id="spHistory" style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto"></div>
        </div>
      </div>

    </div>
  `;

  buildCustomSplitList();
  renderPaycheckHistory();
  if (window._incSplits.length === 0) seedDefaultSplits();
  // Restore amount if user already typed something
  if (window._currentSplitAmt) {
    document.getElementById('spAmount').value = window._currentSplitAmt.toLocaleString();
    recalcSplit();
  }
}

// ── TOGGLE CONNECT TO BUDGET ──
function toggleBudgetConnect(el) {
  connectedToBudget = !connectedToBudget;
  el.dataset.on = String(connectedToBudget);
  el.style.background = connectedToBudget ? 'var(--ac)' : 'var(--surf2)';
  el.style.borderColor = connectedToBudget ? 'var(--ac)' : 'var(--bdr)';
  const thumb = el.querySelector('div');
  if (thumb) { thumb.style.left = connectedToBudget ? '21px' : '3px'; thumb.style.background = connectedToBudget ? '#fff' : 'var(--txm)'; }
  document.getElementById('customSplitsCard').style.display = connectedToBudget ? 'none' : 'block';
  document.getElementById('connectedNotice').style.display = connectedToBudget ? 'block' : 'none';
  recalcSplit();
}

// ── CUSTOM SPLITS ──
function seedDefaultSplits() {
  window._incSplits = [
    {name:'Savings',pct:20,color:'#34d399'},{name:'Bills & rent',pct:35,color:'#60a5fa'},
    {name:'Food',pct:15,color:'#fbbf24'},{name:'Spending money',pct:20,color:'#f472b6'},
    {name:'Emergency fund',pct:10,color:'#a78bfa'}
  ];
}

function buildCustomSplitList() {
  const el = document.getElementById('customSplitList'); if (!el) return;
  el.innerHTML = '';
  (window._incSplits||[]).forEach((s,i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);padding:8px 11px';
    row.innerHTML = `<input type="color" style="width:22px;height:22px;border-radius:5px;border:1px solid var(--bdr);cursor:pointer;flex-shrink:0" value="${s.color}">
      <input type="text" style="flex:1;background:transparent;border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--tx)" value="${s.name}" autocomplete="off">
      <input type="number" min="0" max="200" style="width:50px;text-align:right;background:rgba(255,255,255,0.05);border:1px solid var(--bdr);border-radius:5px;padding:3px 5px;font-family:'DM Mono',monospace;font-size:13px;color:var(--tx);outline:none" value="${s.pct}" autocomplete="off">
      <span style="font-size:11px;color:var(--txm)">%</span>
      <button style="background:none;border:none;cursor:pointer;color:var(--txf);font-size:14px;padding:0" data-i="${i}"><i class="ti ti-x"></i></button>`;
    el.appendChild(row);
    row.querySelector('input[type=color]').addEventListener('input', e => { window._incSplits[i].color=e.target.value; recalcSplit(); });
    row.querySelector('input[type=text]').addEventListener('input', e => { window._incSplits[i].name=e.target.value; recalcSplit(); });
    row.querySelector('input[type=number]').addEventListener('input', e => { window._incSplits[i].pct=parseFloat(e.target.value)||0; recalcSplit(); updateCustomWarn(); });
    row.querySelector('button').addEventListener('click', () => { window._incSplits.splice(i,1); buildCustomSplitList(); recalcSplit(); });
  });
  updateCustomWarn();
}

function addCustomSplit() {
  window._incSplits.push({name:'New split',pct:0,color:'#E8472A'});
  buildCustomSplitList(); recalcSplit();
}

function updateCustomWarn() {
  const el = document.getElementById('customSplitWarn'); if (!el) return;
  const tot = (window._incSplits||[]).reduce((s,x)=>s+(parseFloat(x.pct)||0),0);
  if (tot > 100) { el.style.color='var(--rd)'; el.textContent='Total is '+Math.round(tot)+'% — over by '+Math.round(tot-100)+'%'; }
  else if (Math.round(tot)===100) { el.style.color='var(--gr)'; el.textContent='Perfectly balanced at 100%'; }
  else { el.style.color='var(--txf)'; el.textContent=Math.round(100-tot)+'% unallocated'; }
}

// ── CALC SPLIT ──
function calcSplit(val) {
  const amt = parseFloat(String(val).replace(/,/g,'')) || 0;
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
  const legend   = document.getElementById('spLegend');
  const billsSec = document.getElementById('spBillsSection');
  const billsList= document.getElementById('spBillsList');
  const billsTot = document.getElementById('spBillsTotal');

  if (!amt) {
    if (bd) bd.innerHTML = '<div style="text-align:center;color:var(--txf);font-size:13px;padding:20px 0">Enter an amount above to see your breakdown</div>';
    if (totalRow) totalRow.style.display = 'none';
    if (donutVal) donutVal.textContent = '—';
    if (billsSec) billsSec.style.display = 'none';
    updateSplitterDonut([], [], []);
    return;
  }

  // ── BILLS SET-ASIDE ──
  const bills = (window._bills || []).filter(b => !b.paid);
  const today = new Date();
  const upcoming = bills.filter(b => {
    const days = spDaysUntil(b);
    return days <= 45;
  }).sort((a,b) => spDaysUntil(a) - spDaysUntil(b));

  let billsReserve = 0;
  if (upcoming.length > 0 && billsSec) {
    billsSec.style.display = 'block';
    if (billsList) {
      billsList.innerHTML = upcoming.map(b => {
        const days = spDaysUntil(b);
        const due  = spNextDueDate(b);
        const urg  = days <= 3 ? 'var(--rd)' : days <= 7 ? 'var(--am)' : 'var(--gr)';
        const aside = calcSetAside(b, amt);
        billsReserve += aside;
        const dueLbl = days <= 0 ? 'Overdue!' : days === 1 ? 'Tomorrow' : days <= 45 ? 'in '+days+' days' : spFmtDate(due);
        return `<div style="display:flex;align-items:center;gap:10px;background:var(--surf2);border-radius:var(--rs);padding:10px 13px;border-left:3px solid ${urg}">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500;color:var(--tx)">${b.name}</div>
            <div style="font-size:11px;color:var(--txm)">Due ${dueLbl} · ${(b.frequency||'monthly').replace('biweekly','bi-weekly')}</div>
          </div>
          <span style="font-family:'DM Mono',monospace;font-size:14px;font-weight:600;color:${urg}">${cur}${Math.round(aside).toLocaleString()}</span>
        </div>`;
      }).join('');
    }
    if (billsTot) billsTot.textContent = cur + Math.round(billsReserve).toLocaleString();
  } else if (billsSec) {
    billsSec.style.display = 'none';
  }

  // ── SPLITS ON REMAINING ──
  const remaining = Math.max(amt - billsReserve, 0);
  if (bd) {
    if (splits.length) {
      bd.innerHTML = splits.map(s => {
        const portion = remaining * (parseFloat(s.pct)||0) / 100;
        return `<div style="display:flex;align-items:center;gap:10px;background:var(--surf2);border-radius:var(--rs);padding:10px 13px">
          <span style="width:8px;height:8px;border-radius:2px;background:${s.color};flex-shrink:0;display:inline-block"></span>
          <span style="font-size:13px;color:var(--tx);flex:1">${s.name}</span>
          <span style="font-size:11px;color:var(--txm)">${Math.round(parseFloat(s.pct)||0)}%</span>
          <span style="font-family:'DM Mono',monospace;font-size:14px;font-weight:500;color:var(--tx)">${cur}${Math.round(portion).toLocaleString()}</span>
        </div>`;
      }).join('');
    } else {
      bd.innerHTML = '<div style="text-align:center;color:var(--txf);font-size:13px;padding:12px 0">No splits configured</div>';
    }
  }

  const allocated = billsReserve + splits.reduce((s,x)=>s+remaining*(parseFloat(x.pct)||0)/100, 0);
  if (totalRow) totalRow.style.display = 'flex';
  if (totalAmt) totalAmt.textContent = cur + Math.round(allocated).toLocaleString();
  if (donutVal) donutVal.textContent = cur + Math.round(amt).toLocaleString();

  // Donut data
  const dData=[], dColors=[], dLabels=[];
  if (billsReserve > 0) { dData.push(Math.round(billsReserve/amt*100)); dColors.push('#f87171'); dLabels.push('Bills reserve'); }
  splits.forEach(s => { dData.push(Math.max(parseFloat(s.pct)||0,0)*remaining/amt); dColors.push(s.color); dLabels.push(s.name); });
  updateSplitterDonut(dData, dColors, dLabels);

  if (legend) {
    const items = [];
    if (billsReserve>0) items.push(`<div class="li"><span class="ldot" style="background:#f87171"></span><span>Bills reserve</span><span class="lval">${cur}${Math.round(billsReserve).toLocaleString()}</span></div>`);
    splits.forEach(s => { const p=remaining*(parseFloat(s.pct)||0)/100; items.push(`<div class="li"><span class="ldot" style="background:${s.color}"></span><span>${s.name}</span><span class="lval">${cur}${Math.round(p).toLocaleString()}</span></div>`); });
    legend.innerHTML = items.join('');
  }
}

// ── CALC SET ASIDE ──
function calcSetAside(bill, paycheck) {
  const amt = parseFloat(bill.amount) || 0;
  const days = spDaysUntil(bill);
  if (days <= 3) return Math.min(amt, paycheck);
  switch(bill.frequency || 'monthly') {
    case 'daily':    return amt;
    case 'weekly':   return freq === 'biweekly' ? amt * 2 : amt;
    case 'biweekly': return amt;
    case 'once':     return days <= 30 ? amt : 0;
    default:         return freq === 'biweekly' ? amt / 2 : amt;
  }
}

// ── DONUT CHART ──
function updateSplitterDonut(data, bgColors, labels) {
  const canvas = document.getElementById('splitterDonut'); if (!canvas) return;
  if (!data.length) { if(splitterChart){splitterChart.destroy();splitterChart=null;} return; }
  if (splitterChart) {
    splitterChart.data.labels = labels;
    splitterChart.data.datasets[0].data = data;
    splitterChart.data.datasets[0].backgroundColor = bgColors;
    splitterChart.update('none');
  } else {
    splitterChart = new Chart(canvas, {
      type:'doughnut',
      data:{labels,datasets:[{data,backgroundColor:bgColors,borderWidth:0}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'67%',animation:{duration:300},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${Math.round(ctx.parsed)}%`}}}}
    });
  }
}

// ── SAVE PAYCHECK ──
function savePaycheck() {
  const amt = window._currentSplitAmt || 0;
  if (!amt) { toast('Enter an amount first'); return; }
  const source = document.getElementById('spSource')?.value || 'Other';
  const splits = getActiveSplits();
  const bills  = (window._bills||[]).filter(b=>!b.paid);
  const billsReserve = bills.filter(b=>spDaysUntil(b)<=45).reduce((s,b)=>s+calcSetAside(b,amt),0);
  const remaining = Math.max(amt - billsReserve, 0);
  const breakdown = [];
  if (billsReserve > 0) breakdown.push({name:'Bills reserve',pct:Math.round(billsReserve/amt*100),amount:Math.round(billsReserve),color:'#f87171'});
  splits.forEach(s => { breakdown.push({name:s.name,pct:parseFloat(s.pct)||0,amount:Math.round(remaining*(parseFloat(s.pct)||0)/100),color:s.color}); });

  const entry = {id:'p'+Date.now(),amount:amt,source,breakdown,date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),ts:Date.now()};
  window._paycheckHistory = window._paycheckHistory || [];
  window._paycheckHistory.unshift(entry);
  if (window._paycheckHistory.length > 50) window._paycheckHistory = window._paycheckHistory.slice(0,50);
  window._lastSaveTs = Date.now(); window._cacheTs = window._lastSaveTs;
  renderPaycheckHistory();
  scheduleSave();
  toast('Paycheck saved!');
}

// ── PAYCHECK HISTORY (expanded, in splitter) ──
function renderPaycheckHistory() {
  const el = document.getElementById('spHistory'); if (!el) return;
  const hist = window._paycheckHistory || [];
  if (!hist.length) { el.innerHTML='<div style="text-align:center;color:var(--txf);font-size:13px;padding:16px 0">No paychecks saved yet</div>'; return; }
  el.innerHTML = hist.slice(0,10).map(p=>`
    <div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);overflow:hidden;cursor:pointer" onclick="openPaycheckDetail('${p.id}')">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 13px;background:var(--surf);border-bottom:1px solid var(--bdr)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--tx)">${p.source}</div>
          <div style="font-size:11px;color:var(--txm)">${p.date}</div>
        </div>
        <span style="font-family:'DM Mono',monospace;font-size:16px;font-weight:600;color:var(--ac)">${cur}${Math.round(p.amount).toLocaleString()}</span>
      </div>
      <div style="padding:9px 13px;display:flex;flex-direction:column;gap:5px">
        ${(p.breakdown||[]).map(b=>`
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:7px;height:7px;border-radius:2px;background:${b.color||'var(--ac)'};flex-shrink:0;display:inline-block"></span>
            <span style="font-size:12px;color:var(--tx);flex:1">${b.name}</span>
            <span style="font-size:11px;color:var(--txm)">${b.pct}%</span>
            <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--tx)">${cur}${Math.round(b.amount).toLocaleString()}</span>
          </div>`).join('')}
      </div>
    </div>
  `).join('');
}

function clearPaycheckHistory() {
  if (!confirm('Clear all paycheck history?')) return;
  window._paycheckHistory = [];
  window._lastSaveTs = Date.now(); window._cacheTs = window._lastSaveTs;
  renderPaycheckHistory();
  scheduleSave();
  toast('Paycheck history cleared');
}

function clearPaycheckHistoryFromBills() { clearPaycheckHistory(); }
