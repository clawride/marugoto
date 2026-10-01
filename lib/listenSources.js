// Cách mỗi nơi trong trang dựng kịch bản đọc từ dữ liệu — dùng chung cho component và scripts/gen-listen.mjs để mã luôn khớp.
const txt = (l) => l?.kana || l?.jp || "";

// Bài nghe trong sách (public/book/*): các câu có tên người nói → mỗi người một giọng
export const scriptLines = (sc) => (sc?.lines || []).map((l) => ({ sp: l.sp || "", t: txt(l) }));
// Phần ghi chú (notes) và danh sách từ của một hoạt động
export const notesLines = (A) => (A?.notes || []).map((n) => ({ t: n.jp }));
export const wordLines = (A) => (A?.words?.items || []).map((w) => ({ t: w.jp }));
// Đề mẫu (問題例): g.script
export const sampleLines = (g) => (g?.script || []).map((l) => ({ sp: l.sp || "", t: txt(l) }));
