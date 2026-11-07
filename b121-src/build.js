const fs=require('fs');
let ref=fs.readFileSync(__dirname+'/reference-ui.html','utf8');
let html=ref.slice(0, ref.indexOf('/* ================= QUESTION POOL'));
html=html.replace('<title>CUT-Exam · B121 / BPT</title>','<title>CUT-Exam · B121 / BPT — OLR 2</title>');
html=html.replace("catValue:'Category B121 (BPT) — ARV2 / SR 822.222'","catValue:'Category B121 (BPT) — OLR 2 / SR 822.222'");
html=html.replace('</style>',`  .artref{font-size:12px; color:var(--dark-grey); margin-left:8px; font-weight:400; white-space:nowrap;}
  .verdict:not(.pass):not(.fail){color:var(--mariner);}
  .answer{padding:12px 16px; margin:4px 0;}
  .contentLeft{padding-top:14px;} .contentRight{padding-top:10px;}
  .explain{margin-top:10px;}
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
