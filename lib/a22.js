// Marugoto 初級2 A2-2 (かつどう + りかい): 18 bài × 7 phần, boss mỗi Topic, 2 kỳ thi chứng chỉ
// Từ vựng/kanji/mẫu ngữ pháp theo sách; câu ví dụ, bài đọc, câu hỏi được viết mới.
import LESSONS from "@/data/a22-lessons.json";
import { shuffle } from "@/lib/data";
import { MONSTER_ASSET } from "@/lib/bosses";

export const A22 = LESSONS; // [{ lesson, topic, title, vocab, kanji, grammar, fill, order, reading, listening, … }]
export const a22Lesson = (l) => LESSONS.find((x) => x.lesson === l);
export const A22_TOPICS = [...new Set(LESSONS.map((x) => x.topic))].map((t) => {
  const ls = LESSONS.filter((x) => x.topic === t);
  return { topic: t, title: ls[0].topicTitle, vi: ls[0].topicVi, lessons: ls };
});

// 7 phần của mỗi bài
export const PARTS = [
  { key: "vocab", label: "Từ vựng", ico: "🈶", n: 10 },
  { key: "listen", label: "Nghe hội thoại", ico: "🎧", n: 8 },
  { key: "kanji", label: "Kanji", ico: "漢", n: 10 },
  { key: "read", label: "Bài đọc", ico: "📖" },
  { key: "grammar", label: "Ngữ pháp", ico: "📐", n: 8 },
  { key: "fill", label: "Điền từ", ico: "✏️", n: 10 },
  { key: "order", label: "Sắp xếp câu", ico: "🧩", n: 6 },
];
export const partOf = (k) => PARTS.find((p) => p.key === k);
export const STAR_REWARD = 20; // Nguyên Thạch cho mỗi sao mới đạt được ở một phần

// file audio của một bài nghe: "Katsudou/004.mp3" | "Rikai/004.mp3"
export const trackFile = (it) => `${it.src === "R" ? "Rikai" : "Katsudou"}/${it.track}.mp3`;

// Chỉ hiện cách đọc khi từ có chữ Hán (アニメ không cần あにめ)
export const HAS_KANJI = /[㐀-鿿々]/;
export const readingOf = (v) => (v.kana && v.kana !== v.jp && HAS_KANJI.test(v.jp) ? v.kana : "");

// ===== Soạn câu hỏi cho từng phần =====
const mc = (prompt, right, wrongs, extra = {}) => {
  const opts = shuffle([right, ...shuffle([...new Set(wrongs.filter((w) => w && w !== right))]).slice(0, 3)]);
  return { prompt, opts, answer: right, ...extra };
};

export function vocabQs(L, n = 10, pool = L.vocab) {
  const words = shuffle([...new Map(pool.map((v) => [v.jp, v])).values()]).slice(0, n);
  return words.map((v, i) => {
    const others = pool.filter((x) => x.jp !== v.jp && x.vi !== v.vi);
    return i % 2 === 0
      ? mc(v.jp, v.vi, others.map((x) => x.vi), { sub: readingOf(v) ? `Chọn nghĩa · ${readingOf(v)}` : "Chọn nghĩa tiếng Việt", jpPrompt: true, explain: `${v.jp}${readingOf(v) ? `（${readingOf(v)}）` : ""} — ${v.vi}` })
      : mc(v.vi, v.jp, others.map((x) => x.jp), { sub: "Chọn từ tiếng Nhật", jpOpts: true, explain: `${v.jp}${readingOf(v) ? `（${readingOf(v)}）` : ""} — ${v.vi}` });
  });
}

export function kanjiQs(L, n = 10, pool = L.kanji) {
  const ks = shuffle(pool).slice(0, n);
  return ks.map((k, i) =>
    i % 2 === 0 || !pool.some((x) => x.k !== k.k)
      ? mc(k.k, k.r, k.wr || pool.filter((x) => x.r !== k.r).map((x) => x.r), { sub: `Đọc kanji · ${k.vi}`, jpPrompt: true, jpOpts: true, explain: `${k.k}（${k.r}）— ${k.vi}` })
      : mc(k.r, k.k, pool.filter((x) => x.k !== k.k).map((x) => x.k), { sub: `Chọn cách viết kanji · ${k.vi}`, jpPrompt: true, jpOpts: true, explain: `${k.r} → ${k.k} — ${k.vi}` }),
  );
}

// Ngữ pháp: đọc câu ví dụ, chọn nghĩa tiếng Việt đúng
export function grammarQs(L, n = 8, pool = L.grammar) {
  const ex = pool.flatMap((g) => g.examples.map((e) => ({ ...e, point: g.point })));
  return shuffle(ex).slice(0, n).map((e) => mc(e.jp, e.vi, ex.filter((x) => x.vi !== e.vi).map((x) => x.vi), { sub: `Chọn nghĩa đúng · ${e.point}`, jpPrompt: true, explain: `${e.point}: ${e.vi}` }));
}

export const fillQs = (L, n = 10, pool = L.fill) =>
  shuffle(pool).slice(0, n).map((f) => ({ q: f.q, opts: shuffle(f.opts), answer: f.opts[f.a], vi: f.vi, explain: f.hint }));

export const orderQs = (L, n = 6, pool = L.order) => shuffle(pool).slice(0, n).map((o) => ({ chunks: o.chunks, vi: o.vi }));

// Mỗi câu hỏi nghe là một mục riêng (một bài nghe có thể có 1–3 câu)
export function listenQs(L, n = 8, pool = L.listening) {
  const qs = pool.flatMap((it) => it.questions.map((q, qi) => ({ item: it, q, first: qi === 0 })));
  return shuffle(qs).slice(0, n).map(({ item, q }) => ({ item, prompt: q.q, opts: shuffle(q.opts), answer: q.opts[q.a], explain: q.explain }));
}

// ===== Boss mỗi Topic =====
export const A22_BOSSES = [
  { topic: 1, name: "Thủy Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Water", el: "hydro", hp: 60000 },
  { topic: 2, name: "Cây Lôi Điện", icon: "UI_MonsterIcon_Regisvine_Electric", el: "electro", hp: 80000 },
  { topic: 3, name: "Hải Mã Ngàn Năm", icon: "UI_MonsterIcon_SeaHorse_Primo_Electric", el: "electro", hp: 100000 },
  { topic: 4, name: "Hoàng Đế Lửa Và Sắt", icon: "UI_MonsterIcon_HermitCrab_Primo", el: "pyro", hp: 125000 },
  { topic: 5, name: "Rồng Đá Aeonblight", icon: "UI_MonsterIcon_Gargoyle_Fafnir", el: "geo", hp: 150000 },
  { topic: 6, name: "Thuật Toán Ma Trận", icon: "UI_MonsterIcon_Monolith_Starchild", el: "anemo", hp: 180000 },
  { topic: 7, name: "Shouki no Kami", icon: "UI_MonsterIcon_Nada", el: "electro", hp: 215000 },
  { topic: 8, name: "Toan Nghê Cô Độc", icon: "UI_MonsterIcon_Hermit", el: "anemo", hp: 255000 },
  { topic: 9, name: "Hộ Vệ Ốc Đảo Apep", icon: "UI_MonsterIcon_Apep", el: "dendro", hp: 300000 },
];
export const a22Boss = (t) => A22_BOSSES.find((b) => b.topic === t);
export const a22BossIcon = (b) => `${MONSTER_ASSET}${b.icon}.png`;

// Hàng đợi boss: trộn cả 7 phần của 2 bài trong Topic
export function bossQueue(t) {
  const Ls = LESSONS.filter((x) => x.topic === t);
  const all = (k) => Ls.flatMap((L) => L[k] || []);
  const L0 = Ls[0];
  const q = [];
  vocabQs(L0, 4, all("vocab")).forEach((x) => q.push({ stage: "vocab", type: "mc", ...x }));
  kanjiQs(L0, 3, all("kanji")).forEach((x) => q.push({ stage: "kanji", type: "mc", ...x }));
  grammarQs(L0, 2, all("grammar")).forEach((x) => q.push({ stage: "grammar", type: "mc", ...x }));
  fillQs(L0, 3, all("fill")).forEach((x) => q.push({ stage: "fill", type: "fill", ...x }));
  orderQs(L0, 2, all("order")).forEach((x) => q.push({ stage: "order", type: "order", ...x }));
  listenQs(L0, 2, all("listening")).forEach((x) => q.push({ stage: "listen", type: "listen", ...x }));
  const R = shuffle(all("reading"))[0];
  if (R) shuffle(R.questions).slice(0, 2).forEach((rq) => q.push({ stage: "read", type: "read", passage: R, prompt: rq.q, opts: shuffle(rq.opts), answer: rq.opts[rq.a], explain: rq.explain }));
  return q;
}

// ===== Kỳ thi chứng chỉ (theo 2 lần テストとふりかえり của sách) =====
export const A22_EXAMS = [
  { n: 1, topics: [1, 2, 3, 4, 5], name: "Chứng Chỉ A2-2 · Cấp I", short: "Cấp I", sub: "Bài 1–10 (Topic 1–5)" },
  { n: 2, topics: [6, 7, 8, 9], name: "Chứng Chỉ A2-2 · Cấp II", short: "Cấp II", sub: "Bài 11–18 (Topic 6–9)" },
];
export const a22ExamOf = (n) => A22_EXAMS.find((e) => e.n === n);
export const A22_SECTIONS = [
  { key: "lang", jp: "言語知識（文字・語彙・文法）", vi: "Kiến thức ngôn ngữ", minutes: 25 },
  { key: "read", jp: "読解", vi: "Đọc hiểu", minutes: 30 },
  { key: "listen", jp: "聴解", vi: "Nghe hiểu", minutes: 30 },
];
const toQ = (x) => ({ q: x.prompt ?? x.q, opts: x.opts, a: x.opts.indexOf(x.answer), explain: x.explain });

export function buildA22Exam(ex) {
  const Ls = LESSONS.filter((x) => ex.topics.includes(x.topic));
  const all = (k) => Ls.flatMap((L) => L[k] || []);
  const L0 = Ls[0];
  const lang = [
    ...vocabQs(L0, 10, all("vocab")).map(toQ),
    ...kanjiQs(L0, 8, all("kanji")).map(toQ),
    ...fillQs(L0, 12, all("fill")).map((x) => ({ q: x.q, opts: x.opts, a: x.opts.indexOf(x.answer), explain: x.explain })),
  ];
  const read = shuffle(all("reading")).slice(0, 3).map((p) => ({ ...p, questions: p.questions.map((q) => { const opts = shuffle(q.opts); return { ...q, opts, a: opts.indexOf(q.opts[q.a]) }; }) }));
  const listen = shuffle(all("listening").filter((it) => it.questions.length)).slice(0, 6).map((it) => ({ ...it, file: trackFile(it), questions: it.questions.map((q) => { const opts = shuffle(q.opts); return { ...q, opts, a: opts.indexOf(q.opts[q.a]) }; }) }));
  return { lang, read, listen };
}
