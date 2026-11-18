// Sinh public/romaji-dict.json: từ điển "từ/chữ Hán → cách đọc (hiragana)" để hiện phiên âm Latinh dưới các phần giải thích (components/Rom.js)
// Nguồn: từ vựng các sách (vocab.json, notebook.json, *-lessons.json), phiếu kanji, âm On/Kun của từng chữ Hán (data/kanji/lv-*.json).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const HAS_KANJI = /[㐀-鿿々]/;
const toHira = (s) => (s || "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const KANA_ONLY = /^[぀-ゟ゠-ヿー・]+$/;

const D = new Map();        // từ nhiều chữ → cách đọc (lấy cách đọc xuất hiện đầu tiên)
const single = new Map();   // một chữ Hán → danh sách cách đọc
const add = (jp, kana) => {
  jp = (jp || "").trim(); kana = toHira((kana || "").trim());
  if (!jp || !kana || !HAS_KANJI.test(jp) || jp.length < 2 || !KANA_ONLY.test(kana)) return;
  if (!D.has(jp)) D.set(jp, kana);
};

// vocab.json: [{ n, sections: [{ words: [[jp, kana, vi]] }] }]
for (const t of rd("data/vocab.json")) for (const s of t.sections) for (const w of s.words) add(w[0], w[1]);
// notebook.json: { a1: [{ vocab: [[jp, kana, vi, src]] }] }
const NB = rd("data/notebook.json");
for (const book of Object.values(NB)) for (const L of book) for (const w of L.vocab || []) add(w[0], w[1]);
// *-lessons.json: [{ vocab: [{ jp, kana }] }]
for (const f of fs.readdirSync(path.join(root, "data")).filter((x) => /-lessons\.json$/.test(x))) {
  const a = rd(`data/${f}`);
  for (const L of Array.isArray(a) ? a : a.lessons || []) for (const w of L.vocab || []) if (w && w.jp) add(w.jp, w.kana);
}
// phiếu kanji: words [{ w, r }]
for (const book of ["mnn1", "mnn2", "mnnc2"]) {
  for (const file of fs.readdirSync(path.join(root, "data", book)).filter((f) => /^lesson-\d+\.json$/.test(f))) {
    for (const v of rd(`data/${book}/${file}`).vocab || []) add(v.jp.replace(/\s/g, ""), v.kana.replace(/\s/g, ""));
  }
}
for (const f of fs.readdirSync(path.join(root, "data")).filter((x) => /^kanji-sheets-.*\.json$/.test(x))) {
  for (const sh of rd(`data/${f}`).sheets || []) for (const w of sh.words || []) add(w.w, w.r);
}
// từng chữ Hán: On/Kun + các từ ví dụ
for (const f of fs.readdirSync(path.join(root, "data/kanji")).filter((x) => /^lv-.*\.json$/.test(x))) {
  for (const E of Object.values(rd(`data/kanji/${f}`))) {
    const rs = [...(E.on || []).slice(0, 2).map(toHira), ...(E.kun || []).slice(0, 2).map((k) => toHira(k.split(".")[0].replace(/-/g, "")))].filter((r) => r && KANA_ONLY.test(r));
    if (E.k && rs.length) single.set(E.k, [...new Set(rs)].slice(0, 3));
    for (const w of E.words || []) add(w.w, w.r);
  }
}

const out = { w: Object.fromEntries(D), k: Object.fromEntries(single) };
fs.writeFileSync(path.join(root, "public/romaji-dict.json"), JSON.stringify(out));
console.log(`romaji-dict.json: ${D.size} từ, ${single.size} chữ Hán`);
