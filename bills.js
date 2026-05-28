// ── BILLS MANAGER ──
window._bills = [];
window._billHistory = [];

const BILL_CATS = ['Housing','Transport','Insurance','Utilities','Subscriptions','Food','Healthcare','Education','Entertainment','Other'];
const BILL_COLORS = {
  'Housing':'#60a5fa','Transport':'#fbbf24','Insurance':'#a78bfa',
  'Utilities':'#34d399','Subscriptions':'#f472b6','Food':'#fb923c',
  'Healthcare':'#f87171','Education':'#38bdf8','Entertainment':'#e879f9','Other':'#888892'
};

function refreshBillsUI() {
  const pg = document.getElementById('page-bills');
  if (pg && pg.classList.contains('active')) renderBills();
  updateBillsOverview();
}

// ── BILLS OVERVIEW (shows on Overview tab) ──
function updateBillsOverview() {
  const el = document.getElementById('billsOverviewContent'); if (!el) return;
  const bills = window._bills || [];
  if (!bills.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--txf);font-size:13px;padding:12px 0">No bills added yet</div>';
    return;
  }
  const today = new Date();
  const paid = bills.filter(b => b.paid);
  const unpaid = bills.filter(b => !b.paid);
  const totalMonthly = bills.reduce((s,b) => s + (parseFloat(b.amount)||0), 0);
  const paidAmt = paid.reduce((s,b) => s + (parseFloat(b.amount)||0), 0);
  const unpaidAmt = unpaid.reduce((s,b) => s + (parseFloat(b.amount)||0), 0);
  const pct = totalMonthly > 0 ? Math.round(paidAmt/totalMonthly*100) : 0;

  // Sort unpaid by due date
  const upcoming = unpaid.sort((a,b) => {
    const da = parseInt(a.dueDay)||1, db = parseInt(b.dueDay)||1;
    return da - db;
  }).slice(0,4);

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
      <span style="color:var(--txm)">Total monthly</span>
      <span style="font-family:'DM Mono',monospace;font-weight:500">${cur}${Math.round(totalMonthly).toLocaleString()}</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <div style="flex:1;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.2);border-radius:var(--rs);padding:8px;text-align:center">
        <div style="font-size:11px;color:var(--gr);margin-bottom:2px">Paid</div>
        <div style="font-family:'DM Mono',monospace;font-size:14px;font-weight:500;color:var(--gr)">${cur}${Math.round(paidAmt).toLocaleString()}</div>
      </div>
      <div style="flex:1;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);border-radius:var(--rs);padding:8px;text-align:center">
        <div style="font-size:11px;color:var(--rd);margin-bottom:2px">Remaining</div>
        <div style="font-family:'DM Mono',monospace;font-size:14px;font-weight:500;color:var(--rd)">${cur}${Math.round(unpaidAmt).toLocaleString()}</div>
      </div>
    </div>
    <div style="height:6px;background:var(--bdr);border-radius:3px;overflow:hidden;margin-bottom:8px">
      <div style="height:6px;background:var(--gr);border-radius:3px;width:${pct}%;transition:width .3s"></div>
    </div>
    ${upcoming.map(b => {
      const daysUntil = b.dueDay - today.getDate();
      const urgency = daysUntil <= 0 ? 'var(--rd)' : daysUntil <= 7 ? 'var(--am)' : 'var(--txm)';
      return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--bdr)">
        <span style="width:8px;height:8px;border-radius:2px;background:${BILL_COLORS[b.category]||'var(--ac)'};flex-shrink:0;display:inline-block"></span>
        <span style="font-size:13px;color:var(--tx);flex:1">${b.name}</span>
        <span style="font-size:11px;color:${urgency}">Due ${b.dueDay}${daySuffix(b.dueDay)}</span>
        <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:500">${cur}${Math.round(parseFloat(b.amount)||0).toLocaleString()}</span>
      </div>`;
    }).join('')}
  `;
}

function daySuffix(n) {
  const s = ['th','st','nd','rd'], v = n%100;
  return s[(v-20)%10]||s[v]||s[0];
}

// ── MAIN BILLS PAGE ──
function renderBills() {
  const pg = document.getElementById('page-bills'); if (!pg) return;

  // Inject styles once
  if (!document.getElementById('billsStyles')) {
    const st = document.createElement('style');
    st.id = 'billsStyles';
    st.textContent = `
      .bill-card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);overflow:hidden;transition:border-color .15s}
      .bill-card:hover{border-color:var(--bdrh)}
      .bill-card-hdr{padding:14px 16px;display:flex;align-items:center;gap:12px}
      .bill-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
      .bill-name{font-size:14px;font-weight:600;color:var(--tx)}
      .bill-cat{font-size:11px;color:var(--txm);margin-top:1px}
      .bill-amt{font-family:'DM Mono',monospace;font-size:18px;font-weight:500;margin-left:auto}
      .bill-card-body{padding:0 16px 14px;display:flex;flex-direction:column;gap:8px}
      .bill-row{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--txm)}
      .bill-actions{display:flex;gap:7px;padding:10px 16px;border-top:1px solid var(--bdr);background:var(--surf2)}
      .bill-btn{flex:1;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:7px;border-radius:6px;cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--txm);display:flex;align-items:center;justify-content:center;gap:5px}
      .bill-btn:hover{color:var(--tx);border-color:var(--bdrh)}
      .bill-btn.paid{background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3);color:var(--gr)}
      .bill-btn.del:hover{background:rgba(248,113,113,.1);border-color:rgba(248,113,113,.3);color:var(--rd)}
      .add-bill-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:var(--r);border:1px dashed var(--bdrh);background:transparent;color:var(--txm);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all .15s}
      .add-bill-btn:hover{border-color:var(--ac);color:var(--ac);background:var(--acd)}
      .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:2000;display:flex;align-items:center;justify-content:center}
      .modal{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);padding:24px;width:420px;max-width:90vw;display:flex;flex-direction:column;gap:16px}
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
      .hist-entry{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--bdr);font-size:12px}
      .due-badge{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:500;padding:2px 7px;border-radius:10px}
      @media(max-width:700px){.hist-cols{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(st);
  }

  const bills = window._bills || [];
  const today = new Date();

  // Sort: overdue first, then by due day
  const sorted = [...bills].sort((a,b) => {
    const da = parseInt(a.dueDay)||1, db = parseInt(b.dueDay)||1;
    const aOver = da < today.getDate() && !a.paid;
    const bOver = db < today.getDate() && !b.paid;
    if (aOver && !bOver) return -1;
    if (!aOver && bOver) return 1;
    return da - db;
  });

  const totalMonthly = bills.reduce((s,b) => s+(parseFloat(b.amount)||0), 0);
  const paidAmt = bills.filter(b=>b.paid).reduce((s,b) => s+(parseFloat(b.amount)||0), 0);
  const unpaidAmt = totalMonthly - paidAmt;
  const pct = totalMonthly > 0 ? Math.round(paidAmt/totalMonthly*100) : 0;

  pg.innerHTML = `
    <div class="phdr">
      <div><div class="ptitle">Bills</div><div class="psub">Manage your monthly obligations</div></div>
      <button onclick="openAddBillModal()" style="display:flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:9px 16px;border-radius:var(--rs);border:none;background:var(--ac);color:#fff;cursor:pointer"><i class="ti ti-plus"></i> Add bill</button>
    </div>

    <!-- SUMMARY ROW -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:13px">
      <div class="mc"><div class="mclbl"><i class="ti ti-receipt"></i> Total monthly</div><div class="mcval">${cur}${Math.round(totalMonthly).toLocaleString()}</div><div class="mcsub">${bills.length} bill${bills.length!==1?'s':''}</div></div>
      <div class="mc"><div class="mclbl"><i class="ti ti-circle-check" style="color:var(--gr)"></i> Paid</div><div class="mcval" style="color:var(--gr)">${cur}${Math.round(paidAmt).toLocaleString()}</div><div class="mcsub">${bills.filter(b=>b.paid).length} bill${bills.filter(b=>b.paid).length!==1?'s':''}</div></div>
      <div class="mc"><div class="mclbl"><i class="ti ti-clock" style="color:var(--am)"></i> Remaining</div><div class="mcval" style="color:var(--am)">${cur}${Math.round(unpaidAmt).toLocaleString()}</div><div class="mcsub">${bills.filter(b=>!b.paid).length} bill${bills.filter(b=>!b.paid).length!==1?'s':''}</div></div>
      <div class="mc">
        <div class="mclbl"><i class="ti ti-chart-bar"></i> Progress</div>
        <div class="mcval">${pct}%</div>
        <div style="height:4px;background:var(--bdr);border-radius:2px;margin-top:6px;overflow:hidden"><div style="height:4px;background:var(--gr);border-radius:2px;width:${pct}%;transition:width .3s"></div></div>
      </div>
    </div>

    <!-- BILLS GRID -->
    <div id="billsGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
      ${sorted.length ? sorted.map(b => buildBillCard(b, today)).join('') : ''}
      <button class="add-bill-btn" onclick="openAddBillModal()"><i class="ti ti-plus"></i> Add a bill</button>
    </div>

    <!-- HISTORY ROW -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

      <!-- BILL PAYMENT HISTORY -->
      <div class="cc">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
          <div class="cctitle">Bill payment history</div>
          <button onclick="clearBillHistory()" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--txf)">Clear</button>
        </div>
        <div class="ccsub">All recorded bill payments</div>
        <div id="billHistoryList" style="max-height:340px;overflow-y:auto">
          ${renderBillHistoryHTML()}
        </div>
      </div>

      <!-- PAYCHECK HISTORY (fully expanded) -->
      <div class="cc">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
          <div class="cctitle">Paycheck history</div>
          <button onclick="clearPaycheckHistory()" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--txf)">Clear</button>
        </div>
        <div class="ccsub">Full breakdown of every saved paycheck</div>
        <div id="billsPaycheckHistory" style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:12px">
          ${renderPaycheckHistoryExpanded()}
        </div>
      </div>

    </div>
  `;
}

function buildBillCard(b, today) {
  const daysUntil = parseInt(b.dueDay) - today.getDate();
  const isOverdue = daysUntil < 0 && !b.paid;
  const isDueSoon = daysUntil >= 0 && daysUntil <= 7 && !b.paid;
  const color = BILL_COLORS[b.category] || 'var(--ac)';
  const urgencyColor = b.paid ? 'var(--gr)' : isOverdue ? 'var(--rd)' : isDueSoon ? 'var(--am)' : 'var(--txm)';
  const badgeBg = b.paid ? 'rgba(52,211,153,.1)' : isOverdue ? 'rgba(248,113,113,.1)' : isDueSoon ? 'rgba(251,191,36,.1)' : 'rgba(255,255,255,.05)';
  const badgeLabel = b.paid ? 'Paid' : isOverdue ? 'Overdue' : isDueSoon ? `Due in ${daysUntil}d` : `Due ${b.dueDay}${daySuffix(parseInt(b.dueDay))}`;

  return `<div class="bill-card" id="bcard-${b.id}">
    <div class="bill-card-hdr">
      <div class="bill-icon" style="background:${color}22;color:${color}">
        <i class="ti ${billIcon(b.category)}"></i>
      </div>
      <div style="flex:1">
        <div class="bill-name">${b.name}</div>
        <div class="bill-cat">${b.category}</div>
      </div>
      <div style="text-align:right">
        <div class="bill-amt">${cur}${Math.round(parseFloat(b.amount)||0).toLocaleString()}</div>
        <div class="due-badge" style="background:${badgeBg};color:${urgencyColor}">${badgeLabel}</div>
      </div>
    </div>
    <div class="bill-card-body">
      ${b.notes ? `<div class="bill-row"><span>${b.notes}</span></div>` : ''}
      <div class="bill-row">
        <span>Due every month</span>
        <span>Day ${b.dueDay} of the month</span>
      </div>
      ${b.paid && b.paidDate ? `<div class="bill-row" style="color:var(--gr)"><span><i class="ti ti-circle-check"></i> Paid on ${b.paidDate}</span></div>` : ''}
    </div>
    <div class="bill-actions">
      <button class="bill-btn ${b.paid ? 'paid' : ''}" onclick="toggleBillPaid('${b.id}')">
        <i class="ti ${b.paid ? 'ti-circle-check' : 'ti-circle'}"></i>
        ${b.paid ? 'Paid' : 'Mark paid'}
      </button>
      <button class="bill-btn" onclick="openEditBillModal('${b.id}')"><i class="ti ti-edit"></i> Edit</button>
      <button class="bill-btn del" onclick="deleteBill('${b.id}')"><i class="ti ti-trash"></i> Delete</button>
    </div>
  </div>`;
}

function billIcon(cat) {
  const icons = {'Housing':'ti-home','Transport':'ti-car','Insurance':'ti-shield','Utilities':'ti-bolt','Subscriptions':'ti-refresh','Food':'ti-soup','Healthcare':'ti-heart','Education':'ti-book','Entertainment':'ti-device-tv','Other':'ti-receipt'};
  return icons[cat] || 'ti-receipt';
}

function renderBillHistoryHTML() {
  const hist = window._billHistory || [];
  if (!hist.length) return '<div style="text-align:center;color:var(--txf);font-size:13px;padding:16px 0">No payment history yet</div>';
  return hist.slice(0,30).map(h =>
    `<div class="hist-entry">
      <span style="width:8px;height:8px;border-radius:2px;background:${BILL_COLORS[h.category]||'var(--ac)'};flex-shrink:0;display:inline-block"></span>
      <span style="flex:1;color:var(--tx);font-weight:500">${h.name}</span>
      <span style="color:var(--txm)">${h.date}</span>
      <span style="font-family:'DM Mono',monospace;color:var(--gr);font-weight:500">${cur}${Math.round(parseFloat(h.amount)||0).toLocaleString()}</span>
    </div>`
  ).join('');
}

function toggleBillPaid(id) {
  const b = (window._bills||[]).find(x => x.id === id); if (!b) return;
  b.paid = !b.paid;
  if (b.paid) {
    b.paidDate = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    // Add to history
    if (!window._billHistory) window._billHistory = [];
    window._billHistory.unshift({name:b.name, amount:b.amount, category:b.category, date:b.paidDate, id:Date.now()});
    if (window._billHistory.length > 100) window._billHistory = window._billHistory.slice(0,100);
    toast(b.name+' marked as paid!');
  } else {
    b.paidDate = null;
    toast(b.name+' marked as unpaid');
  }
  scheduleSave();
  renderBills();
  updateBillsOverview();
  if (typeof recalcSplit === 'function') recalcSplit();
}

function deleteBill(id) {
  if (!confirm('Delete this bill?')) return;
  window._bills = (window._bills||[]).filter(b => b.id !== id);
  scheduleSave();
  renderBills();
  updateBillsOverview();
  toast('Bill deleted');
}

function clearBillHistory() {
  if (!confirm('Clear all bill payment history?')) return;
  window._billHistory = [];
  scheduleSave();
  renderBills();
  toast('History cleared');
}

function clearPaycheckHistory() {
  if (!confirm('Clear all paycheck history?')) return;
  window._paycheckHistory = [];
  scheduleSave();
  renderBills();
  toast('Paycheck history cleared');
}

function renderPaycheckHistoryExpanded() {
  const hist = window._paycheckHistory || [];
  if (!hist.length) return '<div style="text-align:center;color:var(--txf);font-size:13px;padding:16px 0">No paychecks saved yet</div>';

  return hist.slice(0, 20).map(p => {
    const billsInBreakdown = p.breakdown.filter(b => b.name === 'Bills reserve');
    const splits = p.breakdown.filter(b => b.name !== 'Bills reserve');

    return `<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--rs);overflow:hidden">
      <!-- Paycheck header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid var(--bdr);background:var(--surf)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--tx)">${p.source}</div>
          <div style="font-size:11px;color:var(--txm);margin-top:1px">${p.date}</div>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:17px;font-weight:600;color:var(--ac)">${cur}${Math.round(p.amount).toLocaleString()}</div>
      </div>
      <!-- Full breakdown always visible -->
      <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px">
        ${p.breakdown.map(b => `
          <div style="display:flex;align-items:center;gap:9px">
            <span style="width:8px;height:8px;border-radius:2px;background:${b.color||'var(--ac)'};flex-shrink:0;display:inline-block"></span>
            <span style="font-size:13px;color:var(--tx);flex:1">${b.name}</span>
            <span style="font-size:11px;color:var(--txm);min-width:30px;text-align:right">${b.pct}%</span>
            <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:var(--tx);min-width:70px;text-align:right">${cur}${Math.round(b.amount).toLocaleString()}</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid var(--bdr);margin-top:2px">
          <span style="font-size:12px;font-weight:600;color:var(--tx)">Total allocated</span>
          <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;color:var(--ac)">
            ${cur}${Math.round(p.breakdown.reduce((s,b)=>s+b.amount,0)).toLocaleString()}
          </span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── ADD / EDIT MODAL ──
function openAddBillModal(id) {
  const bill = id ? (window._bills||[]).find(b=>b.id===id) : null;
  const isEdit = !!bill;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'billModal';
  modal.innerHTML = `
    <div class="modal">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="modal-title">${isEdit ? 'Edit bill' : 'Add a bill'}</div>
        <button onclick="closeBillModal()" style="background:none;border:none;cursor:pointer;color:var(--txm);font-size:18px"><i class="ti ti-x"></i></button>
      </div>
      <div class="modal-row">
        <div class="modal-lbl">Bill name</div>
        <input class="modal-input" type="text" id="bName" placeholder="e.g. Rent, Car insurance…" value="${bill?.name||''}" autocomplete="off">
      </div>
      <div class="modal-row-2">
        <div class="modal-row">
          <div class="modal-lbl">Amount</div>
          <input class="modal-input" type="number" id="bAmount" placeholder="0.00" value="${bill?.amount||''}" autocomplete="off">
        </div>
        <div class="modal-row">
          <div class="modal-lbl">Due day of month</div>
          <input class="modal-input" type="number" id="bDueDay" placeholder="1–31" min="1" max="31" value="${bill?.dueDay||''}" autocomplete="off">
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-lbl">Category</div>
        <select class="modal-select" id="bCat">
          ${BILL_CATS.map(c=>`<option value="${c}" ${bill?.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="modal-row">
        <div class="modal-lbl">Notes (optional)</div>
        <input class="modal-input" type="text" id="bNotes" placeholder="Any extra details…" value="${bill?.notes||''}" autocomplete="off">
      </div>
      <div class="modal-actions">
        <button class="modal-save" onclick="saveBill('${id||''}')"><i class="ti ti-check"></i> ${isEdit?'Save changes':'Add bill'}</button>
        <button class="modal-cancel" onclick="closeBillModal()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(()=>document.getElementById('bName').focus(), 50);
}

function openEditBillModal(id) { openAddBillModal(id); }

function closeBillModal() {
  const m = document.getElementById('billModal');
  if (m) m.remove();
}

function saveBill(existingId) {
  const name = document.getElementById('bName').value.trim();
  const amount = document.getElementById('bAmount').value;
  const dueDay = document.getElementById('bDueDay').value;
  const category = document.getElementById('bCat').value;
  const notes = document.getElementById('bNotes').value.trim();

  if (!name) { document.getElementById('bName').style.borderColor='var(--rd)'; return; }
  if (!amount || parseFloat(amount) <= 0) { document.getElementById('bAmount').style.borderColor='var(--rd)'; return; }
  if (!dueDay || parseInt(dueDay) < 1 || parseInt(dueDay) > 31) { document.getElementById('bDueDay').style.borderColor='var(--rd)'; return; }

  if (!window._bills) window._bills = [];

  if (existingId) {
    const b = window._bills.find(x=>x.id===existingId);
    if (b) { b.name=name; b.amount=parseFloat(amount); b.dueDay=parseInt(dueDay); b.category=category; b.notes=notes; }
  } else {
    window._bills.push({ id: 'b'+Date.now(), name, amount:parseFloat(amount), dueDay:parseInt(dueDay), category, notes, paid:false, paidDate:null });
  }

  closeBillModal();
  scheduleSave();
  renderBills();
  updateBillsOverview();
  if (typeof recalcSplit === 'function') recalcSplit();
  toast(existingId ? 'Bill updated!' : 'Bill added!');
}

// Init
window.addEventListener('load', ()=>{
  setTimeout(updateBillsOverview, 500);
});
