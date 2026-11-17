// Kiểm tra đề boss tổng hợp: node scripts/check-matome.mjs [id…]  (mặc định: mọi file public/boss-matome/*.json)
import fs from "fs";
const DIR = new URL("../public/boss-matome/", import.meta.url);
const NUM = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const ids = process.argv.slice(2);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && (!ids.length || ids.includes(f.slice(0, -5))));
let bad = 0;
for (const f of files) {
  const E = [];
  let D; try { D = JSON.parse(fs.readFileSync(new URL(f, DIR), "utf8")); } catch (e) { console.log(`✗ ${f}: JSON hỏng ${e.message}`); bad++; continue; }
  if (D.id !== f.slice(0, -5)) E.push(`id "${D.id}" ≠ tên file`);
  if (!Array.isArray(D.sections) || D.sections.length !== 7) E.push(`cần đúng 7 sections (đang ${D.sections?.length})`);
  let total = 0;
  (D.sections || []).forEach((s, si) => {
    const at = `sections[${si}]`;
    if (!s.title || !s.sub) E.push(`${at}: thiếu title/sub`);
    if (!s.items?.length) E.push(`${at}: thiếu items`);
    (s.items || []).forEach((it, ii) => {
      const w = `${at}.items[${ii}]`;
      const mcq = (x, ww) => { if (!Array.isArray(x.opts) || x.opts.length < 3) E.push(`${ww}: cần ≥3 opts`); else { if (!(x.a >= 0 && x.a < x.opts.length)) E.push(`${ww}: a sai`); if (new Set(x.opts).size !== x.opts.length) E.push(`${ww}: opts trùng`); } if (!x.explain) E.push(`${ww}: thiếu explain`); };
      if (it.type === "fill") { if ((it.q.match(/（　）/g) || []).length !== 1) E.push(`${w}: q phải có đúng 1 chỗ trống （　）`); mcq(it, w); if (!it.vi) E.push(`${w}: thiếu vi`); total++; }
      else if (it.type === "passage") {
        const marks = [...it.text.matchAll(/（([①-⑳])）/g)].map((m) => NUM.indexOf(m[1]));
        if (marks.length !== it.blanks?.length) E.push(`${w}: số （①）… (${marks.length}) ≠ số blanks (${it.blanks?.length})`);
        if (marks.some((v, i) => v !== i)) E.push(`${w}: các chỗ trống phải đánh số ①②③… theo thứ tự`);
        (it.blanks || []).forEach((b, bi) => mcq(b, `${w}.blanks[${bi}]`));
        if (!it.vi) E.push(`${w}: thiếu vi`); total += it.blanks?.length || 0;
      } else if (it.type === "order") { if (!Array.isArray(it.chunks) || it.chunks.length < 3) E.push(`${w}: cần ≥3 chunks`); if (new Set(it.chunks).size !== it.chunks.length) E.push(`${w}: chunks trùng nhau`); if (!it.vi) E.push(`${w}: thiếu vi`); total++; }
      else if (it.type === "read") { if (!it.text || !it.vi) E.push(`${w}: thiếu text/vi`); if (!(it.statements?.length >= 4)) E.push(`${w}: cần ≥4 statements`); (it.statements || []).forEach((x, xi) => { if (!x.s || typeof x.a !== "boolean" || !x.explain || !x.vi) E.push(`${w}.statements[${xi}]: cần s, a (true/false), vi, explain`); }); total += it.statements?.length || 0; }
      else E.push(`${w}: type không hợp lệ "${it.type}"`);
    });
  });
  if (total < 30 || total > 45) E.push(`tổng số câu tính điểm = ${total} (nên 30–45)`);
  console.log(`${E.length ? "✗" : "✓"} ${f}: ${total} câu${E.length ? "\n  " + E.join("\n  ") : ""}`);
  bad += E.length;
}
process.exit(bad ? 1 : 0);
