"use client";
// Lồng tiếng VOICEVOX cho truyện nhân vật: mỗi người nói một giọng hợp tuổi & giới tính, đổi sắc thái theo cảm xúc (mood).
// Nguồn giọng: "online" (api.tts.quest — không cần cài gì) · "local" (VOICEVOX chạy trên máy) · "web" (giọng có sẵn của trình duyệt).
// Âm thanh đã tạo được lưu vào Cache Storage của trình duyệt → mỗi câu chỉ phải tạo một lần.
// Điều khoản VOICEVOX: phải ghi "VOICEVOX:<tên giọng>" ở nơi dùng giọng — xem voiceCredit().
import { speakLines, stopSpeak as stopWeb } from "@/lib/tts";

// Giọng VOICEVOX: n = tên, s = [kiểu, id], g = giới tính, m = kiểu theo cảm xúc (nếu giọng có)
const F = (n, s, g, m = {}) => ({ n, s, g, m });
export const FAM = {
  metan: F("四国めたん", ["ノーマル", 2], "f", { happy: ["あまあま", 0], angry: ["ツンツン", 6] }),
  metanSexy: F("四国めたん", ["セクシー", 4], "f", { angry: ["ツンツン", 6] }),
  zunda: F("ずんだもん", ["ノーマル", 3], "f", { happy: ["あまあま", 1], angry: ["ツンツン", 7], sad: ["なみだめ", 76] }),
  tsumugi: F("春日部つむぎ", ["ノーマル", 8], "f"),
  hau: F("雨晴はう", ["ノーマル", 10], "f"),
  ritsu: F("波音リツ", ["ノーマル", 9], "f", { angry: ["クイーン", 65] }),
  ritsuQueen: F("波音リツ", ["クイーン", 65], "f"),
  himari: F("冥鳴ひまり", ["ノーマル", 14], "f"),
  sora: F("九州そら", ["ノーマル", 16], "f", { happy: ["あまあま", 15], angry: ["ツンツン", 18] }),
  soraSexy: F("九州そら", ["セクシー", 17], "f", { angry: ["ツンツン", 18] }),
  kurono: F("玄野武宏", ["ノーマル", 11], "m", { happy: ["喜び", 39], angry: ["ツンギレ", 40], sad: ["悲しみ", 41] }),
  kotaro: F("白上虎太郎", ["ふつう", 12], "m", { happy: ["わーい", 32], surprised: ["びくびく", 33], angry: ["おこ", 34] }),
  ryusei: F("青山龍星", ["ノーマル", 13], "m", { happy: ["喜び", 83], angry: ["不機嫌", 82], sad: ["かなしみ", 85], serious: ["しっとり", 84] }),
  ryuseiCalm: F("青山龍星", ["しっとり", 84], "m", { happy: ["喜び", 83], angry: ["不機嫌", 82], sad: ["かなしみ", 85] }),
  ryuseiHot: F("青山龍星", ["熱血", 81], "m", { angry: ["不機嫌", 82], sad: ["かなしみ", 85], serious: ["ノーマル", 13] }),
  kenzaki: F("剣崎雌雄", ["ノーマル", 21], "m"),
  whitecul: F("WhiteCUL", ["ノーマル", 23], "f", { happy: ["たのしい", 24], sad: ["かなしい", 25] }),
  goki: F("後鬼", ["人間ver.", 27], "f", { angry: ["人間（怒り）ver.", 87] }),
  no7Read: F("No.7", ["読み聞かせ", 31], "f"),
  jii: F("ちび式じい", ["ノーマル", 42], "m"),
  miko: F("櫻歌ミコ", ["ノーマル", 43], "f"),
  mikoLoli: F("櫻歌ミコ", ["ロリ", 45], "f"),
  sayo: F("小夜/SAYO", ["ノーマル", 46], "f"),
  robo: F("ナースロボ＿タイプＴ", ["ノーマル", 47], "f", { happy: ["楽々", 48], surprised: ["恐怖", 49] }),
  beni: F("†聖騎士 紅桜†", ["ノーマル", 51], "m"),
  suzumatsu: F("雀松朱司", ["ノーマル", 52], "m"),
  kigashima: F("麒ヶ島宗麟", ["ノーマル", 53], "m"),
  nana: F("春歌ナナ", ["ノーマル", 54], "f"),
  aru: F("猫使アル", ["ノーマル", 55], "f", { happy: ["うきうき", 57], serious: ["おちつき", 56] }),
  bii: F("猫使ビィ", ["ノーマル", 58], "m", { serious: ["おちつき", 59], shy: ["人見知り", 60] }),
  usagi: F("中国うさぎ", ["ノーマル", 61], "f", { surprised: ["おどろき", 62], shy: ["こわがり", 63] }),
  maron: F("栗田まろん", ["ノーマル", 67], "m"),
  iltan: F("あいえるたん", ["ノーマル", 68], "f"),
  hanamaru: F("満別花丸", ["元気", 70], "f", { serious: ["ノーマル", 69], shy: ["ささやき", 71] }),
  hanaBoy: F("満別花丸", ["ボーイ", 73], "m"),
  nia: F("琴詠ニア", ["ノーマル", 74], "f"),
  zonko: F("ぞん子", ["ノーマル", 90], "f"),
  zonkoLazy: F("ぞん子", ["低血圧", 91], "f", { happy: ["ノーマル", 90] }),
  tsurugi: F("中部つるぎ", ["ノーマル", 94], "f", { angry: ["怒り", 95], shy: ["おどおど", 97] }),
  saeshiro: F("黒沢冴白", ["ノーマル", 100], "m"),
  zunko: F("東北ずん子", ["ノーマル", 107], "f"),
  kiritan: F("東北きりたん", ["ノーマル", 108], "f"),
  itako: F("東北イタコ", ["ノーマル", 109], "f"),
};

// Nhóm tuổi: nhãn · danh sách giọng thay thế (khi trùng giọng trong cùng một truyện) · chỉnh mặc định [cao độ, ngữ điệu, tốc độ]
export const GROUP = {
  cf: { vi: "Bé gái", pool: ["mikoLoli", "sayo", "hanamaru", "kiritan", "iltan", "usagi", "zunda"], t: [0.03, 1.15, 1.02] },
  cm: { vi: "Bé trai", pool: ["hanaBoy", "maron", "kotaro"], t: [0.03, 1.15, 1.02] },
  tf: { vi: "Thiếu nữ", pool: ["tsumugi", "metan", "ritsu", "tsurugi", "zunko", "aru", "nana", "nia", "usagi"], t: [0.01, 1.05, 1] },
  tm: { vi: "Thiếu niên", pool: ["kotaro", "bii", "maron", "suzumatsu", "saeshiro"], t: [0.01, 1.05, 1] },
  yf: { vi: "Nữ thanh niên", pool: ["himari", "whitecul", "sora", "miko", "zonko", "nia", "zunko"], t: [0, 1, 0.98] },
  ym: { vi: "Nam thanh niên", pool: ["kurono", "suzumatsu", "saeshiro", "kotaro"], t: [0, 1, 0.98] },
  af: { vi: "Nữ trưởng thành", pool: ["soraSexy", "metanSexy", "goki", "itako", "ritsuQueen", "sora"], t: [-0.01, 0.95, 0.96] },
  am: { vi: "Nam trưởng thành", pool: ["ryusei", "kigashima", "beni", "saeshiro"], t: [-0.02, 0.95, 0.95] },
  ef: { vi: "Bà lão", pool: ["itako", "goki"], t: [-0.07, 0.9, 0.9] },
  em: { vi: "Ông lão", pool: ["jii", "kigashima", "ryusei"], t: [-0.02, 0.95, 0.92] },
  robot: { vi: "Người máy", pool: ["robo"], t: [0, 0.8, 0.97] },
  beast: { vi: "Rồng / thần thú", pool: ["ryusei", "kigashima", "beni"], t: [-0.1, 0.8, 0.88] },
  narr: { vi: "Người dẫn truyện", pool: ["no7Read", "kigashima", "itako"], t: [0, 0.95, 0.96] },
};

// Phân vai: tên tiếng Nhật trong truyện → [nhóm tuổi, giọng, cao độ?, ngữ điệu?, tốc độ?]
// (Giọng chọn theo tuổi, giới tính, tính cách và cách xưng hô của nhân vật trong truyện.)
const CAST = {
  パイモン: ["cf", "zunda", 0.02, 1.15, 1.04],
  // — nhân vật 5★ có truyện —
  神里綾華: ["tf", "zunko", 0, 0.95, 0.97], ジン: ["yf", "sora", -0.01, 0.95], ディルック: ["ym", "saeshiro", -0.03, 0.85, 0.95],
  ウェンティ: ["tm", "kotaro", 0.02, 1.2], 魈: ["ym", "saeshiro", 0, 0.75, 0.97], クレー: ["cf", "mikoLoli", 0.02, 1.25, 1.05],
  鍾離: ["am", "ryuseiCalm", -0.02, 0.9, 0.9], タルタリヤ: ["ym", "kurono", 0.01, 1.2, 1.03], 七七: ["cf", "sayo", 0, 0.55, 0.86],
  甘雨: ["yf", "himari", 0.01, 0.95, 0.95], アルベド: ["tm", "suzumatsu", 0.02, 0.9], モナ: ["tf", "metan", 0.01, 1.05],
  刻晴: ["tf", "tsurugi", 0, 1.1, 1.03], 胡桃: ["tf", "tsumugi", 0.02, 1.25, 1.05], 楓原万葉: ["ym", "suzumatsu", 0, 0.95, 0.96],
  宵宮: ["tf", "aru", 0.01, 1.2, 1.04], エウルア: ["yf", "ritsu", -0.01, 0.95], 雷電将軍: ["af", "goki", -0.02, 0.85, 0.94],
  珊瑚宮心海: ["tf", "nia", 0.01, 1], 荒瀧一斗: ["ym", "ryuseiHot", 0.02, 1.3, 1.05], 八重神子: ["af", "metanSexy", 0, 1.1],
  夜蘭: ["af", "soraSexy", -0.01, 1], アーロイ: ["yf", "whitecul", -0.01, 0.95], 申鶴: ["yf", "himari", -0.02, 0.75, 0.95],
  神里綾人: ["ym", "suzumatsu", -0.02, 0.95], ティナリ: ["tm", "maron", 0.01, 1.05], ニィロウ: ["tf", "nana", 0, 1.05, 0.97],
  セノ: ["ym", "saeshiro", 0, 0.85], ナヒーダ: ["cf", "kiritan", 0, 1, 0.97], 放浪者: ["tm", "bii", 0, 1.1],
  アルハイゼン: ["ym", "saeshiro", -0.03, 0.7, 0.97], ディシア: ["af", "itako", -0.01, 1.1, 1.02], 白朮: ["ym", "suzumatsu", -0.03, 0.9, 0.94],
  リネ: ["tm", "kurono", 0.03, 1.25, 1.03], リオセスリ: ["am", "ryusei", 0.01, 1, 0.98], ヌヴィレット: ["am", "kigashima", -0.01, 0.85, 0.93],
  フリーナ: ["tf", "metan", 0.02, 1.3, 1.03], ナヴィア: ["yf", "zonko", 0.01, 1.15, 1.02], 閑雲: ["af", "itako", -0.02, 0.95, 0.95],
  千織: ["af", "ritsuQueen", 0, 1.05, 1.02], シグウィン: ["cf", "hanamaru", 0.01, 1.15, 1.02], アルレッキーノ: ["af", "itako", -0.05, 0.75, 0.93],
  クロリンデ: ["yf", "himari", -0.03, 0.8, 0.97], エミリエ: ["yf", "whitecul", 0, 0.95, 0.96], キィニチ: ["ym", "saeshiro", -0.01, 0.75, 0.97],
  ムアラニ: ["tf", "tsumugi", 0.02, 1.25, 1.05], シロネン: ["yf", "zonkoLazy", 0, 0.95], チャスカ: ["yf", "sora", -0.02, 0.9, 0.97],
  マーヴィカ: ["af", "soraSexy", 0, 1.15, 1.02], シトラリ: ["tf", "tsurugi", 0.01, 1.15], 夢見月瑞希: ["yf", "nia", 0, 0.95, 0.95],
  ヴァレサ: ["tf", "aru", 0.02, 1.15, 1.02], エスコフィエ: ["af", "miko", -0.02, 0.85, 0.97], スカーク: ["af", "goki", -0.03, 0.75, 0.96],
  イネファ: ["robot", "robo", 0, 0.8, 0.97], ラウマ: ["yf", "himari", 0, 0.9, 0.94], フリンズ: ["ym", "suzumatsu", -0.02, 0.85, 0.95],
  ネフェル: ["af", "metanSexy", -0.01, 1.05, 0.98], ドゥリン: ["cm", "hanaBoy", 0.02, 1.2, 1.03], コロンビーナ: ["yf", "miko", 0.01, 0.95, 0.95],
  茲白: ["af", "itako", 0, 1.1], ヴァルカ: ["am", "beni", 0, 1.2, 1.02], ローエン: ["am", "kigashima", 0, 0.85, 0.96],
  リンネア: ["tf", "zunko", 0.02, 1.1, 1.02], ニコル: ["af", "sora", -0.02, 1, 0.95], サンドローネ: ["af", "ritsuQueen", 0.01, 1.1],
  ヴォジャニーツァ: ["yf", "miko", -0.01, 0.9, 0.94], ヴェスナ: ["yf", "ritsu", -0.02, 1.05, 1.02], オデット: ["tf", "zunko", 0.01, 1.05, 0.98],
  // — nhân vật phụ xuất hiện trong truyện —
  トーマ: ["ym", "kurono", 0, 1.05], リサ: ["af", "soraSexy", 0, 0.95, 0.95], バーバラ: ["tf", "nana", 0.02, 1.2, 1.03],
  アデリン: ["af", "sora", -0.03, 0.9, 0.95], ガイア: ["ym", "kurono", -0.02, 1.05], 女の子: ["cf", "hanamaru", 0.02, 1.2],
  トワリン: ["beast", "ryusei", -0.1, 0.8, 0.88], 少年: ["cm", "hanaBoy", 0.02, 1.15], "ヴェル・ゴレット": ["af", "sora", -0.02, 1, 0.97],
  若陀龍王: ["beast", "ryusei", -0.12, 0.7, 0.85], テウセル: ["cm", "hanaBoy", 0.03, 1.3, 1.05], 留雲借風真君: ["af", "ritsuQueen", -0.02, 1.05, 0.97],
  宝盗団: ["am", "ryusei", 0, 1.2, 1.05], スクロース: ["tf", "nia", 0.01, 0.9, 0.97], 北斗: ["af", "itako", -0.02, 1.15, 1.03],
  龍之介: ["em", "jii", 0, 1, 0.95], アンバー: ["tf", "tsumugi", 0.02, 1.2, 1.05], シューベルト: ["em", "kigashima", -0.03, 1.2, 0.98],
  ルーカス: ["tm", "maron", 0, 0.9, 0.97], ハンス: ["ym", "kurono", -0.01, 0.95], ゴロー: ["tm", "kotaro", 0, 1.15, 1.03],
  久岐忍: ["tf", "ritsu", 0, 0.8, 0.98], 凝光: ["af", "soraSexy", -0.02, 0.95, 0.96], 雲菫: ["tf", "miko", 0.01, 1.05, 0.97],
  コレイ: ["tf", "usagi", 0, 1, 0.98], カーヴェ: ["ym", "kurono", 0, 1.15, 1.02], ドニアザード: ["yf", "himari", 0.01, 0.9, 0.93],
  キャンディス: ["af", "sora", -0.02, 0.95, 0.97], 長生: ["ef", "itako", -0.07, 0.9, 0.9], リネット: ["tf", "ritsu", 0, 0.5, 0.95],
  フレミネ: ["tm", "maron", -0.01, 0.85, 0.95], シャルロット: ["tf", "tsumugi", 0.01, 1.2, 1.05], マリー: ["tf", "nana", 0.02, 1.15, 1.03],
  アハウ: ["beast", "hanaBoy", 0.01, 1.35, 1.05], ナウィ: ["cf", "iltan", 0.02, 1.15], カチーナ: ["cf", "hanamaru", 0.01, 1.1],
  オロルン: ["tm", "maron", -0.01, 0.85, 0.94], イアンサ: ["tf", "tsurugi", 0.01, 1.2, 1.03], チェン: ["em", "jii", 0, 0.95, 0.92],
};
const ALIAS = { クラクサナリデビ: "ナヒーダ", 将軍: "雷電将軍", 公子: "タルタリヤ", 綾華: "神里綾華", 綾人: "神里綾人", 万葉: "楓原万葉", 一斗: "荒瀧一斗", 心海: "珊瑚宮心海", 瑞希: "夢見月瑞希" };
// Lữ Khách: nam (空) / nữ (蛍) — chọn trong cài đặt
const TRAV = { m: ["ym", "kenzaki", 0, 1, 1], f: ["yf", "hau", -0.01, 1, 0.98] };
const NARR = ["narr", "no7Read", 0, 0.95, 0.96];

const hashStr = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };
function entry(sp, D, trav) {
  if (sp === "char") return CAST[D?.name] || CAST[ALIAS[D?.name]];
  if (sp === "trav" || sp === "me") return TRAV[trav === "f" ? "f" : "m"];
  if (sp === "paimon") return CAST.パイモン;
  if (sp === "narr") return NARR;
  return CAST[sp] || CAST[ALIAS[sp]];
}
function toCast([grp, fam, p, i, s]) {
  const t = GROUP[grp].t;
  return { grp, fam, p: p ?? t[0], i: i ?? t[1], s: s ?? t[2] };
}
function baseCast(sp, D, trav) {
  const e = entry(sp, D, trav);
  if (e) return toCast(e);
  // người nói lạ: chọn giọng thanh niên theo tên (ổn định giữa các lần)
  const grp = hashStr(sp || "?") % 2 ? "yf" : "ym";
  return toCast([grp, GROUP[grp].pool[hashStr(sp || "?") % GROUP[grp].pool.length]]);
}

// Phân vai cho cả một truyện: trong cùng truyện không để hai người nói trùng một giọng VOICEVOX.
// Ưu tiên giữ giọng gốc: nhân vật chính → Lữ Khách → Paimon → dẫn truyện → nhân vật phụ (nói nhiều trước).
const memo = new Map();
export function storyCast(D, trav = "m") {
  const k = `${D?.id}|${trav}`;
  if (memo.has(k)) return memo.get(k);
  const count = {};
  for (const C of D?.chapters || []) for (const n of C.nodes) count[n.sp] = (count[n.sp] || 0) + 1;
  const order = ["char", "trav", "paimon", "narr", ...Object.keys(count).filter((s) => !["char", "trav", "paimon", "narr"].includes(s)).sort((a, b) => count[b] - count[a])];
  const used = new Set(), out = {};
  for (const sp of order) {
    const c = baseCast(sp, D, trav);
    if (used.has(FAM[c.fam].n)) {
      const g = FAM[c.fam].g;
      const alt = GROUP[c.grp].pool.find((f) => FAM[f].g === g && !used.has(FAM[f].n));
      if (alt) c.fam = alt;
    }
    used.add(FAM[c.fam].n);
    out[sp] = c;
  }
  out.me = out.trav;
  memo.set(k, out);
  return out;
}
export const castOf = (sp, D, trav) => storyCast(D, trav)[sp] || baseCast(sp, D, trav);
export const voiceCredit = (c) => `VOICEVOX:${FAM[c.fam].n}`;
export const groupLabel = (c) => GROUP[c.grp]?.vi || "";

// ——— cài đặt riêng của máy (không đồng bộ lên hồ sơ) ———
const LS = { url: "vv_local_url", key: "vv_api_key" };
const lsGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
export const localUrl = () => (lsGet(LS.url, "http://127.0.0.1:50021") || "").trim().replace(/\/+$/, "");
export const setLocalUrl = (v) => { lsSet(LS.url, v); localIds = null; };
export const apiKey = () => (lsGet(LS.key, "") || "").trim();
export const setApiKey = (v) => lsSet(LS.key, v);

// ——— trạng thái (để giao diện hiện "đang tạo giọng…" / lỗi) ———
const subs = new Set();
let status = { busy: 0, err: "" };
const emit = (patch) => { status = { ...status, ...patch }; subs.forEach((f) => f(status)); };
export const onVoiceStatus = (f) => { subs.add(f); f(status); return () => subs.delete(f); };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchT(url, opt = {}, ms = 15000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opt, signal: ctl.signal }); } finally { clearTimeout(t); }
}

// Cảm xúc → kiểu giọng (nếu giọng có) + chỉnh [cao độ +, ngữ điệu ×, tốc độ ×] (chỉnh chỉ áp dụng với VOICEVOX trên máy)
const MOOD = { happy: [0.02, 1.2, 1.03], sad: [-0.02, 0.85, 0.92], angry: [0, 1.3, 1.05], surprised: [0.04, 1.25, 1.05], shy: [0.01, 0.9, 0.95], serious: [-0.01, 0.9, 0.97] };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function styleOf(c, mood) { const f = FAM[c.fam]; return f.m[mood] || f.s; }
function tuneOf(c, mood, speed) {
  const m = MOOD[mood] || [0, 1, 1];
  return { p: clamp(c.p + m[0], -0.15, 0.15), i: clamp(c.i * m[1], 0.3, 1.8), s: clamp(c.s * m[2] * speed, 0.5, 2) };
}

// ——— VOICEVOX trên máy ———
let localIds = null; // "tên|kiểu" → id (lấy từ /speakers để khớp đúng phiên bản VOICEVOX đang chạy)
async function localId(name, [style, id]) {
  if (!localIds) {
    localIds = fetchT(localUrl() + "/speakers", {}, 6000).then((r) => r.json()).then((sp) => {
      const m = new Map(); for (const s of sp) for (const st of s.styles) m.set(`${s.name}|${st.name}`, st.id); return m;
    }).catch((e) => { localIds = null; throw e; });
  }
  const m = await localIds;
  return m.get(`${name}|${style}`) ?? id;
}
async function synthLocal(c, mood, text, speed) {
  const b = localUrl(), f = FAM[c.fam], st = styleOf(c, mood), tn = tuneOf(c, mood, speed);
  const id = await localId(f.n, st);
  const qr = await fetchT(`${b}/audio_query?speaker=${id}&text=${encodeURIComponent(text)}`, { method: "POST" });
  if (!qr.ok) throw new Error(`VOICEVOX: audio_query ${qr.status}`);
  const q = await qr.json();
  Object.assign(q, { speedScale: tn.s, pitchScale: tn.p, intonationScale: tn.i, prePhonemeLength: 0.08, postPhonemeLength: 0.12 });
  const r = await fetchT(`${b}/synthesis?speaker=${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) }, 30000);
  if (!r.ok) throw new Error(`VOICEVOX: synthesis ${r.status}`);
  return r.blob();
}
export async function checkLocal() {
  try {
    const v = await fetchT(localUrl() + "/version", {}, 4000).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    localIds = null; await localId("", ["", 0]);
    return { ok: true, version: v };
  } catch {
    // kết nối được nhưng bị chặn CORS → yêu cầu "no-cors" vẫn thành công
    const alive = await fetchT(localUrl() + "/version", { mode: "no-cors" }, 4000).then(() => true, () => false);
    return { ok: false, alive };
  }
}

// ——— VOICEVOX online (api.tts.quest) — giới hạn ~1 yêu cầu / 2 giây nên xếp hàng, câu cần phát ngay được ưu tiên ———
const Q = []; let running = false, lastAt = 0;
const GAP = 1800;
function enqueueJob(fn, now) {
  let item;
  const promise = new Promise((resolve, reject) => {
    item = { fn, resolve, reject, now };
    if (now) Q.unshift(item);
    else {
      Q.push(item);
      const pre = Q.filter((j) => !j.now); // giữ tối đa 6 câu tạo trước, bỏ câu cũ nhất
      if (pre.length > 6) { const old = pre[0]; Q.splice(Q.indexOf(old), 1); old.reject(new Error("skip")); }
    }
    pump();
  });
  const bump = () => { const i = Q.indexOf(item); if (i > 0) { Q.splice(i, 1); item.now = true; Q.unshift(item); } };
  return { promise, bump };
}
async function pump() {
  if (running) return;
  running = true;
  while (Q.length) {
    const job = Q.shift();
    const w = lastAt + GAP - Date.now();
    if (w > 0) await sleep(w);
    try { job.resolve(await job.fn()); } catch (e) { job.reject(e); }
    lastAt = Date.now();
  }
  running = false;
}
// Bước 1 (bị giới hạn lượt, đi qua hàng đợi): gửi yêu cầu tạo giọng → nhận đường dẫn trạng thái / phát trực tiếp / tải về
async function requestOnline(id, text) {
  const k = apiKey();
  const url = `https://api.tts.quest/v3/voicevox/synthesis?speaker=${id}&text=${encodeURIComponent(text)}${k ? `&key=${encodeURIComponent(k)}` : ""}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetchT(url);
    let j = null; try { j = await r.json(); } catch {}
    if (r.status === 429 || (j && !j.success && j.retryAfter)) { lastAt = Date.now(); await sleep(((j?.retryAfter) || 3) * 1000 + 300); continue; }
    if (!j?.success) throw new Error(j?.errorMessage || `tts.quest lỗi ${r.status}`);
    return j;
  }
  throw new Error("VOICEVOX online đang quá tải, thử lại sau ít phút");
}
// Bước 2 (chạy song song, không tốn lượt): chờ tạo xong rồi tải file mp3 hoàn chỉnh
async function downloadOnline(j) {
  for (let i = 0; ; i++) {
    const s = await fetchT(j.audioStatusUrl, {}, 8000).then((x) => x.json()).catch(() => ({}));
    if (s.isAudioError) throw new Error("tts.quest không tạo được âm thanh");
    if (s.isAudioReady) break;
    if (i > 150) throw new Error("tts.quest phản hồi quá lâu");
    await sleep(600);
  }
  const a = await fetchT(j.mp3DownloadUrl, {}, 20000);
  if (!a.ok) throw new Error(`tts.quest tải âm thanh lỗi ${a.status}`);
  return a.blob();
}

// ——— bộ nhớ đệm: trong phiên (Promise) + Cache Storage (giữ qua các lần mở trang) ———
const CACHE = "vv-audio-v1";
const mem = new Map();
async function keyOf(engine, c, mood, text, speed) {
  const st = styleOf(c, mood), tn = engine === "local" ? tuneOf(c, mood, speed) : null;
  const raw = [engine, FAM[c.fam].n, st[0], tn ? `${tn.p.toFixed(3)},${tn.i.toFixed(3)},${tn.s.toFixed(3)}` : "", text].join("|");
  let h = raw;
  try { const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(raw)); h = [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""); } catch { h = encodeURIComponent(raw); }
  return `https://vv-cache.local/${engine}/${h}`;
}
// Trả về { full: Promise<url file hoàn chỉnh>, stream: Promise<url phát trực tiếp | null> }
async function audioFor(engine, c, mood, text, speed, now) {
  const k = await keyOf(engine, c, mood, text, speed);
  let job = mem.get(k);
  if (job && now && job.pending) job.bump?.(); // câu đang chờ trong hàng đợi (tạo trước) → cho lên đầu
  if (job) return job;
  job = { pending: true };
  const cached = (async () => { try { const cc = await caches.open(CACHE); const hit = await cc.match(k); return hit ? URL.createObjectURL(await hit.blob()) : null; } catch { return null; } })();
  const save = async (blob) => { try { const cc = await caches.open(CACHE); await cc.put(k, new Response(blob, { headers: { "Content-Type": blob.type || "audio/mpeg" } })); } catch {} return URL.createObjectURL(blob); };
  if (engine === "local") {
    job.stream = Promise.resolve(null);
    job.full = cached.then((u) => u || synthLocal(c, mood, text, speed).then(save));
  } else {
    const meta = cached.then((u) => {
      if (u) return null;
      const [, id] = styleOf(c, mood);
      const { promise, bump } = enqueueJob(() => requestOnline(id, text), now);
      job.bump = bump;
      return promise;
    });
    job.stream = meta.then((j) => j?.mp3StreamingUrl || null);
    job.full = cached.then((u) => u || meta.then((j) => downloadOnline(j)).then(save));
  }
  job.stream.catch(() => {});
  job.full.then(() => { job.done = true; }, () => mem.delete(k)).finally(() => { job.pending = false; });
  mem.set(k, job);
  if (mem.size > 150) mem.delete(mem.keys().next().value);
  return job;
}

// ——— phát ———
let audio = null, seq = 0;
export function stopVoice() { seq++; if (audio) audio.pause(); stopWeb(); }

// line: { text, sp, mood } · ctx: { D, set } (set = cài đặt truyện: voice, trav, vspeed)
export async function playVoice({ text, sp, mood }, { D, set }) {
  if (!text) return;
  stopVoice();
  const my = seq, c = castOf(sp, D, set?.trav), engine = set?.voice || "online", speed = +set?.vspeed || 1;
  const web = () => speakLines([{ sp, t: text, g: FAM[c.fam].g }], { rate: 0.95 * speed });
  if (engine === "web") return web();
  emit({ busy: status.busy + 1 });
  try {
    const job = await audioFor(engine, c, mood, text, speed, true);
    // file hoàn chỉnh có sẵn (đã lưu / đã tạo xong) → dùng luôn; chưa có → phát trực tiếp trong lúc đang tạo
    let url = job.done ? await job.full : await Promise.race([job.full, job.stream.then((s) => s || job.full)]);
    if (my !== seq) return;
    audio = audio || new Audio();
    const rate = engine === "online" ? speed : 1;
    audio.defaultPlaybackRate = rate; audio.src = url; audio.playbackRate = rate;
    emit({ err: "" });
    await audio.play();
    await new Promise((r) => { audio.onended = audio.onpause = r; });
  } catch (e) {
    if (my !== seq || e?.name === "AbortError" || e?.name === "NotAllowedError") return;
    emit({ err: engine === "local" ? "Không kết nối được VOICEVOX trên máy — tạm dùng giọng trình duyệt." : `${e.message || "VOICEVOX online lỗi"} — tạm dùng giọng trình duyệt.` });
    await web();
  } finally { emit({ busy: Math.max(0, status.busy - 1) }); }
}

// Tạo trước giọng cho các câu sắp tới (không phát)
export function prefetchVoice(lines, { D, set }) {
  const engine = set?.voice || "online";
  if (engine === "web") return;
  const speed = +set?.vspeed || 1;
  for (const l of lines.slice(0, 4)) if (l?.text) audioFor(engine, castOf(l.sp, D, set?.trav), l.mood, l.text, speed, false).then((j) => { j.full.catch(() => {}); j.stream.catch(() => {}); }).catch(() => {});
}
