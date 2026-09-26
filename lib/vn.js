// Truyện nhân vật (galgame) — dữ liệu public/vn/<id>.json, mục lục ngữ pháp public/vn/grammar.json
// Mỗi câu có 3 mức: 1 = A1 (nhập môn) · 2 = A2 (sơ cấp) · 3 = A2/B1–B1 (trung cấp); mức tối đa theo chứng chỉ người học đã đạt.
import { CHARS, keyOf } from "@/lib/genshin";
import { consActive } from "@/lib/gacha";

export const TIERS = {
  1: { name: "Nhập môn", short: "A1", need: "" },
  2: { name: "Sơ cấp", short: "A2", need: "chứng chỉ A2-1 hoặc A2-2" },
  3: { name: "Trung cấp", short: "B1", need: "chứng chỉ A2/B1, B1-1 hoặc B1-2" },
};
const passed = (ex) => Object.values(ex || {}).some((e) => e?.passed);
// Mức cao nhất người học được dùng, theo chứng chỉ đã đạt (chưa có chứng chỉ → A1)
export function tierFromCerts(S) {
  if (!S) return 1;
  if (passed(S.ab1?.ex) || passed(S.b1?.ex) || passed(S.b12?.ex)) return 3;
  if (passed(S.a21?.ex) || passed(S.a22?.ex)) return 2;
  return 1;
}
export const certsText = (S) => {
  const has = [["A1", S?.a1?.ex], ["A2-1", S?.a21?.ex], ["A2-2", S?.a22?.ex], ["A2/B1", S?.ab1?.ex], ["B1-1", S?.b1?.ex], ["B1-2", S?.b12?.ex]].filter(([, ex]) => passed(ex)).map(([n]) => n);
  return has.length ? has.join(", ") : "chưa có chứng chỉ";
};

// Cài đặt hiển thị (lưu trong S.vnSet) · voice: "online" | "local" | "web" (nguồn lồng tiếng) · trav: giọng Lữ Khách "m" | "f" · vspeed: tốc độ đọc
// (bản offline mặc định dùng VOICEVOX trên máy vì không có mạng để dùng bản online)
export const vnSettings = (S) => {
  const v = { ro: true, vi: true, tier: 0, tts: false, voice: "online", trav: "m", vspeed: 1, ...(S?.vnSet || {}) };
  if (process.env.NEXT_PUBLIC_OFFLINE === "1" && v.voice === "online") v.voice = "local";
  return v;
};
export const activeTier = (S) => { const max = tierFromCerts(S), set = vnSettings(S).tier; return set ? Math.min(set, max) : max; };

// Chỉ nhân vật 5★ có truyện; mở khóa khi đã sở hữu, chương C1–C6 cần cung mệnh tương ứng
export const VN_CHARS = CHARS.filter((c) => c.rank === 5);
export const hasStory = (c) => c?.rank === 5;
export const ownedOf = (S, c) => (S?.inv?.[keyOf("c", c)] || 0) > 0;
export const consOfS = (S, c) => consActive(S, keyOf("c", c));
export const chapterOpen = (S, c, ch) => ownedOf(S, c) && ch <= consOfS(S, c);

const cache = {};
export function loadStory(id) {
  if (!cache[id]) cache[id] = fetch(`/vn/${id}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return cache[id];
}
let gcache = null;
export function loadGrammar() {
  if (!gcache) gcache = fetch("/vn/grammar.json").then((r) => r.json()).catch(() => ({}));
  return gcache;
}
// [book, lesson, "Marugoto A2-1 · Bài 5", tiêu đề bài, mẫu, nghĩa, giải thích] → đường dẫn tới bài học
export const grammarHref = (g) => (g ? `/${g[0]}/${g[1]}` : "#");

// Tên người nói
export function speakerName(sp, D) {
  if (sp === "char") return D?.name || "";
  if (sp === "trav") return "旅人";
  if (sp === "paimon") return "パイモン";
  if (sp === "narr") return "";
  return sp;
}

// Cảnh nền: dải màu theo vùng + tên cảnh
export const SCENES = {
  "mond-city": ["Thành Mondstadt", "#6fb6d6", "#2d5a78"], "mond-cathedral": ["Nhà thờ Favonius", "#a9c7e8", "#3c4f7a"], windrise: ["Đồi Gió Khởi", "#8fd4a8", "#2f6a58"],
  "dawn-winery": ["Tửu trang Bình Minh", "#e8b36a", "#6a3e22"], dragonspine: ["Núi Tuyết", "#d7e6f2", "#5a6f86"], "angels-share": ["Quán Angel's Share", "#b07a4a", "#3a2416"],
  "liyue-harbor": ["Cảng Liyue", "#e8c26a", "#7a3a1e"], "wangshu-inn": ["Khách sạn Vọng Thư", "#c9a07a", "#4a3226"], jueyun: ["Tuyệt Vân Gián", "#b8d8c8", "#3e5e56"],
  "yujing-terrace": ["Ngọc Kinh Đài", "#e6d08a", "#6e5220"], "wangsheng-parlor": ["Vãng Sinh Đường", "#b6485a", "#3a1420"], chasm: ["Vực Đá Sâu", "#8a7a6a", "#2a221e"],
  "inazuma-city": ["Thành Inazuma", "#e7a7c0", "#5a2a5a"], tenshukaku: ["Thiên Thủ Các", "#b394e0", "#34205a"], "narukami-shrine": ["Đền Narukami", "#f0b8c8", "#6a2a44"],
  watatsumi: ["Đảo Watatsumi", "#8ad0e0", "#1e4a6a"], yashiro: ["Nhà Kamisato", "#c8d8f0", "#3a4a78"], ritou: ["Cảng Ritou", "#e0c8a0", "#5a4028"],
  "sumeru-city": ["Thành Sumeru", "#9cd67a", "#2e5a24"], akademiya: ["Giáo Viện Sumeru", "#c8e090", "#46602a"], gandharva: ["Rừng Gandharva", "#7ac88a", "#1e4a30"],
  desert: ["Sa mạc", "#f0c878", "#8a4a1e"], "zubayr-theater": ["Nhà hát Zubayr", "#e89a6a", "#5a2a18"], "fontaine-court": ["Tòa án Fontaine", "#9ac0f0", "#243a6a"],
  "opera-epiclese": ["Nhà hát Epiclese", "#b0c8f8", "#2a2a6a"], meropide: ["Pháo đài Meropide", "#8a98a8", "#262e3a"], "fontaine-streets": ["Phố Fontaine", "#a8d8f0", "#2e4e6e"],
  "natlan-arena": ["Đấu trường Natlan", "#f08a5a", "#5a1e14"], "tribe-village": ["Làng bộ tộc", "#e8b070", "#5a3418"], volcano: ["Núi lửa", "#f0704a", "#3a0e0a"],
  "night-realm": ["Dạ Vực", "#6a5ab0", "#140e30"], snezhnaya: ["Snezhnaya", "#d0e0f0", "#3a4a6a"], "nod-krai": ["Nod-Krai", "#a0b8d8", "#26344e"],
  abyss: ["Vực Sâu", "#7a4aa0", "#0e0620"], teapot: ["Ấm Trần Ca", "#e8d8a0", "#4a5a3a"], "camp-night": ["Lửa trại đêm", "#e89a4a", "#140e1e"],
  seaside: ["Bờ biển", "#9ae0e8", "#2a5a7a"], battlefield: ["Chiến trường", "#c86a4a", "#2a1a1a"], "starry-sky": ["Bầu trời sao", "#6a7ad8", "#0a0e2a"],
  indoor: ["Trong nhà", "#d8b890", "#3a2a22"], memory: ["Ký ức", "#e8e0f0", "#5a4a6a"],
};
export const sceneOf = (bg) => SCENES[bg] || SCENES.memory;

// Lưu tiến độ: S.vn[id] = { done: {c: true}, chat: {topic: true}, seen: {c: [nodeIds]} }
export const STORY_REWARD = 40, CHAT_REWARD = 10;
export const vnOf = (S, id) => S?.vn?.[id] || { done: {}, chat: {}, seen: {} };
