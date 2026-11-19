// 🧪 Đấu thẻ Shikihime (khu thử nghiệm): bàn 3×3, mỗi bên 5 thẻ, thẻ có 4 cạnh số 1–10 (10 hiện là "A").
// Đặt thẻ cạnh thẻ địch: cạnh tiếp giáp lớn hơn thì lật thẻ địch thành của mình. Hết 9 ô: ai sở hữu nhiều thẻ hơn thắng
// (tính cả thẻ còn trên tay). Luật thêm (bật/tắt): Lật bài (open), Bằng nhau (same), Cộng (plus), Liên hoàn (combo), Nguyên tố (elemental).
// 4 cạnh lấy từ chỉ số thẻ (quản trị chỉnh được ở /quan-tri): trên = công (STR hoặc INT theo class), phải = AGI, dưới = DEF, trái = HP.
import { allCards, ELEMENTS } from "@/lib/shikihime";

export const SIDES = ["t", "r", "b", "l"];
const OPP = { t: "b", r: "l", b: "t", l: "r" };
const NB = (i) => ({ t: i >= 3 ? i - 3 : -1, b: i <= 5 ? i + 3 : -1, l: i % 3 ? i - 1 : -1, r: i % 3 < 2 ? i + 1 : -1 });
export const showNum = (n) => (n >= 10 ? "A" : String(n));

// Quy chỉ số về 1–10 theo thứ hạng trong cả bộ thẻ (mỗi chỉ số riêng); thẻ bậc cao tự nhiên có số lớn hơn
export function buildDeck(cfg) {
  const cards = allCards(cfg);
  const raw = cards.map((c) => ({ t: c.cls === "phep" ? c.stats.int : c.stats.str, r: c.stats.agi, b: c.stats.def, l: c.stats.hp }));
  const scale = (k) => {
    const v = raw.map((x) => x[k]), lo = Math.min(...v), hi = Math.max(...v);
    return (x) => Math.max(1, Math.min(10, Math.round(1 + ((x - lo) / Math.max(1, hi - lo)) * 9)));
  };
  const f = Object.fromEntries(SIDES.map((k) => [k, scale(k)]));
  return cards.map((c, i) => ({ ...c, n: Object.fromEntries(SIDES.map((k) => [k, f[k](raw[i][k])])) }));
}
export const power = (c) => SIDES.reduce((a, k) => a + c.n[k], 0);

// ô nguyên tố ngẫu nhiên (luật Nguyên tố): thẻ cùng hệ đặt vào +1 mỗi cạnh, khác hệ −1
export function makeBoard(rules) {
  const els = Array(9).fill(null);
  if (rules.elemental) for (let i = 0; i < 9; i++) if (Math.random() < 0.35) els[i] = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
  return { cells: Array(9).fill(null), els };
}
// giá trị cạnh có tính nguyên tố
export function sideVal(cell, el, k) {
  let v = cell.card.n[k];
  if (el) v += cell.card.el === el ? 1 : -1;
  return Math.max(1, Math.min(10, v));
}

// Đặt thẻ → { cells mới, flips: [{ i, by: "basic"|"same"|"plus"|"combo" }] }
export function place(board, i, card, owner, rules) {
  const cells = board.cells.slice();
  cells[i] = { card, owner };
  const flips = [];
  const flip = (j, by) => { if (cells[j] && cells[j].owner !== owner) { cells[j] = { ...cells[j], owner }; flips.push({ i: j, by }); return true; } return false; };
  const adj = (at) => SIDES.map((k) => ({ k, j: NB(at)[k] })).filter((x) => x.j >= 0 && cells[x.j]);
  const val = (at, k) => sideVal(cells[at], board.els[at], k);
  const comboFrom = [];
  // Bằng nhau / Cộng: xét mọi cạnh tiếp giáp (kể cả thẻ của mình) — điều kiện thỏa ở ≥2 cạnh thì lật các thẻ địch trong nhóm đó
  if (rules.same || rules.plus) {
    const pairs = adj(i).map(({ k, j }) => ({ j, a: val(i, k), b: val(j, OPP[k]) }));
    if (rules.same) { const eq = pairs.filter((p) => p.a === p.b); if (eq.length >= 2) for (const p of eq) if (flip(p.j, "same")) comboFrom.push(p.j); }
    if (rules.plus) {
      const sums = {};
      for (const p of pairs) (sums[p.a + p.b] ||= []).push(p);
      for (const g of Object.values(sums)) if (g.length >= 2) for (const p of g) if (flip(p.j, "plus")) comboFrom.push(p.j);
    }
  }
  // luật cơ bản
  for (const { k, j } of adj(i)) if (cells[j].owner !== owner && val(i, k) > val(j, OPP[k])) flip(j, "basic");
  // Liên hoàn: thẻ bị lật bởi Bằng nhau/Cộng tiếp tục lật thẻ địch bên cạnh theo luật cơ bản
  if (rules.combo) {
    const q = [...comboFrom];
    while (q.length) {
      const at = q.shift();
      for (const { k, j } of adj(at)) if (cells[j].owner !== owner && val(at, k) > val(j, OPP[k]) && flip(j, "combo")) q.push(j);
    }
  }
  return { cells, flips };
}

export const score = (cells, hands) => {
  const s = { me: 0, foe: 0 };
  for (const c of cells) if (c) s[c.owner]++;
  s.me += hands.me.length; s.foe += hands.foe.length;
  return s;
};

// Máy chơi: dễ = ngẫu nhiên có ưu tiên lật; vừa = tham (lật nhiều nhất, giữ thẻ mạnh); khó = tham + xét nước đáp trả tốt nhất của người chơi
export function aiMove(board, hands, rules, level = "normal") {
  const empty = board.cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  const moves = [];
  for (const card of hands.foe) for (const i of empty) {
    const r = place(board, i, card, "foe", rules);
    let v = r.flips.length * 10;
    // thẻ để lộ cạnh yếu ra ô trống thì dễ bị lật lại
    for (const k of SIDES) { const j = NB(i)[k]; if (j >= 0 && !r.cells[j]) v -= Math.max(0, 6 - sideVal(r.cells[i], board.els[i], k)) * 0.6; }
    v -= power(card) * 0.15; // ưu tiên giữ thẻ mạnh cho sau
    if (level === "hard" && hands.me.length) {
      const nb = { ...board, cells: r.cells }, left = empty.filter((x) => x !== i);
      let worst = 0;
      for (const mc of hands.me) for (const j of left) worst = Math.max(worst, place(nb, j, mc, "me", rules).flips.length);
      v -= worst * 8;
    }
    moves.push({ card, i, v: level === "easy" ? r.flips.length * 4 + Math.random() * 12 : v + Math.random() * 0.5 });
  }
  moves.sort((a, b) => b.v - a.v);
  return moves[0];
}
