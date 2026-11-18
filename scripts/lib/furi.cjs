// kana (spaced by bunsetsu) + Hepburn romaji (long vowels doubled) from Japanese text via kuromoji
const path = require("path");
const ROOT = path.join(__dirname, "..", "..", "node_modules") + "/";
const kuromoji = require(ROOT + "kuromoji");
const wanakana = require(ROOT + "wanakana");

const toHira = (s) => (s || "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const HAS_KANJI = /[㐀-鿿々〆]/;
// user dictionary for words kuromoji misreads: surface -> reading (hiragana)
const FIX = {
  "貸切": "かしきり", "貸し切り": "かしきり", "何気なく": "なにげなく", "一瞬": "いっしゅん", "我ながら": "われながら",
  "幹事": "かんじ", "猫舌": "ねこじた", "完璧": "かんぺき", "完壁": "かんぺき", "取り越し苦労": "とりこしぐろう",
  "敷居": "しきい", "役不足": "やくぶそく", "力不足": "ちからぶそく", "目上": "めうえ", "見慣れた": "みなれた",
  "一日中": "いちにちじゅう",
  "下手": "へた", "上手": "じょうず",
  "読み仮名": "よみがな", "日本人": "にほんじん", "正しくは": "ただしくは", "一週間": "いっしゅうかん", "何だった": "なんだった", "何でしょう": "なんでしょう", "何ですか": "なんですか", "一人": "ひとり", "二人": "ふたり", "三年目": "さんねんめ", "半年目": "はんとしめ",
  "日本": "にほん", "テイワット": "テイワット", "パイモン": "パイモン", "一つとして": "ひとつとして", "一度として": "いちどとして", "一言": "ひとこと", "人の間": "ひとのあいだ", "水場": "みずば", "市場": "いちば", "他ならぬ": "ほかならぬ", "一晩": "ひとばん", "破れる": "やぶれる", "観察に通った": "かんさつにかよった", "通っていった": "とおっていった", "長い間": "ながいあいだ", "一級": "いっきゅう", "何でも": "なんでも", "一匹": "いっぴき", "的の": "まとの", "璃月": "りーゆえ", "映影": "えいえい", "初代": "しょだい", "座長": "ざちょう", "形無し": "かたなし", "型破り": "かたやぶり", "稽古場": "けいこば", "鳴神": "なるかみ", "稲妻": "いなずま", "一本": "いっぽん", "一度": "いちど", "一日": "いちにち", "一日として": "いちにちとして", "一人として": "ひとりとして", "弟子入り": "でしいり", "御社": "おんしゃ", "当社": "とうしゃ", "商習慣": "しょうしゅうかん", "年目": "ねんめ", "港町": "みなとまち", "関西中": "かんさいじゅう", "辛口": "からくち", "甘口": "あまくち",
};

let T = null;
function init() {
  return new Promise((res, rej) => kuromoji.builder({ dicPath: ROOT + "kuromoji/dict" }).build((e, t) => (e ? rej(e) : ((T = t), res()))));
}
const isPunct = (t) => t.pos === "記号" || /^[、。「」『』（）()！？!?…・：:　\s—―〜～“”"]+$/.test(t.surface_form);
function tokenReading(t) {
  const s = t.surface_form;
  if (!HAS_KANJI.test(s)) return s; // keep kana / katakana / latin as written
  if (FIX[s]) return FIX[s];
  if (t.reading && t.reading !== "*") return toHira(t.reading);
  return s; // unknown kanji: leave (flag later)
}
// bunsetsu-ish: content words start a new chunk
function startsChunk(t, prev) {
  if (!prev) return false;
  if (isPunct(t)) return false;
  if (prev && isPunct(prev) && /[「『（(“]/.test(prev.surface_form)) return false;
  if (["助詞", "助動詞"].includes(t.pos)) return false;
  if (t.pos_detail_1 === "接尾") return false;
  if (prev.pos === "接頭詞") return false;
  if (t.pos === "動詞" && t.pos_detail_1 === "非自立" && ["ちゃう", "じゃう", "ちゃっ", "じゃっ"].some((x) => t.surface_form.startsWith(x))) return false;
  if (t.pos === "名詞" && t.pos_detail_1 === "非自立" && ["ん", "の"].includes(t.surface_form)) return false;
  if (t.pos === "名詞" && t.pos_detail_1 === "特殊") return false;
  if (t.pos === "名詞" && prev.pos === "名詞" && t.pos_detail_1 === "数" && prev.pos_detail_1 === "数") return false;
  return true;
}
// apply FIX for multi-token surfaces by pre-replacing with placeholders
const MISSED = new Set();
function tokenize(text) {
  const keys = Object.keys(FIX).sort((a, b) => b.length - a.length);
  const tk = T.tokenize(text);
  const out = [];
  for (let i = 0; i < tk.length; i++) {
    let done = false;
    for (const k of keys) {
      let s = "", j = i;
      while (j < tk.length && s.length < k.length) s += tk[j++].surface_form;
      if (s === k) {
        out.push({ ...tk[i], surface_form: k, reading: FIX[k], fixed: true, pos: tk[i].pos === "動詞" ? "名詞" : tk[i].pos, pos_detail_1: tk[i].pos === "動詞" ? "一般" : tk[i].pos_detail_1 });
        i = j - 1; done = true; break;
      }
    }
    if (!done) out.push(tk[i]);
  }
  for (const k of keys) if (text.includes(k) && !out.some((t) => t.surface_form === k)) MISSED.add(k);
  return out;
}
const CONTR=["なさる","てる","ちゃう","じゃう","とく","どく","でる"];
const SEP_AUX=["なら","だ","です","でしょ","だろ","らしい","みたい","よう","そう"];
function joinsRomaji(t, prev) {
  if (!prev || isPunct(prev) || isPunct(t)) return false;
  if (prev.pos === "接頭詞") return true;
  const pv = ["動詞","形容詞","助動詞"].includes(prev.pos) || (prev.pos==="名詞"&&prev.pos_detail_1==="接尾"&&prev.fixed!==true&&/[るた]$/.test(prev.basic_form||""));
  if (t.pos === "助動詞" && pv && !SEP_AUX.some((x)=>t.surface_form.startsWith(x))) return true;
  if (t.pos === "助動詞" && t.surface_form==="う" ) return true;
  if (t.pos === "助詞" && t.pos_detail_1 === "接続助詞" && ["て","で","ちゃ","じゃ","ば","ながら"].includes(t.surface_form) && pv) return true;
  if (t.pos === "助詞" && ["たり","だり"].includes(t.surface_form) && pv) return true;
  if (t.pos === "動詞" && t.pos_detail_1 === "接尾") return true;
  if (t.pos === "動詞" && t.pos_detail_1 === "非自立" && CONTR.includes(t.basic_form)) return true;
  if (t.pos === "名詞" && t.pos_detail_1 === "接尾" && !/^し/.test(t.surface_form)) return true;
  return false;
}
function romaWord(toks, hira) {
  const t0 = toks[0];
  if (toks.length===1 && t0.pos === "助詞" && t0.surface_form === "は") return "wa";
  if (toks.length===1 && t0.pos === "助詞" && t0.surface_form === "へ") return "e";
  if (toks.length===1 && t0.pos === "助詞" && t0.surface_form === "を") return "o";
  let h = hira.replace(/([ぁ-ゖ])ー/g, (m, c) => { const v = wanakana.toRomaji(c).slice(-1); return c + ({ a: "あ", i: "い", u: "う", e: "え", o: "お" }[v] || ""); });
  const FS = { "てぃ": "ti", "でぃ": "di", "とぅ": "tu", "どぅ": "du", "ふぁ": "fa", "ふぃ": "fi", "ふぇ": "fe", "ふぉ": "fo", "うぃ": "wi", "うぇ": "we", "うぉ": "wo", "しぇ": "she", "ちぇ": "che", "じぇ": "je", "ゔぁ": "va", "ゔぃ": "vi", "ゔ": "vu", "ゔぇ": "ve", "ゔぉ": "vo" };
  let ro = wanakana.toRomaji(h, { customRomajiMapping: FS }).replace(/'/g,"");
  const last = toks[toks.length - 1];
  const keepFinalOu = (last.pos === "動詞" || last.pos === "形容詞") && /う$/.test(h);
  ro = keepFinalOu ? ro.replace(/ou(?!$)/g, "oo") : ro.replace(/ou/g, "oo");
  if (!toks.some((x)=>x.pos==="動詞") && toks.some((x)=>HAS_KANJI.test(x.surface_form))) ro = ro.replace(/ei/g, "ee");
  if (toks.some((x)=>x.pos_detail_1==="固有名詞") || /-(san|sama)$/.test(ro)) ro = ro.charAt(0).toUpperCase()+ro.slice(1);
  if (toks.length>1 && toks[toks.length-1].surface_form==="さん" && toks[toks.length-1].pos==="名詞") ro = ro.replace(/san$/,"-san");
  if (toks.length>1 && toks[toks.length-1].surface_form==="様") ro = ro.replace(/sama$/,"-sama");
  if (/-(san|sama)$/.test(ro)) ro = ro.charAt(0).toUpperCase()+ro.slice(1);
  return ro;
}
const PUN = (s)=>s.replace(/[、，]/g, ",").replace(/[。．]/g, ".").replace(/[？]/g, "?").replace(/[！]/g, "!").replace(/[（]/g, "(").replace(/[）]/g, ")").replace(/[：]/g, ":").replace(/　/g, " ").replace(/・/g, " ").replace(/[〜～]/g, "~").replace(/…/g,"...").replace(/[―—]/g,"-");
function furi(text, opt = {}) {
  const toks = tokenize(text);
  const chunks = [];
  let prev = null;
  const unknown = [];
  const words = []; // {toks, hira, punct}
  for (const t of toks) {
    const r = tokenReading(t);
    if (HAS_KANJI.test(r)) unknown.push(t.surface_form);
    let sc = startsChunk(t, prev);
    if (t.pos === "動詞" && t.pos_detail_1 === "非自立" && CONTR.includes(t.basic_form)) sc = false;
    if (t.pos === "名詞" && t.pos_detail_1 === "接尾" && /^し/.test(t.surface_form) && prev && prev.pos_detail_1==="サ変接続") sc = true;
    if (!chunks.length || sc) chunks.push({ kana: r });
    else chunks[chunks.length - 1].kana += r;
    if (isPunct(t)) words.push({ punct: t.surface_form });
    else if (words.length && !words[words.length-1].punct && joinsRomaji(t, prev)) { const w = words[words.length-1]; w.toks.push(t); w.hira += toHira(r); }
    else words.push({ toks: [t], hira: toHira(r) });
    prev = t;
  }
  let kana = chunks.map((c) => c.kana).join(" ").replace(/\s+([、。！？」』）…])/g, "$1").replace(/([「『（])\s+/g, "$1").replace(/\s{2,}/g, " ").trim();
  let ro = "";
  for (const w of words) {
    if (w.punct) {
      const p = w.punct;
      if (/^『/.test(p)) ro += " '";
      else if (/^』/.test(p)) ro += "'";
      else if (/^[「“（(]/.test(p)) ro += ' "'.replace('"', /[（(]/.test(p)?"(":'"');
      else if (/^[」』”]/.test(p)) ro += '"';
      else ro += PUN(p);
      continue;
    }
    const rw = romaWord(w.toks, w.hira);
    if (/ '$/.test(ro)) { /* just opened single quote */ }
    else if (ro && !/[ ("]$/.test(ro)) ro += " ";
    else if (ro && /"$/.test(ro) && (ro.match(/"/g)||[]).length % 2 === 0) ro += " ";
    ro += rw;
  }
  ro = ro.replace(/\s{2,}/g, " ").replace(/\s+([,.!?)])/g, "$1").replace(/([,.!?])(?=[A-Za-z])/g, "$1 ").replace(/' /g, (m, off, str) => (str.slice(0, off).split("'").length % 2 === 0 ? "'" : m)).trim();
  if (!opt.noCap) ro = ro.replace(/^(["'(]?)([a-z])/, (m, q, c) => q + c.toUpperCase()).replace(/((?<!\.)[.!?] ["'(]?)([a-z])/g, (m, q, c) => q + c.toUpperCase());
  ro = ro.replace(/\btoiu\b/g, "to iu").replace(/\btte(e|i)u\b/g, "tte iu").replace(/\bdooiu\b/g, "doo iu").replace(/\bnitotte\b/g, "ni totte").replace(/\bnitsuite\b/g, "ni tsuite").replace(/\b([Nn])i(yotte|yoru|yori|yoreba|taishite|taisuru|kanshite|kansuru|mukete|oite|okeru|shitagatte|kawatte|kurabete|tomonatte|watatte|wataru|motozuite|kakete|totte|matsuwaru|tomonau)\b/g, "$1i $2").replace(/\b([Ii])gaito\b/g, "$1gai to").replace(/\b([Tt])okoroga\b/g, "$1okoro ga").replace(/\b([Nn])anto\b/g, "$1an to").replace(/\b([Hh])ontooha\b/g, "$1ontoo wa");
  return { kana, ro, unknown };
}
module.exports = { init, furi, MISSED };
