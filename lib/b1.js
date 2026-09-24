// Học Viện B1-1 (Marugoto 中級1): ngữ pháp, bài đọc dài, bài nghe theo Topic + 3 kỳ thi chứng chỉ kiểu JLPT
// Nội dung bài tập được viết mới dựa trên chủ đề, từ vựng và ngữ pháp của từng Topic.
import B1 from "@/data/b1-topics.json";
import VOCAB from "@/data/vocab.json";
import { shuffle } from "@/lib/data";

export const B1_TOPICS = B1; // [{ topic, title, titleVi, grammar, grammarQ, reading, listening }]
export const b1Topic = (t) => B1.find((x) => x.topic === t);

// 3 kỳ thi: mỗi kỳ gồm 3 Topic
export const EXAMS = [
  { n: 1, topics: [1, 2, 3], name: "Chứng Chỉ B1-1 · Cấp I", short: "Cấp I", sub: "Topic 1–3" },
  { n: 2, topics: [4, 5, 6], name: "Chứng Chỉ B1-1 · Cấp II", short: "Cấp II", sub: "Topic 4–6" },
  { n: 3, topics: [7, 8, 9], name: "Chứng Chỉ B1-1 · Cấp III", short: "Cấp III", sub: "Topic 7–9" },
];
export const examOf = (n) => EXAMS.find((e) => e.n === n);

// Cấu trúc kiểu JLPT: 3 phần, mỗi phần 0–60 điểm, có giờ và điểm sàn riêng
export const SECTIONS = [
  { key: "lang", jp: "言語知識（文字・語彙・文法）", vi: "Kiến thức ngôn ngữ", minutes: 30 },
  { key: "read", jp: "読解", vi: "Đọc hiểu", minutes: 35 },
  { key: "listen", jp: "聴解", vi: "Nghe hiểu", minutes: 30 },
];
export const PASS_TOTAL = 95, PASS_SECTION = 19, EXCELLENT = 150, MAX = 180;

// Soạn đề thi ngẫu nhiên từ 3 Topic
export function buildExam(exam) {
  const Ts = exam.topics.map(b1Topic).filter(Boolean);
  // Từ vựng: lấy từ bảng 語彙表 của các Topic tương ứng
  const vocab = VOCAB.filter((t) => exam.topics.includes(t.n)).flatMap((t) => t.sections.flatMap((s) => s.words));
  const meanings = [...new Set(vocab.map((x) => x[2]))];
  const uniq = [...new Map(vocab.map((x) => [x[0], x])).values()]; // mỗi từ chỉ hỏi một lần
  const vq = shuffle(uniq).slice(0, 12).map(([w, r, m]) => {
    const opts = shuffle([m, ...shuffle(meanings.filter((x) => x !== m)).slice(0, 3)]);
    return { type: "vocab", q: w, sub: r !== w ? r : "", opts, a: opts.indexOf(m) };
  });
  const gq = shuffle(Ts.flatMap((T) => T.grammarQ)).slice(0, 13).map((g) => {
    const opts = shuffle(g.opts);
    return { type: "grammar", q: g.q, opts, a: opts.indexOf(g.opts[g.a]), vi: g.vi, hint: g.hint };
  });
  const passages = shuffle(Ts.flatMap((T) => T.reading)).slice(0, 3).map((p) => ({ ...p, questions: p.questions.map(shuffleQ) }));
  const scripts = shuffle(Ts.flatMap((T) => T.listening)).slice(0, 5).map((s) => ({ ...s, questions: s.questions.map(shuffleQ) }));
  return { lang: [...vq, ...gq], read: passages, listen: scripts };
}
function shuffleQ(q) {
  const opts = shuffle(q.opts);
  return { ...q, opts, a: opts.indexOf(q.opts[q.a]) };
}

// Thưởng lần đầu: đỗ 1.600 Nguyên Thạch, đạt Xuất sắc thêm 800
export const REWARD_PASS = 1600, REWARD_EXCELLENT = 800;

export const certId = (n, name, date) => {
  let h = 2166136261;
  for (const ch of `${n}|${name}|${date}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `B1-${n}-${(h >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
};
