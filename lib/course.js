// Khung khóa học dùng chung (A2-2, A2/B1…): đơn vị bài × 7 phần, boss mỗi Topic, kỳ thi chứng chỉ
// Từ vựng/kanji/mẫu ngữ pháp theo sách; câu ví dụ, bài đọc, câu hỏi được viết mới.
import { shuffle } from "@/lib/data";
import { MONSTER_ASSET } from "@/lib/bosses";

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
export const STAR_REWARD = 20; // Nguyên Thạch cho mỗi sao mới đạt được ở một phần
export const bossIconUrl = (b) => `${MONSTER_ASSET}${b.icon}.png`;

// file audio của một bài nghe: A2/B1 ghi sẵn "file"; A2-2 ghép từ src + track ("Katsudou/004.mp3" | "Rikai/004.mp3")
export const trackFile = (it) => it.file || `${it.src === "R" ? "Rikai" : "Katsudou"}/${it.track}.mp3`;
export const trackLabel = (it) => (it.src ? `${it.src === "R" ? "Rikai" : "Katsudou"} ${it.track}` : `Track ${it.track}`);

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
    const rd = readingOf(v), exp = `${v.jp}${rd ? `（${rd}）` : ""} — ${v.vi}`;
    return i % 2 === 0
      ? mc(v.jp, v.vi, others.map((x) => x.vi), { sub: rd ? `Chọn nghĩa · ${rd}` : "Chọn nghĩa tiếng Việt", jpPrompt: true, explain: exp })
      : mc(v.vi, v.jp, others.map((x) => x.jp), { sub: "Chọn từ tiếng Nhật", jpOpts: true, explain: exp });
  });
}

export function kanjiQs(L, n = 10, pool = L.kanji) {
  const ks = shuffle(pool).slice(0, n);
  return ks.map((k, i) =>
    i % 2 === 0 || !pool.some((x) => x.k !== k.k)
      ? mc(k.k, k.r, k.wr || pool.filter((x) => x.r !== k.r).map((x) => x.r), { sub: `${HAS_KANJI.test(k.k) ? "Đọc kanji" : "Đọc chữ"} · ${k.vi}`, jpPrompt: true, jpOpts: true, explain: `${k.k}（${k.r}）— ${k.vi}` })
      : mc(k.r, k.k, pool.filter((x) => x.k !== k.k).map((x) => x.k), { sub: `${HAS_KANJI.test(k.k) ? "Chọn cách viết kanji" : "Chọn cách viết"} · ${k.vi}`, jpPrompt: true, jpOpts: true, explain: `${k.r} → ${k.k} — ${k.vi}` }),
  );
}

// Ngữ pháp: đọc câu ví dụ, chọn nghĩa tiếng Việt đúng
export function grammarQs(L, n = 8, pool = L.grammar) {
  const ex = pool.flatMap((g) => g.examples.map((e) => ({ ...e, point: g.point })));
  return shuffle(ex).slice(0, n).map((e) => mc(e.jp, e.vi, ex.filter((x) => x.vi !== e.vi).map((x) => x.vi), { sub: `Chọn nghĩa đúng · ${e.point}`, jpPrompt: true, explain: `${e.point}: ${e.vi}` }));
}

// nghĩa tiếng Việt (viAfter) chỉ hiện SAU khi trả lời — hiện trước có thể lộ đáp án
export const fillQs = (L, n = 10, pool = L.fill) =>
  shuffle(pool).slice(0, n).map((f) => ({ q: f.q, opts: shuffle(f.opts), answer: f.opts[f.a], viAfter: f.vi, explain: f.hint }));

export const orderQs = (L, n = 6, pool = L.order) => shuffle(pool).slice(0, n).map((o) => ({ chunks: o.chunks, vi: o.vi }));

// Mỗi câu hỏi nghe là một mục riêng (một bài nghe có thể có 1–3 câu)
export function listenQs(L, n = 8, pool = L.listening) {
  const qs = pool.flatMap((it) => it.questions.map((q) => ({ item: it, q })));
  return shuffle(qs).slice(0, n).map(({ item, q }) => ({ item, prompt: q.q, opts: shuffle(q.opts), answer: q.opts[q.a], explain: q.explain }));
}

const shuffleQs = (qs) => qs.map((q) => { const opts = shuffle(q.opts); return { ...q, opts, a: opts.indexOf(q.opts[q.a]) }; });
const toQ = (x) => ({ q: x.prompt ?? x.q, opts: x.opts, a: x.opts.indexOf(x.answer), explain: x.explain });

export const EXAM_SECTIONS = [
  { key: "lang", jp: "言語知識（文字・語彙・文法）", vi: "Kiến thức ngôn ngữ", minutes: 25 },
  { key: "read", jp: "読解", vi: "Đọc hiểu", minutes: 30 },
  { key: "listen", jp: "聴解", vi: "Nghe hiểu", minutes: 30 },
];

// data: { lessons, bosses:[{topic,name,icon,el,hp}], exams:[{n,topics,name,short,sub}] }
export function makeCourse({ lessons, bosses, exams }) {
  const lessonOf = (l) => lessons.find((x) => x.lesson === l);
  const topics = [...new Set(lessons.map((x) => x.topic))].map((t) => {
    const ls = lessons.filter((x) => x.topic === t);
    return { topic: t, title: ls[0].topicTitle, vi: ls[0].topicVi, lessons: ls };
  });
  const inTopics = (ts) => lessons.filter((x) => ts.includes(x.topic));
  const pool = (Ls, k) => Ls.flatMap((L) => L[k] || []);

  // Hàng đợi boss: trộn cả 7 phần của các bài trong Topic
  function bossQueue(t) {
    const Ls = inTopics([t]), L0 = Ls[0], all = (k) => pool(Ls, k);
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

  // Đề thi: 30 câu ngôn ngữ, 3 bài đọc, 6 bài nghe
  function buildExam(ex) {
    const Ls = inTopics(ex.topics), L0 = Ls[0], all = (k) => pool(Ls, k);
    const lang = [
      ...vocabQs(L0, 10, all("vocab")).map(toQ),
      ...kanjiQs(L0, 8, all("kanji")).map(toQ),
      ...fillQs(L0, 12, all("fill")).map(toQ),
    ];
    const read = shuffle(all("reading")).slice(0, 3).map((p) => ({ ...p, questions: shuffleQs(p.questions) }));
    const listen = shuffle(all("listening").filter((it) => it.questions.length)).slice(0, 6).map((it) => ({ ...it, file: trackFile(it), questions: shuffleQs(it.questions) }));
    return { lang, read, listen };
  }

  return {
    lessons, lessonOf, topics, bosses, exams,
    bossOf: (t) => bosses.find((b) => b.topic === t),
    examOf: (n) => exams.find((e) => e.n === n),
    bossQueue, buildExam,
  };
}
