const fs=require('fs');
let ref=fs.readFileSync(__dirname+'/reference-ui.html','utf8');
let html=ref.slice(0, ref.indexOf('/* ================= QUESTION POOL'));
html=html.replace('<title>CUT-Exam · B121 / BPT</title>','<title>CUT-Exam · B121 / BPT — OLR 2</title>');
html=html.replace('<head>',"<head>\n<script>try{if(localStorage.getItem('b121theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>");
if(!html.includes("b121theme")) throw new Error('theme boot script not inserted');
html=html.replace("catValue:'Category B121 (BPT) — ARV2 / SR 822.222'","catValue:'Category B121 (BPT) — OLR 2 / SR 822.222'");
// English interface wording
html=html.replace("startTitle:'Exam start'","startTitle:'Start of the exam'");
html=html.replace("bookmark:'Bookmark Question'","bookmark:'Bookmark question'");
html=html.replace("confirmAll:'Your exam will now terminate. You can not undo this step.'","confirmAll:'Your exam will now end. This step cannot be undone.'");
html=html.replace("This step can not be undone.'","This step cannot be undone.'");
html=html.replace("closeExam:'Close exam', closeNow:'Close now', doNotClose:'Do not close'","closeExam:'Finish exam', closeNow:'Finish now', doNotClose:'Do not finish'");
html=html.replace("['Close exam','This function ends the exam. Make sure that all questions are answered.']","['Finish exam','This ends the exam. Make sure you have answered all the questions.']");
html=html.replace("['Questions overview','Here you get an overall view of your exam.']","['Questions overview','Here you can see all the questions of your exam at a glance.']");
html=html.replace('</style>',`  .artref{font-size:12px; color:var(--dark-grey); margin-left:8px; font-weight:400; white-space:nowrap;}
  .verdict:not(.pass):not(.fail){color:var(--mariner);}
  .answer{padding:12px 16px; margin:4px 0;}
  .contentLeft{padding-top:14px;} .contentRight{padding-top:10px;}
  .explain{margin-top:10px;}
  .contentRight .explain{margin-bottom:16px;}
  .explain ul{margin:0; padding:0 0 0 18px; list-style:disc;}
  .explain li{margin:0; padding:0;}
  .explain li::marker{color:var(--mariner);}
  /* ===== theme toggle ===== */
  .fgroup{display:inline-flex; gap:8px; align-items:center;}
  .pbtn.themebtn{min-width:0; padding:10px;}
  .themefloat{position:absolute; top:20px; left:20px; z-index:2;}
  @media (max-width:480px){
    .footer{padding:0 8px;}
    .footer .pbtn{padding:9px 7px; font-size:12px; gap:4px; white-space:nowrap;}
    .footer .pbtn svg{width:16px; height:16px;}
    .footer .fgroup{gap:5px;}
    .themefloat{left:12px;}
  }
  /* ===== dark theme: same layout, darker palette ===== */
  html[data-theme="dark"]{
    color-scheme:dark;
    --white:#1e2024; --night-rider:#e6e8eb; --dark-grey:#8b919a; --silver:#5a606a; --white-smoke:#26292e;
    --mariner:#8db1f2; --mariner-light:#3c4d70; --mahogany:#f17f83; --medium-orchid:#d199e6; --deep-lilac:#b877cf;
    --jungle-green:#3fbf9b; --tropical-rain-forest:#4fd0ab;
  }
  html[data-theme="dark"] body{background-color:#17191c;}
  html[data-theme="dark"] .pbtn{background:#2f333a;}
  html[data-theme="dark"] .pbtn.flat{background:transparent;}
  html[data-theme="dark"] .pbtn.invert{background:#3f6fc4; color:#fff;}
  html[data-theme="dark"] .navbtn{background-color:#3f6fc4;}
  html[data-theme="dark"] .navbtn:disabled{background-color:#33373e;}
  html[data-theme="dark"] .navbtn:disabled svg{fill:#7b818b;}
  html[data-theme="dark"] .langcard{background:#2f333a;}
  html[data-theme="dark"] .answer{border-color:transparent;}
  html[data-theme="dark"] .answer.selected{border-color:var(--inactive-color);}
  html[data-theme="dark"] .pcheck{background:#1e2024;}
  html[data-theme="dark"] .answer.checked .pcheck{background:#3f6fc4; border-color:#3f6fc4;}
  html[data-theme="dark"] .pdialog{background:#2a2d33; color:var(--night-rider);}
  html[data-theme="dark"] .cut-time{background:#17191c;}
</style>`);
const enExtra=`notAnswered:'Not answered',
    ok:'OK', cat:{T:'Terms',P:'Scope',O:'Working, driving & rest time',C:'Checks',V:'Misc.'}, exit:'Back to start',
    training:'',trainingDesc:'',allTopics:'',instantFeedback:'',fbOn:'',realMode:'',next:'Next',finishTraining:'',trainingResult:'',correctCount:'',wrongCount:'',byTopic:'',correctLbl:'',questionsLbl:'',restart:'',poolInfo:n=>''`;
const itExtra=`notAnswered:'Nessuna risposta',
    ok:'OK', cat:{T:'Termini',P:'Portata',O:'Orari',C:'Controllo',V:'Varie'}, exit:'Torna all\\'inizio',
    training:'',trainingDesc:'',allTopics:'',instantFeedback:'',fbOn:'',realMode:'',next:'Avanti',finishTraining:'',trainingResult:'',correctCount:'',wrongCount:'',byTopic:'',correctLbl:'',questionsLbl:'',restart:'',poolInfo:n=>''`;
let n=0;
html=html.replace("notAnswered:'Not answered',\n    ok:'OK'", ()=>{n++;return enExtra;});
html=html.replace("notAnswered:'Nessuna risposta',\n    ok:'OK'", ()=>{n++;return itExtra;});
if(n!==2) throw new Error('UI patch failed');
html=html.replace(/disclaimer:'This is an independent practice exam[^\n]*/, "disclaimer:'Independent practice exam for the B121 / BPT additional theory exam (OLR 2). These are not the official asa questions. The correct answer is shown right after each answer. Exam format (30 questions, 3 options, max. 3 mistakes, 45 minutes) matches the official exam.',");
html=html.replace(/disclaimer:'Questo è un esame di prova indipendente[^\n]*/, "disclaimer:'Esame di prova indipendente per l\\'esame di teoria complementare B121 / TPP (OLR 2). Non sono le domande ufficiali asa. La risposta corretta appare subito dopo ogni risposta. Il formato (30 domande, 3 risposte, max. 3 errori, 45 minuti) corrisponde all\\'esame ufficiale.',");
const parts=['pool.js'].map(f=>fs.readFileSync(__dirname+'/'+f,'utf8')).join('\n');
html+=`/* ================= QUESTION POOL — correct answer always index 0, shuffled at runtime.
   c = topic (T Termini, P Portata, O Orari, C Controllo, V Varie); art = legal basis (OLR 2 unless stated).
   Keyed against OLR 2 (RS 822.222, state 01.03.2025), OLR 1 via Art. 16a, ONC, OETV. ================= */
const POOL = [
${parts}
];
`;
html+=fs.readFileSync(__dirname+'/engine3.js','utf8');
fs.writeFileSync(__dirname+'/../index.html', html);
console.log('written', html.length);
