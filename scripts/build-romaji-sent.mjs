// Phiên âm Latinh cả câu cho toàn site: duyệt mọi chuỗi tiếng Nhật trong data/ (bài học, ví dụ ngữ pháp, hội thoại, bài đọc,
// giải thích kanji…), sinh romaji bằng kuromoji (scripts/lib/furi.cjs: tách từ, は→wa, を→o, trường âm viết đôi "oo")
// → public/romaji/s-XX.json (chia 64 phần theo hash của chuỗi; components/Rom.js chỉ tải phần cần dùng).
//   - chuỗi gần như toàn tiếng Nhật (câu, đoạn văn): romaji cho cả chuỗi (mỗi dòng một câu)
//   - chuỗi tiếng Việt có xen tiếng Nhật (phần giải thích): romaji cho từng đoạn tiếng Nhật trong đó
// Bỏ qua: data/book và data/library (đã có sẵn trường ro), từ vựng Genshin (quá lớn, có trang tra cứu riêng).
//   node scripts/build-romaji-sent.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { SHARDS, shardOf, segmentsOf, isMostlyJapanese } from "../lib/romajiKey.js";
import { splitSents } from "../lib/readingSplit.js";

const require = createRequire(import.meta.url);
const { init, furi } = require("./lib/furi.cjs");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JP = /[぀-ヿ㐀-鿿]/;
const SKIP_DIR = /^(book|exams)$/;
const SKIP_FILE = /genshin|notebook|vocab-index|gloss|photo|strokes|pics/;

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (!SKIP_DIR.test(f)) walk(p); }
    else if (f.endsWith(".json") && !SKIP_FILE.test(f)) files.push(p);
  }
})(path.join(root, "data"));

const want = new Set();
const sentences = new Set(); // chuỗi là câu tiếng Nhật trọn vẹn (giữ chữ hoa đầu câu); các đoạn trong phần giải thích viết thường
const visit = (x) => {
  if (typeof x === "string") {
    if (!JP.test(x)) return;
    if (isMostlyJapanese(x)) { want.add(x.trim()); sentences.add(x.trim()); for (const line of x.split("\n")) if (JP.test(line)) { want.add(line.trim()); sentences.add(line.trim()); } if (/[。！？]/.test(x)) for (const { jp } of splitSents(x)) { want.add(jp); sentences.add(jp); } }
    for (const seg of segmentsOf(x)) want.add(seg);
  } else if (Array.isArray(x)) x.forEach(visit);
  else if (x && typeof x === "object") Object.values(x).forEach(visit);
};
for (const f of files) { try { visit(JSON.parse(fs.readFileSync(f, "utf8"))); } catch (e) { console.warn("bỏ qua", f, e.message); } }
// câu điền từ: câu đã điền đáp án (hiện romaji sau khi trả lời)
const BLANK = /（s*）|(s*)|（　）/;
const addFilled = (x) => { if (Array.isArray(x)) x.forEach(addFilled); else if (x && typeof x === "object") { if (typeof x.q === "string" && BLANK.test(x.q) && Array.isArray(x.opts) && Number.isInteger(x.a) && x.opts[x.a] != null) want.add(x.q.replace(BLANK, x.opts[x.a]).trim()); Object.values(x).forEach(addFilled); } };
for (const f of [...files, ...fs.readdirSync(path.join(root, "public", "boss-matome")).map((x) => path.join(root, "public", "boss-matome", x))]) { try { const d = JSON.parse(fs.readFileSync(f, "utf8")); addFilled(d); if (f.includes("boss-matome")) visit(d); } catch {} }
// câu xếp từ (order): trang hiển thị các cụm nối bằng dấu cách
for (const f of files) {
  try {
    const d = JSON.parse(fs.readFileSync(f, "utf8"));
    const walkOrder = (x) => { if (Array.isArray(x)) x.forEach(walkOrder); else if (x && typeof x === "object") { if (Array.isArray(x.chunks)) want.add(x.chunks.join(" ")); Object.values(x).forEach(walkOrder); } };
    walkOrder(d);
  } catch {}
}

// 〔漢字|かな〕 (phiếu kanji) → phần chữ Hán; câu sơ cấp viết cách từng cụm (わたしは にほんごを…) → phiên âm từng cụm
// để kuromoji không tách sai chữ kana liền nhau; câu viết liền → phân tích cả câu.
const HAS_KANJI = /[㐀-鿿々]/;
const plain = (s) => s.replace(/〔([^|〕]+)\|([^〕]+)〕/g, (m, a, b) => (HAS_KANJI.test(a) ? a : b));
function romaLine(line) {
  const t = plain(line).trim();
  const chunks = t.split(/[\s　]+/).filter(Boolean);
  if (chunks.length < 2) return furi(t).ro;
  const out = chunks.map((c, i) => (JP.test(c) ? furi(c, { noCap: i > 0 }).ro : c)).join(" ");
  return out.replace(/\s+([,.!?)])/g, "$1").replace(/^(["'(]?)([a-z])/, (m, q, c) => q + c.toUpperCase()).replace(/([.!?] ["'(]?)([a-z])/g, (m, q, c) => q + c.toUpperCase());
}
// thêm bản đã bỏ 〔|〕 (trang hiển thị bản này)
for (const s of [...want]) if (/〔[^|〕]+\|[^〕]+〕/.test(s)) { const p = plain(s).trim(); want.add(p); if (sentences.has(s)) sentences.add(p); }

await init();
const shards = Array.from({ length: SHARDS }, () => ({}));
let n = 0, bad = 0;
for (const s of want) {
  if (!s) continue;
  let ro;
  try {
    ro = s.split("\n").map((line) => (JP.test(line) ? romaLine(line) : line)).join("\n");
  } catch { bad++; continue; }
  ro = ro.replace(/\bwo(?=[a-z])/g, "o ").replace(/\b([Aa])no u\b/g, "$1noo").replace(/\b([Dd])eha\b/g, "$1e wa").replace(/\b([Nn])iha\b/g, "$1i wa").replace(/\b([Tt])oha\b/g, "$1o wa");
  if (!ro || !/[a-z]/i.test(ro)) continue;
  if (!sentences.has(s) && !/[。！？]$/.test(s)) ro = ro.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
  shards[shardOf(s)][s] = ro;
  n++;
}
const out = path.join(root, "public", "romaji");
fs.mkdirSync(out, { recursive: true });
shards.forEach((m, i) => fs.writeFileSync(path.join(out, `s-${String(i).padStart(2, "0")}.json`), JSON.stringify(m)));
console.log(`romaji câu: ${n} chuỗi từ ${files.length} tệp → public/romaji/ (${SHARDS} phần)${bad ? `, lỗi ${bad}` : ""}`);
