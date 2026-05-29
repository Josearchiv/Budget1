// ── HISTORY TAB — fully synced with overview ──

function renderHistory() {
  const pg = document.getElementById('page-history'); if (!pg) return;
  injectHistoryStyles();

  const today = new Date();
  const curMonthLabel = today.toLocaleDateString('en-US',{month:'long',year:'numeric'});

  const curPaychecks = (window._paycheckHistory||[]).filter(p=>{
    const d=new Date(p.ts||p.date);
    return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear();
  });
  const curBillPmts = (window._billHistory||[]).filter(h=>{
    const d=new Date(h.date);
    return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear();
  });

  const curIncome  = curPaychecks.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const curBillAmt = curBillPmts.reduce((s,h)=>s+(parseFloat(h.amount)||0),0);
  const archive    = window._monthlyArchive||[];

  pg.innerHTML = `
    <div class="phdr">
      <div><div class="ptitle">History</div><div class="psub">Complete financial record — all data synced live</div></div>
    </div>

    <!-- CURRENT MONTH -->
    <div class="cc">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
        <div class="cctitle">${curMonthLabel}</div>
        <span class="badge bg" style="display:flex;align-items:center;gap:4px"><i class="ti ti-circle-filled" style="font-size:8px"></i> Live</span>
      </div>
      <div class="ccsub">Everything recorded so far this month — deletions sync everywhere instantly</div>

      <!-- Summary cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0">
        <div style="background:var(--surf2);border-radius:var(--rs);padding:13px;text-align:center">
          <div style="font-size:10px;color:var(--txm);margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em">Income</div>
          <div style="font-family:'DM Mono',monospace;font-size:20px;font-weight:600;color:var(--ac)">${cur}${Math.round(curIncome).toLocaleString()}</div>
          <div style="font-size:11px;color:var(--txm);margin-top:2px">${curPaychecks.length} paycheck${curPaychecks.length!==1?'s':''}</div>
        </div>
        <div style="background:var(--surf2);border-radius:var(--rs);padding:13px;text-align:center">
          <div style="font-size:10px;color:var(--txm);margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em">Bills paid</div>
          <div style="font-family:'DM Mono',monospace;font-size:20px;font-weight:600;color:var(--rd)">${cur}${Math.round(curBillAmt).toLocaleString()}</div>
          <div style="font-size:11px;color:var(--txm);margin-top:2px">${curBillPmts.length} payment${curBillPmts.length!==1?'s':''}</div>
        </div>
        <div style="background:var(--surf2);border-radius:var(--rs);padding:13px;text-align:center">
          <div style="font-size:10px;color:var(--txm);margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em">Remaining</div>
          <div style="font-family:'DM Mono',monospace;font-size:20px;font-weight:600;color:var(--gr)">${cur}${Math.round(curIncome-curBillAmt).toLocaleString()}</div>
          <div style="font-size:11px;color:var(--txm);margin-top:2px">after bills</div>
        </div>
      </div>

      <!-- Paychecks -->
      ${curPaychecks.length ? `
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txf);margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <i class="ti ti-briefcase" style="color:var(--ac)"></i> Paychecks
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${curPaychecks.sort((a,b)=>(b.ts||0)-(a.ts||0)).map(p=>histPaycheckRow(p)).join('')}
        </div>
      </div>` : ''}

      <!-- Bill payments -->
      ${curBillPmts.length ? `
      <div>
        <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txf);margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <i class="ti ti-receipt" style="color:var(--rd)"></i> Bill payments
        </div>
        <div style="display:flex;flex-direction:column;gap:0">
          ${curBillPmts.map(h=>histBillRow(h)).join('')}
        </div>
      </div>` : ''}

      ${!curPaychecks.length && !curBillPmts.length ? `
        <div style="text-align:center;color:var(--txf);font-size:13px;padding:20px 0">
          <div style="font-size:28px;margin-bottom:8px">📭</div>
          Nothing recorded yet this month
        </div>` : ''}
    </div>

    <!-- ARCHIVED MONTHS -->
    ${archive.length ? `
    <div>
      <div class="cctitle" style="margin-bottom:12px">Previous months</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${archive.map(a=>buildArchiveMonth(a)).join('')}
      </div>
    </div>` : ''}

    ${!archive.length && !curPaychecks.length && !curBillPmts.length ? `
    <div class="cc" style="text-align:center;padding:40px 20px">
      <div style="font-size:40px;margin-bottom:12px">📊</div>
      <div style="font-size:15px;font-weight:600;color:var(--tx);margin-bottom:6px">No history yet</div>
      <div style="font-size:13px;color:var(--txm)">Save a paycheck or mark a bill as paid to start building your history</div>
    </div>` : ''}
  `;
}

function histPaycheckRow(p){
  return `<div class="hist-paycheck-row" onclick="openPaycheckDetail('${p.id}')">
    <div style="display:flex;align-items:center;gap:10px;flex:1">
      <div class="hist-paycheck-icon"><i class="ti ti-briefcase"></i></div>
      <div>
        <div style="font-size:13px;font-weight:500;color:var(--tx)">${p.source}</div>
        <div style="font-size:11px;color:var(--txm)">${p.date}</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-family:'DM Mono',monospace;font-size:14px;font-weight:600;color:var(--ac)">${cur}${Math.round(p.amount).toLocaleString()}</span>
      <button onclick="event.stopPropagation();confirmDeletePaycheck('${p.id}')"
        style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);border-radius:5px;cursor:pointer;color:var(--rd);font-size:11px;padding:4px 8px;font-family:'DM Sans',sans-serif">
        <i class="ti ti-trash"></i>
      </button>
      <i class="ti ti-chevron-right" style="color:var(--txm);font-size:13px"></i>
    </div>
  </div>`;
}

function histBillRow(h){
  const color = (typeof BILL_COLORS!=='undefined'?BILL_COLORS:{})[h.category]||'var(--ac)';
  return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--bdr)">
    <span style="width:8px;height:8px;border-radius:2px;background:${color};flex-shrink:0;display:inline-block"></span>
    <div style="flex:1">
      <div style="font-size:13px;font-weight:500;color:var(--tx)">${h.name}</div>
      <div style="font-size:11px;color:var(--txm)">${h.date}</div>
    </div>
    <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:var(--gr)">${cur}${Math.round(parseFloat(h.amount)||0).toLocaleString()}</span>
    <button onclick="confirmDeleteBillPayment('${h.id}')"
      style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);border-radius:5px;cursor:pointer;color:var(--rd);font-size:11px;padding:4px 8px;font-family:'DM Sans',sans-serif">
      <i class="ti ti-trash"></i>
    </button>
  </div>`;
}

function confirmDeletePaycheck(id){
  if(!confirm('Delete this paycheck from history? This cannot be undone.')) return;
  deletePaycheck(id);
}

function confirmDeleteBillPayment(id){
  if(!confirm('Delete this bill payment from history?')) return;
  deleteBillPayment(id);
}

function buildArchiveMonth(a){
  const incomeTotal = (a.paychecks||[]).reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const billTotal   = (a.billHistory||[]).reduce((s,h)=>s+(parseFloat(h.amount)||0),0);

  return `<div class="hist-month-card">
    <div class="hist-month-hdr" onclick="toggleHistMonth('${a.key}')">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="hist-month-icon"><i class="ti ti-calendar"></i></div>
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--tx)">${a.label}</div>
          <div style="font-size:11px;color:var(--txm);margin-top:1px">${(a.paychecks||[]).length} paycheck${(a.paychecks||[]).length!==1?'s':''} · ${(a.billHistory||[]).length} bill payment${(a.billHistory||[]).length!==1?'s':''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="text-align:right">
          <div style="font-family:'DM Mono',monospace;font-size:14px;font-weight:600;color:var(--ac)">${cur}${Math.round(incomeTotal).toLocaleString()}</div>
          <div style="font-size:10px;color:var(--txm)">income</div>
        </div>
        <i class="ti ti-chevron-down" id="hchev-${a.key}" style="color:var(--txm);font-size:14px;transition:transform .2s"></i>
      </div>
    </div>
    <div id="hm-${a.key}" style="display:none;padding:16px;border-top:1px solid var(--bdr)">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        <div style="background:var(--surf2);border-radius:var(--rs);padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--txm);margin-bottom:3px">Income</div>
          <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--ac)">${cur}${Math.round(incomeTotal).toLocaleString()}</div>
        </div>
        <div style="background:var(--surf2);border-radius:var(--rs);padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--txm);margin-bottom:3px">Bills paid</div>
          <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--rd)">${cur}${Math.round(billTotal).toLocaleString()}</div>
        </div>
        <div style="background:var(--surf2);border-radius:var(--rs);padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--txm);margin-bottom:3px">Remaining</div>
          <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--gr)">${cur}${Math.round(incomeTotal-billTotal).toLocaleString()}</div>
        </div>
      </div>
      ${(a.paychecks||[]).length ? `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txf);margin-bottom:8px">Paychecks</div>
        ${(a.paychecks||[]).sort((x,y)=>(y.ts||0)-(x.ts||0)).map(p=>histPaycheckRow(p)).join('')}
      </div>` : ''}
      ${(a.billHistory||[]).length ? `
      <div>
        <div style="font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--txf);margin-bottom:8px">Bill payments</div>
        ${(a.billHistory||[]).map(h=>histBillRow(h)).join('')}
      </div>` : ''}
    </div>
  </div>`;
}

function toggleHistMonth(key){
  const body=document.getElementById('hm-'+key);
  const chev=document.getElementById('hchev-'+key);
  if(!body) return;
  const open=body.style.display!=='none'&&body.style.display!=='';
  body.style.display=open?'none':'block';
  if(chev) chev.style.transform=open?'':'rotate(180deg)';
}

function injectHistoryStyles(){
  if(document.getElementById('historyStyles')) return;
  const st=document.createElement('style');
  st.id='historyStyles';
  st.textContent=`
    .hist-month-card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);overflow:hidden}
    .hist-month-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;cursor:pointer;transition:background .15s}
    .hist-month-hdr:hover{background:var(--surf2)}
    .hist-month-icon{width:36px;height:36px;border-radius:9px;background:var(--acd);border:1px solid var(--acb);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--ac);flex-shrink:0}
    .hist-paycheck-row{display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--bdr);cursor:pointer;border-radius:var(--rs);transition:background .15s;margin-bottom:2px}
    .hist-paycheck-row:hover{background:var(--surf2)}
    .hist-paycheck-icon{width:32px;height:32px;border-radius:8px;background:var(--acd);border:1px solid var(--acb);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;color:var(--ac)}
  `;
  document.head.appendChild(st);
}
