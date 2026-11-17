import fs from "node:fs";
import { matchingVocab } from "./minna-vocab-utils.mjs";

const read = (p) => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const source = read("data/mnn1-vocab-index.json");
let words = 0, covered = 0, lines = 0;
const missing = [];
for (let n = 0; n <= 25; n++) {
  const L = read(`data/mnn1/lesson-${n}.json`);
  if (L.lesson !== n) throw new Error(`Wrong lesson number: ${n}`);
  for (const key of ["vocab", "kanji", "grammar", "fill", "order", "reading", "listening"]) {
    if (!L[key]?.length) throw new Error(`Lesson ${n}: missing ${key}`);
  }
  for (const w of L.vocab) {
    if (!w.jp?.trim() || !w.kana?.trim() || !/[A-Za-zÀ-ỹ]/.test(w.vi || "")) throw new Error(`Lesson ${n}: invalid vocabulary ${JSON.stringify(w)}`);
  }
  for (const entry of source.entries.filter((e) => e.l.includes(n) || (n === 0 && (e.x || !e.l.length)))) {
    if (matchingVocab(entry, L.vocab)) covered++; else missing.push({ lesson: n, word: entry.raw });
  }
  const checkQ = (q) => {
    if (!q.opts?.[q.a] || !Number.isInteger(q.a) || new Set(q.opts).size !== q.opts.length) throw new Error(`Lesson ${n}: invalid answer ${q.q}`);
  };
  L.fill.forEach(checkQ);
  L.reading.forEach((r) => r.questions.forEach(checkQ));
  L.listening.forEach((it) => {
    it.questions.forEach(checkQ);
    it.tts.forEach((l) => { if (!l.t?.trim() || !l.vi?.trim()) throw new Error(`Lesson ${n}: untranslated dialogue`); lines++; });
  });
  L.order.forEach((q) => { if (q.chunks.length < 2 || q.chunks.some((c) => !c.trim())) throw new Error(`Lesson ${n}: invalid order exercise`); });
  words += L.vocab.length;
}
if (missing.length) throw new Error(`Source entries not covered: ${JSON.stringify(missing)}`);
console.log(`Minna 1: 26 lessons (including introduction), ${words} vocabulary items; ${covered} index references covered; ${lines} translated dialogue lines. OK`);
