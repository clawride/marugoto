const fs = require('fs');
const dir='C:/Users/clawride/AppData/Local/Temp/claude/12468fe8787e5866/8c64c1fb-5b61-4577-adcf-4eff0e3148e5/scratchpad/idx1/';
const norm=s=>(s||'').normalize('NFKC').replace(/^ー/,'').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/[\s。、！？!?〜~～・「」（）()….,、―－：:／/]/g,'').replace(/[\[\]【】]/g,'');
const clean=s=>s.replace(/\[[^\]]*[~〜～][^\]]*\]/g,'').replace(/\[([^\]]*)\]/g,'$1').replace(/[~〜～]/g,'〜').replace(/[。？?！!]+$/g,'').trim();
const items=[1,2,3].flatMap(n=>JSON.parse(fs.readFileSync(dir+`part-${n}.json`,'utf8'))).map(e=>({...e,jp:clean(e.w)||clean(e.h),kana:clean(e.h)}));
const dict=new Map();
function add(jp,kana,vi,type){if(!vi||!jp||!/[A-Za-zÀ-ỹ]/.test(vi))return;const v={jp,kana:kana||jp,vi,type:type||'Từ vựng'};for(const k of [jp,kana])if(k&&!dict.has(norm(k)))dict.set(norm(k),v);}
function walk(o){if(!o||typeof o!=='object')return;if(Array.isArray(o)){if(typeof o[0]==='string'&&typeof o[1]==='string'&&typeof o[2]==='string'&&/[ぁ-ヿ一-鿿]/.test(o[0]))add(o[0],o[1],o[2]);else o.forEach(walk);return;}if(o.jp&&o.vi)add(o.jp,o.kana||o.r,o.vi,o.type);if(o.w&&o.vi)add(o.w,o.r,o.vi);for(const v of Object.values(o))if(v&&typeof v==='object')walk(v);}
for(let n=0;n<=25;n++)walk(JSON.parse(fs.readFileSync(`data/mnn1/lesson-${n}.json`,'utf8')));
function scan(p){for(const f of fs.readdirSync(p,{withFileTypes:true})){const q=p+'/'+f.name;if(f.isDirectory())scan(q);else if(f.name.endsWith('.json')){try{walk(JSON.parse(fs.readFileSync(q,'utf8')))}catch{}}}}
scan('data');
const missing=[];
const report=[];
for(let n=0;n<=25;n++){
 const L=JSON.parse(fs.readFileSync(`data/mnn1/lesson-${n}.json`,'utf8'));
 const keys=new Set(L.vocab.flatMap(v=>[norm(v.jp),norm(v.kana)]));
 const seen=new Set();let count=0;
 for(const e of items.filter(e=>e.l.includes(n)||(n===0&&e.x))){
  const k=norm(e.kana);if(seen.has(k)||keys.has(k)||keys.has(norm(e.jp)))continue;seen.add(k);
  const d=dict.get(norm(e.jp))||dict.get(k);
  missing.push({lesson:n,jp:e.jp,kana:e.kana,na:e.na,raw:e.raw,...(d?{vi:d.vi,type:d.type}:{} )});count++;
 }
 report.push({lesson:n,before:L.vocab.length,missing:count});
}
fs.writeFileSync('.tmp/missing.json',JSON.stringify(missing,null,2));
fs.writeFileSync('.tmp/index.json',JSON.stringify(items,null,2));
console.log(JSON.stringify(report));console.log('index',items.length,'missing',missing.length,'translated',missing.filter(x=>x.vi).length,'untranslated',missing.filter(x=>!x.vi).length);
for(const e of missing.filter(x=>!x.vi))console.log(`${e.lesson}\t${e.jp}\t${e.kana}`);
