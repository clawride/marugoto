// Tải cung mệnh (tiếng Việt) của mọi nhân vật từ gi.yatta.moe → data/constellations.json
// Chạy sau fetch-genshin.mjs: node scripts/fetch-constellations.mjs
import { readFileSync, writeFileSync } from "node:fs";

const { characters } = JSON.parse(readFileSync(new URL("../data/genshin.json", import.meta.url), "utf8"));
const API = "https://gi.yatta.moe/api/v2/vi/avatar/";

// Làm sạch mô tả: giữ <color=#RRGGBB> (hiển thị màu), bỏ thẻ LINK/khác, đổi \n thành xuống dòng
const clean = (s = "") => s
  .replace(/\{LINK#[^}]*\}|\{\/LINK\}/g, "")
  .replace(/<color=#([0-9A-Fa-f]{6})[0-9A-Fa-f]{0,2}>/g, "<c#$1>")
  .replace(/<\/color>/g, "</c>")
  .replace(/<(?!\/?c[#>])[^>]+>/g, "")
  .replace(/\\n/g, "\n");

async function get(id, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(API + id, { signal: AbortSignal.timeout(30000) });
      if (r.ok) return (await r.json()).data;
    } catch {}
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  return null;
}

const out = {};
const queue = [...characters];
let done = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const c = queue.shift();
    const d = await get(c.id);
    done++;
    if (!d) { console.log("FAIL", c.en); continue; }
    out[c.id] = {
      title: d.fetter?.title || "",
      cname: d.fetter?.constellation || "",
      native: d.fetter?.native || "",
      list: Object.values(d.constellation || {}).sort((a, b) => a.id - b.id).slice(0, 6).map((x) => ({ name: x.name, desc: clean(x.description), icon: x.icon })),
    };
  }
}));
writeFileSync(new URL("../data/constellations.json", import.meta.url), JSON.stringify(out));
console.log(`constellations: ${Object.keys(out).length}/${characters.length}`);
