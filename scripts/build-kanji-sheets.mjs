// Phiếu luyện viết kanji (data/kanji-sheets-<cấp>.json): gom nét chữ (KanjiVG) của mọi chữ Hán dùng trong phiếu
// → public/kanji/strokes-sheets-<cấp>.json (mỗi cấp một file, trang phiếu tải khi cần)
//   node scripts/build-kanji-sheets.mjs
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const ALL = {};
for (const lv of ["a1", "a21", "a22", "ab1", "b1", "b12"]) Object.assign(ALL, JSON.parse(fs.readFileSync(path.join(ROOT, "public", "kanji", `strokes-${lv}.json`), "utf8")));

for (const f of fs.readdirSync(path.join(ROOT, "data")).filter((f) => /^kanji-sheets-\w+\.json$/.test(f))) {
  const lv = f.match(/^kanji-sheets-(\w+)\.json$/)[1];
  const D = JSON.parse(fs.readFileSync(path.join(ROOT, "data", f), "utf8"));
  if (!D.sheets.length) continue;
  const chars = new Set();
  const add = (s) => [...(s || "")].forEach((c) => /[一-鿿々]/.test(c) && chars.add(c));
  for (const sh of D.sheets) {
    for (const w of sh.words) { add(w.w); (w.tr || []).forEach(add); }
    for (const e of sh.ex) for (const m of e.matchAll(/〔([^|]+)\|([^〕]+)〕/g)) { add(m[1]); m[2].split("/").forEach(add); }
  }
  const out = {}, miss = [];
  for (const c of [...chars].sort()) (ALL[c] ? (out[c] = ALL[c]) : miss.push(c));
  fs.writeFileSync(path.join(ROOT, "public", "kanji", `strokes-sheets-${lv}.json`), JSON.stringify(out));
  console.log(`${lv}: ${D.sheets.length} phiếu · ${Object.keys(out).length} chữ Hán có nét${miss.length ? ` · THIẾU nét: ${miss.join("")}` : ""}`);
}
