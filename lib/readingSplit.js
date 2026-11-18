// Tách bài đọc thành từng câu (giữ số đoạn p) — dùng chung cho scripts/split-readings.mjs và trang bài đọc
const SENT = /[^。！？!?]*[。！？!?]+[」』）)”]*|[^。！？!?]+$/g;
export function splitSents(text) {
  const out = [];
  String(text || "").split("\n").map((p) => p.trim()).filter(Boolean).forEach((para, p) => {
    for (const m of para.match(SENT) || []) { const jp = m.trim(); if (jp) out.push({ p, jp }); }
  });
  return out;
}
