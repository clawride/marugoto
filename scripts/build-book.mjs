// 📖 Học theo sách: data/book/<khóa>-*.json (mỗi file { lessons: [...] }, chép từ sách) → public/book/<khóa>/<bài>.json
//   node scripts/build-book.mjs
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SRC = path.join(ROOT, "data", "book");
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith(".json"))) {
  const course = f.split("-")[0]; // a1-katsudou.json → a1
  const D = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
  const out = path.join(ROOT, "public", "book", course);
  fs.mkdirSync(out, { recursive: true });
  for (const L of D.lessons) fs.writeFileSync(path.join(out, `${L.lesson}.json`), JSON.stringify(L));
  console.log(`${f}: ${D.lessons.length} bài → public/book/${course}/`);
}
