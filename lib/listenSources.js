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
  // dữ liệu ghi rõ (data/book): A.tts[i] = lời đọc của track thứ i; A.ttsFrom[i] = "4_08" | "5_08+5_12" | "3_64:3-8" (lời thoại track khác, có thể chỉ lấy câu 3→8)
  if (A?.tts?.[i]?.length) return A.tts[i].filter(say).map(line);
  if (A?.ttsFrom?.[i]) {
    const l = A.ttsFrom[i].split("+").flatMap((x) => {
      const [k, r] = x.split(":"), ls = byTrack?.[k] || [];
      if (!r) return ls;
      const [a, b] = r.split("-").map(Number);
      return ls.slice(a, b + 1);
    });
    if (l.length) return l;
  }
  const words = Array.isArray(A?.words) ? A.words : A?.words?.items || [];
  const lists = [A?.items, A?.text, A?.model, A?.notes, words].map((a) => (a || []).filter((l) => say(l)).map(line)).filter((a) => a.length);
  const per = lists.find((a) => a.length === n && n > 1); // mỗi track một câu (vd. 5 track ↔ 5 câu bài tập)
  if (per) return [per[i]];
  if (lists[0]) return lists[0];
  if (byTrack?.alt?.[t]?.length) return byTrack.alt[t];
  // "nghe rồi nói theo" (track thứ hai thường là bản có khoảng lặng để nói đuổi) → đọc lại lời thoại của chính hoạt động
  if (A?.kind === "listen-say" && A.scripts?.length) return A.scripts.flatMap(scriptLines);
  return [];
}

// Số track của một lời thoại: sc.audio "4_08" · tên "4_08 ① 地獄谷温泉" · gộp nhiều track "4_36–4_40" / "5_18-21"
// → { tracks, split }: split = số câu chia đều cho từng track (mỗi track một nút phát); không chia đều được thì cả lời thoại là một nút
const RANGE = /^(\d+)_(\d+)\s*[–-]\s*(?:(\d+)_)?(\d+)(?!\d)/;
export function scriptTracks(sc) {
  const src = [sc?.audio, sc?.title].find((x) => typeof x === "string" && RANGE.test(x));
  if (src) {
    const [, a, b, c, d] = src.match(RANGE);
    if (!c || c === a) {
      const tracks = [];
      for (let k = +b; k <= +d && tracks.length < 20; k++) tracks.push(`${a}_${String(k).padStart(b.length, "0")}`);
      if (tracks.length > 1) return { tracks, split: (sc.lines?.length || 0) % tracks.length === 0 };
    }
  }
  const one = sc?.audio || (typeof sc?.title === "string" && sc.title.match(/^(\d+_\d+)(?![\d_])(?!\s*[–-]\s*\d)/)?.[1]);
  return { tracks: one ? [one] : [], split: false };
}
export function tracksScripts(B) {
  const m = {};
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o.scripts)) for (const sc of o.scripts) {
      if (!sc?.lines?.length) continue;
      const { tracks, split } = scriptTracks(sc), all = scriptLines(sc), per = all.length / tracks.length;
      tracks.forEach((k, j) => { if (!m[k]) m[k] = split ? all.slice(j * per, (j + 1) * per) : all; });
    }
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
