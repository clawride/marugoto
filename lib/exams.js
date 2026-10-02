// 📝 Luyện đề thi: JLPT (N1–N5) và các kỳ thi theo 級 (NAT-TEST, J.TEST, JLPT cũ…)
// Đề: data/exams/<id>.json → public/exams/<id>.json (+ index.json) — scripts/build-exams.mjs
// Điểm: quy đổi tuyến tính số câu đúng (có trọng số "pt") sang thang điểm của từng nhóm điểm, rồi xét điểm đỗ + điểm sàn.
// JLPT thật dùng phương pháp cân bằng (IRT) nên điểm ở đây là ƯỚC TÍNH.

export const EXAM_KINDS = [
  { id: "jlpt", ico: "🎌", name: "Đề JLPT", jp: "日本語能力試験", color: "220,80,90",
    desc: "Đề luyện theo đúng cấu trúc JLPT N1–N5: 言語知識, 読解, 聴解 — có giờ, điểm sàn, quy đổi CEFR." },
  { id: "kyu", ico: "🏅", name: "Đề JLPT cũ 1級–4級", jp: "旧日本語能力試験", color: "90,140,220",
    desc: "Đề JLPT kiểu cũ (trước 2010) 1級–4級: 文字・語彙 100 · 聴解 100 · 読解・文法 200 điểm, đỗ 70% (1級) / 60% (2–4級)." },
];
export const kindById = (id) => EXAM_KINDS.find((k) => k.id === id);

const G = (id, jp, vi, max, min) => ({ id, jp, vi, max, min });
const GENGO = (max = 60, min = 19) => G("gengo", max === 60 ? "言語知識（文字・語彙・文法）" : "言語知識（文字・語彙・文法）・読解", max === 60 ? "Kiến thức ngôn ngữ" : "Kiến thức ngôn ngữ · Đọc hiểu", max, min);
const DOKKAI = G("dokkai", "読解", "Đọc hiểu", 60, 19);
const CHOUKAI = G("choukai", "聴解", "Nghe hiểu", 60, 19);

// Cấu trúc điểm & giờ chuẩn của JLPT (từ 2020): giờ tính bằng phút cho từng phần thi
export const JLPT = {
  N1: { groups: [GENGO(), DOKKAI, CHOUKAI], pass: 100, minutes: { gengo_dokkai: 110, choukai: 55 }, cefr: [[142, "C1"], [100, "B2"]] },
  N2: { groups: [GENGO(), DOKKAI, CHOUKAI], pass: 90, minutes: { gengo_dokkai: 105, choukai: 50 }, cefr: [[112, "B2"], [90, "B1"]] },
  N3: { groups: [GENGO(), DOKKAI, CHOUKAI], pass: 95, minutes: { moji: 30, bunpou_dokkai: 70, choukai: 40 }, cefr: [[104, "B1"], [95, "A2"]] },
  N4: { groups: [GENGO(120, 38), CHOUKAI], pass: 90, minutes: { moji: 25, bunpou_dokkai: 55, choukai: 35 }, cefr: [[90, "A2"]] },
  N5: { groups: [GENGO(120, 38), CHOUKAI], pass: 80, minutes: { moji: 20, bunpou_dokkai: 40, choukai: 30 }, cefr: [[80, "A1"]] },
};

// JLPT kiểu cũ (旧日本語能力試験, trước 2010): tổng 400 điểm, không có điểm sàn từng phần.
// Kết quả được QUY ĐỔI sang JLPT mới theo cấp tương đương chính thức (1級→N1, 2級→N2, 3級→N4, 4級→N5): mỗi câu xếp vào nhóm điểm
// mới (文字・語彙 & 文法 → 言語知識, 読解 → 読解, 聴解 → 聴解), chấm theo thang 180 điểm + điểm sàn của cấp đó, rồi quy CEFR như JLPT mới.
const OG = (id, jp, vi, max) => ({ id, jp, vi, max, min: 0 });
const OLD_GROUPS = [OG("moji", "文字・語彙", "Chữ – Từ vựng", 100), OG("choukai", "聴解", "Nghe hiểu", 100), OG("dokkai", "読解・文法", "Đọc hiểu – Ngữ pháp", 200)];
export const OLD_JLPT = {
  "1級": { groups: OLD_GROUPS, pass: 280, eq: "N1", minutes: { moji: 45, choukai: 45, dokkai: 90 } },
  "2級": { groups: OLD_GROUPS, pass: 240, eq: "N2", minutes: { moji: 35, choukai: 40, dokkai: 70 } },
  "3級": { groups: OLD_GROUPS, pass: 240, eq: "N4", minutes: { moji: 35, choukai: 35, dokkai: 70 } },
  "4級": { groups: OLD_GROUPS, pass: 240, eq: "N5", minutes: { moji: 25, choukai: 25, dokkai: 50 } },
};

export const CEFR_VI = {
  A1: "Sơ cấp – hiểu và dùng câu rất cơ bản", A2: "Sơ cấp – giao tiếp việc quen thuộc hằng ngày",
  B1: "Trung cấp – xử lý phần lớn tình huống thường gặp", B2: "Trung cao cấp – giao tiếp trôi chảy, hiểu văn bản phức tạp",
  C1: "Cao cấp – dùng ngôn ngữ linh hoạt, hiệu quả trong công việc và học thuật", C2: "Thành thạo",
};

// cấu hình chấm của một đề: đề tự khai báo "scoring" (kỳ thi 級) hoặc lấy mặc định JLPT theo cấp
export function scoringOf(E) {
  if (E.scoring) return E.scoring;
  const J = E.kind === "kyu" ? OLD_JLPT[E.level] : JLPT[E.level];
  if (J?.eq) return { groups: J.groups, pass: J.pass, eq: J.eq, cefr: JLPT[J.eq].cefr };
  return J ? { groups: J.groups, pass: J.pass, cefr: J.cefr } : { groups: [G("all", "合計", "Tổng", 100, 0)], pass: 60, cefr: [] };
}

// mọi câu hỏi của đề, kèm vị trí (phần thi, 問題) — id câu: q.id hoặc "s-p-q"
export function allQuestions(E) {
  const out = [];
  E.sections.forEach((S, si) => S.parts.forEach((P, pi) => P.questions.forEach((Q, qi) => out.push({ Q, S, P, si, pi, qi, id: Q.id || `${si}-${pi}-${qi}` }))));
  return out;
}

// chấm theo một thang điểm; groupOf(S, P, Q) → id nhóm điểm của câu
function gradeWith(Qs, answers, sc, groupOf) {
  const groups = sc.groups.map((g) => ({ ...g, got: 0, tot: 0, right: 0, n: 0 }));
  const parts = [];
  for (const { Q, S, P, si, pi, id } of Qs) {
    const w = Q.pt || 1, ok = answers[id] === Q.answer, g = groups.find((x) => x.id === groupOf(S, P, Q)) || groups[0];
    g.tot += w; g.n++; if (ok) { g.got += w; g.right++; }
    let row = parts.find((r) => r.si === si && r.pi === pi);
    if (!row) parts.push((row = { si, pi, sec: S.jp, part: P.jp, title: P.title || "", n: 0, wrong: 0, blank: 0 }));
    row.n++; if (!ok) row.wrong++; if (answers[id] == null || answers[id] === -1) row.blank++;
  }
  groups.forEach((g) => { g.score = g.tot ? Math.round((g.got / g.tot) * g.max) : 0; g.okMin = g.score >= (g.min || 0); });
  const total = groups.reduce((a, g) => a + g.score, 0), max = groups.reduce((a, g) => a + g.max, 0);
  const passed = total >= sc.pass && groups.every((g) => g.okMin);
  const cefr = passed ? (sc.cefr || []).find(([min]) => total >= min)?.[1] || null : null;
  const grade = sc.grades ? (sc.grades.find(([min]) => total >= min)?.[1] || null) : null;
  return { total, max, pass: sc.pass, passed, cefr, grade, groups, parts, right: Qs.filter(({ Q, id }) => answers[id] === Q.answer).length, count: Qs.length };
}
const ownGroup = (S, P, Q) => Q.group || P.group || S.group;

// answers: { [qid]: chỉ số lựa chọn (-1 = bỏ trống) } → kết quả đầy đủ
// Đề JLPT cũ (級): chấm thang cũ (R.old) rồi quy đổi sang JLPT mới cấp tương đương (R chính, có CEFR theo JLPT mới)
export function gradeExam(E, answers) {
  const Qs = allQuestions(E);
  const O = !E.scoring && E.kind === "kyu" ? OLD_JLPT[E.level] : null;
  if (!O) return gradeWith(Qs, answers, scoringOf(E), ownGroup);
  const old = gradeWith(Qs, answers, { groups: O.groups, pass: O.pass }, ownGroup);
  const J = JLPT[O.eq];
  const n45 = J.groups.length === 2;
  const newGroup = (S, P, Q) => {
    if (Q.newGroup || P.newGroup) return Q.newGroup || P.newGroup;
    const g = ownGroup(S, P, Q);
    if (g === "choukai") return "choukai";
    if (n45 || g === "moji") return "gengo";
    return /文法/.test(`${P.title || ""}${P.jp || ""}`) ? "gengo" : "dokkai"; // phần 読解・文法: 問題 ngữ pháp → 言語知識
  };
  const R = gradeWith(Qs, answers, { groups: J.groups, pass: J.pass, cefr: J.cefr }, newGroup);
  return { ...R, eq: O.eq, old };
}

export const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
export const examUrl = (id) => `/exams/${id}.json`;
export const EXAM_INDEX = "/exams/index.json";
