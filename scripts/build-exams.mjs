// 📝 Luyện đề thi: data/exams/<id>.json → public/exams/<id>.json + public/exams/index.json
//   node scripts/build-exams.mjs            (chạy tự động trước khi build — package.json "prebuild")
//   node scripts/build-exams.mjs --check    (chỉ kiểm tra, in cả cảnh báo, không ghi file)
// Khuôn đề: xem docs ở đầu lib/exams.js và data/exams/README.md. Lỗi dữ liệu → dừng lại.
import fs from "fs";
import path from "path";

const CHECK = process.argv.includes("--check");
if (!CHECK) process.argv.push("--nokuro");
const { checkSentence, checkExtra } = await import("./check-library.mjs");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SRC = path.join(ROOT, "data", "exams");
const OUT = path.join(ROOT, "public", "exams");
// số câu chuẩn từng phần thi (đề đầy đủ phải khớp; đề rút gọn khai "mini": true trong meta)
// era "2020" = cấu trúc hiện hành (từ 12/2020) · era "2010" = cấu trúc 2010–2020 (N4/N5 nhiều câu hơn)
const EXPECT = {
  N5: [21, 22, 24], "N5-2010": [35, 32, 24],
  N4: [28, 29, 28], "N4-2010": [35, 35, 28],
  N3: [35, 39, 28], "N3-2010": [35, 39, 28],
  // N2/N1: 2 phần thi (言語知識・読解 · 聴解); 統合理解 3番 có 質問1/質問2 tính 2 câu
  N2: [72, 30], "N2-2010": [75, 32],
  "N1-2010": [70, 37],
};
const KINDS = ["jlpt", "kyu"], LEVELS = ["N1", "N2", "N3", "N4", "N5"], KYU = ["1級", "2級", "3級", "4級"];

function checkExam(X) {
  const E = [], W = [];
  for (const k of ["id", "kind", "title"]) if (!X[k]) E.push(`thiếu "${k}"`);
  if (X.kind && !KINDS.includes(X.kind)) E.push(`"kind" phải là ${KINDS.join(" / ")}`);
  if (X.kind === "jlpt" && !LEVELS.includes(X.level)) E.push(`đề JLPT cần "level" N1–N5`);
  if (X.kind === "kyu" && !X.scoring && !KYU.includes(X.level)) E.push(`đề 級 cần "level" 1級–4級 (thang JLPT cũ) hoặc tự khai "scoring"`);
  const groups = new Set((X.scoring?.groups || (X.kind === "kyu" ? [{ id: "moji" }, { id: "choukai" }, { id: "dokkai" }] : X.level >= "N4" ? [{ id: "gengo" }, { id: "choukai" }] : [{ id: "gengo" }, { id: "dokkai" }, { id: "choukai" }])).map((g) => g.id));
  if (!Array.isArray(X.sections) || !X.sections.length) E.push(`thiếu "sections"`);
  const ids = new Set();
  if (X.era && !["2010", "2020"].includes(X.era)) E.push(`"era" phải là "2010" hoặc "2020"`);
  const exp = !X.mini && X.kind === "jlpt" && EXPECT[X.era === "2010" ? `${X.level}-2010` : X.level];
  if (exp && Array.isArray(X.sections)) {
    const got = X.sections.map((S) => (S.parts || []).reduce((a, P) => a + (P.questions || []).length, 0));
    if (got.length !== exp.length || got.some((n, i) => n !== exp[i])) E.push(`đề ${X.level} đầy đủ phải có ${exp.join(" / ")} câu theo từng phần thi (đang có ${got.join(" / ") || 0})`);
  }
  (X.sections || []).forEach((S, si) => {
    const at = `sections[${si}]`;
    if (!S.jp) E.push(`${at}: thiếu "jp"`);
    if (!(S.minutes > 0)) W.push(`${at}: không có "minutes" (không giới hạn giờ)`);
    if (!S.group) E.push(`${at}: thiếu "group" (nhóm điểm: ${[...groups].join(" / ")})`);
    else if (!groups.has(S.group)) E.push(`${at}: group "${S.group}" không có trong scoring.groups`);
    if (!Array.isArray(S.parts) || !S.parts.length) E.push(`${at}: thiếu "parts"`);
    (S.parts || []).forEach((P, pi) => {
      const ap = `${at}.parts[${pi}]`;
      if (!P.jp) E.push(`${ap}: thiếu "jp" (ví dụ 問題1)`);
      (P.passage?.sentences || []).forEach((s, i) => checkSentence(s, `${ap}.passage.sentences[${i}]`, E, W));
      if (!Array.isArray(P.questions) || !P.questions.length) E.push(`${ap}: thiếu "questions"`);
      (P.questions || []).forEach((Q, qi) => {
        const aq = `${ap}.questions[${qi}]`;
        const id = Q.id || `${si}-${pi}-${qi}`;
        if (ids.has(id)) E.push(`${aq}: trùng id "${id}"`); ids.add(id);
        if (!Q.q && !Q.audio?.length) E.push(`${aq}: cần "q" (đề bài) hoặc "audio"`);
        if (!Array.isArray(Q.choices) || Q.choices.length < 2) E.push(`${aq}: cần ít nhất 2 lựa chọn`);
        if (!(Number.isInteger(Q.answer) && Q.answer >= 0 && Q.answer < (Q.choices || []).length)) E.push(`${aq}: "answer" phải là chỉ số lựa chọn đúng (0…${(Q.choices || []).length - 1})`);
        (Q.audio || []).forEach((l, i) => { if (!l.jp) E.push(`${aq}.audio[${i}]: thiếu "jp"`); else if (l.words) checkSentence(l, `${aq}.audio[${i}]`, E, W); });
        if (!Q.ex) W.push(`${aq}: chưa có lời giải "ex"`);
        else {
          if (Q.ex.s) checkSentence(Q.ex.s, `${aq}.ex.s`, E, W);
          if (!Q.ex.vi) W.push(`${aq}: lời giải chưa có "vi"`);
          if (Q.ex.choices && Q.ex.choices.length !== (Q.choices || []).length) E.push(`${aq}: ex.choices phải có đúng ${(Q.choices || []).length} mục`);
        }
      });
    });
  });
  return { E, W };
}

fs.mkdirSync(SRC, { recursive: true });
if (!CHECK) { fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true }); }
const index = [];
let bad = 0;
// một đề = file <id>.json, hoặc thư mục <id>/ gồm meta.json + s1.json, s2.json… (mỗi file một phần thi — để nhiều người soạn song song)
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
const entries = fs.readdirSync(SRC).filter((f) => (f.endsWith(".json") || (fs.statSync(path.join(SRC, f)).isDirectory() && fs.existsSync(path.join(SRC, f, "meta.json")))) && !f.startsWith("_")).sort();
for (const f of entries) {
  let X;
  try {
    if (f.endsWith(".json")) X = readJson(path.join(SRC, f));
    else {
      const dir = path.join(SRC, f), secs = fs.readdirSync(dir).filter((x) => /^s\d+\.json$/.test(x)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
      X = readJson(path.join(dir, "meta.json"));
      X.sections = secs.map((x) => readJson(path.join(dir, x)));
      if (!X.id) X.id = f;
    }
  } catch (e) { bad++; console.error(`✗ ${f}: JSON hỏng — ${e.message}`); continue; }
  const { E, W } = checkExam(X);
  if (CHECK || E.length) console.log(`\n== ${f}: ${E.length} lỗi, ${W.length} cảnh báo`);
  E.forEach((x) => console.log("  ✗ " + x));
  if (CHECK) W.forEach((x) => console.log("  ! " + x));
  if (E.length) { bad += E.length; continue; }
  const n = X.sections.reduce((a, S) => a + S.parts.reduce((b, P) => b + P.questions.length, 0), 0);
  index.push({ id: X.id, kind: X.kind, level: X.level || "", era: X.era || (X.kind === "jlpt" ? "2020" : ""), mini: !!X.mini, title: X.title, jp: X.jp || "", source: X.source || "", note: X.note || "", order: X.order ?? 0, n,
    minutes: X.sections.reduce((a, S) => a + (S.minutes || 0), 0), sections: X.sections.map((S) => ({ jp: S.jp, minutes: S.minutes || 0, n: S.parts.reduce((b, P) => b + P.questions.length, 0) })) });
  if (!CHECK) fs.writeFileSync(path.join(OUT, `${X.id}.json`), JSON.stringify(X));
}
index.sort((a, b) => a.kind.localeCompare(b.kind) || a.level.localeCompare(b.level) || a.order - b.order || a.id.localeCompare(b.id));
if (!CHECK) fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
// ——— Ôn thi: data/exams/on-thi/<id>.json (khuôn trang tra cứu: { id, jp, vi, intro, level?, order?, blocks }) ———
const RSRC = path.join(SRC, "on-thi"), ROUT = path.join(OUT, "on-thi");
fs.mkdirSync(RSRC, { recursive: true });
if (!CHECK) fs.mkdirSync(ROUT, { recursive: true });
const review = [];
for (const f of fs.readdirSync(RSRC).filter((f) => f.endsWith(".json")).sort()) {
  const { E, W, L } = await checkExtra(path.join(RSRC, f));
  if (CHECK || E.length) console.log(`
== on-thi/${f}: ${E.length} lỗi, ${W.length} cảnh báo`);
  E.forEach((x) => console.log("  ✗ " + x));
  if (CHECK) W.forEach((x) => console.log("  ! " + x));
  if (E.length) { bad += E.length; continue; }
  review.push({ id: L.id, jp: L.jp, vi: L.vi, intro: L.intro || "", ico: L.ico || "📘", level: L.level || "", tag: L.tag || "", order: L.order ?? 99, source: L.source || "" });
  if (!CHECK) fs.writeFileSync(path.join(ROUT, `${L.id}.json`), JSON.stringify(L));
}
review.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
if (!CHECK) fs.writeFileSync(path.join(OUT, "on-thi.json"), JSON.stringify(review));
console.log(`📝 Đề thi: ${index.length} đề · Ôn thi: ${review.length} bài${CHECK ? " (chỉ kiểm tra)" : " → public/exams/"}`);
if (bad) { console.error(`\n✗ Đề thi: ${bad} lỗi dữ liệu — sửa rồi chạy lại (node scripts/build-exams.mjs --check)`); process.exit(1); }
