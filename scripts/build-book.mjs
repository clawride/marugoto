// 📖 Học theo sách: data/book/<khóa>-*.json (mỗi file { lessons: [...] }, chép từ sách) → public/book/<khóa>/<bài>.json
// + dữ liệu 2 buổi "テストとふりかえり" (A1: Topic 1–5 và 6–9): public/book/<khóa>/test1.json, test2.json
//   node scripts/build-book.mjs
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SRC = path.join(ROOT, "data", "book");

// Buổi kiểm tra theo sách (p71–72, p114–115): Can-do, もじテスト (đọc 5 thẻ), かいわテスト (5 câu hỏi)
const TESTS = {
  a1: [
    { n: 1, page: 71, topics: [1, 5], lessons: [1, 10], moji: "word", write: ["だい2か「なふだ」", "だい7か「Eメール」", "だい10か「バースデーカード」"],
      examples: [["おめでとう", "omedetoo", "chúc mừng"], ["あね", "ane", "chị gái (của mình)"], ["コーヒー", "koohii", "cà phê"], ["ベッド", "beddo", "giường"], ["かいしゃ", "kaisha", "công ty"]] },
    { n: 2, page: 114, topics: [6, 9], lessons: [11, 18], moji: "sentence", write: ["だい17か「ブログ」"],
      examples: [["やすみの ひは しゃしんを とります。", "Yasumi no hi wa shashin o torimasu.", "Ngày nghỉ tôi chụp ảnh."], ["かわいい ハンカチが ほしいです。", "Kawaii hankachi ga hoshii desu.", "Tôi muốn một chiếc khăn tay dễ thương."], ["1000えんです", "Sen-en desu", "1000 yên."], ["かぶきを みました。", "Kabuki o mimashita.", "Tôi đã xem kabuki."], ["すばらしかったです。", "Subarashikatta desu.", "Tuyệt vời lắm."]] },
  ],
};
const KANA = /^[぀-ヿ　\sー、。？！0-9０-９]+$/;

for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith(".json"))) {
  // a1-katsudou.json → public/book/a1/ (kèm buổi kiểm tra) · a1-rikai.json → public/book/a1-rikai/
  const main = f.endsWith("-katsudou.json");
  const course = main ? f.split("-")[0] : f.replace(/\.json$/, "");
  const D = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
  const out = path.join(ROOT, "public", "book", course);
  fs.mkdirSync(out, { recursive: true });
  // câu cơ bản (きほんぶん) của bài Rikai: các trợ lý chép sách ghi ở kihonbun/kihon/key hoặc cando có số → gom về notes
  for (const L of D.lessons) {
    if (!main && L.cando?.[0]?.no) { L.notes = L.notes || L.cando; L.cando = []; }
    for (const k of ["kihonbun", "kihon", "key"]) if (L[k]) { if (!L.notes) L.notes = L[k]; delete L[k]; }
  }
  for (const L of D.lessons) fs.writeFileSync(path.join(out, `${L.lesson}.json`), JSON.stringify(L));
  console.log(`${f}: ${D.lessons.length} bài → public/book/${course}/`);

  for (const T of (main && TESTS[course]) || []) {
    const Ls = D.lessons.filter((L) => L.lesson >= T.lessons[0] && L.lesson <= T.lessons[1]);
    const cando = Ls.flatMap((L) => L.cando.map((c) => ({ ...c, lesson: L.lesson, title: L.title.jp })));
    const seen = new Set(), moji = [];
    const add = (x, lesson) => { const jp = x.jp.trim(); if (seen.has(jp)) return; seen.add(jp); moji.push({ jp, ro: x.ro || "", vi: x.vi, lesson }); };
    for (const L of Ls) {
      if (T.moji === "word") {
        for (const S of L.sections) for (const A of S.acts) for (const w of A.words?.items || []) if (KANA.test(w.jp) && [...w.jp].length >= 2 && [...w.jp].length <= 8) add(w, L.lesson);
      } else {
        for (const q of L.quiz) if (KANA.test(q.jp) && [...q.jp].length <= 24) add(q, L.lesson);
      }
    }
    // câu hỏi hội thoại: câu hỏi trong hội thoại mẫu + câu trả lời ngay sau đó
    const qseen = new Set(), kaiwa = [];
    for (const L of Ls) for (const S of L.sections) for (const A of S.acts) {
      const m = A.model || [];
      for (let i = 0; i < m.length - 1; i++) {
        const q = m[i], a = m[i + 1];
        if (!/[か？?]。?$/.test(q.jp.trim()) || /^そうですか/.test(q.jp.trim()) || qseen.has(q.jp) || /[か？?]。?$/.test(a.jp.trim())) continue;
        qseen.add(q.jp); kaiwa.push({ q: { jp: q.jp, ro: q.ro || "", vi: q.vi }, a: { jp: a.jp, ro: a.ro || "", vi: a.vi }, lesson: L.lesson });
      }
    }
    const data = { n: T.n, page: T.page, topics: T.topics, lessons: T.lessons, moji: T.moji, write: T.write,
      examples: T.examples.map(([jp, ro, vi]) => ({ jp, ro, vi })), cando, mojiPool: moji, kaiwa };
    fs.writeFileSync(path.join(out, `test${T.n}.json`), JSON.stringify(data));
    console.log(`  test${T.n}: ${cando.length} Can-do · ${moji.length} thẻ もじ · ${kaiwa.length} câu hỏi かいわ`);
  }
}
