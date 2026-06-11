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
