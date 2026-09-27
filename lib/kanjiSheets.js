// Phiếu luyện viết kanji Marugoto A1 → B1-2 (theo mẫu phiếu giấy 漢字練習シート của lớp Marugoto, JF Việt Nam)
// Mỗi phiếu: trang 1 = bảng từ (chữ, cách đọc, Hán Việt, nghĩa) + hàng tô mờ + ô tập viết;
//            trang 2 = viết cách đọc / chữ Hán của phần gạch chân + bảng viết lại từng từ.
// A2/B1: chép từ phiếu PDF của JF Việt Nam · các cấp khác: soạn theo danh sách chữ Hán từng bài của giáo trình.
import A1 from "@/data/kanji-sheets-a1.json";
import A21 from "@/data/kanji-sheets-a21.json";
import A22 from "@/data/kanji-sheets-a22.json";
import AB1 from "@/data/kanji-sheets-ab1.json";
import B1 from "@/data/kanji-sheets-b1.json";
import B12 from "@/data/kanji-sheets-b12.json";

const JF = "Theo phiếu luyện viết kanji Marugoto A2/B1 của Trung tâm Giao lưu Văn hóa Nhật Bản tại Việt Nam (国際交流基金ベトナム日本文化交流センター). Đáp án bài tập do Sổ Tay Teyvat soạn thêm.";
const OWN = "Phiếu do Sổ Tay Teyvat soạn theo mẫu phiếu 漢字練習シート của lớp Marugoto, dùng danh sách chữ Hán từng bài của giáo trình.";
export const SHEET_LEVELS = [
  { id: "a1", name: "A1", full: "Marugoto 入門 A1", ico: "🍃", D: A1, credit: OWN },
  { id: "a21", name: "A2-1", full: "Marugoto 初級1 A2-1", ico: "⚡", D: A21, credit: OWN },
  { id: "a22", name: "A2-2", full: "Marugoto 初級2 A2-2", ico: "🌱", D: A22, credit: OWN },
  { id: "ab1", name: "A2/B1", full: "Marugoto 初中級 A2/B1", ico: "🌊", D: AB1, credit: JF, jf: true },
  { id: "b1", name: "B1-1", full: "Marugoto 中級1 B1-1", ico: "🎓", D: B1, credit: OWN },
  { id: "b12", name: "B1-2", full: "Marugoto 中級2 B1-2", ico: "🔥", D: B12, credit: OWN },
].filter((L) => L.D.sheets.length);
export const SHEETS = SHEET_LEVELS.flatMap((L) => L.D.sheets.map((s) => ({ ...s, lv: L.id, book: L.D.book })));
export const levelOfSheet = (sh) => SHEET_LEVELS.find((L) => L.id === sh.lv);
export const sheetsOf = (lv) => SHEETS.filter((s) => s.lv === lv);
export const sheetOf = (id) => SHEETS.find((s) => s.id === id);
export const sheetKey = (id) => (/^\d/.test(id) ? `sheet:ab1:${id}` : `sheet:${id}`); // khoá lưu điểm trong S.kanji.p (A2/B1 giữ khoá cũ)
export const topicsOf = (lv) => [...new Set(sheetsOf(lv).map((s) => s.t))];

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

// số ô tập viết của một từ = số chữ (tối thiểu 2 như phiếu gốc); từ có nhiều chữ mẫu (tr) → gom mẫu theo hàng 3 chữ mẫu
export const cellsOf = (w) => {
  if (w.tr) return Math.max(...chunk(w.tr, 3).map((row) => row.reduce((a, t) => a + [...t].length, 0)));
  return Math.max(2, [...w.w].length);
};
export function chunk(a, n) { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; }

const sCache = {};
export const loadSheetStrokes = (lv) => (sCache[lv] ||= fetch(`/kanji/strokes-sheets-${lv}.json`).then((r) => r.json()).catch(() => ({})));
