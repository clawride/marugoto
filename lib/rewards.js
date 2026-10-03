// Phần thưởng Nguyên Thạch + điểm xếp hạng cho Luyện đề thi và các bài kiểm tra có đáp án
// Đề JLPT / đề cũ 級 thưởng nhiều hơn các bài luyện thường (đố vui: 10 / câu đúng)

// first: mỗi câu đúng lần đầu · again: làm lại câu đã từng đúng · done: lần đầu nộp hết đề
// pass: lần đầu đỗ · great: lần đầu đạt ≥ 90% điểm tối đa · rank: điểm xếp hạng (Điểm Mạo Hiểm) khi đỗ, +5 nếu xuất sắc
export const EXAM_RW = {
  jlpt: { first: 20, again: 5, done: 100, pass: 800, great: 400, rank: 8 },
  kyu: { first: 25, again: 6, done: 150, pass: 1000, great: 500, rank: 10 },
};
// mult: hệ số do quản trị đặt (0–5, mặc định 1) — nhân mọi khoản thưởng Nguyên Thạch, không đổi điểm xếp hạng
export const examRw = (E, mult = 1) => {
  const b = E?.kind === "kyu" ? EXAM_RW.kyu : EXAM_RW.jlpt, m = Number.isFinite(+mult) ? Math.max(0, +mult) : 1;
  const x = (v) => Math.round(v * m);
  return { ...b, first: x(b.first), again: x(b.again), done: x(b.done), pass: x(b.pass), great: x(b.great), mult: m };
};
export const examRankOf = (id) => (String(id).startsWith("kyu") ? EXAM_RW.kyu.rank : EXAM_RW.jlpt.rank);

// bài kiểm tra trong khóa học (có đáp án): 10 Nguyên Thạch cho mỗi câu đúng MỚI so với kỷ lục cũ của phần đó
export const TEST_PER_CORRECT = 10;
