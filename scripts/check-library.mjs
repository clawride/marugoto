// 📚 Kiểm tra dữ liệu Thư viện sách: data/library/<sách>/NN.json
//   node scripts/check-library.mjs            → kiểm tra mọi bài của it-b2
//   node scripts/check-library.mjs 3 7        → chỉ bài 3 và 7
//   node scripts/check-library.mjs --book=it-b2 --nokuro
// LỖI (phải sửa): JSON hỏng, thiếu trường, nối các từ không ra đúng câu, token có chữ Hán mà thiếu cách đọc…
// CẢNH BÁO (nên xem): phiên âm Latinh không khớp cách đọc, kuromoji đọc khác (kuromoji cũng hay sai — chỉ để tham khảo)
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const wanakana = require("wanakana");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

const KANJI = /[㐀-鿿々〆ヶ]/;
const PUNCT = /^[\s、。！？!?「」『』（）()・…〜～:：，,.．\-—/]+$/;
const EXT = { ティ: "ti", ディ: "di", トゥ: "tu", ドゥ: "du", テュ: "tyu", デュ: "dyu", ファ: "fa", フィ: "fi", フェ: "fe", フォ: "fo", フュ: "fyu", ヴァ: "va", ヴィ: "vi", ヴェ: "ve", ヴォ: "vo", ヴ: "vu", ウィ: "wi", ウェ: "we", ウォ: "wo", ツァ: "tsa", ツェ: "tse", ツォ: "tso", シェ: "she", ジェ: "je", チェ: "che" };
const EXT_RE = new RegExp(Object.keys(EXT).sort((a, b) => b.length - a.length).join("|"), "g");
const roma = (s) => wanakana.toRomaji(wanakana.toKatakana(s || "").replace(EXT_RE, (m) => ` ${EXT[m]} `))
  .replace(/\s+/g, "").replace(/([aeiou])-/g, "$1$1");
// so sánh "lỏng": bỏ dấu cách/dấu nháy/gạch, coi ou = oo, ei = ee (trường âm hay viết khác nhau)
const canon = (s) => String(s || "").toLowerCase().normalize("NFKC").replace(/[^a-z]/g, "").replace(/ou/g, "oo").replace(/ei/g, "ee").replace(/nb/g, "mb").replace(/np/g, "mp").replace(/nm/g, "mm");
const isHira = (s) => /^[ぁ-ゖー]+$/.test(s);

let tokenizer = null;
async function kuro() {
  if (tokenizer || process.argv.includes("--nokuro")) return tokenizer;
  const kuromoji = require("kuromoji");
  tokenizer = await new Promise((res, rej) => kuromoji.builder({ dicPath: path.join(ROOT, "node_modules", "kuromoji", "dict") }).build((e, t) => (e ? rej(e) : res(t))));
  return tokenizer;
}
const kuroRead = (w) => tokenizer ? wanakana.toHiragana(tokenizer.tokenize(w).map((t) => (t.reading && t.reading !== "*" ? t.reading : t.surface_form)).join("")) : null;

// kiểm tra một câu; where = "grammar[1].ex[0]"…
export function checkSentence(s, where, E, W) {
  if (!s || typeof s !== "object") return E.push(`${where}: không phải object`);
  for (const k of ["jp", "ro", "vi"]) if (!s[k] || typeof s[k] !== "string") E.push(`${where}: thiếu "${k}"`);
  if (/〇|○/.test(s.jp || "")) E.push(`${where}: câu có 〇〇 — chỉ dùng câu hoàn chỉnh`);
  if (!Array.isArray(s.words) || !s.words.length) return E.push(`${where}: thiếu "words"`);
  const joined = s.words.map((w) => w.w ?? "").join("");
  if (joined !== s.jp) E.push(`${where}: nối từ ≠ câu\n      jp:   ${s.jp}\n      nối:  ${joined}`);
  let roAll = "";
  // trợ từ は trong では/には/とは… phải phiên âm "wa" (không phải "deha", "niha"…)
  const BAD_WA = /\b(de|ni|to|e|kara|made|yori|no)ha\b/i;
  if (BAD_WA.test(s.ro || "")) W.push(`${where}: romaji "${(s.ro.match(BAD_WA) || [])[0]}" — trợ từ は đọc "wa"`);
  s.words.forEach((t) => { if (t.ro && BAD_WA.test(t.ro) && /は/.test(t.w || "")) W.push(`${where} "${t.w}": romaji "${t.ro}" — trợ từ は đọc "wa"`); });
  s.words.forEach((t, i) => {
    const at = `${where}.words[${i}] "${t.w}"`;
    if (!t.w) return E.push(`${at}: thiếu "w"`);
    if (PUNCT.test(t.w)) return;
    if (!t.ro) E.push(`${at}: thiếu "ro"`);
    if (!t.vi) E.push(`${at}: thiếu "vi"`);
    if (!t.pos) W.push(`${at}: thiếu "pos"`);
    if (KANJI.test(t.w)) {
      if (!t.r) E.push(`${at}: có chữ Hán nhưng thiếu "r" (cách đọc)`);
      else if (!isHira(t.r)) E.push(`${at}: "r" phải là hiragana: ${t.r}`);
    } else if (t.r && t.r !== t.w && !/[A-Za-z0-9]/.test(t.w)) W.push(`${at}: không có chữ Hán, nên bỏ "r"`);
    // phiên âm khớp cách đọc?
    const src = t.r || t.w;
    if (t.ro && /^[ぁ-ゖァ-ヺー・]+$/.test(src)) {
      let exp = roma(src);
      if (t.pos === "trợ từ") exp = exp.replace(/^ha$/, "wa").replace(/^he$/, "e").replace(/^wo$/, "o");
      if (/^(ha|wa)$/.test(roma(src)) && t.w === "は") exp = "wa";
      const got = canon(t.ro), want = canon(exp);
      // cụm có trợ từ は/を bên trong (ではない, を問わず…): chấp nhận "wa"/"o"
      const loose = /[はを]/.test(src) ? canon(roma(src.replace(/は/g, "わ").replace(/を/g, "お"))) : want;
      if (got !== want && got !== loose && got !== want.replace(/ha$/, "wa").replace(/wo$/, "o")) W.push(`${at}: ro "${t.ro}" ≠ cách đọc "${src}" (${exp})`);
    }
    if (t.r && KANJI.test(t.w) && tokenizer) {
      const k = kuroRead(t.w);
      if (k && k !== t.r && canon(roma(k)) !== canon(roma(t.r))) W.push(`${at}: r "${t.r}" — kuromoji đọc "${k}"`);
    }
    roAll += " " + (t.ro || "");
  });
  if (s.ro && canon(s.ro) !== canon(roAll)) W.push(`${where}: "ro" cả câu khác ghép phiên âm từng từ\n      câu: ${s.ro}\n      từ:  ${roAll.trim()}`);
}

export async function checkLesson(file) {
  const E = [], W = [];
  let L;
  try { L = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); } catch (e) { return { E: [`JSON hỏng: ${e.message}`], W, L: null }; }
  await kuro();
  if (!L.n) E.push(`thiếu "n"`);
  for (const k of ["scene"]) if (!L[k]) E.push(`thiếu "${k}"`);
  for (const k of ["people", "goals", "grammar", "phrases", "vocab", "tips"]) if (!Array.isArray(L[k])) E.push(`thiếu mảng "${k}"`);
  (L.grammar || []).forEach((g, i) => {
    const at = `grammar[${i}]`;
    for (const k of ["p", "ro", "vi", "form", "use"]) if (!g[k]) E.push(`${at}: thiếu "${k}"`);
    if (!Array.isArray(g.ex) || g.ex.length < 2) E.push(`${at}: cần ít nhất 2 câu ví dụ "ex"`);
    (g.ex || []).forEach((s, j) => checkSentence(s, `${at}.ex[${j}]`, E, W));
  });
  const ng = (L.grammar || []).length;
  if (ng < 3 || ng > 10) E.push(`grammar: cần 3–10 mẫu câu (đang có ${ng})`);
  if (!L.dialog?.lines?.length) E.push(`thiếu "dialog.lines"`);
  (L.dialog?.lines || []).forEach((s, i) => { if (!s.sp) E.push(`dialog.lines[${i}]: thiếu "sp"`); checkSentence(s, `dialog.lines[${i}]`, E, W); });
  (L.phrases || []).forEach((p, i) => { if (!p.h) E.push(`phrases[${i}]: thiếu "h"`); (p.items || []).forEach((s, j) => checkSentence(s, `phrases[${i}].items[${j}]`, E, W)); });
  const seen = new Set();
  (L.vocab || []).forEach((v, i) => {
    const at = `vocab[${i}] "${v.w}"`;
    if (!v.w || !v.ro || !v.vi) E.push(`${at}: cần w, ro, vi`);
    if (KANJI.test(v.w || "") && !v.r) E.push(`${at}: có chữ Hán nhưng thiếu "r"`);
    if (v.r && !isHira(v.r.replace(/[～〜()（）・\s]/g, "").replace(/[ァ-ヺ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)))) W.push(`${at}: "r" nên là hiragana: ${v.r}`);
    if (seen.has(v.w)) W.push(`${at}: trùng`);
    seen.add(v.w);
  });
  if ((L.vocab || []).length < 25) W.push(`vocab: chỉ có ${(L.vocab || []).length} từ (nên 30–50)`);
  return { E, W, L };
}

// trang tra cứu thêm x-*.json: { id, jp, vi, intro, blocks: [{ t: "text"|"table"|"sent"|"people", … }] }
export async function checkExtra(file) {
  const E = [], W = [];
  let X;
  try { X = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); } catch (e) { return { E: [`JSON hỏng: ${e.message}`], W, L: null }; }
  await kuro();
  for (const k of ["id", "jp", "vi"]) if (!X[k]) E.push(`thiếu "${k}"`);
  if (!Array.isArray(X.blocks) || !X.blocks.length) E.push(`thiếu "blocks"`);
  (X.blocks || []).forEach((b, i) => {
    const at = `blocks[${i}]`;
    if (b.t === "text") { if (!Array.isArray(b.p)) E.push(`${at}: text cần mảng "p"`); }
    else if (b.t === "table") {
      if (!Array.isArray(b.head) || !Array.isArray(b.rows)) E.push(`${at}: table cần "head" và "rows"`);
      else b.rows.forEach((r, j) => { if (!Array.isArray(r) || r.length !== b.head.length) E.push(`${at}.rows[${j}]: số cột ≠ head`); });
    } else if (b.t === "sent") (b.items || []).forEach((s, j) => checkSentence(s, `${at}.items[${j}]`, E, W));
    else if (b.t === "people") (b.items || []).forEach((p, j) => { if (!p.name || !p.role) E.push(`${at}.items[${j}]: cần name, role`); });
    else E.push(`${at}: "t" không hợp lệ: ${b.t}`);
  });
  return { E, W, L: X };
}

// ——— chạy trực tiếp ———
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  const book = (process.argv.find((a) => a.startsWith("--book=")) || "--book=it-b2").slice(7);
  const dir = path.join(ROOT, "data", "library", book);
  const want = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);
  const extras = process.argv.includes("--extras");
  const files = fs.readdirSync(dir).filter((f) => (extras ? /^x-.+\.json$/.test(f) : /^\d+\.json$/.test(f) && (!want.length || want.includes(+f.slice(0, -5))))).sort();
  if (!files.length) { console.error(`Không có file nào trong ${dir}`); process.exit(1); }
  let bad = 0;
  for (const f of files) {
    const { E, W } = await (extras ? checkExtra : checkLesson)(path.join(dir, f));
    console.log(`\n== ${book}/${f}: ${E.length} lỗi, ${W.length} cảnh báo`);
    E.forEach((x) => console.log("  ✗ " + x));
    W.forEach((x) => console.log("  ! " + x));
    bad += E.length;
  }
  process.exit(bad ? 1 : 0);
}
