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

    <!-- CYCLE HISTORY (merged bill payments + unpay) -->
    <div class="cc">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
        <div class="cctitle">This cycle — paid bills</div>
        <button onclick="clearBillHistory()" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--txf)">Clear cycle</button>
      </div>
      <div class="ccsub">Live view of bills paid this month — click to unpay</div>
      <div style="display:flex;flex-direction:column;gap:0" id="cyclePaidList">
        ${renderCyclePaidBills()}
      </div>
    </div>

    <!-- PAYCHECK HISTORY — month grouped -->
    <div class="cc">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
        <div class="cctitle">Paycheck history</div>
        <button onclick="clearPaycheckHistoryFromBills()" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--txf)">Clear</button>
      </div>
      <div class="ccsub">Tap a month to expand · tap a paycheck for full detail</div>
      <div style="display:flex;flex-direction:column;gap:6px" id="paycheckMonthGroups">
        ${renderPaycheckMonthGroups()}
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
