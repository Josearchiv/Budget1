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
  if(pg && pg.classList.contains('active')){
    // Update cycle paid list in place if possible
    const cyclePaid = document.getElementById('cyclePaidList');
    if(cyclePaid) cyclePaid.innerHTML = renderCyclePaidBills();
    else renderBills();
  }
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
