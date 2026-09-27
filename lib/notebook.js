// Sổ Tay Mạo Hiểm · Từ Vựng: gom từ vựng của mọi sách Marugoto (A1, A2-1, A2-2, A2/B1, B1-1, B1-2)
// B1-1 giữ nguyên mã Topic 1–9 (tương thích kỷ lục cũ "t1_all"…); sách khác dùng mã "a22-3"…
import VOCAB from "@/data/vocab.json";
import NB from "@/data/notebook.json"; // sinh bởi scripts/build-notebook.mjs (chỉ phần từ vựng)
import GV from "@/data/genshin-vocab-index.json"; // sinh bởi scripts/build-vocab.mjs (mục lục; từ thật tải khi cần)
import { SEC, TOPIC_VI, TOPIC_EL } from "@/lib/data";
import { CHARS } from "@/lib/genshin";
import { useEffect, useState } from "react";

const EL_ORDER = ["anemo", "pyro", "electro", "hydro", "dendro", "cryo", "geo", "electro", "pyro"];
const SRC = { K: "かつどう", R: "りかい", L: "Danh sách từ", B: "Từ trong sách", X: "Từ bổ sung", J: "準備", 1: "Part 1 · 聞いてわかる", 2: "Part 2 · 会話する", 3: "Part 3 · 長く話す", 4: "Part 4 · 読んでわかる", 5: "Part 5 · 書く", S: "教室の外へ" };

// Chia từ của một Topic thành các phần theo bài + nguồn
function fromCourse(book, lessons) {
  const topics = [...new Set(lessons.map((l) => l.topic))];
  return topics.map((t) => {
    const Ls = lessons.filter((l) => l.topic === t);
    const sections = [];
    for (const L of Ls) {
      const groups = new Map(); // Map giữ đúng thứ tự phần (khóa "1","2"… của B1-2 không bị đẩy lên trước "J")
      for (const [jp, kana, vi, src] of L.vocab) { if (!groups.has(src)) groups.set(src, []); groups.get(src).push([jp, kana, vi]); }
      for (const [src, words] of groups) {
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
  { id: "b12", name: "B1-2", full: "Marugoto 中級2 B1-2", ico: "🔥" },
  { id: "gi", name: "Genshin", full: "Từ vựng thêm có trong Genshin Impact", ico: "✨", note: "Từ KHÔNG có trong Marugoto, gặp trong truyện & trò chuyện của từng nhân vật" },
];

// ——— Sổ Tay "Từ vựng thêm có trong Genshin Impact": mỗi nhân vật 1 Topic, mỗi chương 1 phần ———
const CH_ICO = (k) => (k === "chat" ? "💬" : k === "c0" ? "序" : `C${k.slice(1)}`);
const GI_TOPICS = GV.C.map((x, i) => {
  const c = CHARS.find((y) => y.id === x.c);
  return {
    id: `gi-${x.c}`, book: "gi", n: i + 1, char: c, title: x.name || c?.vi, vi: c?.vi || "", el: c?.el || "anemo", lazy: true,
    total: x.s.reduce((a, s) => a + s[3], 0),
    sections: x.s.map(([key, jp, vi, count]) => ({
      key, count, words: [],
      sub: key === "chat" ? "Từ mới trong các chủ đề trò chuyện" : `${key === "c0" ? "Chương mở đầu" : `Cung mệnh ${key.slice(1)}`} — ${vi}`,
      meta: { ico: CH_ICO(key), vi: key === "chat" ? "Trò chuyện" : key === "c0" ? "Mở đầu" : `Cung mệnh ${key.slice(1)}`, jp },
    })),
  };
}).sort((a, b) => (b.char?.rank || 0) - (a.char?.rank || 0) || (a.char?.release || 0) - (b.char?.release || 0)).map((T, i) => ({ ...T, n: i + 1 }));

// Tải từ thật (≈800KB) một lần rồi điền vào các Topic Genshin
let GV_FULL = null, gvWait = null;
export const GV_WORDS = () => GV_FULL?.W || null;
export function loadGenshinVocab() {
  if (GV_FULL) return Promise.resolve(GV_FULL);
  gvWait ||= fetch("/vn/genshin-vocab.json").then((r) => r.json()).then((d) => {
    const byC = new Map(d.C.map((x) => [`gi-${x.c}`, new Map(x.s)]));
    for (const T of GI_TOPICS) { const m = byC.get(T.id); T.sections.forEach((s) => { s.words = (m?.get(s.key) || []).map((id) => d.W[id]).filter(Boolean); }); }
    GV_FULL = d; return d;
  }).catch((e) => { gvWait = null; throw e; });
  return gvWait;
}
// Hook: trả về true khi dữ liệu của Topic đã sẵn sàng (Topic Marugoto luôn sẵn sàng)
export function useNBReady(id) {
  const lazy = String(id || "").startsWith("gi-") || id === "gi";
  const [ok, setOk] = useState(!lazy || !!GV_FULL);
  useEffect(() => { if (lazy && !GV_FULL) { let on = true; loadGenshinVocab().then(() => on && setOk(true)).catch(() => {}); return () => { on = false; }; } }, [lazy]);
  return ok;
}
const DATA = NB;

export const NB_TOPICS = [
  ...BOOKS.filter((b) => DATA[b.id]).flatMap((b) => fromCourse(b, DATA[b.id])),
  ...VOCAB.map((T) => ({ id: String(T.n), book: "b1", n: T.n, title: T.title, vi: TOPIC_VI[T.n], el: TOPIC_EL[T.n], sections: T.sections })),
  ...GI_TOPICS,
];
export const topicsOf = (book) => NB_TOPICS.filter((t) => t.book === book);
export const nbTopic = (id) => NB_TOPICS.find((t) => t.id === String(id));
export const bookOf = (T) => BOOKS.find((b) => b.id === T.book);
export const secOf = (T, key) => (key === "all" ? SEC.all : T.sections.find((s) => s.key === key)?.meta || SEC[key] || SEC.all);
export const topicLabel = (T) => (T.book === "gi" ? `Genshin · ${T.vi}` : T.book === "b1" ? `Topic ${T.n}` : `${bookOf(T).name} · Topic ${T.n}`);
export const topicCount = (T) => T.total ?? nbWords(T.id, "all").length;

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

export const NB_TOTAL = new Set(NB_TOPICS.filter((t) => !t.lazy).flatMap((t) => t.sections.flatMap((s) => s.words.map((w) => w[0])))).size;
export const bookTotal = (book) => book === "gi" ? GV.total : new Set(topicsOf(book).flatMap((t) => t.sections.flatMap((s) => s.words.map((w) => w[0])))).size;
