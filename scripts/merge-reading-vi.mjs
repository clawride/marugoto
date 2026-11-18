// Gộp bản dịch từng câu của bài đọc vào dữ liệu bài học: reading[ri].lines = [{ p, jp, vi }]
//   node scripts/merge-reading-vi.mjs <thư mục chứa mnn1.json, mnn2.json, mnnc2.json>
import fs from "node:fs";
import path from "node:path";
import { splitSents } from "../lib/readingSplit.js";

const src = process.argv[2];
for (const dir of ["mnn1", "mnn2", "mnnc2"]) {
  const f = path.join(src, `${dir}.json`);
  if (!fs.existsSync(f)) { console.log("chưa có", f); continue; }
  const T = JSON.parse(fs.readFileSync(f, "utf8"));
  let n = 0, miss = 0;
  for (const t of T) {
    const lf = `data/${dir}/lesson-${t.lesson}.json`;
    const L = JSON.parse(fs.readFileSync(lf, "utf8"));
    const R = L.reading?.[t.ri];
    const cur = splitSents(R?.text);
    if (!R || cur.length !== t.sents.length || cur.some((x, i) => x.jp !== t.sents[i].jp)) { console.log("✗ không khớp", lf, t.ri); miss++; continue; }
    R.lines = t.sents.map((x) => ({ p: x.p, jp: x.jp, vi: x.vi || "" }));
    n += R.lines.length;
    fs.writeFileSync(lf, JSON.stringify(L, null, 1));
  }
  console.log(dir, n, "câu", miss ? `· ${miss} bài không khớp` : "");
}
