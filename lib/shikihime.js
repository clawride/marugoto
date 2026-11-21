import GI from "@/data/genshin.json";
import editionTwo from "@/data/genshin-duel-v2.json";
const GI_IDS = new Set(GI.characters.map((c) => "g" + c.id)); // id thẻ Genshin hợp lệ
const EDITION_TWO_IDS = new Set(editionTwo.map((card) => card.id));
export const isGenshinCardId = (id) => GI_IDS.has(id) || EDITION_TWO_IDS.has(id);
const LEGACY_LADDER = ["Amber", "Barbara", "Kaeya", "Lisa", "Xiangling", "Bennett", "Fischl", "Ningguang", "Diluc", "Keqing", "Zhongli", "Ganyu", "Raiden Shogun", "Neuvillette", "Nahida"];
import { WEAPONS } from "@/lib/genshin";

export const STAT_VI = { hp: "HP", mp: "MP", str: "STR", int: "INT", def: "DEF", agi: "AGI", atk: "ATK" };

// 4 class (Rìu xếp vào Kiếm — vũ khí cận chiến; Hồi phục xếp vào Phép thuật)
export const CLASSES = {
  kiem: { vi: "Kiếm", ico: "🗡️", range: 1, magic: false },
  thuong: { vi: "Thương", ico: "🔱", range: 2, magic: false, line: true }, // đâm xa 2 ô theo hàng/cột
  cung: { vi: "Cung", ico: "🏹", range: 3, magic: false, minRange: 1 },
  phep: { vi: "Phép thuật", ico: "🔮", range: 2, magic: true },
};
export const ELEMENTS = ["pyro", "hydro", "anemo", "electro", "dendro", "cryo", "geo"];
// 8 hạng thẻ từ thấp đến cao (quản trị có thể gán tay; để trống = tự xếp theo sức mạnh)
export const RANKS = ["F", "E", "D", "C", "B", "A", "S", "SR"];
export const RANK_VI = { F: "Kém", E: "Khá kém", D: "Gần trung bình", C: "Trung bình", B: "Trung bình khá", A: "Khá", S: "Tốt", SR: "Xuất sắc" };

// Vũ khí (túi đồ Genshin): loại → class dùng được; chỉ số mặc định theo độ hiếm
export const WT_CLASS = ["kiem", "kiem", "thuong", "cung", "phep"]; // Kiếm Đơn, Trọng Kiếm, Cán Dài, Cung, Pháp Khí
export const WEAPON_STATS = ["atk", "hp", "mp", "str", "int", "def", "agi"];
export function defaultWeapon(w) {
  const atk = { 3: 18, 4: 30, 5: 44 }[w.rank] || 12;
  const bonus = [{ agi: 4 }, { str: 6 }, { agi: 6 }, { agi: 5 }, { int: 8, mp: 20 }][w.wt] || {};
  const m = { 3: 1, 4: 1.6, 5: 2.4 }[w.rank] || 1;
  return Object.fromEntries(WEAPON_STATS.map((s) => [s, s === "atk" ? atk : Math.round((bonus[s] || 0) * m)]));
}
export const weaponClass = (w) => WT_CLASS[w.wt];

export function weaponOf(w, cfg) {
  const o = cfg?.weapons?.[w.id] || {}, d = defaultWeapon(w);
  return { ...w, cls: weaponClass(w), stats: Object.fromEntries(WEAPON_STATS.map((s) => [s, Number.isFinite(o[s]) ? o[s] : d[s]])) };
}
export const allWeapons = (cfg) => WEAPONS.map((w) => weaponOf(w, cfg));

// Chuẩn hóa dữ liệu quản trị gửi lên (máy chủ dùng): chỉ giữ id hợp lệ, số nguyên 0–99999
const num = (v, max = 99999) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : undefined; };
export const EXTRA_RULES = [
  ["same", "Bằng nhau", "Ít nhất 2 cặp cạnh tiếp giáp bằng nhau → lật thẻ đối thủ trong các cặp đó."],
  ["plus", "Cộng", "Ít nhất 2 cặp cạnh tiếp giáp có cùng tổng → lật thẻ đối thủ trong các cặp đó."],
  ["combo", "Liên hoàn", "Thẻ bị lật bởi Bằng nhau hoặc Cộng có thể lật tiếp các thẻ bên cạnh."],
  ["elemental", "Nguyên tố", "Ô có nguyên tố: thẻ cùng hệ +1 mỗi cạnh, khác hệ −1."],
];

export function normalizeShiki(raw = {}) {
  const weapons = {};
  for (const w of WEAPONS) {
    const o = raw?.weapons?.[w.id]; if (!o) continue;
    const x = {};
    for (const s of WEAPON_STATS) { const n = num(o[s]); if (n !== undefined) x[s] = n; }
    if (Object.keys(x).length) weapons[w.id] = x;
  }
  // Ải: độ khó 1–4 và bộ 5 lá của boss do quản trị đặt (bỏ trống = tự động)
  const stages = {};
  for (const [k, o] of Object.entries(raw?.stages || {})) {
    // khóa = id nhân vật boss; số nhỏ (< 100) là số thứ tự ải kiểu cũ → đổi sang id nhân vật
    let i = Number(k);
    if (!Number.isInteger(i) || i < 0 || !o) continue;
    if (i < 100) i = GI.characters.find((c) => c.en === LEGACY_LADDER[i])?.id;
    if (!i || !GI_IDS.has("g" + i)) continue;
    const x = {};
    if ([1, 2, 3, 4].includes(Number(o.level))) x.level = Number(o.level);
    if (Array.isArray(o.deck)) {
      const ids = [...new Set(o.deck.map(String))].filter((id) => isGenshinCardId(id)).slice(0, 5);
      if (ids.length === 5) x.deck = ids;
    }
    const rules = EXTRA_RULES.map(([key]) => key).filter((key) => Array.isArray(o.rules) && o.rules.includes(key));
    if (rules.length) x.rules = rules;
    if (Object.keys(x).length) stages[i] = x;
  }
  return {
    cards: {}, weapons, stages,
    firstMatchDraft: raw?.firstMatchDraft !== false,
    autoEnabled: raw?.autoEnabled !== false,
    autoLimit: Math.max(1, num(raw?.autoLimit ?? 999, 999) ?? 999),
  };
}

// Tương khắc nguyên tố (đơn giản cho bản thử nghiệm): đánh vào hệ bị khắc +25%
export const BEATS = { pyro: ["cryo", "dendro"], hydro: ["pyro", "geo"], electro: ["hydro", "anemo"], cryo: ["hydro", "dendro"], dendro: ["hydro", "geo"], anemo: ["pyro", "cryo"], geo: ["electro", "anemo"] };

