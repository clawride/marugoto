// Sinh data/notebook.json — chỉ phần từ vựng của các khóa học (A1, A2-1, A2-2, A2/B1) cho Sổ Tay Từ Vựng,
// để trang chủ không phải tải toàn bộ dữ liệu bài học. Chạy: node scripts/build-notebook.mjs
import { readFileSync, writeFileSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), "utf8"));
const BOOKS = { a1: "a1-lessons", a21: "a21-lessons", a22: "a22-lessons", ab1: "ab1-units" };
const out = {};
for (const [id, file] of Object.entries(BOOKS)) {
  out[id] = read(file).map((L) => ({
    lesson: L.lesson, topic: L.topic, topicTitle: L.topicTitle, topicVi: L.topicVi, title: L.title, titleVi: L.titleVi,
    vocab: L.vocab.map((v) => [v.jp, v.kana && v.kana !== v.jp ? v.kana : "", v.vi, v.src || "L"]),
  }));
}
writeFileSync(new URL("../data/notebook.json", import.meta.url), JSON.stringify(out));
console.log("notebook.json:", Object.entries(out).map(([k, v]) => `${k} ${v.reduce((a, L) => a + L.vocab.length, 0)}`).join(", "));
