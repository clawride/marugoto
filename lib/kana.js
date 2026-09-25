// Chương trình Bảng Chữ Cái: hiragana (chữ mềm) + katakana (chữ cứng)
// Thứ tự bài theo logic playlist "Học tiếng Nhật Free 1 tháng: Dạy bảng chữ cái" (54 video):
// mỗi hàng chữ = 1 bài "Hướng dẫn viết" + 1 bài "Đọc và học thuộc"; hiragana học hàng H trước hàng N.
import STROKES from "@/data/kana-strokes.json";
import INFO from "@/data/kana-info.json";

export const KANA_STROKES = STROKES; // { "あ": ["M…", "M…"], … } — KanjiVG, CC BY-SA 3.0
export const KANA_INFO = INFO; // { chars: { "あ": { mn, tip, words:[{w, vi}] } }, rules: { … } }

// Romaji kiểu Hepburn (dạng sách Marugoto dùng)
const ROW = {
  "": ["a", "i", "u", "e", "o"], k: ["ka", "ki", "ku", "ke", "ko"], s: ["sa", "shi", "su", "se", "so"],
  t: ["ta", "chi", "tsu", "te", "to"], n: ["na", "ni", "nu", "ne", "no"], h: ["ha", "hi", "fu", "he", "ho"],
  m: ["ma", "mi", "mu", "me", "mo"], r: ["ra", "ri", "ru", "re", "ro"],
  g: ["ga", "gi", "gu", "ge", "go"], z: ["za", "ji", "zu", "ze", "zo"], d: ["da", "ji", "zu", "de", "do"],
  b: ["ba", "bi", "bu", "be", "bo"], p: ["pa", "pi", "pu", "pe", "po"],
};
const HIRA = { "": "あいうえお", k: "かきくけこ", s: "さしすせそ", t: "たちつてと", n: "なにぬねの", h: "はひふへほ", m: "まみむめも", r: "らりるれろ", g: "がぎぐげご", z: "ざじずぜぞ", d: "だぢづでど", b: "ばびぶべぼ", p: "ぱぴぷぺぽ" };
export const toKata = (s) => [...s].map((c) => { const x = c.codePointAt(0); return x >= 0x3041 && x <= 0x3096 ? String.fromCodePoint(x + 0x60) : c; }).join("");

export const ROMAJI = {};
for (const [r, cs] of Object.entries(HIRA)) [...cs].forEach((c, i) => { ROMAJI[c] = ROW[r][i]; ROMAJI[toKata(c)] = ROW[r][i]; });
Object.assign(ROMAJI, { や: "ya", ゆ: "yu", よ: "yo", わ: "wa", を: "wo", ん: "n", ヤ: "ya", ユ: "yu", ヨ: "yo", ワ: "wa", ヲ: "wo", ン: "n", ー: "(kéo dài)" });
// ぢ/づ: playlist đọc "di/du" (âm ji/zu); ghi cả hai
ROMAJI["ぢ"] = ROMAJI["ヂ"] = "ji (di)"; ROMAJI["づ"] = ROMAJI["ヅ"] = "zu (du)";

// Âm ghép (拗音): phụ âm + ゃゅょ
const YOON_BASE = { き: "k", ぎ: "g", し: "sh", じ: "j", ち: "ch", ぢ: "dy", に: "n", み: "m", ひ: "h", り: "r", び: "b", ぴ: "p" };
const Y = { ゃ: ["a", "ya"], ゅ: ["u", "yu"], ょ: ["o", "yo"] };
export const yoonOf = (bases) => bases.flatMap((b) => Object.entries(Y).map(([s, [v, yv]]) => {
  const c = YOON_BASE[b];
  const r = /^(sh|j|ch)$/.test(c) ? c + v : c === "dy" ? "j" + v + " (dy" + v + ")" : c + yv;
  return { k: b + s, r };
}));

// Ký tự của một bài (base = chữ đơn, yoon = âm ghép)
const H = (s) => [...s];
export const LESSONS = [
  // ===== Hiragana — chữ mềm (video 1–36) =====
  { id: 1, script: "h", title: "Nguyên âm あ い う え お", sub: "5 nguyên âm", chars: H("あいうえお"), videos: [1, 2] },
  { id: 2, script: "h", title: "Hàng か (ka ki ku ke ko)", sub: "Phụ âm K", chars: H("かきくけこ"), videos: [3, 4] },
  { id: 3, script: "h", title: "Hàng さ (sa shi su se so)", sub: "Phụ âm S", chars: H("さしすせそ"), videos: [5, 6] },
  { id: 4, script: "h", title: "Hàng た (ta chi tsu te to)", sub: "Phụ âm T", chars: H("たちつてと"), videos: [7, 8] },
  { id: 5, script: "h", title: "Hàng は (ha hi fu he ho)", sub: "Phụ âm H", chars: H("はひふへほ"), videos: [9, 10] },
  { id: 6, script: "h", title: "Hàng な (na ni nu ne no)", sub: "Phụ âm N", chars: H("なにぬねの"), videos: [11, 12] },
  { id: 7, script: "h", title: "Hàng ま (ma mi mu me mo)", sub: "Phụ âm M", chars: H("まみむめも"), videos: [13, 14] },
  { id: 8, script: "h", title: "Hàng ら (ra ri ru re ro)", sub: "Phụ âm R", chars: H("らりるれろ"), videos: [15, 16] },
  { id: 9, script: "h", title: "や ゆ よ · わ を · ん", sub: "6 âm cuối bảng", chars: H("やゆよわをん"), videos: [17, 18] },
  { id: 10, script: "h", title: "Âm đục が (ga gi gu ge go)", sub: "Âm đục — dấu tenten ゛", chars: H("がぎぐげご"), rule: "dakuon", videos: [19, 20] },
  { id: 11, script: "h", title: "Âm đục ざ · だ", sub: "Za ji zu ze zo · Da ji zu de do", chars: H("ざじずぜぞだぢづでど"), rule: "dakuon", videos: [21, 22] },
  { id: 12, script: "h", title: "Âm đục ば · Âm tròn ぱ", sub: "Ba bi bu be bo · Pa pi pu pe po (dấu maru ゜)", chars: H("ばびぶべぼぱぴぷぺぽ"), rule: "handakuon", videos: [23, 24] },
  { id: 13, script: "h", title: "Âm ghép きゃ · ぎゃ", sub: "K, G + ゃゅょ", yoon: yoonOf(["き", "ぎ"]), rule: "yoon", videos: [25, 26] },
  { id: 14, script: "h", title: "Âm ghép しゃ · じゃ", sub: "Sh, J + ゃゅょ", yoon: yoonOf(["し", "じ"]), rule: "yoon", videos: [27, 28] },
  { id: 15, script: "h", title: "Âm ghép ちゃ · ぢゃ", sub: "Ch, Dy + ゃゅょ", yoon: yoonOf(["ち", "ぢ"]), rule: "yoon", videos: [29, 30] },
  { id: 16, script: "h", title: "Âm ghép みゃ · にゃ", sub: "M, N + ゃゅょ", yoon: yoonOf(["み", "に"]), rule: "yoon", videos: [31, 32] },
  { id: 17, script: "h", title: "Âm ghép ひゃ · りゃ", sub: "H, R + ゃゅょ", yoon: yoonOf(["ひ", "り"]), rule: "yoon", videos: [33, 34] },
  { id: 18, script: "h", title: "Âm ghép びゃ · ぴゃ · Trường âm · Âm ngắt", sub: "B, P + ゃゅょ · âm dài · っ", yoon: yoonOf(["び", "ぴ"]), extra: H("っ"), rule: "long_sokuon", videos: [35] },
  { id: 19, script: "h", title: "Tổng kết chữ mềm · ん và trợ từ は", sub: "Cách đọc ん, は đọc là “wa”", review: "h", rule: "n_wa", videos: [36] },
  // ===== Katakana — chữ cứng (video 37–54) =====
  { id: 20, script: "k", title: "Nguyên âm ア イ ウ エ オ", sub: "5 nguyên âm chữ cứng", chars: H("アイウエオ"), videos: [37, 38] },
  { id: 21, script: "k", title: "Hàng カ (ka ki ku ke ko)", sub: "Phụ âm K", chars: H("カキクケコ"), videos: [39, 40] },
  { id: 22, script: "k", title: "Hàng サ (sa shi su se so)", sub: "Phụ âm S", chars: H("サシスセソ"), videos: [41, 42] },
  { id: 23, script: "k", title: "Hàng タ (ta chi tsu te to)", sub: "Phụ âm T", chars: H("タチツテト"), videos: [43, 44] },
  { id: 24, script: "k", title: "Hàng ナ (na ni nu ne no)", sub: "Phụ âm N", chars: H("ナニヌネノ"), videos: [45, 46] },
  { id: 25, script: "k", title: "Hàng ハ (ha hi fu he ho)", sub: "Phụ âm H", chars: H("ハヒフヘホ"), videos: [47, 48] },
  { id: 26, script: "k", title: "Hàng マ (ma mi mu me mo)", sub: "Phụ âm M", chars: H("マミムメモ"), videos: [49, 50] },
  { id: 27, script: "k", title: "Hàng ラ (ra ri ru re ro)", sub: "Phụ âm R", chars: H("ラリルレロ"), videos: [51, 52] },
  { id: 28, script: "k", title: "ヤ ユ ヨ · ワ ヲ · ン", sub: "6 âm cuối bảng chữ cứng", chars: H("ヤユヨワヲン"), videos: [53, 54] },
  // ===== Mở rộng katakana (cùng quy tắc như chữ mềm) =====
  { id: 29, script: "k", title: "Katakana âm đục & âm tròn", sub: "ガ ザ ダ バ パ", chars: H("ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ"), rule: "dakuon_k", videos: [] },
  { id: 30, script: "k", title: "Katakana âm ghép · Trường âm ー · Âm ngắt ッ", sub: "キャ シュ チョ… · ー · ッ", yoon: yoonOf(["き", "し", "ち", "に", "ひ", "み", "り", "ぎ", "じ", "び", "ぴ"]).map((y) => ({ k: toKata(y.k), r: y.r })), extra: H("ーッ"), rule: "katakana_ext", videos: [] },
];
export const lessonOf = (id) => LESSONS.find((l) => l.id === id);

// Tất cả ký tự đơn đã học tới bài `id` (dùng cho ôn tập / câu hỏi gây nhiễu)
export const charsUpTo = (id, script) => LESSONS.filter((l) => l.id <= id && (!script || l.script === script)).flatMap((l) => l.chars || []);
export const itemsOf = (L) => [...(L.chars || []).map((c) => ({ k: c, r: ROMAJI[c] })), ...(L.yoon || []), ...(L.extra || []).map((c) => ({ k: c, r: ROMAJI[c] || "" }))];

export const YT_PLAYLIST = "https://www.youtube.com/playlist?list=PLMveC4LU1myU1SfyYa-ZKRqfuioAqmd4V";
// Mã 54 video theo thứ tự trong playlist (chỉ để dẫn link xem trên YouTube)
export const YT_IDS = ["ip0cPce0J0o", "nXNbySEbHYI", "7ounTCAcPzM", "piRVAr64g7s", "2W_oW7_KLjk", "Go0ywLJyO4I", "stM26rwzHxI", "CcK6ok_Gn6U", "1r1utOEIbd4", "rvZGR7SbTZk", "axcmi6sbNaE", "XQRk4AXuFYo", "1A0YRg4z-5c", "77Kt-1WVWSQ", "23RKSqlS070", "KGcJuvuQMTs", "9d1hVr_eSgY", "iSgIn8JcsGw", "fry80v_Qf8M", "KLSOGn3ra1w", "JEgKxl9Uxg4", "CHLhw8hLcKo", "gevHDP2-FfE", "Q7LCCQNhOJ4", "SqbKCl6mdxU", "jjygvNuqTBo", "QDkrFaZWJtg", "dXNcQVzq3FU", "cimIUxJX8zI", "3G3hO9T5Gb0", "mf2u9G3wyQk", "dxsFQwwAQQI", "uU2q77WoDi8", "5URC9lWvF1Q", "f549-DDKSmg", "0tl3y77S1ME", "rUZeHUC1ZRo", "CA0aL2dUl1g", "Y0htqjeIa1c", "ZaJY04lMAHA", "rCBCIZb1LBI", "3FnjleFOb5Y", "AyYWkHZgpuw", "RJ1zcFvP7NU", "sP_LjS8t7_E", "YWDQ5rN_rC0", "Lwxw96iOtJ0", "R21ipOnSxqE", "0GZ2e7wKfvk", "-SKNKcJjJX0", "qjXX5ONsxKw", "JozDblnY-40", "arjqOqk7X_I", "dnvwtul10Kk"];
export const videoUrl = (n) => `https://www.youtube.com/watch?v=${YT_IDS[n - 1]}&list=PLMveC4LU1myU1SfyYa-ZKRqfuioAqmd4V`;

// Chuyển một từ kana sang romaji (xử lý âm ghép, âm ngắt っ, trường âm ー)
const SMALL = { ゃ: "ya", ゅ: "yu", ょ: "yo", ャ: "ya", ュ: "yu", ョ: "yo" };
export function toRomaji(word) {
  const cs = [...word];
  let out = "";
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i], n = cs[i + 1];
    if (c === "っ" || c === "ッ") { const nx = toRomaji(cs.slice(i + 1).join("")); out += nx.startsWith("ch") ? "t" : nx[0] || ""; continue; }
    if (c === "ー") { out += out.slice(-1); continue; }
    let r = (ROMAJI[c] || c).split(" ")[0];
    if (n && SMALL[n]) {
      const y = SMALL[n];
      r = /^(shi|chi|ji)$/.test(r) ? r.slice(0, -1) + y.slice(1) : r.slice(0, -1) + y;
      i++;
    }
    out += r;
  }
  return out;
}
