// 📚 Thư viện sách: data/library/<sách>/NN.json (bài) + x-<id>.json (trang tra cứu) → public/library/<sách>/<bài|id>.json
// + public/library/<sách>/vocab.json (mọi từ vựng các bài, gộp trùng, ghi bài xuất hiện) để trang "Tra cứu từ vựng" dùng.
//   node scripts/build-library.mjs   (chạy tự động trước khi build — xem package.json "prebuild")
// Dữ liệu lỗi (nối từ không ra câu, thiếu trường…) → dừng lại. Kiểm tra kỹ hơn: node scripts/check-library.mjs
import fs from "fs";
import path from "path";

process.argv.push("--nokuro"); // đóng gói nhanh: bỏ phần đối chiếu cách đọc bằng kuromoji
const { checkLesson, checkExtra } = await import("./check-library.mjs");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SRC = path.join(ROOT, "data", "library");
const OUT = path.join(ROOT, "public", "library");

let bad = 0;
for (const book of fs.readdirSync(SRC).filter((d) => fs.statSync(path.join(SRC, d)).isDirectory() && !d.startsWith("_"))) {
  const dir = path.join(SRC, book), out = path.join(OUT, book);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const vocab = new Map();
  let lessons = 0, extras = 0;
  for (const f of fs.readdirSync(dir).sort()) {
    const lesson = /^\d+\.json$/.test(f), extra = /^x-.+\.json$/.test(f);
    if (!lesson && !extra) continue;
    const { E, L } = await (lesson ? checkLesson : checkExtra)(path.join(dir, f));
    if (E.length) { bad += E.length; console.error(`✗ ${book}/${f}:\n  ` + E.slice(0, 8).join("\n  ") + (E.length > 8 ? `\n  … và ${E.length - 8} lỗi nữa` : "")); continue; }
    if (extra) { fs.writeFileSync(path.join(out, `${L.id}.json`), JSON.stringify(L)); extras++; continue; }
    fs.writeFileSync(path.join(out, `${L.n}.json`), JSON.stringify(L));
    lessons++;
    for (const v of L.vocab) {
      const k = `${v.w}|${v.r || ""}`;
      if (!vocab.has(k)) vocab.set(k, { w: v.w, r: v.r || "", ro: v.ro, vi: v.vi, en: v.en || "", ls: [] });
      const e = vocab.get(k);
      if (!e.ls.includes(L.n)) e.ls.push(L.n);
    }
  }
  const list = [...vocab.values()].sort((a, b) => (a.r || a.w).localeCompare(b.r || b.w, "ja"));
  fs.writeFileSync(path.join(out, "vocab.json"), JSON.stringify(list));
  console.log(`📚 ${book}: ${lessons} bài, ${extras} trang tra cứu, ${list.length} từ vựng → public/library/${book}/`);
}
if (bad) { console.error(`\n✗ Thư viện sách: ${bad} lỗi dữ liệu — sửa rồi chạy lại (chi tiết: node scripts/check-library.mjs)`); process.exit(1); }
