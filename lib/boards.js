// Danh sách bảng xếp hạng — dùng chung cho client và server
import VOCAB from "@/data/vocab.json";

const SEC_VI = { all: "Toàn bộ Topic", prep: "Chuẩn bị", p1: "Part 1", p2: "Part 2", p3: "Part 3", p4: "Part 4", p5: "Part 5", out: "Ra ngoài lớp" };

export const BOARD_GROUPS = [
  { key: "overall", label: "🏆 Tổng", boards: [{ id: "overall", label: "Điểm Mạo Hiểm" }] },
  {
    key: "vq", label: "📖 Từ vựng B1-1",
    boards: VOCAB.flatMap((T) => ["all", ...T.sections.map((s) => s.key)].map((k) => ({ id: `vq:${T.n}:${k}`, label: `Topic ${T.n} · ${SEC_VI[k] || k}` }))),
  },
  { key: "bs", label: "⚔️ Boss A2-1", boards: Array.from({ length: 18 }, (_, i) => ({ id: `bs:${i + 1}`, label: `Boss bài ${i + 1}` })) },
  { key: "ex", label: "🎓 Chứng chỉ B1-1", boards: [1, 2, 3].map((n) => ({ id: `ex:${n}`, label: `Kỳ thi Cấp ${"I".repeat(n)} (Topic ${n * 3 - 2}–${n * 3})` })) },
  { key: "ls", label: "🎧 Nghe A2-1", boards: [...Array.from({ length: 18 }, (_, i) => ({ id: `ls:${i + 1}`, label: `Bài nghe ${i + 1}` })), { id: "ls:final", label: "Ronova (boss cuối)" }] },
];
export const ALL_BOARDS = new Set(BOARD_GROUPS.flatMap((g) => g.boards.map((b) => b.id)));
export const boardLabel = (id) => BOARD_GROUPS.flatMap((g) => g.boards).find((b) => b.id === id)?.label || id;

// Điểm của một thử thách: tỉ lệ đúng trước, số câu sau (bằng tỉ lệ thì làm nhiều câu hơn xếp trên)
export const encode = (pct, total) => Math.round(pct) * 10000 + Math.min(9999, Math.max(0, Math.round(total)));
export const certsOf = (S) => Object.entries(S.b1?.ex || {}).filter(([, e]) => e.passed).map(([n, e]) => (e.excellent ? `${n}*` : `${n}`));
export const decode = (score) => ({ pct: Math.floor(score / 10000), total: score % 10000 });

const stars = (pct) => (pct >= 95 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0);

// Điểm Mạo Hiểm = 100 × tổng số sao + số câu trả lời đúng (tối đa 99.999)
export function overallOf(S) {
  let st = 0;
  Object.values(S.best || {}).forEach((b) => (st += stars(b.pct)));
  Object.values(S.boss || {}).forEach((b) => (st += b.best || 0));
  Object.entries(S.listen || {}).forEach(([k, b]) => (st += (b.best || 0) * (k === "final" ? 3 : 1)));
  Object.values(S.b1?.ex || {}).forEach((e) => (st += (e.passed ? 5 : 0) + (e.excellent ? 5 : 0)));
  return st * 100 + Math.min(99999, S.total || 0);
}

// Gom mọi kỷ lục đang có trên máy thành danh sách gửi lên server
export function entriesOf(S) {
  const out = [];
  Object.entries(S.best || {}).forEach(([k, b]) => { const m = k.match(/^t(\d+)_(\w+)$/); if (m) out.push({ board: `vq:${m[1]}:${m[2]}`, pct: b.pct, total: b.t }); });
  Object.entries(S.bossPct || {}).forEach(([l, b]) => out.push({ board: `bs:${l}`, pct: b.pct, total: b.total }));
  Object.entries(S.listenPct || {}).forEach(([l, b]) => out.push({ board: `ls:${l}`, pct: b.pct, total: b.total }));
  Object.entries(S.b1?.ex || {}).forEach(([n, e]) => { if (e.best > 0) out.push({ board: `ex:${n}`, pct: Math.round((e.best / 180) * 100), total: e.best }); });
  return out;
}
