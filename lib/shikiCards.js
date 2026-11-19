// 🧪 Đấu thẻ Shikihime (khu thử nghiệm): bàn 3×3, mỗi bên 5 thẻ, thẻ có 4 cạnh số 1–10 (10 hiện là "A").
// Đặt thẻ cạnh thẻ địch: cạnh tiếp giáp lớn hơn thì lật thẻ địch thành của mình. Hết 9 ô: ai sở hữu nhiều thẻ hơn thắng
// (tính cả thẻ còn trên tay). Luật thêm (bật/tắt): Lật bài (open), Bằng nhau (same), Cộng (plus), Liên hoàn (combo), Nguyên tố (elemental).
// 4 cạnh lấy từ chỉ số thẻ (quản trị chỉnh được ở /quan-tri): trên = công (STR hoặc INT theo class), phải = AGI, dưới = DEF, trái = HP.
import { allCards, ELEMENTS, RANKS } from "@/lib/shikihime";
import { CHARS } from "@/lib/genshin";

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
  const deck = cards.map((c, i) => ({ ...c, n: Object.fromEntries(SIDES.map((k) => [k, f[k](raw[i][k])])) }));
  // Hạng thẻ: xếp theo tổng 4 cạnh (yếu → mạnh), chia theo số lượng mỗi hạng; quản trị gán tay thì dùng hạng đó
  const order = deck.map((c, i) => ({ i, p: power(c) + (c.tier || 0) * 0.01 })).sort((a, b) => a.p - b.p);
  const quota = RANK_QUOTA.map((q) => Math.round((q / 36) * deck.length));
  let k = 0, r = 0;
  for (const { i } of order) { while (r < RANKS.length - 1 && k >= quota.slice(0, r + 1).reduce((a, b) => a + b, 0)) r++; deck[i].rank = deck[i].rankFix || RANKS[r]; k++; }
  return deck;
}
// số thẻ mỗi hạng (trên 36 thẻ): F E D C B A S SR
export const RANK_QUOTA = [6, 6, 5, 5, 4, 4, 3, 3];
// tỉ lệ rút (%) — thẻ càng tốt càng hiếm
export const RANK_ODDS = { F: 28, E: 22, D: 17, C: 12, B: 9, A: 6, S: 4, SR: 2 };
export const rankIdx = (r) => RANKS.indexOf(r);

// Rút khởi đầu: 5 thẻ KHÁC NHAU; mỗi lá chọn hạng theo tỉ lệ rồi chọn ngẫu nhiên một thẻ còn lại của hạng đó
export function drawCards(deck, n = 5, rand = Math.random) {
  const left = deck.slice(), out = [];
  while (out.length < n && left.length) {
    const avail = RANKS.filter((r) => left.some((c) => c.rank === r));
    const tot = avail.reduce((a, r) => a + RANK_ODDS[r], 0);
    let x = rand() * tot, rk = avail[0];
    for (const r of avail) { x -= RANK_ODDS[r]; if (x <= 0) { rk = r; break; } }
    const pool = left.filter((c) => c.rank === rk), c = pool[Math.floor(rand() * pool.length)];
    out.push(c); left.splice(left.indexOf(c), 1);
  }
  return out;
}

// ——— Đối thủ: nhân vật Genshin, mỗi người một bộ 5 thẻ cố định (theo hạng), thắng người trước mới mở người sau ———
// band = [hạng thấp nhất, hạng cao nhất] của bộ bài · ai = độ khó của máy
export const OPPONENTS = [
  { en: "Amber", band: ["F", "E"], ai: "easy", line: "Kỵ sĩ Thám hiểm Amber, sẵn sàng!" },
  { en: "Barbara", band: ["F", "D"], ai: "easy", line: "Cố lên nhé, mình sẽ không nương tay đâu~" },
  { en: "Kaeya", band: ["E", "D"], ai: "normal", line: "Chơi bài à? Ta rất giỏi đoán ý người khác đấy." },
  { en: "Lisa", band: ["E", "C"], ai: "normal", line: "Cưng à, thắng được ta thì lấy một lá nhé." },
  { en: "Xiangling", band: ["D", "C"], ai: "normal", line: "Thua thì phải ăn thử món mới của mình đó!" },
  { en: "Bennett", band: ["D", "B"], ai: "normal", line: "Hy vọng lần này mình không xui xẻo…" },
  { en: "Fischl", band: ["C", "B"], ai: "normal", line: "Hoàng nữ Đêm Phán Quyết chấp nhận lời thách đấu!" },
  { en: "Ningguang", band: ["C", "A"], ai: "hard", line: "Mỗi lá bài là một khoản đầu tư." },
  { en: "Diluc", band: ["B", "A"], ai: "hard", line: "Nói ít thôi. Chơi đi." },
  { en: "Keqing", band: ["B", "S"], ai: "hard", line: "Ta sẽ thắng bằng chính sức của mình." },
  { en: "Zhongli", band: ["A", "S"], ai: "hard", line: "Khế ước đã lập — thắng thua đều phải giữ lời." },
  { en: "Ganyu", band: ["A", "S"], ai: "hard", line: "Ta… ta sẽ cố gắng hết sức." },
  { en: "Raiden Shogun", band: ["S", "SR"], ai: "hard", line: "Vĩnh hằng không cho phép thất bại." },
  { en: "Neuvillette", band: ["S", "SR"], ai: "hard", line: "Phiên xét xử bắt đầu." },
  { en: "Nahida", band: ["A", "SR"], ai: "hard", line: "Để mình xem cậu nghĩ gì nào~" },
].map((o, i) => ({ ...o, i, char: CHARS.find((c) => c.en === o.en) })).filter((o) => o.char);

// số ngẫu nhiên có hạt giống (bộ bài của mỗi đối thủ luôn giống nhau)
function seeded(seed) { let x = seed >>> 0; return () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function oppDeck(op, deck) {
  const lo = rankIdx(op.band[0]), hi = rankIdx(op.band[1]);
  const pool = deck.filter((c) => rankIdx(c.rank) >= lo && rankIdx(c.rank) <= hi).sort((a, b) => a.id.localeCompare(b.id));
  const rnd = seeded(op.char.id * 7919 + op.i), out = [];
  const p = pool.slice();
  while (out.length < 5 && p.length) out.push(p.splice(Math.floor(rnd() * p.length), 1)[0]);
  if (out.length === 5) return out;
  // thiếu thẻ trong khoảng hạng → lấy thêm thẻ gần nhất
  for (const c of deck.slice().sort((a, b) => Math.abs(rankIdx(a.rank) - hi) - Math.abs(rankIdx(b.rank) - hi))) { if (out.length >= 5) break; if (!out.includes(c)) out.push(c); }
  return out;
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
