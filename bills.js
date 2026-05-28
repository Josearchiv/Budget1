// ── BILLS MANAGER ──
window._bills         = window._bills         || [];
window._billHistory   = window._billHistory   || [];
window._monthlyArchive= window._monthlyArchive|| [];

const BILL_CATS = ['Housing','Transport','Insurance','Utilities','Subscriptions','Food','Healthcare','Education','Entertainment','Other'];
const BILL_COLORS = {
  'Housing':'#60a5fa','Transport':'#fbbf24','Insurance':'#a78bfa',
  'Utilities':'#34d399','Subscriptions':'#f472b6','Food':'#fb923c',
  'Healthcare':'#f87171','Education':'#38bdf8','Entertainment':'#e879f9','Other':'#888892'
};
const FREQ_LABELS = {daily:'Daily',weekly:'Weekly',biweekly:'Bi-weekly',monthly:'Monthly',once:'One-time'};

// ── CALENDAR ENGINE (always running) ──
let _lastCheckedDate = null;
function tickCalendar(){
  const today = new Date();
  const key   = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  if(_lastCheckedDate === key) return;
  _lastCheckedDate = key;

  // Reset recurring bills whose cycle has reset
  let changed = false;
  (window._bills||[]).forEach(b=>{
    if(!b.recurring || !b.paid) return;
    const resetDate = getNextResetDate(b);
    if(today >= resetDate){
      b.paid = false;
      b.paidDate = null;
      changed = true;
      console.log('Bill reset:', b.name);
    }
  });

  // Monthly archive rollover
  const archiveKey = today.getFullYear()+'-'+today.getMonth();
  const archive = window._monthlyArchive||[];
  const already = archive.find(a=>a.key===archiveKey);
  if(!already){
    // Archive previous month snapshot
    const pm = new Date(today.getFullYear(), today.getMonth()-1, 1);
    const pmKey = pm.getFullYear()+'-'+pm.getMonth();
    const pmAlready = archive.find(a=>a.key===pmKey);
    if(!pmAlready && (window._billHistory||[]).length>0){
      archive.unshift({
        key: pmKey,
        label: pm.toLocaleDateString('en-US',{month:'long',year:'numeric'}),
        bills: (window._bills||[]).map(b=>({...b})),
        billHistory: (window._billHistory||[]).filter(h=>{
          const d = new Date(h.date);
          return d.getMonth()===pm.getMonth() && d.getFullYear()===pm.getFullYear();
        }),
        paychecks: (window._paycheckHistory||[]).filter(p=>{
          const d = new Date(p.date);
          return d.getMonth()===pm.getMonth() && d.getFullYear()===pm.getFullYear();
        })
      });
      window._monthlyArchive = archive;
      changed = true;
    }
  }

  if(changed){ scheduleSave(); refreshBillsUI(); }
}

function getNextResetDate(b){
  const paid = b.paidDate ? new Date(b.paidDate) : new Date();
  const d = new Date(paid);
  switch(b.frequency){
    case 'daily':    d.setDate(d.getDate()+1); break;
    case 'weekly':   d.setDate(d.getDate()+7); break;
    case 'biweekly': d.setDate(d.getDate()+14); break;
    case 'once':     return new Date(9999,0,1); // never resets
    default:         d.setMonth(d.getMonth()+1); break; // monthly
  }
  return d;
}

function getDaysUntilDue(b){
  const today = new Date();
  today.setHours(0,0,0,0);
  const due = getNextDueDate(b);
  return Math.ceil((due-today)/(1000*60*60*24));
}

function getNextDueDate(b){
  const today = new Date();
  today.setHours(0,0,0,0);
  const day = parseInt(b.dueDay)||1;
  switch(b.frequency){
    case 'daily':{
      const d = new Date(today); d.setDate(d.getDate()+1); return d;
    }
    case 'weekly':{
      const d = new Date(today); d.setDate(d.getDate()+7); return d;
    }
    case 'biweekly':{
      const d = new Date(today); d.setDate(d.getDate()+14); return d;
    }
    case 'once':{
      const d = new Date(today.getFullYear(), today.getMonth(), day);
      if(d<=today) d.setMonth(d.getMonth()+1);
      return d;
    }
    default:{ // monthly
      const d = new Date(today.getFullYear(), today.getMonth(), day);
      if(d<=today) d.setMonth(d.getMonth()+1);
      return d;
    }
  }
}

function daySuffix(n){
  const s=['th','st','nd','rd'],v=n%100;
  return s[(v-20)%10]||s[v]||s[0];
}

function formatDate(d){
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

// ── REFRESH ALL BILLS UI ──
function refreshBillsUI(){
  const pg = document.getElementById('page-bills');
  if(pg && pg.classList.contains('active')) renderBills();
  updateBillsOverviewTabs();
  tickCalendar();
}

// ── OVERVIEW BILLS (current/paid toggle) ──
let _ovTab = 'current';
function switchOverviewBills(tab){
  _ovTab = tab;
  document.getElementById('ovCurrent').style.background = tab==='current'?'var(--surf)':'transparent';
  document.getElementById('ovCurrent').style.color = tab==='current'?'var(--tx)':'var(--txm)';
  document.getElementById('ovCurrent').style.boxShadow = tab==='current'?'0 1px 3px rgba(0,0,0,.15)':'none';
  document.getElementById('ovPaid').style.background = tab==='paid'?'var(--surf)':'transparent';
  document.getElementById('ovPaid').style.color = tab==='paid'?'var(--tx)':'var(--txm)';
  document.getElementById('ovPaid').style.boxShadow = tab==='paid'?'0 1px 3px rgba(0,0,0,.15)':'none';
  updateBillsOverviewTabs();
}

function updateBillsOverviewTabs(){
  const el = document.getElementById('billsOverviewContent'); if(!el) return;
  const bills = window._bills||[];
  if(!bills.length){
    el.innerHTML = '<div style="text-align:center;color:var(--txf);font-size:13px;padding:12px 0">No bills added yet</div>';
    return;
  }
  const today = new Date();
  const totalMonthly = bills.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
  const paidAmt = bills.filter(b=>b.paid).reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
  const pct = totalMonthly>0?Math.round(paidAmt/totalMonthly*100):0;

  const filtered = _ovTab==='current'
    ? bills.filter(b=>!b.paid).sort((a,b)=>getDaysUntilDue(a)-getDaysUntilDue(b))
    : bills.filter(b=>b.paid).sort((a,b)=>new Date(b.paidDate||0)-new Date(a.paidDate||0));

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
      <span style="color:var(--txm)">Monthly total</span>
      <span style="font-family:'DM Mono',monospace;font-weight:500">${cur}${Math.round(totalMonthly).toLocaleString()}</span>
    </div>
    <div style="height:5px;background:var(--bdr);border-radius:3px;overflow:hidden;margin-bottom:10px">
      <div style="height:5px;background:var(--gr);border-radius:3px;width:${pct}%;transition:width .3s"></div>
    </div>
    ${filtered.length ? filtered.slice(0,5).map(b=>{
      const days = getDaysUntilDue(b);
      const urg = b.paid?'var(--gr)':days<=0?'var(--rd)':days<=7?'var(--am)':'var(--txm)';
      const lbl = b.paid?('Paid '+(b.paidDate||'')):days<=0?'Overdue':days===1?'Tomorrow':('Due in '+days+'d');
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr)">
        <span style="width:8px;height:8px;border-radius:2px;background:${BILL_COLORS[b.category]||'var(--ac)'};flex-shrink:0;display:inline-block"></span>
        <span style="font-size:13px;color:var(--tx);flex:1">${b.name}</span>
        <span style="font-size:10px;color:${urg}">${lbl}</span>
        <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:500">${cur}${Math.round(parseFloat(b.amount)||0).toLocaleString()}</span>
      </div>`;
    }).join('') : `<div style="text-align:center;color:var(--txf);font-size:13px;padding:10px 0">No ${_ovTab==='current'?'unpaid':'paid'} bills</div>`}
  `;
}

// ── MAIN BILLS PAGE ──
function renderBills(){
  const pg = document.getElementById('page-bills'); if(!pg) return;
  injectBillsStyles();
  tickCalendar();

  const bills = window._bills||[];
  const today = new Date();

  const unpaid = bills.filter(b=>!b.paid).sort((a,b)=>getDaysUntilDue(a)-getDaysUntilDue(b));
  const paid   = bills.filter(b=>b.paid);
  const totalMonthly = bills.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
  const paidAmt = paid.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
  const unpaidAmt = totalMonthly-paidAmt;
  const pct = totalMonthly>0?Math.round(paidAmt/totalMonthly*100):0;

  pg.innerHTML = `
    <div class="phdr">
      <div><div class="ptitle">Bills</div><div class="psub">Manage your monthly obligations</div></div>
      <button onclick="openBillModal()" style="display:flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:9px 16px;border-radius:var(--rs);border:none;background:var(--ac);color:#fff;cursor:pointer"><i class="ti ti-plus"></i> Add bill</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:13px">
      <div class="mc"><div class="mclbl"><i class="ti ti-receipt"></i> Total monthly</div><div class="mcval">${cur}${Math.round(totalMonthly).toLocaleString()}</div><div class="mcsub">${bills.length} bill${bills.length!==1?'s':''}</div></div>
      <div class="mc"><div class="mclbl"><i class="ti ti-circle-check" style="color:var(--gr)"></i> Paid</div><div class="mcval" style="color:var(--gr)">${cur}${Math.round(paidAmt).toLocaleString()}</div><div class="mcsub">${paid.length} paid</div></div>
      <div class="mc"><div class="mclbl"><i class="ti ti-clock" style="color:var(--am)"></i> Remaining</div><div class="mcval" style="color:var(--am)">${cur}${Math.round(unpaidAmt).toLocaleString()}</div><div class="mcsub">${unpaid.length} remaining</div></div>
      <div class="mc">
        <div class="mclbl"><i class="ti ti-chart-bar"></i> Progress</div>
        <div class="mcval">${pct}%</div>
        <div style="height:4px;background:var(--bdr);border-radius:2px;margin-top:6px;overflow:hidden"><div style="height:4px;background:var(--gr);border-radius:2px;width:${pct}%;transition:width .3s"></div></div>
      </div>
    </div>

    ${unpaid.length ? `
    <div>
      <div class="cctitle" style="margin-bottom:12px">Upcoming bills</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
        ${unpaid.map(b=>buildBillCard(b)).join('')}
        <button class="add-bill-btn" onclick="openBillModal()"><i class="ti ti-plus"></i> Add a bill</button>
      </div>
    </div>` : `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
      <button class="add-bill-btn" onclick="openBillModal()"><i class="ti ti-plus"></i> Add a bill</button>
    </div>`}

    ${paid.length ? `
    <div>
      <div class="cctitle" style="margin-bottom:12px">Paid this cycle</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
        ${paid.map(b=>buildBillCard(b)).join('')}
      </div>
    </div>` : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="cc">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
          <div class="cctitle">Bill payment history</div>
          <button onclick="clearBillHistory()" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--txf)">Clear</button>
        </div>
        <div class="ccsub">All recorded bill payments</div>
        <div style="max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:0">
          ${renderBillHistoryHTML()}
        </div>
      </div>

      <div class="cc">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
          <div class="cctitle">Paycheck history</div>
          <button onclick="clearPaycheckHistoryFromBills()" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--txf)">Clear</button>
        </div>
        <div class="ccsub">Tap a month to expand</div>
        <div style="max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:6px" id="paycheckMonthGroups">
          ${renderPaycheckMonthGroups()}
        </div>
      </div>
    </div>
  `;
}

function buildBillCard(b){
  const days = getDaysUntilDue(b);
  const isOverdue = days<0 && !b.paid;
  const isDueSoon = days>=0 && days<=7 && !b.paid;
  const color = BILL_COLORS[b.category]||'var(--ac)';
  const urg = b.paid?'var(--gr)':isOverdue?'var(--rd)':isDueSoon?'var(--am)':'var(--txm)';
  const badgeBg = b.paid?'rgba(52,211,153,.1)':isOverdue?'rgba(248,113,113,.1)':isDueSoon?'rgba(251,191,36,.1)':'rgba(255,255,255,.05)';
  const due = getNextDueDate(b);
  const lbl = b.paid?'Paid':isOverdue?'Overdue':days===0?'Due today':days===1?'Due tomorrow':('Due '+formatDate(due));
  const freqLbl = FREQ_LABELS[b.frequency||'monthly']||'Monthly';

  return `<div class="bill-card">
    <div class="bill-card-hdr">
      <div class="bill-icon" style="background:${color}22;color:${color}"><i class="ti ${billIcon(b.category)}"></i></div>
      <div style="flex:1">
        <div class="bill-name">${b.name}</div>
        <div class="bill-cat">${b.category} · ${freqLbl}${b.recurring?' · <span style="color:var(--ac)">Recurring</span>':''}</div>
      </div>
      <div style="text-align:right">
        <div class="bill-amt">${cur}${Math.round(parseFloat(b.amount)||0).toLocaleString()}</div>
        <div class="due-badge" style="background:${badgeBg};color:${urg}">${lbl}</div>
      </div>
    </div>
    ${b.notes?`<div style="padding:0 16px 8px;font-size:12px;color:var(--txm)">${b.notes}</div>`:''}
    <div class="bill-actions">
      <button class="bill-btn ${b.paid?'paid':''}" onclick="toggleBillPaid('${b.id}')">
        <i class="ti ${b.paid?'ti-circle-check':'ti-circle'}"></i> ${b.paid?'Paid':'Mark paid'}
      </button>
      <button class="bill-btn" onclick="openBillModal('${b.id}')"><i class="ti ti-edit"></i> Edit</button>
      <button class="bill-btn del" onclick="deleteBill('${b.id}')"><i class="ti ti-trash"></i></button>
    </div>
  </div>`;
}

function billIcon(cat){
  return {'Housing':'ti-home','Transport':'ti-car','Insurance':'ti-shield','Utilities':'ti-bolt','Subscriptions':'ti-refresh','Food':'ti-soup','Healthcare':'ti-heart','Education':'ti-book','Entertainment':'ti-device-tv','Other':'ti-receipt'}[cat]||'ti-receipt';
}

// ── PAYCHECK HISTORY — MONTH GROUPED ──
function renderPaycheckMonthGroups(){
  const hist = window._paycheckHistory||[];
  if(!hist.length) return '<div style="text-align:center;color:var(--txf);font-size:13px;padding:16px 0">No paychecks saved yet</div>';

  // Group by month
  const groups = {};
  hist.forEach(p=>{
    const d = new Date(p.ts||p.date);
    const key = d.getFullYear()+'-'+d.getMonth();
    const label = d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    if(!groups[key]) groups[key]={label,key,items:[],total:0};
    groups[key].items.push(p);
    groups[key].total += parseFloat(p.amount)||0;
  });

  return Object.values(groups).sort((a,b)=>b.key.localeCompare(a.key)).map(g=>`
    <div class="month-group">
      <div class="month-group-hdr" onclick="toggleMonthGroup('${g.key}')">
        <div style="display:flex;align-items:center;gap:8px">
          <i class="ti ti-calendar-month" style="color:var(--ac)"></i>
          <span style="font-size:13px;font-weight:600;color:var(--tx)">${g.label}</span>
          <span class="badge ba">${g.items.length} paycheck${g.items.length!==1?'s':''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:var(--ac)">${cur}${Math.round(g.total).toLocaleString()}</span>
          <i class="ti ti-chevron-down" id="chev-${g.key}" style="color:var(--txm);font-size:14px;transition:transform .2s"></i>
        </div>
      </div>
      <div class="month-group-body" id="mg-${g.key}" style="display:none">
        ${g.items.sort((a,b)=>(b.ts||0)-(a.ts||0)).map(p=>`
          <div class="paycheck-row" onclick="openPaycheckDetail('${p.id}')">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <div style="width:34px;height:34px;border-radius:8px;background:var(--acd);border:1px solid var(--acb);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="ti ti-briefcase" style="color:var(--ac);font-size:14px"></i>
              </div>
              <div>
                <div style="font-size:13px;font-weight:500;color:var(--tx)">${p.source}</div>
                <div style="font-size:11px;color:var(--txm)">${p.date}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-family:'DM Mono',monospace;font-size:14px;font-weight:600;color:var(--ac)">${cur}${Math.round(p.amount).toLocaleString()}</span>
              <i class="ti ti-chevron-right" style="color:var(--txm);font-size:13px"></i>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function toggleMonthGroup(key){
  const body = document.getElementById('mg-'+key);
  const chev = document.getElementById('chev-'+key);
  if(!body) return;
  const open = body.style.display!=='none';
  body.style.display = open?'none':'flex';
  body.style.flexDirection = 'column';
  if(chev) chev.style.transform = open?'':'rotate(180deg)';
}

function openPaycheckDetail(id){
  const p = (window._paycheckHistory||[]).find(x=>x.id===id); if(!p) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'paycheckDetailModal';
  const totalAllocated = (p.breakdown||[]).reduce((s,b)=>s+b.amount,0);
  const billsReserve = (p.breakdown||[]).filter(b=>b.name==='Bills reserve').reduce((s,b)=>s+b.amount,0);
  const splits = (p.breakdown||[]).filter(b=>b.name!=='Bills reserve');

  modal.innerHTML = `
    <div class="modal" style="width:480px;max-height:85vh;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div>
          <div class="modal-title">Paycheck breakdown</div>
          <div style="font-size:12px;color:var(--txm);margin-top:2px">${p.source} · ${p.date}</div>
        </div>
        <button onclick="document.getElementById('paycheckDetailModal').remove()" style="background:none;border:none;cursor:pointer;color:var(--txm);font-size:20px"><i class="ti ti-x"></i></button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
        <div style="background:var(--surf2);border-radius:var(--rs);padding:12px;text-align:center">
          <div style="font-size:11px;color:var(--txm);margin-bottom:4px">Paycheck total</div>
          <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:600;color:var(--ac)">${cur}${Math.round(p.amount).toLocaleString()}</div>
        </div>
        <div style="background:var(--surf2);border-radius:var(--rs);padding:12px;text-align:center">
          <div style="font-size:11px;color:var(--txm);margin-bottom:4px">Total allocated</div>
          <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:600;color:var(--gr)">${cur}${Math.round(totalAllocated).toLocaleString()}</div>
        </div>
      </div>

      ${billsReserve>0?`
      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txm);margin-bottom:8px"><i class="ti ti-receipt" style="color:var(--rd)"></i> Bills reserved</div>
        <div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:var(--rs);padding:11px 14px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:13px;color:var(--tx)">Bills reserve</span>
          <span style="font-family:'DM Mono',monospace;font-size:14px;font-weight:600;color:var(--rd)">${cur}${Math.round(billsReserve).toLocaleString()}</span>
        </div>
      </div>`:''}

      ${splits.length?`
      <div>
        <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txm);margin-bottom:8px"><i class="ti ti-percentage" style="color:var(--ac)"></i> Splits breakdown</div>
        <div style="display:flex;flex-direction:column;gap:7px">
          ${splits.map(b=>`
            <div style="background:var(--surf2);border-radius:var(--rs);padding:11px 14px;display:flex;align-items:center;gap:10px">
              <span style="width:10px;height:10px;border-radius:3px;background:${b.color||'var(--ac)'};flex-shrink:0;display:inline-block"></span>
              <span style="font-size:13px;color:var(--tx);flex:1">${b.name}</span>
              <span style="font-size:11px;color:var(--txm);min-width:36px;text-align:right">${b.pct}%</span>
              <span style="font-family:'DM Mono',monospace;font-size:14px;font-weight:500;color:var(--tx);min-width:80px;text-align:right">${cur}${Math.round(b.amount).toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      </div>`:''}

      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--txm)">Unallocated</span>
        <span style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--tx)">${cur}${Math.round(p.amount-totalAllocated).toLocaleString()}</span>
      </div>

      <button onclick="document.getElementById('paycheckDetailModal').remove()" style="margin-top:16px;width:100%;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;padding:11px;border-radius:var(--rs);border:none;background:var(--ac);color:#fff;cursor:pointer">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function renderBillHistoryHTML(){
  const hist = window._billHistory||[];
  if(!hist.length) return '<div style="text-align:center;color:var(--txf);font-size:13px;padding:16px 0">No payment history yet</div>';
  return hist.slice(0,30).map(h=>`
    <div class="hist-entry">
      <span style="width:8px;height:8px;border-radius:2px;background:${BILL_COLORS[h.category]||'var(--ac)'};flex-shrink:0;display:inline-block"></span>
      <span style="flex:1;color:var(--tx);font-weight:500;font-size:13px">${h.name}</span>
      <span style="color:var(--txm);font-size:11px">${h.date}</span>
      <span style="font-family:'DM Mono',monospace;color:var(--gr);font-weight:500;font-size:12px">${cur}${Math.round(parseFloat(h.amount)||0).toLocaleString()}</span>
    </div>
  `).join('');
}

// ── TOGGLE BILL PAID ──
function toggleBillPaid(id){
  const b=(window._bills||[]).find(x=>x.id===id); if(!b) return;
  b.paid=!b.paid;
  if(b.paid){
    b.paidDate=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    if(!window._billHistory) window._billHistory=[];
    window._billHistory.unshift({name:b.name,amount:b.amount,category:b.category,date:b.paidDate,id:Date.now()});
    if(window._billHistory.length>100) window._billHistory=window._billHistory.slice(0,100);
    // One-time bills: remove after paying
    if(b.frequency==='once'){
      window._bills=(window._bills||[]).filter(x=>x.id!==id);
      toast(b.name+' paid and removed (one-time)');
    } else {
      toast(b.name+' marked as paid!');
    }
  } else {
    b.paidDate=null;
    toast(b.name+' marked as unpaid');
  }
  scheduleSave();
  renderBills();
  updateBillsOverviewTabs();
  if(typeof recalcSplit==='function') recalcSplit();
}

function deleteBill(id){
  if(!confirm('Delete this bill?')) return;
  window._bills=(window._bills||[]).filter(b=>b.id!==id);
  scheduleSave(); renderBills(); updateBillsOverviewTabs(); toast('Bill deleted');
}

function clearBillHistory(){
  if(!confirm('Clear all bill payment history?')) return;
  window._billHistory=[];
  scheduleSave(); renderBills(); toast('History cleared');
}

function clearPaycheckHistoryFromBills(){
  if(!confirm('Clear all paycheck history?')) return;
  window._paycheckHistory=[];
  scheduleSave(); renderBills(); toast('Paycheck history cleared');
}

// ── ADD / EDIT BILL MODAL ──
function openBillModal(id){
  const bill=id?(window._bills||[]).find(b=>b.id===id):null;
  const isEdit=!!bill;
  const modal=document.createElement('div');
  modal.className='modal-overlay'; modal.id='billModal';
  modal.innerHTML=`
    <div class="modal">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="modal-title">${isEdit?'Edit bill':'Add a bill'}</div>
        <button onclick="closeBillModal()" style="background:none;border:none;cursor:pointer;color:var(--txm);font-size:18px"><i class="ti ti-x"></i></button>
      </div>
      <div class="modal-row">
        <div class="modal-lbl">Bill name</div>
        <input class="modal-input" type="text" id="bName" placeholder="e.g. Rent, Car insurance…" value="${bill?.name||''}" autocomplete="off">
      </div>
      <div class="modal-row-2">
        <div class="modal-row">
          <div class="modal-lbl">Amount (${cur})</div>
          <input class="modal-input" type="number" id="bAmount" placeholder="0.00" value="${bill?.amount||''}" autocomplete="off">
        </div>
        <div class="modal-row">
          <div class="modal-lbl">Due day of month</div>
          <input class="modal-input" type="number" id="bDueDay" placeholder="1–31" min="1" max="31" value="${bill?.dueDay||''}" autocomplete="off">
        </div>
      </div>
      <div class="modal-row-2">
        <div class="modal-row">
          <div class="modal-lbl">Category</div>
          <select class="modal-select" id="bCat">
            ${BILL_CATS.map(c=>`<option value="${c}" ${bill?.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="modal-row">
          <div class="modal-lbl">Frequency</div>
          <select class="modal-select" id="bFreq">
            ${Object.entries(FREQ_LABELS).map(([v,l])=>`<option value="${v}" ${(bill?.frequency||'monthly')===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-lbl">Notes (optional)</div>
        <input class="modal-input" type="text" id="bNotes" placeholder="Any extra details…" value="${bill?.notes||''}" autocomplete="off">
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--bdr)">
        <div class="admin-toggle ${bill?.recurring?'on':''}" id="recurringToggle" onclick="this.classList.toggle('on')"></div>
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--tx)">Recurring bill</div>
          <div style="font-size:11px;color:var(--txm)">Auto-resets after each payment cycle</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-save" onclick="saveBill('${id||''}')"><i class="ti ti-check"></i> ${isEdit?'Save changes':'Add bill'}</button>
        <button class="modal-cancel" onclick="closeBillModal()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(()=>document.getElementById('bName').focus(),50);
}

function closeBillModal(){
  const m=document.getElementById('billModal'); if(m) m.remove();
}

function saveBill(existingId){
  const name=document.getElementById('bName').value.trim();
  const amount=document.getElementById('bAmount').value;
  const dueDay=document.getElementById('bDueDay').value;
  const category=document.getElementById('bCat').value;
  const frequency=document.getElementById('bFreq').value;
  const notes=document.getElementById('bNotes').value.trim();
  const recurring=document.getElementById('recurringToggle').classList.contains('on');

  if(!name){document.getElementById('bName').style.borderColor='var(--rd)';return;}
  if(!amount||parseFloat(amount)<=0){document.getElementById('bAmount').style.borderColor='var(--rd)';return;}
  if(!dueDay||parseInt(dueDay)<1||parseInt(dueDay)>31){document.getElementById('bDueDay').style.borderColor='var(--rd)';return;}

  if(!window._bills) window._bills=[];
  if(existingId){
    const b=window._bills.find(x=>x.id===existingId);
    if(b){b.name=name;b.amount=parseFloat(amount);b.dueDay=parseInt(dueDay);b.category=category;b.frequency=frequency;b.notes=notes;b.recurring=recurring;}
  } else {
    window._bills.push({id:'b'+Date.now(),name,amount:parseFloat(amount),dueDay:parseInt(dueDay),category,frequency,notes,recurring,paid:false,paidDate:null});
  }
  closeBillModal();
  scheduleSave();
  renderBills();
  updateBillsOverviewTabs();
  if(typeof recalcSplit==='function') recalcSplit();
  toast(existingId?'Bill updated!':'Bill added!');
}

// ── STYLES ──
function injectBillsStyles(){
  if(document.getElementById('billsStyles')) return;
  const st=document.createElement('style');
  st.id='billsStyles';
  st.textContent=`
    .bill-card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);overflow:hidden;transition:border-color .15s}
    .bill-card:hover{border-color:var(--bdrh)}
    .bill-card-hdr{padding:14px 16px;display:flex;align-items:center;gap:12px}
    .bill-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
    .bill-name{font-size:14px;font-weight:600;color:var(--tx)}
    .bill-cat{font-size:11px;color:var(--txm);margin-top:1px}
    .bill-amt{font-family:'DM Mono',monospace;font-size:18px;font-weight:500}
    .bill-actions{display:flex;gap:7px;padding:10px 16px;border-top:1px solid var(--bdr);background:var(--surf2)}
    .bill-btn{flex:1;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:7px;border-radius:6px;cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--txm);display:flex;align-items:center;justify-content:center;gap:5px}
    .bill-btn:hover{color:var(--tx);border-color:var(--bdrh)}
    .bill-btn.paid{background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3);color:var(--gr)}
    .bill-btn.del{flex:none;width:36px;padding:7px}
    .bill-btn.del:hover{background:rgba(248,113,113,.1);border-color:rgba(248,113,113,.3);color:var(--rd)}
    .add-bill-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:var(--r);border:1px dashed var(--bdrh);background:transparent;color:var(--txm);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;min-height:80px}
    .add-bill-btn:hover{border-color:var(--ac);color:var(--ac);background:var(--acd)}
    .due-badge{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:500;padding:2px 7px;border-radius:10px}
    .hist-entry{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--bdr)}
    .month-group{background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);overflow:hidden}
    .month-group-hdr{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;cursor:pointer;transition:background .15s}
    .month-group-hdr:hover{background:var(--surf)}
    .month-group-body{flex-direction:column;border-top:1px solid var(--bdr)}
    .paycheck-row{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;border-bottom:1px solid var(--bdr);transition:background .15s}
    .paycheck-row:hover{background:var(--surf)}
    .paycheck-row:last-child{border-bottom:none}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:2000;display:flex;align-items:center;justify-content:center}
    .modal{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);padding:24px;width:440px;max-width:92vw;display:flex;flex-direction:column;gap:14px}
    .modal-title{font-size:16px;font-weight:600}
    .modal-row{display:flex;flex-direction:column;gap:5px}
    .modal-lbl{font-size:12px;color:var(--txm);font-weight:500}
    .modal-input{font-family:'DM Sans',sans-serif;font-size:14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);color:var(--tx);padding:9px 12px;outline:none;width:100%}
    .modal-input:focus{border-color:var(--ac)}
    .modal-select{font-family:'DM Sans',sans-serif;font-size:14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);color:var(--tx);padding:9px 12px;outline:none;width:100%;cursor:pointer}
    .modal-row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .modal-actions{display:flex;gap:10px;margin-top:4px}
    .modal-save{flex:1;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;padding:11px;border-radius:var(--rs);border:none;background:var(--ac);color:#fff;cursor:pointer}
    .modal-save:hover{filter:brightness(1.1)}
    .modal-cancel{font-family:'DM Sans',sans-serif;font-size:14px;padding:11px 16px;border-radius:var(--rs);border:1px solid var(--bdr);background:transparent;color:var(--txm);cursor:pointer}
  `;
  document.head.appendChild(st);
}

// Start calendar tick — runs every minute
setInterval(tickCalendar, 60000);
window.addEventListener('load', ()=>{ setTimeout(()=>{ tickCalendar(); updateBillsOverviewTabs(); }, 800); });
