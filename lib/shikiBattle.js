// Luật trận đấu đội hình kiểu TS Online (khu thử nghiệm): mỗi bên một đội hình 3×3 (hàng 0 = trước, 2 = sau), đánh theo lượt.
// Lượt: ra lệnh cho cả đội → mọi đơn vị (hai bên) hành động theo AGI giảm dần.
import { CLASSES, STATS, BEATS } from "@/lib/shikihime";

export const SKILL_MP = { kiem: 30, thuong: 30, cung: 35, phep: 40, heal: 35 };
export const isHealer = (u) => u.card.he === "Hồi phục";
const rnd = (a, b) => a + Math.random() * (b - a);

export function makeUnit(card, weapon, side, r, c, uid) {
  const w = weapon?.stats || {};
  const s = Object.fromEntries(STATS.map((k) => [k, card.stats[k] + (w[k] || 0)]));
  return { uid, side, card, weapon, r, c, max: { hp: s.hp, mp: s.mp }, hp: s.hp, mp: s.mp, str: s.str, int: s.int, def: s.def, agi: s.agi, atk: w.atk || 0, guard: false };
}
export const alive = (us) => us.filter((u) => u.hp > 0);
// hàng trước nhất còn người của một bên
export const frontRow = (us) => Math.min(...alive(us).map((u) => u.r), 9);

// Kiếm phải đứng hàng trước nhất của đội mới đánh được; Thương đứng hàng trước hoặc hàng kế tiếp; Cung, Phép đánh từ đâu cũng được
export function canStrike(u, team) {
  const C = u.card.cls, f = frontRow(team);
  if (C === "kiem") return u.r === f;
  if (C === "thuong") return u.r <= f + 1;
  return true;
}
// Mục tiêu đánh thường được phép: Kiếm chỉ đánh hàng trước nhất của địch, Thương đánh tới 2 hàng đầu, Cung/Phép đánh bất kỳ ai
export function targetsFor(u, foes) {
  const f = frontRow(foes), C = u.card.cls;
  return alive(foes).filter((t) => (C === "kiem" ? t.r === f : C === "thuong" ? t.r <= f + 1 : true));
}

export function damage(a, b, mult = 1) {
  const magic = CLASSES[a.card.cls].magic;
  let dmg = magic ? (a.int + a.atk) * 1.15 - b.def * 0.3 : (a.str + a.atk) - b.def * 0.6;
  dmg = Math.max(6, dmg) * mult * rnd(0.9, 1.1);
  const el = BEATS[a.card.el]?.includes(b.card.el);
  if (el) dmg *= 1.25;
  const crit = Math.random() < Math.min(0.35, a.agi / 400);
  if (crit) dmg *= 1.5;
  if (b.guard) dmg *= 0.5;
  return { dmg: Math.round(dmg), crit, el };
}

// Đội hình tự động: Kiếm/Thương hàng trước, Cung giữa, Phép sau; mỗi hàng tối đa 3, tràn thì lùi hàng
export function autoFormation(cards) {
  const pref = { kiem: 0, thuong: 0, cung: 1, phep: 2 };
  const rows = [[], [], []];
  for (const c of cards) {
    const want = pref[c.cls] ?? 1;
    const r = [want, want + 1, want + 2, want - 1, want - 2].find((x) => x >= 0 && x <= 2 && rows[x].length < 3);
    rows[r ?? 0].push(c);
  }
  const COLS = [[], [1], [0, 2], [0, 1, 2]];
  return rows.flatMap((row, r) => row.map((card, i) => ({ card, r, c: COLS[row.length][i] })));
}

// AI chọn hành động cho một đơn vị
export function aiOrder(u, mine, foes) {
  const hurt = alive(mine).filter((x) => x.hp < x.max.hp * 0.45).sort((a, b) => a.hp / a.max.hp - b.hp / b.max.hp)[0];
  if (isHealer(u) && hurt && u.mp >= SKILL_MP.heal) return { kind: "heal", target: hurt.uid };
  if (!canStrike(u, mine)) return { kind: "guard" };
  const ts = targetsFor(u, foes);
  if (!ts.length) return { kind: "guard" };
  const t = ts.sort((a, b) => a.hp - b.hp)[0];
  const cost = SKILL_MP[u.card.cls];
  if (u.mp >= cost && Math.random() < 0.35) return { kind: "skill", target: t.uid };
  return { kind: "attack", target: t.uid };
}
