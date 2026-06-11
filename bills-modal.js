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
  // kept for history.js compatibility
  return renderCyclePaidBills();
}

function renderCyclePaidBills(){
  const today = new Date();
  const hist = (window._billHistory||[]).filter(h=>{
    const d = new Date(h.date);
    return d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear();
  });
  if(!hist.length) return '<div style="text-align:center;color:var(--txf);font-size:13px;padding:16px 0">No bills paid yet this cycle</div>';
  return hist.map(h=>`
    <div class="hist-entry" style="padding:9px 0">
      <span style="width:8px;height:8px;border-radius:2px;background:${BILL_COLORS[h.category]||'var(--ac)'};flex-shrink:0;display:inline-block"></span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500;color:var(--tx)">${h.name}</div>
        <div style="font-size:11px;color:var(--txm)">${h.date}</div>
      </div>
      <span style="font-family:'DM Mono',monospace;color:var(--gr);font-weight:500;font-size:13px">${cur}${Math.round(parseFloat(h.amount)||0).toLocaleString()}</span>
      <button onclick="unpayBill('${h.billId||''}','${h.id}')" title="Unpay this bill"
        style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);border-radius:5px;cursor:pointer;color:var(--rd);font-size:11px;padding:3px 8px;font-family:'DM Sans',sans-serif;white-space:nowrap">
        <i class="ti ti-arrow-back-up"></i> Unpay
      </button>
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
    window._billHistory.unshift({name:b.name,amount:b.amount,category:b.category,date:b.paidDate,id:Date.now(),billId:b.id});
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

function unpayBill(billId, histId){
  // Remove from bill history
  window._billHistory = (window._billHistory||[]).filter(h=>String(h.id)!==String(histId));
  // Find the bill and mark as unpaid
  const b = (window._bills||[]).find(x=>x.id===billId);
  if(b){ b.paid=false; b.paidDate=null; }
  scheduleSave();
  renderBills();
  updateBillsOverviewTabs();
  if(typeof updateBillsOverview==='function') updateBillsOverview();
  toast('Bill marked as unpaid');
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
        <div class="modal-row" id="dueDayRow">
          <div class="modal-lbl" id="dueDayLbl">Due day of month</div>
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
          <select class="modal-select" id="bFreq" onchange="updateDueDayVisibility()">
            ${Object.entries(FREQ_LABELS).map(([v,l])=>`<option value="${v}" ${(bill?.frequency||'monthly')===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-row">
        <div class="modal-lbl">Notes (optional)</div>
        <input class="modal-input" type="text" id="bNotes" placeholder="Any extra details…" value="${bill?.notes||''}" autocomplete="off">
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid var(--bdr)">
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--tx)">Recurring bill</div>
          <div style="font-size:11px;color:var(--txm)">Auto-resets after each payment cycle</div>
        </div>
        <div id="recurringToggle" onclick="toggleRecurring(this)"
          style="width:44px;height:24px;border-radius:12px;background:${bill?.recurring?'var(--ac)':'var(--surf2)'};border:1px solid ${bill?.recurring?'var(--ac)':'var(--bdr)'};cursor:pointer;position:relative;transition:all .2s;flex-shrink:0"
          data-on="${bill?.recurring?'true':'false'}">
          <div style="position:absolute;top:3px;left:${bill?.recurring?'21px':'3px'};width:16px;height:16px;border-radius:50%;background:${bill?.recurring?'#fff':'var(--txm)'};transition:all .2s"></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-save" onclick="saveBill('${id||''}')"><i class="ti ti-check"></i> ${isEdit?'Save changes':'Add bill'}</button>
        <button class="modal-cancel" onclick="closeBillModal()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(()=>{ document.getElementById('bName').focus(); updateDueDayVisibility(); },50);
}

function toggleRecurring(el){
  const on = el.dataset.on !== 'true';
  el.dataset.on = on ? 'true' : 'false';
  el.style.background = on ? 'var(--ac)' : 'var(--surf2)';
  el.style.borderColor = on ? 'var(--ac)' : 'var(--bdr)';
  const thumb = el.querySelector('div');
  if(thumb){
    thumb.style.left = on ? '21px' : '3px';
    thumb.style.background = on ? '#fff' : 'var(--txm)';
  }
  // Show/hide due day based on recurring + frequency
  updateDueDayVisibility();
}

function updateDueDayVisibility(){
  const row = document.getElementById('dueDayRow');
  const lbl = document.getElementById('dueDayLbl');
  const inp = document.getElementById('bDueDay');
  const freqEl = document.getElementById('bFreq');
  const recurringEl = document.getElementById('recurringToggle');
  if(!row || !freqEl || !recurringEl) return;

  const isRecurring = recurringEl.dataset.on === 'true';
  const freq2 = freqEl.value;

  // Monthly and one-time bills always need a due day
  // Daily/weekly/biweekly recurring bills don't need one
  const needsDueDay = !isRecurring || freq2 === 'monthly' || freq2 === 'once';

  row.style.opacity = needsDueDay ? '1' : '0.4';
  if(lbl) lbl.textContent = needsDueDay ? 'Due day of month' : 'Due day (optional for this frequency)';
  if(inp){
    inp.required = needsDueDay;
    inp.style.borderColor = needsDueDay ? '' : 'var(--bdr)';
  }
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
  const recurring=document.getElementById('recurringToggle').dataset.on==='true';

  if(!name){document.getElementById('bName').style.borderColor='var(--rd)';return;}
  if(!amount||parseFloat(amount)<=0){document.getElementById('bAmount').style.borderColor='var(--rd)';return;}
  const recurringOn = document.getElementById('recurringToggle').dataset.on==='true';
  const needsDueDay2 = !recurringOn || frequency==='monthly' || frequency==='once';
  if(needsDueDay2 && (!dueDay||parseInt(dueDay)<1||parseInt(dueDay)>31)){
    document.getElementById('bDueDay').style.borderColor='var(--rd)'; return;
  }
  const finalDueDay = dueDay ? parseInt(dueDay) : 1;

  if(!window._bills) window._bills=[];
  if(existingId){
    const b=window._bills.find(x=>x.id===existingId);
    if(b){b.name=name;b.amount=parseFloat(amount);b.dueDay=finalDueDay;b.category=category;b.frequency=frequency;b.notes=notes;b.recurring=recurring;}
  } else {
    window._bills.push({id:'b'+Date.now(),name,amount:parseFloat(amount),dueDay:finalDueDay,category,frequency,notes,recurring,paid:false,paidDate:null});
  }
  closeBillModal();
  scheduleSave();
  renderBills();
  updateBillsOverviewTabs();
  if(typeof recalcSplit==='function') recalcSplit();
  toast(existingId?'Bill updated!':'Bill added!');
}

// ── STYLES ──
