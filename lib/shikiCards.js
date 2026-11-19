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
  return deck.concat(genshinCards(rankRanges(deck)));
}

// Khoảng tổng 4 cạnh của mỗi hạng, đo trên bộ 36 lá Shikihime — thẻ Genshin cùng hạng phải nằm trong đúng khoảng này
function rankRanges(shiki) {
  const out = {};
  RANKS.forEach((r, i) => {
    const p = shiki.filter((c) => c.rank === r).map(power);
    out[r] = p.length ? [Math.min(...p), Math.max(...p)] : [8 + i * 3, 10 + i * 3];
  });
  // giữ thứ tự tăng dần giữa các hạng (phòng khi quản trị gán hạng tay làm khoảng bị chồng)
  for (let i = 1; i < RANKS.length; i++) {
    const prev = out[RANKS[i - 1]], cur = out[RANKS[i]];
    if (cur[0] <= prev[1]) cur[0] = Math.min(cur[1], prev[1] + 1);
    if (cur[1] < cur[0]) cur[1] = cur[0];
  }
  return out;
}

// ——— Thẻ nhân vật Genshin (120 lá): ảnh splash cắt dọc ở /shiki-duel/gi/<id>.webp (scripts/build-gi-cards.cjs) ———
// 1) Xếp hạng F–SR theo tỉ lệ số lá mỗi hạng như bộ Shikihime; 5★ đứng trên 4★ (thứ tự trong cùng độ hiếm cố định theo id).
// 2) Tổng 4 cạnh lấy trong đúng khoảng điểm của hạng đó ở bộ Shikihime → hạng nào thì mạnh đúng hạng đó.
// 3) Chia tổng ra 4 cạnh theo loại vũ khí (trên = công, phải = nhanh, dưới = thủ, trái = máu).
export const GI_WEAPON = ["Kiếm Đơn", "Trọng Kiếm", "Vũ Khí Cán Dài", "Cung", "Pháp Khí"];
const SHAPE = [[1, 1, 1, 1], [1.35, 0.7, 1.1, 0.95], [1.1, 1.3, 0.8, 0.9], [1.15, 1.2, 0.75, 0.95], [1.35, 0.9, 0.7, 1.05]];
let giCache = null, giKey = "";
export function genshinCards(ranges) {
  ranges ||= rankRanges(baseShiki());
  const key = JSON.stringify(ranges);
  if (giCache && giKey === key) return giCache;
  const quota = RANK_QUOTA.map((q) => Math.round((q / 36) * CHARS.length));
  const order = CHARS.map((ch) => ({ ch, p: ch.rank * 10 + seeded(ch.id * 40503)() * 9 })).sort((x, y) => x.p - y.p);
  const rankOf = new Map();
  let k = 0, r = 0;
  for (const { ch } of order) { while (r < RANKS.length - 1 && k >= quota.slice(0, r + 1).reduce((a, b) => a + b, 0)) r++; rankOf.set(ch.id, RANKS[r]); k++; }
  const cards = CHARS.map((ch) => {
    const rnd = seeded(ch.id * 2654435761), rank = rankOf.get(ch.id), [lo, hi] = ranges[rank];
    const target = Math.min(40, Math.max(4, lo + Math.round(rnd() * (hi - lo))));
    const w = SHAPE[ch.wt] || SHAPE[0];
    const raw = w.map((x) => x * (0.8 + rnd() * 0.4)), sum = raw.reduce((a, b) => a + b, 0);
    const v = raw.map((x) => Math.max(1, Math.min(10, Math.round((x / sum) * target))));
    for (let i = 0, d = target - v.reduce((a, b) => a + b, 0); d !== 0 && i < 80; i++) { // chỉnh cho tổng đúng mục tiêu
      const j = i % 4, nv = v[j] + Math.sign(d);
      if (nv >= 1 && nv <= 10) { v[j] = nv; d -= Math.sign(d); }
    }
    return { id: "g" + ch.id, gi: true, charId: ch.id, name: ch.vi, ro: ch.en, el: ch.el, stars: ch.rank, wt: ch.wt, rank,
      img: "/shiki-duel/gi/" + ch.id + ".webp", n: { t: v[0], r: v[1], b: v[2], l: v[3] } };
  });
  giKey = key;
  return (giCache = cards);
}
// bộ Shikihime với chỉ số mặc định (dùng khi chưa có cấu hình, ví dụ lúc dựng danh sách boss)
let baseCache = null;
function baseShiki() { return (baseCache ||= buildDeck({}).filter((c) => !c.gi)); }
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
// 15 boss cũ (thứ tự ải trước đây) — để chuyển tiến độ cũ sang cách lưu theo nhân vật
export const LEGACY_LADDER = ["Amber", "Barbara", "Kaeya", "Lisa", "Xiangling", "Bennett", "Fischl", "Ningguang", "Diluc", "Keqing", "Zhongli", "Ganyu", "Raiden Shogun", "Neuvillette", "Nahida"];
export const legacyCharId = (i) => CHARS.find((c) => c.en === LEGACY_LADDER[i])?.id;

// 120 boss = 120 nhân vật Genshin, xếp từ yếu đến mạnh theo sức mạnh lá bài của chính họ.
// band = khoảng hạng của 4 lá còn lại trong bộ bài boss (lá thứ 5 luôn là thẻ mang hình boss).
export const OPPONENTS = (() => {
  const byChar = new Map(genshinCards().map((c) => [c.charId, c]));
  const order = CHARS.filter((ch) => byChar.has(ch.id)).sort((x, y) => {
    const cx = byChar.get(x.id), cy = byChar.get(y.id);
    return rankIdx(cx.rank) - rankIdx(cy.rank) || power(cx) - power(cy) || (x.release || 0) - (y.release || 0);
  });
  const N = order.length;
  return order.map((ch, i) => {
    const t = N > 1 ? i / (N - 1) : 0, lo = Math.min(6, Math.floor(t * 7)), hi = Math.min(7, lo + (t > 0.45 ? 2 : 1));
    return { i, en: ch.en, char: ch, band: [RANKS[lo], RANKS[hi]] };
  });
})();
export const opById = (id) => OPPONENTS.find((o) => o.char.id === Number(id));

// số ngẫu nhiên có hạt giống (bộ bài của mỗi đối thủ luôn giống nhau)
function seeded(seed) { let x = seed >>> 0; return () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Bộ bài của boss: quản trị đặt 5 lá cho ải thì dùng bộ đó, không thì bộ cố định tự sinh
export const ownCardId = (op) => "g" + op.char.id;
export function stageDeck(op, deck, cfg) {
  const ids = cfg?.stages?.[op.char.id]?.deck;
  if (ids) {
    const by = Object.fromEntries(deck.map((c) => [String(c.id), c]));
    const cs = ids.map((id) => by[id]).filter(Boolean);
    if (cs.length === 5) {
      const own = by[ownCardId(op)];
      if (own && !cs.includes(own)) cs[4] = own; // quản trị quên lá của boss → thay lá cuối
      return cs;
    }
  }
  return oppDeck(op, deck);
}
export function oppDeck(op, deck) {
  const lo = rankIdx(op.band[0]), hi = rankIdx(op.band[1]);
  const own = deck.find((c) => c.id === ownCardId(op));
  const pool = deck.filter((c) => c !== own && rankIdx(c.rank) >= lo && rankIdx(c.rank) <= hi).sort((a, b) => a.id.localeCompare(b.id));
  const rnd = seeded(op.char.id * 7919 + op.i), out = own ? [own] : [];
  const p = pool.slice();
  while (out.length < 5 && p.length) out.push(p.splice(Math.floor(rnd() * p.length), 1)[0]);
  if (out.length === 5) return out;
  // thiếu thẻ trong khoảng hạng → lấy thêm thẻ gần nhất
  for (const c of deck.slice().sort((a, b) => Math.abs(rankIdx(a.rank) - hi) - Math.abs(rankIdx(b.rank) - hi))) { if (out.length >= 5) break; if (!out.includes(c)) out.push(c); }
  return out;
}
export function power(c) { return SIDES.reduce((a, k) => a + c.n[k], 0); }

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
