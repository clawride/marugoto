// Cơ chế Cầu Nguyện mô phỏng Genshin Impact
// - Nhân vật sự kiện / Thường trú: 5★ 0,6% (bảo hiểm mềm từ lần 74: +6%/lần, cứng 90); 4★ 5,1% (từ lần 9: +51%, cứng 10)
// - Vũ khí sự kiện: 5★ 0,7% (mềm từ lần 63: +7%/lần, cứng 80); 4★ 6,0% (từ lần 8: +60%, cứng 10)
// - Nhân vật sự kiện: 50/50 + bảo hiểm lần sau + "Ánh Sáng Bắt Giữ" (Capturing Radiance)
// - Vũ khí sự kiện: 75/25 + Định Quỹ Đạo (Epitomized Path, 1 điểm định mệnh)
import { CHARS, WEAPONS, keyOf, itemOf } from "@/lib/genshin";

const STD_5C = ["Diluc", "Jean", "Keqing", "Mona", "Qiqi", "Tighnari", "Dehya", "Yumemizuki Mizuki"];
const STD_5W = ["Amos' Bow", "Skyward Harp", "Skyward Pride", "Skyward Spine", "Skyward Blade", "Skyward Atlas", "Aquila Favonia", "Lost Prayer to the Sacred Winds", "Primordial Jade Winged-Spear", "Wolf's Gravestone"];
const STD_4W = ["The Flute", "Lion's Roar", "Sacrificial Sword", "Favonius Sword", "The Bell", "Rainslasher", "Sacrificial Greatsword", "Favonius Greatsword", "Dragon's Bane", "Favonius Lance", "The Stringless", "Rust", "Sacrificial Bow", "Favonius Warbow", "Eye of Perception", "The Widsith", "Sacrificial Fragments", "Favonius Codex"];
const STD_3W = ["Cool Steel", "Harbinger of Dawn", "Skyrider Sword", "Debate Club", "Ferrous Shadow", "Bloodtainted Greatsword", "Black Tassel", "Raven Bow", "Sharpshooter's Oath", "Slingshot", "Magic Guide", "Thrilling Tales of Dragon Slayers", "Emerald Orb"];

const byNames = (list, names) => names.map((n) => list.find((x) => x.en === n)).filter(Boolean);
export const POOL = {
  std5c: byNames(CHARS, STD_5C),
  std5w: byNames(WEAPONS, STD_5W),
  std4w: byNames(WEAPONS, STD_4W),
  std3w: byNames(WEAPONS, STD_3W),
  all4c: CHARS.filter((c) => c.rank === 4),
  lim5c: CHARS.filter((c) => c.rank === 5 && !STD_5C.includes(c.en)).sort((a, b) => b.release - a.release || b.id - a.id),
  lim5w: WEAPONS.filter((w) => w.rank === 5 && !STD_5W.includes(w.en)).sort((a, b) => b.id - a.id),
};

// Banner xoay vòng mỗi 7 ngày (giống một "giai đoạn" ước nguyện)
const PHASE_MS = 7 * 86400000;
export const phaseIndex = (t = Date.now()) => Math.floor(t / PHASE_MS);
export const phaseEnds = (t = Date.now()) => (phaseIndex(t) + 1) * PHASE_MS;

export function currentBanners(t = Date.now()) {
  const p = phaseIndex(t);
  const pickN = (list, n, step) => Array.from({ length: n }, (_, i) => list[(p * step + i * 5 + i) % list.length]);
  const uniq = (arr) => [...new Map(arr.map((x) => [x.id, x])).values()];
  return {
    char: { featured5: POOL.lim5c[p % POOL.lim5c.length], featured4: uniq(pickN(POOL.all4c, 3, 3)) },
    weapon: { featured5: uniq([POOL.lim5w[(p * 2) % POOL.lim5w.length], POOL.lim5w[(p * 2 + 1) % POOL.lim5w.length]]), featured4: uniq(pickN(POOL.std4w, 5, 5)) },
  };
}

export const BANNER_INFO = {
  char: { name: "Ước Nguyện Nhân Vật Sự Kiện", fate: "i", hard5: 90, soft5: 74, base5: 0.006, inc5: 0.06, hard4: 10, soft4: 9, base4: 0.051, inc4: 0.51 },
  weapon: { name: "Ước Nguyện Vũ Khí Sự Kiện", fate: "i", hard5: 80, soft5: 63, base5: 0.007, inc5: 0.07, hard4: 10, soft4: 8, base4: 0.06, inc4: 0.6 },
  standard: { name: "Ước Nguyện Thường Trú · Bôn Ba", fate: "a", hard5: 90, soft5: 74, base5: 0.006, inc5: 0.06, hard4: 10, soft4: 9, base4: 0.051, inc4: 0.51 },
};

export const rate5 = (b, n) => Math.min(1, n < b.soft5 ? b.base5 : b.base5 + b.inc5 * (n - b.soft5 + 1));
export const rate4 = (b, n) => Math.min(1, n < b.soft4 ? b.base4 : b.base4 + b.inc4 * (n - b.soft4 + 1));

export const newBannerState = () => ({
  char: { p5: 0, p4: 0, g5: false, g4: false, cr: 0 },
  weapon: { p5: 0, p4: 0, g5: false, g4: false, path: null, fp: 0 },
  standard: { p5: 0, p4: 0 },
});

const pick = (a) => a[(Math.random() * a.length) | 0];
const std4 = (exclude = []) => {
  const ex = new Set(exclude.map((x) => x.id));
  return Math.random() < 0.5
    ? { kind: "c", x: pick(POOL.all4c.filter((c) => !ex.has(c.id))) }
    : { kind: "w", x: pick(POOL.std4w.filter((w) => !ex.has(w.id))) };
};

/**
 * Quay 1 lần. `st` là state của banner (bị sửa trực tiếp). Trả về { kind, x, rank, pity, flags }
 */
export function rollOnce(bannerId, st, banners) {
  const B = BANNER_INFO[bannerId];
  st.p5 += 1; st.p4 += 1;
  const pity5 = st.p5, pity4 = st.p4;
  let res;
  if (Math.random() < rate5(B, st.p5)) {
    st.p5 = 0;
    res = { rank: 5, pity: pity5, ...roll5(bannerId, st, banners) };
  } else if (Math.random() < rate4(B, st.p4)) {
    st.p4 = 0;
    res = { rank: 4, pity: pity4, ...roll4(bannerId, st, banners) };
  } else {
    res = { rank: 3, pity: 1, kind: "w", x: pick(POOL.std3w), flags: {} };
  }
  return res;
}

function roll5(bannerId, st, banners) {
  if (bannerId === "char") {
    const F = banners.char.featured5;
    if (st.g5) { st.g5 = false; return { kind: "c", x: F, flags: { guaranteed: true } }; }
    if (Math.random() < 0.5) { st.cr = 0; return { kind: "c", x: F, flags: { won5050: true } }; }
    // Thua 50/50 → có thể kích hoạt Ánh Sáng Bắt Giữ (thua liên tiếp càng nhiều càng dễ)
    if (st.cr >= 3 || (st.cr === 2 && Math.random() < 0.5)) { st.cr = 1; return { kind: "c", x: F, flags: { radiance: true } }; }
    st.cr += 1; st.g5 = true;
    return { kind: "c", x: pick(POOL.std5c), flags: { lost5050: true } };
  }
  if (bannerId === "weapon") {
    const Fs = banners.weapon.featured5;
    const charted = Fs.find((w) => w.id === st.path);
    let x;
    if (charted && st.fp >= 1) { x = charted; st.g5 = false; }
    else if (st.g5 || Math.random() < 0.75) { x = pick(Fs); st.g5 = false; }
    else { x = pick(POOL.std5w); st.g5 = true; }
    const flags = {};
    if (charted) {
      if (x.id === charted.id) { st.fp = 0; flags.path = true; } else st.fp = 1;
    }
    if (!Fs.some((w) => w.id === x.id)) flags.lost5050 = true;
    return { kind: "w", x, flags };
  }
  // Thường trú
  return Math.random() < 0.5 ? { kind: "c", x: pick(POOL.std5c), flags: {} } : { kind: "w", x: pick(POOL.std5w), flags: {} };
}

function roll4(bannerId, st, banners) {
  if (bannerId === "char") {
    const F = banners.char.featured4;
    if (st.g4 || Math.random() < 0.5) { st.g4 = false; return { kind: "c", x: pick(F), flags: { featured: true } }; }
    st.g4 = true;
    const r = std4(F);
    return { ...r, flags: {} };
  }
  if (bannerId === "weapon") {
    const F = banners.weapon.featured4;
    if (st.g4 || Math.random() < 0.75) { st.g4 = false; return { kind: "w", x: pick(F), flags: { featured: true } }; }
    st.g4 = true;
    return { ...std4(F), flags: {} };
  }
  return { ...std4(), flags: {} };
}

/**
 * Tính phần thưởng phụ (Sao Chòm / Tinh Trần) & cung mệnh giống game.
 * `ownedBefore` = số bản đã có trước lần này.
 */
export function extraReward(kind, rank, ownedBefore) {
  if (rank === 3) return { dust: 15, glitter: 0 };
  if (kind === "w") return { dust: 0, glitter: rank === 5 ? 10 : 2 };
  if (ownedBefore === 0) return { dust: 0, glitter: 0 }; // nhân vật mới
  if (ownedBefore <= 6) return { dust: 0, glitter: rank === 5 ? 10 : 2 }; // lên cung mệnh C1–C6
  return { dust: 0, glitter: rank === 5 ? 25 : 5 };
}

export const constLabel = (kind, count) => (kind === "c" ? `C${Math.min(Math.max(count - 1, 0), 6)}` : `R${Math.min(Math.max(count, 1), 5)}`);

export { itemOf, keyOf };
