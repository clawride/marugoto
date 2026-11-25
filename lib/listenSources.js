// Cách mỗi nơi trong trang dựng kịch bản đọc từ dữ liệu — dùng chung cho component và scripts/gen-listen.mjs để mã luôn khớp.
const txt = (l) => l?.kana || l?.jp || "";

// Bài nghe trong sách (public/book/*): các câu có tên người nói → mỗi người một giọng
export const scriptLines = (sc) => (sc?.lines || []).map((l) => ({ sp: l.sp || "", t: txt(l) }));
// Phần ghi chú (notes) và danh sách từ của một hoạt động
export const notesLines = (A) => (A?.notes || []).map((n) => ({ t: n.jp }));
export const wordLines = (A) => (A?.words?.items || []).map((w) => ({ t: w.jp }));
// Track audio của một hoạt động khi chưa có audio sách (B1…: nhiều hoạt động chỉ ghi số track, không kèm lời thoại)
// → lời thoại cùng track ở chỗ khác trong bài; không có thì đọc nội dung của chính hoạt động (câu bài tập đã điền đáp án, đoạn văn, câu mẫu…)
// byTrack: { "3_11": [...lines] } dựng từ mọi scripts có sc.audio trong bài
export function trackLines(A, t, i, n, byTrack) {
  if (byTrack?.[t]?.length) return byTrack[t];
  const say = (l) => txt(l) || (typeof l?.q === "object" ? txt(l.q) : ""); // câu hỏi dạng { q: { jp, kana } }
  const line = (l) => ({ sp: l.sp || "", t: say(l) });
  const words = Array.isArray(A?.words) ? A.words : A?.words?.items || [];
  const lists = [A?.items, A?.text, A?.model, A?.notes, words].map((a) => (a || []).filter((l) => say(l)).map(line)).filter((a) => a.length);
  const per = lists.find((a) => a.length === n && n > 1); // mỗi track một câu (vd. 5 track ↔ 5 câu bài tập)
  if (per) return [per[i]];
  return lists[0] || byTrack?.alt?.[t] || [];
}
export function tracksScripts(B) {
  const m = {};
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o.scripts)) for (const sc of o.scripts) if (sc?.audio && sc.lines?.length && !m[sc.audio]) m[sc.audio] = scriptLines(sc);
    for (const k in o) if (k !== "scripts") walk(o[k]);
  };
  walk(B);
  // track dùng chung với hoạt động khác trong bài (vd. bài nối và bài điền cùng nghe 3_15–3_17) → mượn nội dung của hoạt động đó
  const alt = {};
  const walk2 = (o) => {
    if (Array.isArray(o)) return o.forEach(walk2);
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o.audio) && o.kind) o.audio.forEach((t, i) => { if (!alt[t]) { const l = trackLines(o, t, i, o.audio.length, m); if (l.length) alt[t] = l; } });
    for (const k in o) walk2(o[k]);
  };
  walk2(B);
  m.alt = alt;
  return m;
}
// Đề mẫu (問題例): g.script
export const sampleLines = (g) => (g?.script || []).map((l) => ({ sp: l.sp || "", t: txt(l) }));
