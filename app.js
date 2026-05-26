// ── FIREBASE INIT ──
const firebaseConfig = {
  apiKey: "AIzaSyBXMytCm5WcOesnU9Wnq4tdZhym64_HYVc",
  authDomain: "my-budget-2e588.firebaseapp.com",
  projectId: "my-budget-2e588",
  storageBucket: "my-budget-2e588.firebasestorage.app",
  messagingSenderId: "146994126291",
  appId: "1:146994126291:web:cccf787924bd10c78de326"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ── STATE ──
const DEFCATS   = [{name:'Housing',pct:30},{name:'Food & groceries',pct:15},{name:'Transport',pct:10},{name:'Savings',pct:20},{name:'Entertainment',pct:10},{name:'Healthcare',pct:5},{name:'Clothing',pct:5},{name:'Other',pct:5}];
const DEFCOLORS = ['#E8472A','#34d399','#fbbf24','#60a5fa','#f472b6','#a78bfa','#fb923c','#38bdf8','#4ade80','#e879f9'];
const ACCENTS   = ['#E8472A','#7c6cfa','#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#f97316'];
const AIKEY     = 'budget_ai_key';

let cats    = DEFCATS.map(c=>({...c}));
let colors  = [...DEFCOLORS];
let baseMo  = 5000;
let freq    = 'monthly';
let cur     = '$';
let period  = 'monthly';
let myChart = null;
let splitterChart = null; // shared with income.js
let isLight = false;
let passcode= '1234';
let pcEntry = '';
let newN    = 0;
let chatOpen= false;
let chatHist= [];
let aiBusy  = false;
let currentUser = null;
let unsub   = null;
let saveTimer = null;

// ── UTILS ──
const f = n => cur + Math.round(n).toLocaleString();
const totPct = () => cats.reduce((s,c)=>s+(+c.pct||0),0);
const pMult  = () => period==='quarterly'?3:period==='yearly'?12:1;
const biwk   = m => m*12/26;
const dispInc= () => freq==='biweekly'?biwk(baseMo):freq==='yearly'?baseMo*12:baseMo;

// ── PAGES ──
function showPage(id, btn) {
  // Clean up splitter chart when navigating away from splitter
  if(id !== 'splitter' && splitterChart){
    splitterChart.destroy(); splitterChart = null;
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ntab').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  if(btn) btn.classList.add('active');
  if(id==='splitter') renderSplitter();
}

// ── THEME ──
function toggleTheme(){ isLight=!isLight; document.body.classList.toggle('light',isLight); toast(isLight?'Light mode':'Dark mode'); }

// ── INCOME ──
function onIncType(v){
  const n=parseFloat(v.replace(/,/g,''))||0;
  baseMo = freq==='biweekly'?n*26/12:freq==='yearly'?n/12:n;
  updateDash();
}
function setFreq(f2,btn){
  freq=f2;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const el=document.getElementById('incInput');
  if(document.activeElement!==el) el.value=Math.round(dispInc()).toLocaleString();
  updateDash();
}
function setPeriod(v){ period=v; updateDash(); }
function syncIncSub(){
  const mo=baseMo,bi=biwk(mo),yr=mo*12;
  const s = freq==='monthly'?'= '+f(bi)+' bi-weekly \xb7 '+f(yr)+'/yr':freq==='biweekly'?'= '+f(mo)+'/mo \xb7 '+f(yr)+'/yr':'= '+f(mo)+'/mo \xb7 '+f(bi)+' bi-weekly';
  document.getElementById('isub').textContent=s;
}

// ── CAT LIST ──
function buildCatList(){
  const el=document.getElementById('catList'); el.innerHTML='';
  cats.forEach((c,i)=>{
    const co=colors[i%colors.length];
    const wrap=document.createElement('div'); wrap.className='citem';
    wrap.innerHTML='<div class="ctop"><span class="cswatch" id="csw'+i+'" style="background:'+co+'"></span><input class="cname" id="cn'+i+'" type="text" value="'+c.name+'" autocomplete=\"off\"><div class="cpwrap"><input class="cpct" id="cp'+i+'" type="number" min="0" max="200" value="'+c.pct+'" autocomplete=\"off\"><span class="cpsym">%</span></div><button class="cdel" data-i="'+i+'"><i class="ti ti-x"></i></button></div><div class="cbarbg"><div class="cbarfill" id="cbf'+i+'" style="width:0%;background:'+co+'"></div></div><div class="camt" id="ca'+i+'"></div>';
    el.appendChild(wrap);
    document.getElementById('cn'+i).addEventListener('input', function(){ cats[i].name=this.value; updateDash(); });
    document.getElementById('cp'+i).addEventListener('input', function(){ cats[i].pct=parseFloat(this.value)||0; updateDash(); });
    wrap.querySelector('.cdel').addEventListener('click', ()=>removeCat(i));
  });
}
function updateCatBars(){
  const mult=pMult();
  cats.forEach((c,i)=>{
    const pct=parseFloat(c.pct)||0, amt=baseMo*pct/100;
    const bar=document.getElementById('cbf'+i), amtEl=document.getElementById('ca'+i);
    if(bar) bar.style.width=Math.min(pct,100)+'%';
    if(amtEl) amtEl.textContent=f(amt*mult);
  });
}
function addCat(){
  newN++; cats.push({name:'Category '+newN,pct:0}); colors.push(DEFCOLORS[newN%DEFCOLORS.length]);
  if(myChart){myChart.destroy();myChart=null;}
  buildCatList(); updateDash(); rebuildACatList(); rebuildCatColList();
  setTimeout(()=>{const ins=document.querySelectorAll('.cname');if(ins.length)ins[ins.length-1].focus();},50);
}
function removeCat(i){
  cats.splice(i,1); colors.splice(i,1);
  if(myChart){myChart.destroy();myChart=null;}
  buildCatList(); updateDash(); rebuildACatList(); rebuildCatColList();
}

// ── MAIN RENDER ──
function updateDash(){
  const el=document.getElementById('incInput');
  if(document.activeElement!==el) el.value=Math.round(dispInc()).toLocaleString();
  syncIncSub();
  const inc=baseMo, mult=pMult(), tot=totPct(), alloc=inc*tot/100, free=inc-alloc;
  document.getElementById('mcInc').textContent=f(inc*mult);
  document.getElementById('mcSub').textContent=period==='monthly'?'Per month':period==='quarterly'?'Per quarter':'Per year';
  document.getElementById('mcAlloc').textContent=f(alloc*mult);
  const b=document.getElementById('mcBadge'); b.textContent=Math.round(tot)+'%'; b.className='badge '+(tot>100?'br':tot===100?'bg':'ba');
  document.getElementById('mcFree').textContent=f(free*mult);
  document.getElementById('mcAnn').textContent=f(inc*12);
  document.getElementById('sPct').textContent=Math.round(tot)+'%';
  document.getElementById('sBar').style.width=Math.min(tot,100)+'%';
  document.getElementById('sBar').style.background=tot>100?'var(--rd)':tot>=95?'var(--gr)':'var(--am)';
  document.getElementById('sLbl').textContent=tot>100?'Over budget!':tot===100?'Fully allocated':Math.round(100-tot)+'% unallocated';
  document.getElementById('sBadge').innerHTML='<span class="badge '+(tot>100?'br':tot>=95?'bg':'ba')+'"><i class="ti '+(tot>100?'ti-alert-triangle':tot>=95?'ti-circle-check':'ti-info-circle')+'"></i></span>';
  updateCatBars();
  document.getElementById('dVal').textContent=f(inc*mult);
  const data=cats.map(c=>Math.max(+c.pct||0,0)), lbls=cats.map(c=>c.name), cols=cats.map((_,i)=>colors[i%colors.length]);
  if(myChart){ myChart.data.labels=lbls; myChart.data.datasets[0].data=data; myChart.data.datasets[0].backgroundColor=cols; myChart.update(); }
  else{ myChart=new Chart(document.getElementById('donutC'),{type:'doughnut',data:{labels:lbls,datasets:[{data,backgroundColor:cols,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'67%',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.label+': '+Math.round(ctx.parsed)+'% \xb7 '+f(inc*mult*ctx.parsed/100)}}}}}); }
  document.getElementById('legEl').innerHTML=cats.map((c,i)=>{const a=inc*mult*(+c.pct||0)/100;return'<div class="li"><span class="ldot" style="background:'+colors[i%colors.length]+'"></span><span>'+c.name+'</span><span class="lval">'+f(a)+'</span></div>';}).join('');
  const maxA=Math.max(...cats.map(c=>inc*mult*(+c.pct||0)/100),1);
  document.getElementById('barEl').innerHTML=cats.map((c,i)=>{const a=inc*mult*(+c.pct||0)/100;return'<div><div class="bhdr"><span class="bname">'+c.name+'</span><span class="bval">'+f(a)+' <span class="bpct">'+Math.round(+c.pct||0)+'%</span></span></div><div class="bbg"><div class="bfill" style="width:'+(a/maxA*100).toFixed(1)+'%;background:'+colors[i%colors.length]+'"></div></div></div>';}).join('');
  document.getElementById('tBody').innerHTML=cats.map((c,i)=>{const p=+c.pct||0,mo=inc*p/100;return'<tr><td><span style="background:'+colors[i%colors.length]+';width:8px;height:8px;border-radius:2px;display:inline-block"></span>'+c.name+'</td><td>'+Math.round(p)+'%</td><td>'+f(mo)+'</td><td>'+f(mo*3)+'</td><td>'+f(mo*12)+'</td></tr>';}).join('');
  document.getElementById('tFoot').innerHTML='<tr><td>Total</td><td>'+Math.round(tot)+'%</td><td>'+f(alloc)+'</td><td>'+f(alloc*3)+'</td><td>'+f(alloc*12)+'</td></tr>';
  scheduleSave();
}

// ── ADMIN ──
function openAdmin(){ document.getElementById('ap').classList.add('open'); rebuildACatList(); rebuildCatColList(); buildAccentGrid(); }
function closeAdmin(){ document.getElementById('ap').classList.remove('open'); }
function saveAndClose(){ closeAdmin(); toast('Settings saved!'); }
function switchTab(t,btn){
  ['budget','appearance','profile','security'].forEach(x=>document.getElementById('tab-'+x).style.display=x===t?'flex':'none');
  document.querySelectorAll('.dtab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
}
function aSetInc(v){ baseMo=parseFloat(v)||0; document.getElementById('incInput').value=Math.round(dispInc()).toLocaleString(); updateDash(); }
function aSetCur(v){ cur=v; document.getElementById('curSym').textContent=v; updateDash(); }
function aSetName(v){ const p=v.trim().split(' '); document.getElementById('navAv').textContent=p.map(x=>x[0]||'').join('').toUpperCase().slice(0,2)||'ME'; }
function setV(prop,val){ document.documentElement.style.setProperty(prop,val); if(prop==='--ac'){document.documentElement.style.setProperty('--acd',val+'22');document.documentElement.style.setProperty('--acb',val+'48');} }
function applyPreset(p){
  const P={'503020':[{name:'Needs',pct:50},{name:'Wants',pct:30},{name:'Savings',pct:20}],'702010':[{name:'Living expenses',pct:70},{name:'Savings',pct:20},{name:'Giving/Debt',pct:10}],'essential':[{name:'Housing',pct:35},{name:'Food',pct:15},{name:'Transport',pct:10},{name:'Utilities',pct:8},{name:'Healthcare',pct:7},{name:'Savings',pct:15},{name:'Other',pct:10}],'savings':[{name:'Emergency fund',pct:20},{name:'Investments',pct:20},{name:'Housing',pct:25},{name:'Food',pct:12},{name:'Transport',pct:8},{name:'Living',pct:15}]};
  cats=P[p].map(c=>({...c})); if(myChart){myChart.destroy();myChart=null;} buildCatList(); updateDash(); rebuildACatList(); rebuildCatColList(); toast('Preset applied!');
}
function exportData(){ const d={income:baseMo,currency:cur,categories:cats,exported:new Date().toISOString()}; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'})); a.download='budget.json'; a.click(); toast('Exported!'); }
function resetAll(){
  if(!confirm('Reset to defaults?'))return;
  cats=DEFCATS.map(c=>({...c})); colors=[...DEFCOLORS]; baseMo=5000; cur='$';
  document.getElementById('curSym').textContent='$'; document.getElementById('incInput').value='5,000'; document.getElementById('aInc').value=5000; document.getElementById('aCur').value='$';
  if(myChart){myChart.destroy();myChart=null;} buildCatList(); updateDash(); rebuildACatList(); rebuildCatColList(); toast('Reset to defaults');
}
function rebuildACatList(){
  const el=document.getElementById('aCatList'); if(!el)return; el.innerHTML='';
  cats.forEach((c,i)=>{
    const co=colors[i%colors.length], r=document.createElement('div'); r.className='acrow';
    r.innerHTML='<input type="color" class="accol" value="'+co+'" style="background:'+co+'"><input class="acname" type="text" value="'+c.name+'" autocomplete=\"off\"><input class="acpct" type="number" min="0" max="200" value="'+c.pct+'" autocomplete=\"off\"><span style="font-size:12px;color:var(--txm)">%</span><button class="acdel" data-i="'+i+'"><i class="ti ti-trash"></i></button>';
    el.appendChild(r);
    r.querySelector('.accol').addEventListener('input',function(){ colors[i]=this.value; this.style.background=this.value; const sw=document.getElementById('csw'+i);if(sw)sw.style.background=this.value; const bar=document.getElementById('cbf'+i);if(bar)bar.style.background=this.value; rebuildCatColList(); updateDash(); });
    r.querySelector('.acname').addEventListener('input',function(){ cats[i].name=this.value; const n=document.getElementById('cn'+i);if(n)n.value=this.value; updateDash(); });
    r.querySelector('.acpct').addEventListener('input',function(){ cats[i].pct=parseFloat(this.value)||0; const p=document.getElementById('cp'+i);if(p)p.value=this.value; updateDash(); });
    r.querySelector('.acdel').addEventListener('click',()=>removeCat(i));
  });
}
function rebuildCatColList(){
  const el=document.getElementById('catColList'); if(!el)return; el.innerHTML='';
  cats.forEach((c,i)=>{ const d=document.createElement('div'); d.className='drow'; d.innerHTML='<div class="drlbl">'+c.name+'</div><input type="color" class="dcol" value="'+colors[i%colors.length]+'">'; el.appendChild(d); d.querySelector('input').addEventListener('input',function(){ colors[i]=this.value; const sw=document.getElementById('csw'+i);if(sw)sw.style.background=this.value; const bar=document.getElementById('cbf'+i);if(bar)bar.style.background=this.value; updateDash(); rebuildACatList(); }); });
}
function buildAccentGrid(){
  const el=document.getElementById('accentGrid'); if(!el)return;
  el.innerHTML=ACCENTS.map(c=>'<div class="csw" style="background:'+c+'" onclick="setV(\'--ac\',\''+c+'\')"></div>').join('')+'<input type="color" class="dcol" title="Custom" oninput="setV(\'--ac\',this.value)">';
}

// ── PASSCODE ──
function pcP(d){ if(pcEntry.length>=4)return; pcEntry+=d; updPcD(); if(pcEntry.length===4){ passcode=pcEntry; document.getElementById('pcSt').textContent='Passcode updated!'; document.getElementById('pcSt').style.color='var(--gr)'; setTimeout(()=>{ pcEntry=''; updPcD(); document.getElementById('pcSt').textContent=''; },1500); toast('Passcode changed!'); } }
function pcDel(){ pcEntry=pcEntry.slice(0,-1); updPcD(); }
function updPcD(){ for(let i=0;i<4;i++) document.getElementById('pd'+i).classList.toggle('on',i<pcEntry.length); }

// ── TOAST ──
function toast(msg){ const el=document.getElementById('toast'); el.innerHTML='<i class="ti ti-circle-check" style="color:var(--gr)"></i> '+msg; el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2400); }

// ── FIREBASE AUTH ──
function switchAuthTab(tab){
  document.getElementById('authSignIn').style.display=tab==='signin'?'flex':'none';
  document.getElementById('authSignUp').style.display=tab==='signup'?'flex':'none';
  document.getElementById('tabSignIn').classList.toggle('active',tab==='signin');
  document.getElementById('tabSignUp').classList.toggle('active',tab==='signup');
}
function setAuthErr(id,msg){ document.getElementById(id).textContent=msg; }
function friendlyErr(code){
  const map={'auth/invalid-email':'Invalid email address.','auth/user-not-found':'No account found with that email.','auth/wrong-password':'Incorrect password.','auth/email-already-in-use':'An account with this email already exists.','auth/weak-password':'Password must be at least 6 characters.','auth/too-many-requests':'Too many attempts. Try again later.','auth/invalid-credential':'Incorrect email or password.'};
  return map[code]||'Something went wrong. Try again.';
}
function doSignIn(){
  const email=document.getElementById('siEmail').value.trim(), pass=document.getElementById('siPass').value;
  if(!email||!pass){setAuthErr('siErr','Please fill in all fields.');return;}
  setAuthErr('siErr','');
  auth.signInWithEmailAndPassword(email,pass).catch(e=>setAuthErr('siErr',friendlyErr(e.code)));
}
function doSignUp(){
  const name=document.getElementById('suName').value.trim(), email=document.getElementById('suEmail').value.trim(), pass=document.getElementById('suPass').value;
  if(!name||!email||!pass){setAuthErr('suErr','Please fill in all fields.');return;}
  if(pass.length<6){setAuthErr('suErr','Password must be at least 6 characters.');return;}
  setAuthErr('suErr','');
  auth.createUserWithEmailAndPassword(email,pass).then(cred=>cred.user.updateProfile({displayName:name})).catch(e=>setAuthErr('suErr',friendlyErr(e.code)));
}
function doGoogle(){
  const provider=new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err=>{
    if(err.code==='auth/popup-blocked'||err.code==='auth/popup-closed-by-user') auth.signInWithRedirect(provider);
    else console.error(err);
  });
}
function doSignOut(){ if(unsub){unsub();unsub=null;} auth.signOut(); }
function toggleUserDrop(){ document.getElementById('userDrop').classList.toggle('open'); }
function onUserSignedIn(user){
  currentUser=user;
  document.getElementById('authScreen').classList.add('hidden');
  const name=user.displayName||user.email||'Me';
  const initials=name.trim().split(' ').map(p=>p[0]||'').join('').toUpperCase().slice(0,2)||'ME';
  document.getElementById('navAv').textContent=initials;
  document.getElementById('userEmail').textContent=user.email;

  // Load from localStorage cache instantly — no waiting for Firebase
  const cached = localStorage.getItem('budget_cache');
  if(cached){
    try{
      const d = JSON.parse(cached);
      loadFromCloud(d);
    } catch(e){ console.warn('Cache parse error', e); }
  }

  // Reveal the app immediately after cache load (or with defaults)
  document.querySelector('.app').style.visibility = 'visible';
  document.querySelector('nav').style.visibility = 'visible';

  // Then sync with Firebase in background — updates silently if anything changed
  startDataSync(user.uid);
}
function onUserSignedOut(){ currentUser=null; if(unsub){unsub();unsub=null;} document.getElementById('authScreen').classList.remove('hidden'); document.getElementById('userDrop').classList.remove('open'); }
function startDataSync(uid){
  const ref=db.collection('users').doc(uid).collection('data').doc('budget');
  unsub=ref.onSnapshot(snap=>{
    if(snap.exists){
      const d=snap.data();
      // Only update UI if this is newer than what we last saved
      // and newer than what we loaded from cache
      const cacheTs = window._cacheTs || 0;
      if(d._savedAt !== window._lastSaveTs && d._savedAt !== cacheTs){
        loadFromCloud(d);
      }
    }
  }, err=>{ console.error('Snapshot error:', err); });
}
function loadFromCloud(d){
  window._cacheTs = d._savedAt || 0;
  if(d.cats) cats=[...d.cats];
  if(d.colors) colors=[...d.colors];
  if(d.baseMo!==undefined){ baseMo=d.baseMo; document.getElementById('incInput').value=Math.round(dispInc()).toLocaleString(); document.getElementById('aInc').value=Math.round(baseMo); }
  if(d.cur){ cur=d.cur; document.getElementById('curSym').textContent=cur; document.getElementById('aCur').value=cur; }
  if(d.incSplits) window._incSplits=[...d.incSplits];
  if(d.paycheckHistory) window._paycheckHistory=[...d.paycheckHistory];
  if(myChart){myChart.destroy();myChart=null;}
  buildCatList(); updateDash(); rebuildACatList(); rebuildCatColList();
  // If splitter page is open, only update history — never re-render the whole page
  const splitterActive = document.getElementById('page-splitter').classList.contains('active');
  if(splitterActive){
    renderHistory();
    recalcSplit();
  }
}
function saveToCloud(){
  if(!currentUser){ console.warn('saveToCloud: no user logged in'); return; }
  console.log('Saving to Firebase for user:', currentUser.uid);
  const ts=Date.now(); window._lastSaveTs=ts;
  const ind=document.getElementById('saveInd'); if(ind) ind.classList.add('saving');
  const ref=db.collection('users').doc(currentUser.uid).collection('data').doc('budget');
  const payload={cats,colors,baseMo,cur,incSplits:window._incSplits||[],paycheckHistory:window._paycheckHistory||[],_savedAt:ts};
  console.log('Saving payload:', JSON.stringify(payload).slice(0,200));
  // Cache locally for instant load next time
  try { localStorage.setItem('budget_cache', JSON.stringify(payload)); } catch(e){}
  ref.set(payload,{merge:true})
    .then(()=>{ console.log('Save successful!'); if(ind) ind.classList.remove('saving'); })
    .catch(e=>{ console.error('Save error:',e); if(ind) ind.classList.remove('saving'); });
}
function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(saveToCloud,1500); }

// ── AI CHAT ──
function toggleChat(){ chatOpen=!chatOpen; document.getElementById('aichat').classList.toggle('open',chatOpen); if(chatOpen){ if(!localStorage.getItem(AIKEY))showSetup(); else showFace(); } }
function showSetup(){ document.getElementById('aisetup').style.display='flex'; document.getElementById('aiface').style.display='none'; }
function showFace(){ document.getElementById('aisetup').style.display='none'; document.getElementById('aiface').style.display='flex'; document.getElementById('bdot').classList.add('on'); if(chatHist.length===0) addMsg('assistant','Hi! I\'m Claude, your budget assistant.\n\nTry:\n\u2022 "Set housing to 30%"\n\u2022 "Add a Gym category at 3%"\n\u2022 "Apply the 50/30/20 rule"\n\u2022 "What\'s my biggest expense?"'); }
function saveKey(){ const k=document.getElementById('keyIn').value.trim(); if(!k.startsWith('sk-ant-')){document.getElementById('keyIn').style.borderColor='var(--rd)';return;} localStorage.setItem(AIKEY,k); showFace(); }
function clearChat(){ chatHist=[]; document.getElementById('aimsgs').innerHTML=''; showFace(); }
function addMsg(role,text){
  const el=document.getElementById('aimsgs'), d=document.createElement('div'); d.className='amsg '+role;
  const ht=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  d.innerHTML='<div class="aav"><i class="ti '+(role==='user'?'ti-user':'ti-sparkles')+'"></i></div><div class="abub">'+ht+'</div>';
  el.appendChild(d); el.scrollTop=el.scrollHeight; chatHist.push({role,content:text});
}
function showTyping(){ const el=document.getElementById('aimsgs'),d=document.createElement('div'); d.className='amsg assistant'; d.id='aiTy'; d.innerHTML='<div class="aav"><i class="ti ti-sparkles"></i></div><div class="abub"><div class="atyping"><span></span><span></span><span></span></div></div>'; el.appendChild(d); el.scrollTop=el.scrollHeight; }
function rmTyping(){ const e=document.getElementById('aiTy'); if(e)e.remove(); }
function setSt(s,c){ const e=document.getElementById('aiSt'); e.textContent=s; e.style.color=c||'var(--gr)'; }
function qsend(t){ document.getElementById('aiinput').value=t; sendMsg(); }
function aiKey(e){ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();} }
async function sendMsg(){
  const inp=document.getElementById('aiinput'), t=inp.value.trim(); if(!t||aiBusy)return; inp.value='';
  const key=localStorage.getItem(AIKEY); if(!key){showSetup();return;}
  addMsg('user',t); aiBusy=true; document.getElementById('aisend').disabled=true; setSt('Thinking\u2026','var(--am)'); showTyping();
  const snap={monthlyIncome:Math.round(baseMo),currency:cur,categories:cats.map((c,i)=>({name:c.name,pct:c.pct,monthly:Math.round(baseMo*c.pct/100)})),totalAllocated:Math.round(totPct()),unallocated:Math.round(100-totPct())};
  const sys='You are Claude inside a personal budget dashboard. Make live changes using action tags.\n<action>{"type":"setPct","name":"Housing","pct":35}</action>\n<action>{"type":"setName","oldName":"X","newName":"Y"}</action>\n<action>{"type":"addCat","name":"Gym","pct":3}</action>\n<action>{"type":"removeCat","name":"X"}</action>\n<action>{"type":"setIncome","value":6000}</action>\n<action>{"type":"preset","name":"503020"}</action>\nState: '+JSON.stringify(snap)+'. Be concise and helpful.';
  const msgs=chatHist.slice(-10).filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}));
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:sys,messages:msgs})});
    rmTyping();
    if(!r.ok){ const e=await r.json().catch(()=>({})); addMsg('assistant',r.status===401?'API key invalid \u2014 click the key icon.':'Error '+r.status+': '+(e.error?.message||'Unknown')); if(r.status===401)localStorage.removeItem(AIKEY); setSt('Error','var(--rd)'); }
    else{ const d=await r.json(), raw=d.content?.[0]?.text||''; [...raw.matchAll(/<action>([\s\S]*?)<\/action>/g)].forEach(m=>{try{execAct(JSON.parse(m[1]));}catch(e){}}); addMsg('assistant',raw.replace(/<action>[\s\S]*?<\/action>/g,'').trim()); setSt('Ready','var(--gr)'); }
  }catch(e){ rmTyping(); addMsg('assistant','Connection error. Check internet and API key.'); setSt('Error','var(--rd)'); }
  aiBusy=false; document.getElementById('aisend').disabled=false;
}
function execAct(a){
  switch(a.type){
    case 'setPct':{ const i=cats.findIndex(c=>c.name.toLowerCase()===a.name.toLowerCase()); if(i>=0){ cats[i].pct=a.pct; const el=document.getElementById('cp'+i); if(el)el.value=a.pct; } break; }
    case 'setName':{ const i=cats.findIndex(c=>c.name.toLowerCase()===a.oldName.toLowerCase()); if(i>=0){ cats[i].name=a.newName; const el=document.getElementById('cn'+i); if(el)el.value=a.newName; } break; }
    case 'addCat':{ cats.push({name:a.name,pct:a.pct||0}); colors.push('#E8472A'); if(myChart){myChart.destroy();myChart=null;} buildCatList(); rebuildACatList(); rebuildCatColList(); break; }
    case 'removeCat':{ const i=cats.findIndex(c=>c.name.toLowerCase()===a.name.toLowerCase()); if(i>=0){cats.splice(i,1);colors.splice(i,1);if(myChart){myChart.destroy();myChart=null;}buildCatList();rebuildACatList();rebuildCatColList();} break; }
    case 'setIncome':{ baseMo=a.value; document.getElementById('aInc').value=a.value; break; }
    case 'preset':{ applyPreset(a.name); return; }
  }
  updateDash();
}

// ── INIT ──
// Show skeleton loader instantly, hide app until data is ready
document.querySelector('.app').style.visibility = 'hidden';
document.querySelector('nav').style.visibility = 'hidden';

auth.onAuthStateChanged(user=>{
  if(user) onUserSignedIn(user);
  else {
    // Not logged in — show auth screen, reveal nav
    document.querySelector('.app').style.visibility = 'visible';
    document.querySelector('nav').style.visibility = 'visible';
    onUserSignedOut();
  }
});
if(localStorage.getItem(AIKEY)) document.getElementById('bdot').classList.add('on');
buildCatList();
updateDash();
