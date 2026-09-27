// Phiếu luyện viết kanji Marugoto A2/B1: gom nét chữ (KanjiVG) của mọi chữ Hán dùng trong phiếu → public/kanji/strokes-sheets-ab1.json
//   node scripts/build-kanji-sheets.mjs
// Dữ liệu phiếu: data/kanji-sheets-ab1.json (chép từ phiếu PDF của JF Việt Nam; đáp án bài tập tự soạn)
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const D = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "kanji-sheets-ab1.json"), "utf8"));
const ALL = {};
for (const lv of ["a1", "a21", "a22", "ab1", "b1", "b12"]) Object.assign(ALL, JSON.parse(fs.readFileSync(path.join(ROOT, "public", "kanji", `strokes-${lv}.json`), "utf8")));

const chars = new Set();
const add = (s) => [...(s || "")].forEach((c) => /[一-鿿々]/.test(c) && chars.add(c));
for (const sh of D.sheets) {
  for (const w of sh.words) { add(w.w); (w.tr || []).forEach(add); }
  for (const e of sh.ex) for (const m of e.matchAll(/〔([^|]+)\|([^〕]+)〕/g)) { add(m[1]); m[2].split("/").forEach(add); }
}
const out = {}, miss = [];
for (const c of [...chars].sort()) (ALL[c] ? (out[c] = ALL[c]) : miss.push(c));
fs.writeFileSync(path.join(ROOT, "public", "kanji", "strokes-sheets-ab1.json"), JSON.stringify(out));
console.log(`${D.sheets.length} phiếu · ${Object.keys(out).length} chữ Hán có nét${miss.length ? ` · THIẾU nét: ${miss.join("")}` : ""}`);
