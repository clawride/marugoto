// Tách bài đọc của các khóa Minna (data/mnn1, mnn2, mnnc2) thành từng câu: [{ p: số đoạn, jp }]
//   node scripts/split-readings.mjs <thư mục ra>  → <ra>/<khóa>.json để dịch; dùng chung hàm splitSents khi gộp lại
import fs from "node:fs";
import path from "node:path";
export const DIRS = ["mnn1", "mnn2", "mnnc2"];
import { splitSents } from "../lib/readingSplit.js";
export { splitSents };
if (process.argv[1]?.endsWith("split-readings.mjs")) {
  const outDir = process.argv[2]; fs.mkdirSync(outDir, { recursive: true });
  let total = 0;
  for (const dir of DIRS) {
    const items = [];
    for (const f of fs.readdirSync(`data/${dir}`).filter((f) => /^lesson-\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(7)) - parseInt(b.slice(7)))) {
      const L = JSON.parse(fs.readFileSync(`data/${dir}/${f}`, "utf8"));
      (L.reading || []).forEach((R, ri) => { const s = splitSents(R.text); total += s.length; items.push({ lesson: L.lesson, ri, title: R.title, sents: s.map((x) => ({ p: x.p, jp: x.jp, vi: "" })) }); });
    }
    fs.writeFileSync(path.join(outDir, `${dir}.json`), JSON.stringify(items, null, 1));
    console.log(dir, items.length, "bài đọc,", items.reduce((a, x) => a + x.sents.length, 0), "câu");
  }
  console.log("tổng", total, "câu");
}
