// Sổ Tay Mạo Hiểm · Từ Vựng: gom từ vựng của mọi sách Marugoto (A1, A2-1, A2-2, A2/B1, B1-1)
// B1-1 giữ nguyên mã Topic 1–9 (tương thích kỷ lục cũ "t1_all"…); sách khác dùng mã "a22-3"…
import VOCAB from "@/data/vocab.json";
import NB from "@/data/notebook.json"; // sinh bởi scripts/build-notebook.mjs (chỉ phần từ vựng)
import { SEC, TOPIC_VI, TOPIC_EL } from "@/lib/data";

const EL_ORDER = ["anemo", "pyro", "electro", "hydro", "dendro", "cryo", "geo", "electro", "pyro"];
const SRC = { K: "かつどう", R: "りかい", L: "Danh sách từ", B: "Từ trong sách", X: "Từ bổ sung" };

// Chia từ của một Topic thành các phần theo bài + nguồn
function fromCourse(book, lessons) {
  const topics = [...new Set(lessons.map((l) => l.topic))];
  return topics.map((t) => {
    const Ls = lessons.filter((l) => l.topic === t);
    const sections = [];
    for (const L of Ls) {
      const groups = {};
      for (const [jp, kana, vi, src] of L.vocab) (groups[src] ||= []).push([jp, kana, vi]);
      for (const [src, words] of Object.entries(groups)) {
        const one = Ls.length === 1;
        const key = `l${L.lesson}${src.toLowerCase()}`;
        const name = one ? SRC[src] : `Bài ${L.lesson} · ${SRC[src]}`;
        sections.push({ key, sub: `${L.title} — ${L.titleVi}`, words, meta: { ico: one ? SRC[src].slice(0, 4) : `BÀI ${L.lesson}`, vi: name, jp: one ? "" : L.title } });
      }
    }
    return { id: `${book.id}-${t}`, book: book.id, n: t, title: Ls[0].topicTitle, vi: Ls[0].topicVi, el: EL_ORDER[(t - 1) % 9], sections };
  });
}

export const BOOKS = [
  { id: "a1", name: "A1", full: "Marugoto 入門 A1", ico: "🍃" },
  { id: "a21", name: "A2-1", full: "Marugoto 初級1 A2-1", ico: "⚡" },
  { id: "a22", name: "A2-2", full: "Marugoto 初級2 A2-2", ico: "🌱" },
  { id: "ab1", name: "A2/B1", full: "Marugoto 初中級 A2/B1", ico: "🌊" },
  { id: "b1", name: "B1-1", full: "Marugoto 中級1 B1-1", ico: "🎓" },
];
const DATA = NB;

export const NB_TOPICS = [
  ...BOOKS.filter((b) => DATA[b.id]).flatMap((b) => fromCourse(b, DATA[b.id])),
  ...VOCAB.map((T) => ({ id: String(T.n), book: "b1", n: T.n, title: T.title, vi: TOPIC_VI[T.n], el: TOPIC_EL[T.n], sections: T.sections })),
];
export const topicsOf = (book) => NB_TOPICS.filter((t) => t.book === book);
export const nbTopic = (id) => NB_TOPICS.find((t) => t.id === String(id));
export const bookOf = (T) => BOOKS.find((b) => b.id === T.book);
export const secOf = (T, key) => (key === "all" ? SEC.all : T.sections.find((s) => s.key === key)?.meta || SEC[key] || SEC.all);
export const topicLabel = (T) => (T.book === "b1" ? `Topic ${T.n}` : `${bookOf(T).name} · Topic ${T.n}`);

// Danh sách từ của một phần (hoặc "all" = cả Topic, không trùng)
export function nbWords(id, key) {
  const T = nbTopic(id);
  if (!T) return [];
  const mk = ([w, r, m]) => ({ w, r, m, t: T.id, el: T.el });
  if (key !== "all") { const s = T.sections.find((x) => x.key === key); return s ? s.words.map(mk) : []; }
  const seen = new Set(), out = [];
  T.sections.forEach((s) => s.words.forEach((x) => { if (!seen.has(x[0])) { seen.add(x[0]); out.push(mk(x)); } }));
  return out;
}

// Nghĩa gây nhiễu: trong cùng Topic trước, thiếu thì lấy cùng sách
export function meaningsNear(id) {
  const T = nbTopic(id);
  const same = T ? T.sections.flatMap((s) => s.words.map((w) => w[2])) : [];
  const book = T ? topicsOf(T.book).flatMap((x) => x.sections.flatMap((s) => s.words.map((w) => w[2]))) : [];
  return { same, book };
}

export const NB_TOTAL = new Set(NB_TOPICS.flatMap((t) => t.sections.flatMap((s) => s.words.map((w) => w[0])))).size;
export const bookTotal = (book) => new Set(topicsOf(book).flatMap((t) => t.sections.flatMap((s) => s.words.map((w) => w[0])))).size;
