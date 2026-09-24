// Cung mệnh (tiếng Việt) — chỉ import ở trang nhân vật vì dữ liệu khá lớn
import CONS from "@/data/constellations.json";
import { ASSET } from "@/lib/genshin";

export const consOf = (id) => CONS[id] || null;
export const talentIcon = (icon) => `${ASSET}${icon}.png`;

// Tách mô tả có thẻ màu <c#RRGGBB>…</c> thành các đoạn
export function parseDesc(s = "") {
  const out = [];
  const re = /<c#([0-9A-Fa-f]{6})>([\s\S]*?)<\/c>/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index) });
    out.push({ t: m[2], c: `#${m[1]}` });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  return out;
}
