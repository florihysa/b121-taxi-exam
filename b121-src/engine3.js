
/* ================= CONSTANTS (official asa CUT exam format for BPT / B121) ================= */
const EXAM_N = 30;          // questions per exam
const EXAM_MIN = 45;        // minutes
const MAX_MISTAKES = 3;     // max errors allowed
const CRITICAL_S = 5*60;    // timer turns red
const CATS = ['T','P','O','C','V'];
const CAT_MIN = {T:3,P:3,O:7,C:9,V:0};
const VERSION = 'v13 · 09.11.2026 · OLR 2 stato 01.03.2025';

/* ================= STATE ================= */
let lang = localStorage.getItem('b121lang2') || null;
let view = lang ? 'start' : 'lang';   // lang | start | exam | overview | result | train | trainresult
let exam = null;
let train = null;
const instantFb = true;   // correct answer is always shown right after answering
const $ = id=>document.getElementById(id);
const esc = s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function shuffled(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const T = ()=>UI[lang||'en'];
const catName = c => (T().cat[c]||(c==='V'?'Varie':c));

/* ================= VIEWS ================= */
function loginInfoBlock(){
  const t=T();
  return `<table class="logininfo"><tr><td>${t.loggedIn}</td><td>Demo</td></tr>
  <tr><td>${t.category}</td><td>B121</td></tr>
  <tr><td>${t.device}</td><td>Web</td></tr></table>`;
}

function renderLang(){
  $('app').innerHTML = `
    <div class="header"></div>
    ${lang?loginInfoBlock():`<table class="logininfo"><tr><td>Logged in:</td><td>Demo</td></tr><tr><td>Category:</td><td>B121</td></tr><tr><td>Device:</td><td>Web</td></tr></table>`}
    <div class="langpage">
      <div style="margin-top:40px; text-align:center; font-size:13px; line-height:1.5;">
        Select a language<br>Seleziona una lingua
      </div>
      <div class="langcards">
        <button class="langcard" onclick="pickLang('it')">Italiano</button>
        <button class="langcard" onclick="pickLang('en')">English</button>
      </div>
    </div>`;
}
function pickLang(l){ lang=l; localStorage.setItem('b121lang2',l); view='start'; render(); }

function poolCounts(){ const c={}; POOL.forEach(p=>{c[p.c]=(c[p.c]||0)+1;}); return c; }

function renderStart(){
  const t=T(); const pc=poolCounts();
  $('app').innerHTML = `
    <div class="header"></div>
    ${loginInfoBlock()}
    <div class="scrollpanel scrollpanel-noheader" style="top:80px;">
    <div class="startpage">
      <h1>${t.startTitle}</h1>
      <div class="goodluck">${t.goodLuck}</div>
      <div class="disclaimer">${t.disclaimer}</div>
      <div class="examtable">
        <table>
          <tr><td>${t.yourExam}</td><td>${t.catValue}<br>${t.oneAnswer}</td></tr>
          <tr><td>${t.numQuestions}</td><td>${EXAM_N}</td></tr>
          <tr><td>${t.maxScore}</td><td>${EXAM_N}</td></tr>
          <tr><td>${t.maxMistakes}</td><td>${MAX_MISTAKES}</td></tr>
          <tr><td>${t.time}</td><td>${t.minutes}</td></tr>
        </table>
      </div>
      <button class="pbtn invert startbtn" onclick="startExam()">${t.startExam}</button>

    </div>
    </div>
    <div class="footer justified">
      <span style='font-size:12px;color:var(--dark-grey)'>${VERSION}</span>
      <button class="pbtn" onclick="view='lang';render()">${IC.lang} ${lang==='en'?'English':'Italiano'}</button>
    </div>`;
}

/* ===== exam persistence ===== */
function saveExam(){
  if(!exam) return;
  try{ localStorage.setItem('b121exam', JSON.stringify({qs:exam.qs, answers:exam.answers, marked:exam.marked, cur:exam.cur, total:exam.total, left:exam.left, fb:exam.fb, savedAt:Date.now()})); }catch(e){}
}
function clearSaved(){ try{ localStorage.removeItem('b121exam'); }catch(e){} }
function resumeExam(){
  try{
    const s=JSON.parse(localStorage.getItem('b121exam')||'null');
    if(!s || !Array.isArray(s.qs) || s.qs.length!==EXAM_N || !Array.isArray(s.answers)) return false;
    if(s.qs.some(q=>!POOL[q.p] || !Array.isArray(q.perm) || q.perm.length!==3)) { clearSaved(); return false; }
    const elapsed=Math.floor((Date.now()-(s.savedAt||Date.now()))/1000);
    exam={qs:s.qs, answers:s.answers, marked:s.marked, cur:s.cur||0, total:s.total, left:Math.max(0, s.left-elapsed), fb:true, timerId:null};
    view='exam';
    if(exam.left<=0){ exam.left=0; render(); finish(); return true; }
    exam.timerId=setInterval(tick, 1000);
    return true;
  }catch(e){ return false; }
}

/* ===== stratified random draw: every topic is represented, proportionally to the pool ===== */
function pickExam(){
  const byCat={}; POOL.forEach((p,i)=>{(byCat[p.c]=byCat[p.c]||[]).push(i);});
  const cats=Object.keys(byCat), total=POOL.length;
  const counts={}; let sum=0;
  cats.forEach(c=>{ counts[c]=Math.min(byCat[c].length, Math.max(CAT_MIN[c]||1, Math.round(EXAM_N*byCat[c].length/total))); sum+=counts[c]; });
  while(sum>EXAM_N){ const c=cats.reduce((a,b)=>counts[a]>=counts[b]?a:b); counts[c]--; sum--; }
  while(sum<EXAM_N){ const c=cats.filter(k=>counts[k]<byCat[k].length).reduce((a,b)=>counts[a]/byCat[a].length<=counts[b]/byCat[b].length?a:b); counts[c]++; sum++; }
  let picks=[]; cats.forEach(c=>{ picks=picks.concat(shuffled(byCat[c]).slice(0,counts[c])); });
  return shuffled(picks);
}
function startExam(){
  clearSaved();
  if(exam && exam.timerId) clearInterval(exam.timerId);
  const picks = pickExam();
  exam = {
    qs: picks.map(p=>({p, perm: shuffled([0,1,2])})),
    answers: Array(EXAM_N).fill(null),
    marked: Array(EXAM_N).fill(false),
    cur: 0,
    total: EXAM_MIN*60,
    left: EXAM_MIN*60,
    fb: true,
    timerId: null
  };
  exam.timerId = setInterval(tick, 1000);
  view='exam'; render();
}

function tick(){
  if(!exam) return;
  exam.left--;
  if(exam.left<=0){
    clearInterval(exam.timerId);
    exam.left=0;
    showDialog(`<p>${T().timeUp}</p>`, [[T().ok, ()=>{closeDialog(); finish();}, true]]);
    return;
  }
  saveExam();
  const el=$('timelabel'), fill=$('timefill');
  if(el){ el.innerHTML = timeHTML(); el.classList.toggle('critical', exam.left<=CRITICAL_S); }
  if(fill){ fill.style.width = (exam.left/exam.total*100)+'%'; }
}
function timeHTML(){
  const m=Math.floor(exam.left/60), s=exam.left%60;
  return `${T().remaining}&nbsp;<b>${m}:${String(s).padStart(2,'0')}</b>`;
}

/* ===== answer row renderers ===== */
function answerRowPlain(text, sel, onclick){
  return `<div class="answer ${sel?'checked selected':''}" onclick="${onclick}">
    <span class="pcheck"></span>
    <span class="atext">${esc(text)}</span>
  </div>`;
}
function answerRowGraded(text, isC, sel, anim){
  let cls='answer'; if(sel) cls+=' checked selected';
  if(sel && anim) cls += isC ? ' flashgood' : ' flashbad';
  let ring=''; if(isC) ring='correct'; else if(sel) ring='incorrect';
  return `<div class="${cls}" style="cursor:default">
    <span class="${ring}"><span class="ring${ring&&anim?' anim':''}"><span class="pcheck"></span></span></span>
    <span class="atext">${esc(text)}</span>
  </div>`;
}

function renderExam(){
  const t=T(), e=exam, qq=e.qs[e.cur], P=POOL[qq.p], q=P[lang];
  const answeredCount = e.answers.filter(a=>a!==null).length;
  const markedCount = e.marked.filter(Boolean).length;
  const answered = e.answers[e.cur]!==null;
  const graded = e.fb && answered;
  $('app').innerHTML = `
    <div class="header justified">
      <div>
        <button class="pbtn" onclick="view='overview';render()">${IC.menu} <span>${t.overview}</span></button>
      </div>
      <div style="display:flex; align-items:center;">
        <div class="hstack">
          <div class="row questionBookmarked">${IC.bookmark}<span>${t.marked(markedCount)}</span></div>
          <div class="row questionAnswered">${IC.check}<span>${answeredCount} / ${EXAM_N}</span></div>
        </div>
        <div class="timewrap">
          <div class="cut-time">
            <div class="fill" id="timefill" style="width:${e.left/e.total*100}%"></div>
            <div class="label ${e.left<=CRITICAL_S?'critical':''}" id="timelabel">${timeHTML()}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="scrollpanel">
      <div class="examcontainer">
        <div class="self-center">
          <button class="navbtn back" onclick="nav(-1)" ${e.cur===0?'disabled':''}>${IC.chevL}</button>
        </div>
        <div class="exampage">
          <div class="content">
            <div class="title">
              <span class="titleText">${t.question} ${e.cur+1} ${t.of} ${EXAM_N}</span>
              <div class="flexspacer"></div>
              <button class="pbtn bookmarkbtn" onclick="toggleMark()">
                ${IC.bookmark} <span>${e.marked[e.cur]?t.removeBookmark:t.bookmark}</span>
              </button>
            </div>
            <div class="qcols">
              <div class="contentLeft">
                <span class="questionTitle">${esc(q.q)}</span>
              </div>
              <div class="contentRight">
                ${qq.perm.map(orig=>{
                  const sel = e.answers[e.cur]===orig;
                  if(!graded) return answerRowPlain(q.a[orig], sel, `choose(${orig})`);
                  return answerRowGraded(q.a[orig], orig===0, sel, e.justAnswered);
                }).join('')}
                ${graded && P.x ? `<div class="explain"><b>${esc(P.art)}</b> — ${esc(P.x[lang])}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="self-center">
          <button class="navbtn forward" onclick="nav(1)" ${e.cur===EXAM_N-1?'disabled':''}>${IC.chevR}</button>
        </div>
      </div>
    </div>

    <div class="footer justified">
      <button class="pbtn" onclick="showHelp()">${IC.help} ${t.help}</button>
      <button class="pbtn" onclick="askFinish()">${IC.check} ${t.closeExam}</button>
      <button class="pbtn" onclick="switchLangInline()">${IC.lang} ${lang==='en'?'English':'Italiano'}</button>
    </div>
    <div class="backdrop" id="dlgback"><div class="pdialog" id="dlg"></div></div>`;
}

let keepScroll=false;
function choose(orig){
  if(exam.answers[exam.cur]!==null) return;   // locked after the first answer; the correct answer is shown immediately
  exam.answers[exam.cur] = orig;
  exam.justAnswered = true;
  saveExam();
  keepScroll=true; render();
  exam.justAnswered = false;
  const sel=document.querySelector('.contentRight .answer.selected'); if(sel) sel.scrollIntoView({block:'nearest'});
}
function nav(d){
  exam.cur=Math.min(EXAM_N-1,Math.max(0,exam.cur+d));
  saveExam();
  render();
}
function toggleMark(){ exam.marked[exam.cur]=!exam.marked[exam.cur]; saveExam(); keepScroll=true; render(); }
function gotoQ(i){ exam.cur=i; view='exam'; saveExam(); render(); }
function switchLangInline(){ lang = lang==='en'?'it':'en'; localStorage.setItem('b121lang2',lang); render(); }

function renderOverview(){
  const t=T(), e=exam;
  const answeredCount=e.answers.filter(a=>a!==null).length;
  const markedCount=e.marked.filter(Boolean).length;
  $('app').innerHTML = `
    <div class="header justified">
      <div>
        <button class="pbtn" onclick="view='exam';render()">${IC.menu} <span>${t.closeOverview}</span></button>
      </div>
      <div class="hstack">
        <div class="row questionBookmarked">${IC.bookmark}<span>${t.marked(markedCount)}</span></div>
        <div class="row questionAnswered">${IC.check}<span>${t.answered(answeredCount)}</span></div>
      </div>
    </div>
    <div class="scrollpanel">
      <div class="ovwrap">
        ${e.qs.map((_,i)=>`
          <div class="list-item">
            <span class="flag ${e.marked[i]?'':'hiddenflag'}">${IC.flag}</span>
            <button class="pbtn ovbtn ${e.answers[i]!==null?'invert answered':''}" onclick="gotoQ(${i})">
              <span class="button-text">${i+1}</span>
            </button>
          </div>`).join('')}
      </div>
    </div>
    <div class="footer justified">
      <button class="pbtn" onclick="showHelp()">${IC.help} ${t.help}</button>
      <button class="pbtn" onclick="askFinish()">${IC.check} ${t.closeExam}</button>
      <span></span>
    </div>
    <div class="backdrop" id="dlgback"><div class="pdialog" id="dlg"></div></div>`;
}

/* ===== dialogs ===== */
function showDialog(html, buttons){
  const back=$('dlgback');
  if(!back) return;
  $('dlg').innerHTML = html + `<div class="dlgbuttons">${buttons.map((b,i)=>
    `<button class="pbtn ${b[2]?'invert':''}" id="dlgbtn${i}">${esc(b[0])}</button>`).join('')}</div>`;
  buttons.forEach((b,i)=>{ $('dlgbtn'+i).onclick=b[1]; });
  back.classList.add('open');
}
function closeDialog(){ const b=$('dlgback'); if(b) b.classList.remove('open'); }
function showHelp(){
  const t=T();
  showDialog(t.helpTexts.map(h=>`<p><b>${esc(h[0])}</b><br>${esc(h[1])}</p>`).join(''), [[t.ok, closeDialog, true]]);
}
function askFinish(){
  const t=T();
  const missing = exam.answers.some(a=>a===null);
  showDialog(`<p>${missing?t.confirmMissing:t.confirmAll}</p>`,
    [[t.doNotClose, closeDialog, false],[t.closeNow, ()=>{closeDialog();finish();}, true]]);
}

function finish(){
  clearInterval(exam.timerId);
  clearSaved();
  exam.usedS = exam.total - exam.left;
  view='result'; render();
  window.scrollTo(0,0);
}

function topicTable(items){ // items: [{p, ok}]
  const t=T(); const st={};
  items.forEach(it=>{ const c=POOL[it.p].c; st[c]=st[c]||{n:0,ok:0}; st[c].n++; if(it.ok) st[c].ok++; });
  return `<table class="cattable">${CATS.filter(c=>st[c]).map(c=>`<tr><td>${esc(catName(c))}</td><td><b>${st[c].ok} / ${st[c].n}</b></td></tr>`).join('')}</table>`;
}

function reviewBlock(qs, answers, marked){
  const t=T();
  return qs.map((qq,i)=>{
    const P=POOL[qq.p], q=P[lang], user=answers[i];
    return `<div>
      <div class="rquestion"><span class="qnum">${i+1}.</span> ${esc(q.q)} <span class="artref">${esc(P.art)}</span> ${marked&&marked[i]?`<span class="rmarkedflag">⚑</span>`:''} ${user===null||user===undefined?`<span style="color:var(--error-color); font-weight:400; font-size:13px;">— ${t.notAnswered}</span>`:''}</div>
      ${qq.perm.map(orig=>answerRowGraded(q.a[orig], orig===0, user===orig, false)).join('')}
      ${P.x?`<div class="explain">${esc(P.x[lang])}</div>`:''}
    </div>`;
  }).join('');
}

function renderResult(){
  const t=T(), e=exam;
  const correct=e.answers.filter(a=>a===0).length;
  const mistakes=EXAM_N-correct;
  const pass=mistakes<=MAX_MISTAKES;
  const mm=Math.floor(e.usedS/60), ss=e.usedS%60;
  $('app').innerHTML = `
    <div class="header"></div>
    ${loginInfoBlock()}
    <div class="scrollpanel scrollpanel-noheader" style="top:80px;">
    <div class="resultpage">
      <h1>${t.examResult}</h1>
      <div class="verdict ${pass?'pass':'fail'}">${pass?t.passed:t.failed}</div>
      <div class="examtable">
        <table>
          <tr><td>${t.score}</td><td>${correct} / ${EXAM_N}</td></tr>
          <tr><td>${t.mistakes}</td><td>${mistakes} (max. ${MAX_MISTAKES})</td></tr>
          <tr><td>${t.time}</td><td>${mm}:${String(ss).padStart(2,'0')}</td></tr>
        </table>
      </div>
      <button class="pbtn invert" style="margin-top:26px;" onclick="startExam()">${t.newExam}</button>
      <button class="pbtn" style="margin-top:26px;" onclick="view='start';render()">${t.exit}</button>

      <div class="reviewwrap">
        <h2>${t.review}</h2><div style="font-size:13px; color:var(--night-rider); margin:8px 0 2px; line-height:1.6;">${t.legend}</div>
        ${reviewBlock(e.qs, e.answers, e.marked)}
      </div>
    </div>
    </div>
    <div class="footer justified">
      <span></span>
      <button class="pbtn" onclick="switchLangInline()">${IC.lang} ${lang==='en'?'English':'Italiano'}</button>
    </div>`;
}

/* ================= TRAINING MODE ================= */
function startTrain(cat){
  const idx = POOL.map((p,i)=>i).filter(i=>!cat || POOL[i].c===cat);
  train = { cat, qs: shuffled(idx).map(p=>({p, perm: shuffled([0,1,2])})), answers: [], cur: 0 };
  train.answers = Array(train.qs.length).fill(null);
  view='train'; render(); window.scrollTo(0,0);
}
function trainChoose(orig){
  if(train.answers[train.cur]!==null) return;
  train.answers[train.cur]=orig; train.justAnswered=true; render(); train.justAnswered=false;
}
function trainNav(d){ train.cur=Math.min(train.qs.length-1, Math.max(0, train.cur+d)); render(); window.scrollTo(0,0); }
function renderTrain(){
  const t=T(), e=train, qq=e.qs[e.cur], P=POOL[qq.p], q=P[lang], N=e.qs.length;
  const done=e.answers.filter(a=>a!==null).length, ok=e.answers.filter(a=>a===0).length;
  const answered=e.answers[e.cur]!==null;
  $('app').innerHTML = `
    <div class="header justified">
      <div><button class="pbtn" onclick="view='start';render()">${IC.close} <span>${t.exit}</span></button></div>
      <div class="hstack">
        <div class="row" style="color:var(--night-rider)"><b>${t.training}:</b>&nbsp;${esc(e.cat?catName(e.cat):t.allTopics)}</div>
        <div class="row questionAnswered">${IC.check}<span>${ok} / ${done} ${t.correctLbl} · ${N} ${t.questionsLbl}</span></div>
      </div>
    </div>
    <div class="scrollpanel">
      <div class="examcontainer">
        <div class="self-center"><button class="navbtn back" onclick="trainNav(-1)" ${e.cur===0?'disabled':''}>${IC.chevL}</button></div>
        <div class="exampage"><div class="content">
          <div class="title">
            <span class="titleText">${t.question} ${e.cur+1} ${t.of} ${N}</span>
            <div class="flexspacer"></div>
            <span class="artref">${esc(catName(P.c))} · ${esc(P.art)}</span>
          </div>
          <div class="qcols">
            <div class="contentLeft"><span class="questionTitle">${esc(q.q)}</span><span class="qhint">${t.oneAnswer}</span></div>
            <div class="contentRight">
              ${qq.perm.map(orig=>{
                const sel=e.answers[e.cur]===orig;
                if(!answered) return answerRowPlain(q.a[orig], sel, `trainChoose(${orig})`);
                return answerRowGraded(q.a[orig], orig===0, sel, e.justAnswered);
              }).join('')}
              ${answered && P.x ? `<div class="explain"><b>${esc(P.art)}</b> — ${esc(P.x[lang])}</div>` : ''}
              ${answered ? `<div style="margin-top:14px;text-align:right"><button class="pbtn invert" onclick="${e.cur===N-1?'finishTrain()':'trainNav(1)'}">${e.cur===N-1?t.finishTraining:t.next} ${IC.chevR}</button></div>` : ''}
            </div>
          </div>
        </div></div>
        <div class="self-center"><button class="navbtn forward" onclick="trainNav(1)" ${e.cur===N-1?'disabled':''}>${IC.chevR}</button></div>
      </div>
    </div>
    <div class="footer justified">
      <button class="pbtn" onclick="finishTrain()">${IC.check} ${t.finishTraining}</button>
      <button class="pbtn" onclick="switchLangInline()">${IC.lang} ${lang==='en'?'English':'Italiano'}</button>
    </div>`;
}
function finishTrain(){ view='trainresult'; render(); window.scrollTo(0,0); }
function renderTrainResult(){
  const t=T(), e=train;
  const done=e.qs.map((qq,i)=>({qq,i})).filter(x=>e.answers[x.i]!==null);
  const ok=done.filter(x=>e.answers[x.i]===0).length;
  const wrong=done.filter(x=>e.answers[x.i]!==0);
  $('app').innerHTML = `
    <div class="header"></div>
    ${loginInfoBlock()}
    <div class="scrollpanel scrollpanel-noheader" style="top:80px;">
    <div class="resultpage">
      <h1>${t.trainingResult}</h1>
      <div class="verdict ${wrong.length===0?'pass':''}">${ok} / ${done.length}</div>
      <div class="examtable"><table>
        <tr><td>${t.correctCount}</td><td>${ok}</td></tr>
        <tr><td>${t.wrongCount}</td><td>${wrong.length}</td></tr>
        <tr><td>${t.byTopic}</td><td>${topicTable(done.map(x=>({p:x.qq.p, ok:e.answers[x.i]===0})))}</td></tr>
      </table></div>
      <button class="pbtn invert" style="margin-top:26px;" onclick="startTrain(${e.cat?`'${e.cat}'`:'null'})">${t.restart}</button>
      <button class="pbtn" style="margin-top:26px;" onclick="view='start';render()">${t.exit}</button>
      ${wrong.length?`<div class="reviewwrap"><h2>${t.wrongCount}</h2>${reviewBlock(wrong.map(x=>x.qq), wrong.map(x=>e.answers[x.i]), null)}</div>`:''}
    </div>
    </div>
    <div class="footer justified">
      <span></span>
      <button class="pbtn" onclick="switchLangInline()">${IC.lang} ${lang==='en'?'English':'Italiano'}</button>
    </div>`;
}

/* ================= RENDER ROOT ================= */
function render(){
  const sp=document.querySelector('.scrollpanel'); const st=(keepScroll&&sp)?sp.scrollTop:0; keepScroll=false;
  if(view==='lang') renderLang();
  else if(view==='start') renderStart();
  else if(view==='exam') renderExam();
  else if(view==='overview') renderOverview();
  else if(view==='result') renderResult();
  else if(view==='train') renderTrain();
  else if(view==='trainresult') renderTrainResult();
  const sp2=document.querySelector('.scrollpanel'); if(sp2) sp2.scrollTop=st;
}
if(lang) resumeExam();
render();
</script>
</body>
</html>
