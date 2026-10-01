// Bài nghe tạo sẵn: cách phân giọng và mã nhận diện một kịch bản — DÙNG CHUNG cho trình duyệt (lib/listenClip.js)
// và script tạo audio (scripts/gen-listen.mjs). Không import gì ngoài voiceCast.js nên chạy được cả trong Node.
// Mã kịch bản chỉ phụ thuộc (giọng, câu chữ) từng dòng → hai kịch bản giống hệt nhau dùng chung một file.
import { FAM } from "./voiceCast.js";

export const F_POOL = ["himari", "tsumugi", "metan", "sora", "hau", "zunko", "nia", "kiritan"];
export const M_POOL = ["kurono", "ryusei", "kotaro", "suzumatsu", "saeshiro", "kenzaki", "maron", "bii"];
export const LISTEN_SPEED = 0.95; // tốc độ đọc khi tạo (hơi chậm cho người học)

export const hashStr = (s) => {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); a = Math.imul(a ^ ch, 0x01000193) >>> 0; b = Math.imul(b ^ ch, 0x5bd1e995) >>> 0; }
  return a.toString(36).padStart(7, "0") + b.toString(36).padStart(7, "0");
};

// Chuẩn hóa: bỏ dòng trống, sp mặc định "A", g chỉ nhận "m" | "f"
export const normLines = (lines) => (lines || [])
  .map((l) => ({ sp: l?.sp == null ? "A" : String(l.sp), g: l?.g === "m" || l?.g === "f" ? l.g : "", t: String(l?.t ?? "").trim() }))
  .filter((l) => l.t);

// Mỗi người nói một giọng riêng (theo giới tính g nếu có, không thì xen kẽ nữ/nam); điểm bắt đầu trong danh sách giọng đổi theo nội dung
// để các bài nghe không bài nào cũng bắt đầu bằng cùng một giọng
export function castLines(lines) {
  const L = normLines(lines);
  const seed = parseInt(hashStr(L.map((l) => l.t).join("|")).slice(0, 6), 36);
  const by = new Map();
  let nf = 0, nm = 0, alt = seed % 2;
  for (const l of L) {
    if (by.has(l.sp)) continue;
    const g = l.g || (alt++ % 2 ? "m" : "f");
    by.set(l.sp, g === "m" ? M_POOL[(seed + nm++) % M_POOL.length] : F_POOL[(seed + nf++) % F_POOL.length]);
  }
  return L.map((l) => ({ ...l, fam: by.get(l.sp) }));
}

// Mã của cả kịch bản: danh sách (giọng, câu chữ) theo thứ tự
export const listenKey = (lines) => hashStr(castLines(lines).map((l) => `${l.fam}:${l.t}`).join("\n"));
export const famName = (fam) => FAM[fam]?.n;
