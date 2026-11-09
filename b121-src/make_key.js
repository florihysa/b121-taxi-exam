// Generates chiave-risposte.html (plain answer key) from pool.js. Run: node b121-src/make_key.js
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/pool.js','utf8');
const m=src.match(/const VERSION = '(v\d+)/)||[];
const ver=(fs.readFileSync(__dirname+'/engine3.js','utf8').match(/const VERSION = '(v\d+)/)||[,'v?'])[1];
const pool=src.split('\n').filter(l=>l.trim().startsWith('{')).map(l=>JSON.parse(l.replace(/,\s*$/,'')));
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
let h='<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chiave delle risposte — B121 / OLR 2</title><style>body{font-family:Roboto,Arial,sans-serif;font-size:14px;margin:16px;color:#303030}h1{font-size:20px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px 6px;vertical-align:top;text-align:left}th{background:#f1f1f1}td:first-child{color:#999;width:34px}.a{color:#777;white-space:nowrap;font-size:12px}</style></head><body>';
h+=`<h1>Chiave delle risposte — ${pool.length} domande (${ver})</h1><p>Domanda, risposta corretta, base legale. Le righe con una lettera (a, b, c…) sono i casi concreti della stessa domanda: a ogni esame ne esce uno. Se una riga non ha senso, segnalala.</p><table><tr><th>#</th><th>Domanda</th><th>Risposta corretta</th><th>Articolo</th></tr>`;
let rows=0; pool.forEach((q,i)=>{(q.vars||[q]).forEach((v,j)=>{rows++;h+=`<tr><td>${i+1}${q.vars?String.fromCharCode(97+j):''}</td><td>${esc(v.it.q)}</td><td><b>${esc(v.it.a[0])}</b></td><td class="a">${esc(q.art)}</td></tr>`;});});
h+='</table></body></html>';
fs.writeFileSync(__dirname+'/../chiave-risposte.html',h);
console.log('key written:',pool.length,'questions',rows,'rows',ver);
