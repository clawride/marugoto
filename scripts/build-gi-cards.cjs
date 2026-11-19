// Tạo ảnh thẻ bài Genshin cho game Đấu thẻ: tải ảnh splash nhân vật (gi.yatta.moe), cắt khung dọc 3:4 ở giữa,
// lưu webp nhỏ vào public/shiki-duel/gi/<id>.webp. Chạy lại an toàn: ảnh đã có thì bỏ qua.
//   node scripts/build-gi-cards.cjs
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const GI = require("../data/genshin.json");

const OUT = path.join(__dirname, "..", "public", "shiki-duel", "gi");
const BASE = "https://gi.yatta.moe/assets/UI/";
fs.mkdirSync(OUT, { recursive: true });

async function one(c) {
  const file = path.join(OUT, c.id + ".webp");
  if (fs.existsSync(file)) return "skip";
  const r = await fetch(`${BASE}UI_Gacha_AvatarImg_${c.icon}.png`, { headers: { "User-Agent": "marugoto-card-builder" } });
  if (!r.ok) throw new Error(`${c.en}: HTTP ${r.status}`);
  const img = sharp(Buffer.from(await r.arrayBuffer()));
  const { width, height } = await img.metadata();
  const w = Math.min(width, Math.round(height * 0.75));
  await img.extract({ left: Math.round((width - w) / 2), top: 0, width: w, height })
    .resize({ width: 360, height: 480, fit: "cover", position: "top" })
    .webp({ quality: 76 }).toFile(file);
  return "ok";
}

(async () => {
  const list = GI.characters.slice();
  let ok = 0, skip = 0;
  const fail = [];
  const worker = async () => {
    for (let c = list.shift(); c; c = list.shift()) {
      try { (await one(c)) === "ok" ? ok++ : skip++; } catch (e) { fail.push(e.message); }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`done: ${ok} new, ${skip} existing, ${fail.length} failed`);
  if (fail.length) console.log(fail.join("\n"));
})();
