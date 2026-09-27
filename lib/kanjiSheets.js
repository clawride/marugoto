// Phiếu luyện viết kanji Marugoto A2/B1 (theo phiếu PDF của JF Việt Nam): 9 Topic × 2 phiếu
// Mỗi phiếu: trang 1 = bảng từ (chữ, cách đọc, Hán Việt, nghĩa) + hàng tô mờ + ô tập viết;
//            trang 2 = viết cách đọc / chữ Hán của phần gạch chân + bảng viết lại từng từ.
import D from "@/data/kanji-sheets-ab1.json";

export const SHEET_BOOK = D.book;
export const SHEET_CREDIT = D.credit;
export const SHEETS = D.sheets;
export const sheetOf = (id) => SHEETS.find((s) => s.id === id);
export const sheetKey = (id) => `sheet:ab1:${id}`; // khoá lưu điểm trong S.kanji.p
export const TOPICS = [...new Set(SHEETS.map((s) => s.t))];

const HAS_KANJI = /[一-鿿々]/;
// "〔せんしゅう|先週〕の…" → [{ text: "せんしゅう", ans: ["先週"], kind: "write" }, "の…"]
export function parseEx(s) {
  const out = []; let last = 0;
  for (const m of s.matchAll(/〔([^|]+)\|([^〕]+)〕/g)) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push({ text: m[1], ans: m[2].split("/"), kind: HAS_KANJI.test(m[1]) ? "read" : "write" });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

// so đáp án: bỏ khoảng trắng, số toàn góc → số thường, katakana → hiragana (khi hỏi cách đọc)
const toHalf = (s) => s.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
const toHira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const norm = (s, kind) => { const t = toHalf((s || "").replace(/[\s　、。,.]/g, "")); return kind === "read" ? toHira(t) : t; };
export const checkAns = (input, blank) => blank.ans.some((a) => norm(a, blank.kind) === norm(input, blank.kind));

// số ô tập viết của một từ = số chữ (tối thiểu 1); từ có nhiều chữ mẫu (tr) → gom mẫu theo hàng 3 chữ mẫu
export const cellsOf = (w) => {
  if (w.tr) return Math.max(...chunk(w.tr, 3).map((row) => row.reduce((a, t) => a + [...t].length, 0)));
  return Math.max(2, [...w.w].length); // chữ đơn vẫn rộng 2 ô như phiếu gốc (đủ chỗ cho nghĩa)
};
export function chunk(a, n) { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; }

let sCache = null;
export const loadSheetStrokes = () => (sCache ||= fetch("/kanji/strokes-sheets-ab1.json").then((r) => r.json()).catch(() => ({})));
