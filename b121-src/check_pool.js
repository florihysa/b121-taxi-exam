// Quality checks for pool.js. Run: node b121-src/check_pool.js
const fs=require('fs');
const L=fs.readFileSync(__dirname+'/pool.js','utf8').split('\n').filter(l=>l.trim().startsWith('{')).map(l=>JSON.parse(l.replace(/,\s*$/,'')));
let bad=0; const say=(...a)=>{bad++;console.log(...a);};
const items=[]; L.forEach(q=>{(q.vars||[q]).forEach((v,i)=>items.push({src:q.src+(q.vars?'#'+i:''),g:q.src,it:v.it,en:v.en,x:v.x||q.x}));});
if(new Set(L.map(q=>q.src)).size!==L.length) say('DUPLICATE src');
L.forEach(q=>{ if(!'TPOCV'.includes(q.c)||!q.art) say('BAD cat/art',q.src); if(q.vars&&(JSON.stringify(q.it)!==JSON.stringify(q.vars[0].it))) say('top-level != first variant',q.src); });
for(const q of items) for(const l of ['it','en']){
  const a=q[l]&&q[l].a; if(!q[l]||!q[l].q||!Array.isArray(a)||a.length!==3){say('BAD shape',q.src,l);continue;}
  if(new Set(a).size!==3) say('REPEATED option',q.src,l,a);
  if(!q.x||!q.x[l]) say('NO explanation',q.src,l);
  const [k,...d]=a, m=Math.max(...d.map(x=>x.length)), mn=Math.min(...d.map(x=>x.length));
  if(k.length>1.35*m&&k.length>m+3||k.length>m+18||k.length<mn*0.6&&k.length<mn-3) say('LENGTH TELL',q.src,l,a.map(x=>x.length));
}
const seenQ={}; items.forEach(q=>{(seenQ[q.it.q]=seenQ[q.it.q]||[]).push(q.src);}); Object.values(seenQ).filter(v=>v.length>1).forEach(v=>say('DUPLICATE question text',v));
const seenA={}; items.forEach(q=>{const k=q.it.a.slice().sort().join('|');(seenA[k]=seenA[k]||new Set()).add(q.g);}); Object.values(seenA).filter(s=>s.size>1).forEach(s=>{const v=[...s]; if(v.join()!=='ref6,ref41') console.log('note: same answer set in different questions',v);});
console.log('entries',L.length,'| with cases',L.filter(q=>q.vars).length,'| questions incl. cases',items.length,'| problems',bad);
process.exit(bad?1:0);
