import fs from 'node:fs';
import { indexWord, matchingVocab, vocabKey } from '../scripts/minna-vocab-utils.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data/mnn1-vocab-index.json');
const missing=read('.tmp/missing.json');
const meanings={...read('.tmp/meanings.json'),
 'はい、わかります':'Vâng, tôi hiểu.',
 'もう 一度 お願いします':'Xin nói / làm lại một lần nữa.',
 '例':'Ví dụ',
 'わかりますか':'Anh/chị có hiểu không?',
};
let count=0;
const summary=[];
for(let n=0;n<=25;n++){
 const p=`data/mnn1/lesson-${n}.json`, L=read(p), before=L.vocab.length;
 for(const e of source.entries.filter(e=>e.l.includes(n)||(n===0&&(e.x||!e.l.length)))){
  const i=indexWord(e); let word=matchingVocab(e,L.vocab);
  if(!word){
   const m=missing.find(m=>m.lesson===n&&vocabKey(m.jp)===vocabKey(i.jp));
   const vi=meanings[i.jp]||m?.vi;
   if(!vi)throw new Error(`Missing meaning ${n}: ${i.jp}`);
   word={jp:i.jp.replace(/^ー/,'〜'),kana:i.kana.replace(/^ー/,'〜'),vi,type:e.na?'Tính từ な':m?.type||(/ます$/.test(i.kana)?'Động từ':'Từ vựng'),src:'L'};
   L.vocab.push(word);count++;
  }
  if(e.na) word.type='Tính từ な';
  const context=(e.w||e.h).match(/\[([^\]]*[~〜～][^\]]*)\]/)?.[1];
  if(context && !/^[~〜～、,\s]+$/.test(context)){
   const usage=context.replace(/[~〜～]/g,i.jp);
   if(!word.usage)word.usage=[];
   if(!word.usage.includes(usage))word.usage.push(usage);
  }
 }
 // A few words have different meanings in these particular lesson contexts.
 const contextual={
 4:{'〜から':'Từ ~ (mốc bắt đầu)','そちら':'Phía đó, chỗ anh/chị (lịch sự)'},
 11:{'います':'Có (người, động vật); ở lại (trong mẫu 日本にいます)'},
 14:{'出ます':'Ra khỏi (phòng, quán…); xuống (taxi)','入ります':'Vào (phòng, quán…)','あれ':'Ơ? (thán từ khi ngạc nhiên)','もう〜':'Thêm ~ nữa (ví dụ もう一度: thêm một lần)'},
 17:{'飲みます':'Uống (thuốc)','入ります':'Vào, tắm bồn (おふろに入ります)'},
 19:{'でも':'Nhưng, tuy nhiên'},
 21:{'月':'Mặt trăng'},
 22:{'こちら':'Phía này, chỗ này; cái này (lịch sự)','します':'Đeo, mang (cà vạt: ネクタイをします)'},
 23:{'聞きます':'Hỏi (đường, cách làm…); nghe','出ます':'Ra (tiền thừa, kết quả…)','角':'Góc đường, chỗ rẽ'},
 25:{'取ります':'Lấy; thêm tuổi (年を取ります: già đi)'}
 }[n]||{};
 for(const w of L.vocab){
  const original=missing.find(m=>m.lesson===n&&vocabKey(m.jp)===vocabKey(w.jp));
  if(original&&meanings[original.jp])w.vi=meanings[original.jp];
  if(contextual[w.jp])w.vi=contextual[w.jp];
  if(w.kana==='2、3にち')w.kana='に、さんにち';
  if(w.kana==='2、3〜')w.kana='に、さん〜';
 }
 // Aliases preserve the exact index form for numeral expressions.
 for(const w of L.vocab){if(w.jp==='2、3日')w.aliases=['2、3にち'];if(w.jp==='2、3〜')w.aliases=['2、3〜'];}
 if(n===0){
  L.listening[3].tts[2].t='それでは、また あとで。';
  L.listening[3].tts[2].vi='Vậy thì hẹn gặp lại sau nhé.';
 }
 summary.push({lesson:n,before,after:L.vocab.length});
 fs.writeFileSync(p,JSON.stringify(L,null,1)+'\n');
}
console.log(JSON.stringify(summary));console.log('Added:',count);
