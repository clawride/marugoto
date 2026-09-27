// Danh sách từ vựng cho truyện nhân vật & trò chuyện: tách từ mọi câu (3 mức) bằng kuromoji → từ điển chung
// public/vn/dict.json { id: [từ gốc, cách đọc hiragana, romaji, nghĩa tiếng Việt, nguồn Marugoto ("a21-5"…) hoặc ""] }
// và gắn vào từng câu trong public/vn/<id>.json: w: { "1": [id…], "2": […], "3": […] } (lựa chọn/đáp án trò chuyện: w, rw)
//   node scripts/build-vocab.mjs                 → tạo lại dict.json + gắn w; ghi danh sách từ chưa có nghĩa vào data/vocab-vi-todo.tsv
// Nghĩa tiếng Việt của từ ngoài Marugoto lấy từ data/vocab-vi.tsv (từ gốc ⇥ cách đọc ⇥ nghĩa).
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const kuromoji = require("kuromoji");
const wanakana = require("wanakana");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const VN = path.join(ROOT, "public", "vn");
const DATA = path.join(ROOT, "data");
const tokenizer = await new Promise((res, rej) => kuromoji.builder({ dicPath: path.join(ROOT, "node_modules", "kuromoji", "dict") }).build((e, t) => (e ? rej(e) : res(t))));

const hira = (s) => wanakana.toHiragana(s || "", { passRomaji: true });
// wanakana đọc sai các âm katakana ghép (ティ → "tei", ファ → "fua", ウェ → "ue") → đổi trước các âm này
const EXT = { ティ: "ti", ディ: "di", トゥ: "tu", ドゥ: "du", テュ: "tyu", デュ: "dyu", ファ: "fa", フィ: "fi", フェ: "fe", フォ: "fo", フュ: "fyu", ヴァ: "va", ヴィ: "vi", ヴェ: "ve", ヴォ: "vo", ヴ: "vu", ウィ: "wi", ウェ: "we", ウォ: "wo", ツァ: "tsa", ツェ: "tse", ツォ: "tso" };
const EXT_RE = new RegExp(Object.keys(EXT).sort((a, b) => b.length - a.length).join("|"), "g");
const roma = (s) => wanakana.toRomaji(wanakana.toKatakana(s || "").replace(EXT_RE, (m) => ` ${EXT[m]} `))
  .replace(/\s+/g, "").replace(/'/g, "")
  .replace(/([aeiou])-/g, "$1$1") // ティー → "tii" (dấu kéo dài sau âm ghép)
  .replace(/(konnichi|konban)ha$/, "$1wa"); // lời chào: は đọc "wa"

// ——— từ vựng Marugoto: từ gốc / cách đọc → [nghĩa, nguồn] (bài đầu tiên xuất hiện) ———
const MG = new Map();
// giáo trình ghi động từ ở thể ます (はなします) → thêm cả thể từ điển (話す/はなす) để đối chiếu với từ trong truyện.
// Hai bảng: MG = theo chữ viết (có kanji) · MGK = theo cách đọc, CHỈ dùng cho từ viết bằng kana
// (tránh ghép nhầm từ đồng âm khác nghĩa: 跳ねる ≠ 羽根, 橋 ≠ 箸)
// MGK = từ sách viết bằng kana · MGR = cách đọc của từ sách viết bằng kanji (chỉ dùng khi truyện viết từ đó bằng kana)
const MGK = new Map(), MGR = new Map();
const HASK = (s) => /[一-鿿々]/.test(s);
const put = (m, k, v) => { if (k && !m.has(k)) m.set(k, v); };
const clean = (s) => (s || "").replace(/[（(].*?[)）]|〜|～|\s/g, "").trim();
const base = (key) => {
  const content = tokenizer.tokenize(key).filter((t) => !["助詞", "助動詞", "記号"].includes(t.pos));
  return content.length === 1 && content[0].basic_form && content[0].basic_form !== "*" ? content[0].basic_form : null;
};
const readOf = (w) => hira(tokenizer.tokenize(w).map((x) => x.reading || "").join(""));
const addMG = (jp, kana, vi, src) => {
  const v = [vi, src], J = clean(jp), K = clean(kana);
  if (J && HASK(J)) {
    put(MG, J, v); const b = base(J); if (b) put(MG, b, v);
    if (K) { put(MGR, K, v); const bk = base(K); if (bk) put(MGR, bk, v); }
    if (b) put(MGR, readOf(b), v);
  } else if (J || K) {
    const w = J || K; put(MGK, w, v);
    const b = base(w); if (b) { put(MGK, b, v); put(MGK, readOf(b), v); }
  }
};
// từ có kanji: chỉ khớp đúng chữ (khớp theo cách đọc sẽ nhầm từ đồng âm: 橋 ≠ はし "đũa") · từ viết bằng kana: khớp cả cách đọc
const findMG = (lemma, kana) => (HASK(lemma) ? MG.get(lemma) : MGK.get(lemma) || MGR.get(lemma) || MGK.get(kana) || MGR.get(kana));
// truyện viết kanji (顔) nhưng sách viết kana (かお): chỉ coi là cùng từ khi nghĩa tiếng Việt có chung ít nhất một tiếng
// (顔 "khuôn mặt" ~ かお "Mặt" ✓ · 橋 "cây cầu" ≠ はし "đũa" ✗)
const SYL = (s) => new Set(String(s || "").toLowerCase().replace(/[（(].*?[)）]/g, " ").split(/[^\p{L}]+/u).filter((x) => x && !["sự", "việc", "của", "và", "là", "được", "cho", "với", "rất"].includes(x)));
const sameSense = (a, b) => { const A = SYL(a); return [...SYL(b)].some((x) => A.has(x)); };
const NB = JSON.parse(fs.readFileSync(path.join(DATA, "notebook.json"), "utf8"));
for (const book of ["a1", "a21", "a22", "ab1", "b12"]) for (const L of NB[book] || []) for (const [jp, kana, vi] of L.vocab) addMG(jp, kana, vi, `${book}-${L.lesson}`);
for (const T of JSON.parse(fs.readFileSync(path.join(DATA, "vocab.json"), "utf8"))) for (const s of T.sections) for (const [jp, kana, vi] of s.words) addMG(jp, kana, vi, `b1-${T.n}`);

// ——— nghĩa tiếng Việt đã dịch cho từ ngoài Marugoto ———
const VI = new Map();
const viFile = path.join(DATA, "vocab-vi.tsv");
// cột 4 (không bắt buộc): cách đọc đúng khi máy đoán sai (ví dụ 辛い: からい ↔ つらい)
if (fs.existsSync(viFile)) for (const line of fs.readFileSync(viFile, "utf8").split(/\r?\n/)) { const [w, r, vi, fix] = line.split("\t"); if (w && vi) VI.set(`${w}\t${r}`, { vi: vi.trim(), fix: (fix || "").trim() }); }

// ——— tách từ ———
const KEEP = (t) => {
  if (/^[\s\p{P}\p{S}ー〜～…・]+$/u.test(t.surface_form)) return false;
  if (["助詞", "助動詞", "記号", "フィラー", "その他", "接頭詞", "感動詞"].includes(t.pos)) return false;
  const lemma = t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form;
  if (/^[぀-ゟ]$/.test(lemma)) return false; // mảnh 1 chữ hiragana (ちゃ, え…) thường là tách sai
  if (t.pos === "名詞" && ["非自立", "接尾", "数", "代名詞", "固有名詞"].includes(t.pos_detail_1)) return false;
  if ((t.pos === "動詞" || t.pos === "形容詞") && t.pos_detail_1 !== "自立") return false;
  if (t.pos === "動詞" && ["する", "いる", "ある", "なる", "くる", "来る", "できる"].includes(t.basic_form)) return false;
  return true;
};
const lemmaReading = new Map();
function readingOf(lemma, tok) {
  if (/^[぀-ゟ]+$/.test(lemma)) return lemma;
  if (/^[゠-ヿ]+$/.test(lemma)) return hira(lemma);
  if (lemma === tok.surface_form && tok.reading) return hira(tok.reading);
  if (!lemmaReading.has(lemma)) {
    const ts = tokenizer.tokenize(lemma);
    lemmaReading.set(lemma, ts.every((x) => x.reading) ? hira(ts.map((x) => x.reading).join("")) : "");
  }
  return lemmaReading.get(lemma) || (tok.reading ? hira(tok.reading) : "");
}

// từ cùng chữ khác nghĩa mà kuromoji hay đọc sai: chọn cách đọc theo các từ xung quanh trong câu
const SENSE = [
  ["間", "ま", /いつの間|間もな|茶の間|床の間|束の間|瞬く間|あっという間|間違|間合い/],
  ["間", "あいだ", /間/], // 旅の間・この間・二人の間 … (máy hay đọc nhầm thành ま)
  ["辛い", "からい", /料理|味|食|唐辛子|辣|スープ|鍋|ソース|舌|チリ|香辛|スパイス|激辛|甘い|塩|グゥオパァー|絶雲|におい|匂|辛いもの|辛さ|ピリ|ぴり|煮|ぽかぽか|香菱|万民堂|重雲|うまい|辛すぎ/],
];
const senseReading = (lemma, jp) => { for (const [w, r, re] of SENSE) if (w === lemma && re.test(jp)) return r; return null; };
// bản dịch theo từ gốc (để tìm theo cách đọc đã sửa ở cột 4)
const VI_BY_LEMMA = new Map();
for (const [k, v] of VI) { const [w, r] = k.split("\t"); if (!VI_BY_LEMMA.has(w)) VI_BY_LEMMA.set(w, []); VI_BY_LEMMA.get(w).push({ r, ...v }); }
const viOf = (lemma, kana) => VI.get(`${lemma}\t${kana}`) || (VI_BY_LEMMA.get(lemma) || []).find((x) => x.fix === kana) || null;

const FAKE = new Set(["うい"]); // うう → "憂い"
const dict = new Map(); // "từ gốc\tđọc" → { id, lemma, kana, ex }
const words = (jp, names) => {
  const out = [];
  // câu mức A1 viết cách chữ theo cụm → tách từng cụm riêng (hiragana liền nhau dễ bị tách sai)
  const toks = jp.split(/[\s　]+/).filter(Boolean).flatMap((chunk) => tokenizer.tokenize(chunk));
  for (const t of toks) {
    if (!KEEP(t)) continue;
    if (/^[ぁぃぅぇぉゃゅょっゎァィゥェォャュョッ]/.test(t.surface_form)) continue; // mảnh bắt đầu bằng chữ nhỏ = tách sai
    if (t.word_type === "UNKNOWN" && /^[぀-ゟ]+$/.test(t.surface_form)) continue; // hiragana không có trong từ điển
    const lemma = t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form;
    if (names.has(lemma) || names.has(t.surface_form)) continue;
    if (/^[ぁ-ゖ]+$/.test(t.surface_form) && FAKE.has(lemma)) continue; // tiếng kêu (うう…) bị máy hiểu nhầm thành từ
    const guess = senseReading(lemma, jp) || readingOf(lemma, t);
    const tr = viOf(lemma, guess);
    if (tr?.vi === "-") continue; // người dịch đánh dấu "-" = mảnh tách sai, bỏ
    const kana = tr?.fix || guess;
    const key = `${lemma}\t${kana}`;
    if (!dict.has(key)) dict.set(key, { id: dict.size, lemma, kana, guess, ex: jp });
    const id = dict.get(key).id;
    if (!out.includes(id)) out.push(id);
  }
  return out;
};
const tag = (t, names) => { const w = {}; for (const k of ["1", "2", "3"]) if (t?.[k]?.jp) w[k] = words(t[k].jp, names); return w; };

const files = fs.readdirSync(VN).filter((f) => /^\d+\.json$/.test(f));
const ids = (w) => ["1", "2", "3"].flatMap((k) => w?.[k] || []);
const per = []; // từ theo từng nhân vật · từng chương (cho Sổ Tay "Từ vựng thêm có trong Genshin Impact")
for (const f of files) {
  const p = path.join(VN, f), D = JSON.parse(fs.readFileSync(p, "utf8"));
  const names = new Set([...(D.names || []), "旅人", "パイモン", "オイラ"]);
  for (const C of D.chapters) for (const n of C.nodes) {
    n.w = tag(n.t, names);
    for (const ch of n.choices || []) ch.w = tag(ch.t, names);
  }
  for (const T of D.chat || []) for (const tu of T.turns) {
    tu.w = tag(tu.t, names);
    for (const o of tu.opts) { o.w = tag(o.t, names); o.rw = tag(o.r, names); }
  }
  per.push({ c: D.id ?? +f.split(".")[0], name: D.name || "", s: [
    ...D.chapters.map((C) => [`c${C.c}`, C.title?.jp || "", C.title?.vi || "", C.nodes.flatMap((n) => [...ids(n.w), ...(n.choices || []).flatMap((ch) => ids(ch.w))])]),
    ["chat", "会話", "Trò chuyện", (D.chat || []).flatMap((T) => T.turns.flatMap((tu) => [...ids(tu.w), ...tu.opts.flatMap((o) => [...ids(o.w), ...ids(o.rw)])]))],
  ] });
  if (!process.argv.includes("--dry")) fs.writeFileSync(p, JSON.stringify(D, null, 1)); // --dry: chỉ đếm, không ghi file truyện
}

// ——— từ điển chung + danh sách còn thiếu nghĩa ———
const out = {}, todo = [];
let inMG = 0, withVI = 0;
for (const e of dict.values()) {
  const own = viOf(e.lemma, e.guess)?.vi || "";
  let mg = findMG(e.lemma, e.kana);
  let fuzzy = false; // ghép theo nghĩa: giữ nghĩa theo truyện, vẫn ghi nguồn bài Marugoto
  if (!mg && HASK(e.lemma)) { const k = MGK.get(e.kana); if (k && sameSense(own, k[0])) { mg = k; fuzzy = true; } }
  const vi = mg ? (fuzzy && own) || mg[0] : own;
  if (mg) inMG++; else if (vi) withVI++; else todo.push(`${e.lemma}\t${e.guess}\t${e.ex}`);
  // từ katakana (クローバー): giữ nguyên katakana làm cách đọc — đổi sang hiragana sẽ ra "くろうばあ" rất lạ
  const kana = /^[゠-ヿー]+$/.test(e.lemma) ? e.lemma : e.kana;
  out[e.id] = [e.lemma, kana, roma(kana), vi, mg ? mg[1] : ""];
}
fs.writeFileSync(path.join(VN, "dict.json"), JSON.stringify(out));
fs.writeFileSync(path.join(DATA, "vocab-vi-todo.tsv"), todo.join("\n"));

// ——— Sổ Tay "Từ vựng thêm có trong Genshin Impact": chỉ từ NGOÀI Marugoto, mỗi nhân vật một Topic,
// mỗi chương một phần (từ đã gặp ở chương trước không lặp lại) · W: id → [từ, cách đọc, nghĩa, latinh]
const W = {}, GC = [];
for (const P of per) {
  const seen = new Set(), s = [];
  for (const [key, jp, vi, list] of P.s) {
    const w = [...new Set(list)].filter((id) => !seen.has(id) && out[id] && !out[id][4] && out[id][3]);
    w.forEach((id) => { seen.add(id); W[id] = [out[id][0], out[id][1], out[id][3], out[id][2]]; });
    if (w.length) s.push([key, jp, vi, w]);
  }
  if (s.length) GC.push({ c: P.c, name: P.name, s });
}
// bản đầy đủ tải khi cần (public) + mục lục nhỏ gói vào trang (data) để trang chủ không nặng
fs.writeFileSync(path.join(VN, "genshin-vocab.json"), JSON.stringify({ W, C: GC.map((x) => ({ c: x.c, s: x.s.map(([k, , , w]) => [k, w]) })) }));
fs.writeFileSync(path.join(DATA, "genshin-vocab-index.json"), JSON.stringify({ total: Object.keys(W).length, C: GC.map((x) => ({ c: x.c, name: x.name, s: x.s.map(([k, jp, vi, w]) => [k, jp, vi, w.length]) })) }));
console.log(`Sổ Tay Genshin: ${GC.length} nhân vật · ${Object.keys(W).length} từ ngoài Marugoto`);
console.log(`${files.length} truyện · ${dict.size} từ: ${inMG} có trong Marugoto, ${withVI} ngoài Marugoto đã có nghĩa, ${todo.length} chưa có nghĩa (data/vocab-vi-todo.tsv)`);
