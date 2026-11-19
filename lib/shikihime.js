// 🧪 Khu thử nghiệm · Bộ thẻ Shikihime (式姫草子): 36 thẻ, mỗi thẻ có class, nguyên tố và chỉ số HP MP STR INT DEF AGI.
// Dữ liệu gốc: data/shikihime.json (ảnh hiển thị trực tiếp từ trang chính thức shikihime-project.com, không sao chép).
// Quản trị viên chỉnh chỉ số thẻ và vũ khí ở /quan-tri (lưu bảng site_settings, khóa "shiki"); không chỉnh thì dùng chỉ số mặc định dưới đây.
import CARDS from "@/data/shikihime.json";
import { WEAPONS } from "@/lib/genshin";

export const SHIKI_CARDS = CARDS;
export const STATS = ["hp", "mp", "str", "int", "def", "agi"];
export const STAT_VI = { hp: "HP", mp: "MP", str: "STR", int: "INT", def: "DEF", agi: "AGI", atk: "ATK" };

// 4 class (Rìu xếp vào Kiếm — vũ khí cận chiến; Hồi phục xếp vào Phép thuật)
export const CLASSES = {
  kiem: { vi: "Kiếm", ico: "🗡️", range: 1, magic: false },
  thuong: { vi: "Thương", ico: "🔱", range: 2, magic: false, line: true }, // đâm xa 2 ô theo hàng/cột
  cung: { vi: "Cung", ico: "🏹", range: 3, magic: false, minRange: 1 },
  phep: { vi: "Phép thuật", ico: "🔮", range: 2, magic: true },
};
export const ELEMENTS = ["pyro", "hydro", "anemo", "electro", "dendro", "cryo", "geo"];

const BASE = {
  kiem: { hp: 520, mp: 60, str: 48, int: 14, def: 34, agi: 30 },
  thuong: { hp: 480, mp: 70, str: 42, int: 18, def: 28, agi: 40 },
  cung: { hp: 400, mp: 90, str: 40, int: 26, def: 22, agi: 46 },
  phep: { hp: 360, mp: 160, str: 14, int: 52, def: 20, agi: 32 },
};
// chỉnh thêm theo nhóm gốc của thẻ
const TWEAK = { "Rìu": { str: 1.15, agi: 0.85, def: 1.1 }, "Hồi phục": { hp: 1.15, mp: 1.2, int: 0.9 } };

export function defaultStats(c) {
  const b = BASE[c.cls], k = 1 + 0.15 * ((c.tier || 1) - 1), tw = TWEAK[c.he] || {};
  return Object.fromEntries(STATS.map((s) => [s, Math.round(b[s] * k * (tw[s] || 1))]));
}

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

// Gộp cấu hình quản trị (cfg = { cards: { id: {...} }, weapons: { id: {...} } }) với mặc định
export function cardOf(c, cfg) {
  const o = cfg?.cards?.[c.id] || {};
  const d = defaultStats(c);
  return { ...c, cls: CLASSES[o.cls] ? o.cls : c.cls, el: ELEMENTS.includes(o.el) ? o.el : c.el, stats: Object.fromEntries(STATS.map((s) => [s, Number.isFinite(o[s]) ? o[s] : d[s]])) };
}
export function weaponOf(w, cfg) {
  const o = cfg?.weapons?.[w.id] || {}, d = defaultWeapon(w);
  return { ...w, cls: weaponClass(w), stats: Object.fromEntries(WEAPON_STATS.map((s) => [s, Number.isFinite(o[s]) ? o[s] : d[s]])) };
}
export const allCards = (cfg) => CARDS.map((c) => cardOf(c, cfg));
export const allWeapons = (cfg) => WEAPONS.map((w) => weaponOf(w, cfg));

// Chuẩn hóa dữ liệu quản trị gửi lên (máy chủ dùng): chỉ giữ id hợp lệ, số nguyên 0–99999
const num = (v, max = 99999) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : undefined; };
export function normalizeShiki(raw = {}) {
  const cards = {}, weapons = {};
  for (const c of CARDS) {
    const o = raw?.cards?.[c.id]; if (!o) continue;
    const x = {};
    for (const s of STATS) { const n = num(o[s]); if (n !== undefined) x[s] = n; }
    if (CLASSES[o.cls]) x.cls = o.cls;
    if (ELEMENTS.includes(o.el)) x.el = o.el;
    if (Object.keys(x).length) cards[c.id] = x;
  }
  for (const w of WEAPONS) {
    const o = raw?.weapons?.[w.id]; if (!o) continue;
    const x = {};
    for (const s of WEAPON_STATS) { const n = num(o[s]); if (n !== undefined) x[s] = n; }
    if (Object.keys(x).length) weapons[w.id] = x;
  }
  return { cards, weapons };
}

// Tương khắc nguyên tố (đơn giản cho bản thử nghiệm): đánh vào hệ bị khắc +25%
export const BEATS = { pyro: ["cryo", "dendro"], hydro: ["pyro", "geo"], electro: ["hydro", "anemo"], cryo: ["hydro", "dendro"], dendro: ["hydro", "geo"], anemo: ["pyro", "cryo"], geo: ["electro", "anemo"] };
