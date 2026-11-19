// Version 1. The browser and the referee replay exactly the same decisions.
// Use an expansion count, never elapsed time, for deterministic search on any device.
import { place, score, sideVal } from "@/lib/shikiCards";

export const DUEL_MODE = "local-v1";
const NODE_LIMIT = 32000;
// Độ khó của máy: 1 Dễ · 2 Thường · 3 Khó · 4 Địa ngục. Trận cũ không có m.level → 4 (giữ nguyên cách chấm cũ).
// Các lần "đi hớ" dùng số ngẫu nhiên có hạt giống từ mã trận + số ô đã đặt → máy chủ chấm lại ra đúng nước đó.
export const LEVELS = { 1: ["Dễ", "初級"], 2: ["Thường", "中級"], 3: ["Khó", "上級"], 4: ["Địa ngục", "地獄"] };
const LEVEL_CFG = { 1: { nodes: 0, depth: 1, blunder: 0.4 }, 2: { nodes: 1500, depth: 2, blunder: 0.18 }, 3: { nodes: 8000, depth: 9, blunder: 0.05 }, 4: { nodes: NODE_LIMIT, depth: 9, blunder: 0 } };
export const stageLevel = (op, cfg) => cfg?.stages?.[op.i]?.level || autoLevel(op.i); // quản trị đặt hoặc tăng dần
export const autoLevel = (opIndex) => Math.min(4, 1 + Math.floor(opIndex / 4)); // 15 đối thủ: 4 Dễ · 4 Thường · 4 Khó · 3 Địa ngục
function seededRandom(m) {
  let h = 2166136261;
  for (const ch of (m.id || "") + "|" + m.cells.filter(Boolean).length) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
const directions = ["t", "r", "b", "l"];
const adjacent = Array.from({ length: 9 }, (_, i) =>
  [i >= 3 ? i - 3 : -1, i % 3 < 2 ? i + 1 : -1, i < 6 ? i + 3 : -1, i % 3 ? i - 1 : -1]);
const cellOrder = [0, 2, 6, 8, 4, 1, 3, 5, 7];
const other = (who) => who === "me" ? "foe" : "me";

function boardOf(m) {
  return { els: m.els, cells: m.cells.map((c) => c && { owner: c.owner, card: m.cards[c.id] }) };
}

export function duelMove(m, id, cell) {
  const who = m.turn;
  if (!Number.isInteger(cell) || cell < 0 || cell > 8 || m.cells[cell] || !m.hands[who]?.includes(id)) {
    throw new Error("Nước đi không hợp lệ.");
  }
  const placed = place(boardOf(m), cell, m.cards[id], who, m.rules);
  const cells = placed.cells.map((c) => c && { owner: c.owner, id: c.card.id });
  const hands = { ...m.hands, [who]: m.hands[who].filter((card) => card !== id) };
  return { match: { ...m, cells, hands, turn: cells.every(Boolean) ? "done" : other(who) },
    step: { who, id, cell, flips: placed.flips } };
}

function evaluate(board, myHand, foeHand, terminal) {
  let balance = foeHand.length - myHand.length;
  let stability = 0;
  for (let i = 0; i < 9; i++) {
    const cell = board.cells[i];
    if (!cell) continue;
    const sign = cell.owner === "foe" ? 1 : -1;
    balance += sign;
    if (terminal) continue;
    let weakest = 11;
    for (let k = 0; k < 4; k++) {
      const j = adjacent[i][k];
      if (j >= 0 && !board.cells[j]) weakest = Math.min(weakest, sideVal(cell, board.els[i], directions[k]));
    }
    stability += sign * (weakest - 6);
  }
  return balance * 100 + stability;
}

// Bài úp (trận có ai ≥ 2 và tắt luật Lật bài): máy KHÔNG được biết bài trên tay người chơi.
// Tay bài đó được thay bằng các lá "ảo" có 4 cạnh = trung bình bài của chính máy (thông tin máy được biết).
function blindHand(m) {
  const own = m.hands.foe.map((id) => m.cards[id]);
  const avg = (k) => Math.round(own.reduce((sum, c) => sum + c.n[k], 0) / Math.max(1, own.length)) || 6;
  const n = { t: avg("t"), r: avg("r"), b: avg("b"), l: avg("l") };
  return m.hands.me.map((_, i) => ({ id: "?" + i, n, el: null }));
}

export function bestDuelMove(m, full = false) {
  const cfg = LEVEL_CFG[full ? 4 : m.level] || LEVEL_CFG[4];
  const board = boardOf(m);
  const blind = m.ai >= 2 && !m.rules.open;
  const myHand = blind ? blindHand(m) : m.hands.me.map((id) => m.cards[id]);
  const foeHand = m.hands.foe.map((id) => m.cards[id]);
  const remaining = board.cells.filter((v) => !v).length;
  let nodes = 0;
  const table = new Map();
  const cardCodes = new Map([...Object.keys(m.cards), ...(blind ? myHand.map((c) => c.id) : [])].sort().map((id, i) => [id, i + 1]));
  const handMask = (hand) => hand.reduce((mask, card) => mask | (1 << cardCodes.get(card.id)), 0);
  const roots = [];
  for (const card of foeHand) for (const cell of cellOrder) {
    if (board.cells[cell]) continue;
    const next = { ...board, cells: place(board, cell, card, "foe", m.rules).cells };
    const hand = foeHand.filter((c) => c !== card);
    roots.push({ id: card.id, cell, next, hand, value: evaluate(next, myHand, hand, remaining === 1) });
  }
  roots.sort((a, b) => b.value - a.value);
  let finishedBest = roots[0];

  function search(position, me, foe, who, left, depth, alpha, beta) {
    if (!depth || !left) return evaluate(position, me, foe, left === 0);
    const maximize = who === "foe", hand = maximize ? foe : me;
    // Identical boards can come from different move orders. Include both hands
    // because a card type can occur on both sides of a duel.
    const key = depth >= 2 ? String.fromCharCode(handMask(me), handMask(foe),
      ...position.cells.map((c) => c ? cardCodes.get(c.card.id) + (c.owner === "foe" ? 16 : 0) : 0)) : null;
    const cached = key && table.get(key);
    if (cached?.depth === depth) {
      if (cached.bound === "exact") return cached.value;
      if (cached.bound === "lower" && cached.value >= beta) return cached.value;
      if (cached.bound === "upper" && cached.value <= alpha) return cached.value;
    }
    const originalAlpha = alpha, originalBeta = beta;
    let best = maximize ? -Infinity : Infinity;
    let bestId, bestCell;
    const firstCard = cached && hand.find((c) => c.id === cached.id);
    const orderedHand = firstCard ? [firstCard, ...hand.filter((c) => c !== firstCard)] : hand;
    searchMoves: for (const card of orderedHand) {
      const rest = hand.filter((c) => c !== card);
      const order = card === firstCard ? [cached.cell, ...cellOrder.filter((i) => i !== cached.cell)] : cellOrder;
      for (const cell of order) {
        if (position.cells[cell]) continue;
        if (++nodes > cfg.nodes) return null;
        const next = { els: position.els, cells: place(position, cell, card, who, m.rules).cells };
        const value = search(next, maximize ? me : rest, maximize ? rest : foe, other(who), left - 1, depth - 1, alpha, beta);
        if (value === null) return null;
        if (maximize ? value > best : value < best) {
          best = value; bestId = card.id; bestCell = cell;
        }
        if (maximize) alpha = Math.max(alpha, best);
        else beta = Math.min(beta, best);
        if (beta <= alpha) break searchMoves;
      }
    }
    if (key) {
      const bound = best <= originalAlpha ? "upper" : best >= originalBeta ? "lower" : "exact";
      table.set(key, { depth, value: best, bound, id: bestId, cell: bestCell });
    }
    return best;
  }

  // Prefer the principal move from the last fully searched depth; discard a partial iteration.
  const pick = () => {
    // máy yếu thỉnh thoảng đi hớ: chọn một trong vài nước kém hơn nước tốt nhất
    const r = seededRandom(m);
    if (cfg.blunder && roots.length > 1 && r() < cfg.blunder) {
      const alt = roots.filter((x) => x !== finishedBest);
      const w = alt[Math.floor(r() * Math.min(3, alt.length))];
      return { id: w.id, cell: w.cell };
    }
    return { id: finishedBest.id, cell: finishedBest.cell };
  };
  for (let depth = 2; depth <= Math.min(remaining, cfg.depth); depth++) {
    let alpha = -Infinity, best = roots[0];
    for (const candidate of roots) {
      const value = search(candidate.next, myHand, candidate.hand, "me", remaining - 1, depth - 1, alpha, Infinity);
      if (value === null) return pick();
      if (value > alpha) { alpha = value; best = candidate; }
    }
    finishedBest = best;
    roots.splice(roots.indexOf(best), 1);
    roots.unshift(best);
  }
  return pick();
}

// Quân sư: nước tốt nhất cho NGƯỜI CHƠI (lật ngược hai phe rồi dùng cùng bộ tìm kiếm).
// Bài úp thì quân sư cũng không nhìn được bài trên tay đối thủ.
export function adviseMove(m) {
  const swap = (c) => c && { ...c, owner: c.owner === "me" ? "foe" : "me" };
  return bestDuelMove({ ...m, cells: m.cells.map(swap), hands: { me: m.hands.foe, foe: m.hands.me }, turn: "foe" }, true);
}

export function computerReply(match) {
  if (match.turn !== "foe") return { match, step: null };
  const { id, cell } = bestDuelMove(match);
  return duelMove(match, id, cell);
}

export function replayDuel(initial, moves) {
  if (!Array.isArray(moves) || moves.length > 5) throw new Error("Lịch sử ván không hợp lệ.");
  let current = computerReply(initial);
  for (const move of moves) {
    if (current.match.turn !== "me") throw new Error("Ván đã kết thúc.");
    current = duelMove(current.match, move?.id, move?.cell);
    if (current.match.turn === "foe") current = computerReply(current.match);
  }
  return current;
}

export function duelResult(m) {
  const tally = score(m.cells, m.hands);
  return { score: tally, result: tally.me > tally.foe ? "w" : tally.me < tally.foe ? "l" : "d" };
}
