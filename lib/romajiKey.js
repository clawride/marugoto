// Dùng chung giữa scripts/build-romaji-sent.mjs (sinh dữ liệu) và components/Rom.js (tra cứu):
// cách chia phần theo hash, cách tách các đoạn tiếng Nhật trong một câu tiếng Việt.
export const SHARDS = 64;
// FNV-1a 32-bit
export function shardOf(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h % SHARDS;
}
const JPCH = /[぀-ヿ㐀-鿿々〆ー〜～]/g;
// Đoạn tiếng Nhật liền nhau (cho phép 、「」 ở giữa) trong một chuỗi tiếng Việt
const SEG = /[぀-ヿ㐀-鿿々〆ー〜～][぀-ヿ㐀-鿿々〆ー〜～、。「」『』！？]*/g;
export function segmentsOf(text) {
  const out = new Set();
  for (const m of String(text || "").matchAll(SEG)) {
    const seg = m[0].replace(/[、。「」『』！？]+$/, "").replace(/^[「『]/, "");
    if (seg && !/^[ー〜～]+$/.test(seg)) out.add(seg);
  }
  return [...out];
}
// Chuỗi gần như toàn tiếng Nhật (câu, đoạn văn, lời thoại) → hiện romaji cả câu
export function isMostlyJapanese(text) {
  const s = String(text || "").replace(/[\s0-9０-９、。「」『』（）()！？!?・…―—〜～:：,.\-→⇒/／]/g, "");
  if (!s) return false;
  const jp = (s.match(JPCH) || []).length;
  return jp / s.length >= 0.7;
}
