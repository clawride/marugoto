// Đấu thẻ Genshin Impact — luật chạy NGAY TRÊN TRÌNH DUYỆT (giảm tải máy chủ).
// Hộp bài, chỉ số, trận đang đấu lưu trong tiến độ của trò chơi (S.shiki → localStorage) và tự đồng bộ lên tài khoản
// cùng phần tiến độ học (/api/save). Các hàm dưới đây nhận d = S.shiki (bản sao, được phép sửa trực tiếp).
import { RANKS } from "@/lib/shikihime";
import { drawCards, OPPONENTS, oppDeck, makeBoard, place, aiMove, score, power, rankIdx } from "@/lib/shikiCards";

export const RULE_KEYS = ["open", "same", "plus", "combo", "elemental"];
export const emptyShiki = () => ({ box: {}, starter: null, deck: [], beat: {}, rec: { w: 0, l: 0, d: 0 }, match: null, pending: null });
export const fixShiki = (d) => ({ ...emptyShiki(), ...(d || {}), rec: { w: 0, l: 0, d: 0, ...(d?.rec || {}) } });

const fail = (msg) => { throw new Error(msg); };
const MIN_KINDS = 5;
// Lấy 1 lá khỏi Hộp bài ("best" = hạng cao nhất, mạnh nhất · "random") → id thẻ bị lấy, hoặc null nếu được bảo vệ
function takeCard(d, byId, how) {
  const kinds = Object.keys(d.box).filter((id) => d.box[id] > 0 && byId[id]);
  const ok = kinds.filter((id) => d.box[id] > 1 || kinds.length > MIN_KINDS);
  if (!ok.length) return null;
  let id;
  if (how === "best") id = ok.sort((a, b) => rankIdx(byId[b].rank) - rankIdx(byId[a].rank) || power(byId[b]) - power(byId[a]))[0];
  else { const pool = ok.flatMap((x) => Array(d.box[x]).fill(x)); id = pool[Math.floor(Math.random() * pool.length)]; }
  d.box[id]--;
  if (d.box[id] <= 0) {
    delete d.box[id];
    if (d.deck.includes(id)) { // lá bị lấy đang trong bộ bài → bù lá mạnh nhất còn lại
      d.deck = d.deck.filter((x) => x !== id);
      const fill = Object.keys(d.box).filter((x) => d.box[x] > 0 && byId[x] && !d.deck.includes(x)).sort((p, q) => rankIdx(byId[q].rank) - rankIdx(byId[p].rank) || power(byId[q]) - power(byId[p]))[0];
      if (fill) d.deck.push(fill);
    }
  }
  return id;
}

function step(m, byId, who, handIdx, cell) {
  const hand = m.hands[who], id = hand[handIdx];
  const board = { els: m.els, cells: m.cells.map((c) => (c ? { card: byId[c.id], owner: c.owner } : null)) };
  const r = place(board, cell, byId[id], who, m.rules);
  m.cells = r.cells.map((c) => (c ? { id: c.card.id, owner: c.owner } : null));
  m.hands[who] = hand.filter((_, k) => k !== handIdx);
  m.turn = who === "me" ? "foe" : "me";
  return { who, id, cell, flips: r.flips };
}
function aiStep(m, byId, level) {
  const board = { els: m.els, cells: m.cells.map((c) => (c ? { card: byId[c.id], owner: c.owner } : null)) };
  const mv = aiMove(board, { me: m.hands.me.map((i) => byId[i]), foe: m.hands.foe.map((i) => byId[i]) }, m.rules, level);
  return step(m, byId, "foe", m.hands.foe.indexOf(mv.card.id), mv.i);
}

// Một thao tác của người chơi → kết quả (giống API máy chủ cũ). Lỗi → throw Error(lời nhắn).
export function act(d, deck, byId, action, b = {}) {
  switch (action) {
    case "starter": {
      if (d.starter) fail("Đã rút bài khởi đầu");
      const got = drawCards(deck, 5);
      for (const c of got) d.box[c.id] = (d.box[c.id] || 0) + 1;
      d.starter = got.map((c) => c.id); d.deck = d.starter.slice();
      return { drawn: d.starter };
    }
    case "deck": {
      const ids = [...new Set((b.deck || []).map(String))].slice(0, 5);
      if (ids.some((id) => !(d.box[id] > 0))) fail("Chỉ chọn được thẻ có trong Hộp bài");
      d.deck = ids; return {};
    }
    case "start": {
      if (d.match) return { steps: [] };
      if (d.pending) fail("Hãy nhận thẻ thưởng của trận trước");
      const op = OPPONENTS[Number(b.op)];
      if (!op) fail("Không có đối thủ này");
      if (op.i > 0 && !(d.beat[op.i - 1] > 0)) fail("Đối thủ này chưa mở khóa");
      const mine = d.deck.filter((id) => d.box[id] > 0 && byId[id]);
      if (new Set(mine).size !== 5) fail("Cần đủ 5 thẻ trong bộ bài");
      const rules = Object.fromEntries(RULE_KEYS.map((k) => [k, b.rules?.[k] === true]));
      const bd = makeBoard(rules);
      const m = { op: op.i, rules, els: bd.els, cells: bd.cells, hands: { me: mine.slice(), foe: oppDeck(op, deck).map((c) => c.id) }, turn: Math.random() < 0.5 ? "me" : "foe" };
      m.foeAll = m.hands.foe.slice();
      const steps = [];
      if (m.turn === "foe") steps.push(aiStep(m, byId, op.ai));
      d.match = m;
      return { steps, first: steps.length ? "foe" : "me" };
    }
    case "move": {
      const m = d.match;
      if (!m) fail("Không có trận nào đang diễn ra");
      if (m.turn !== "me") fail("Chưa tới lượt bạn");
      const hi = Number(b.hand), ci = Number(b.cell);
      if (!Number.isInteger(hi) || hi < 0 || hi >= m.hands.me.length) fail("Thẻ không hợp lệ");
      if (!Number.isInteger(ci) || ci < 0 || ci > 8 || m.cells[ci]) fail("Ô không hợp lệ");
      const op = OPPONENTS[m.op];
      const steps = [step(m, byId, "me", hi, ci)];
      if (m.cells.some((c) => !c)) steps.push(aiStep(m, byId, op.ai));
      let result = null, lost = null, sc;
      if (m.cells.every(Boolean)) {
        sc = score(m.cells, m.hands);
        result = sc.me > sc.foe ? "w" : sc.me < sc.foe ? "l" : "d";
        d.rec[result]++;
        if (result === "w") { d.beat[op.i] = (d.beat[op.i] || 0) + 1; d.pending = { op: op.i, cards: m.foeAll }; }
        if (result === "l") lost = takeCard(d, byId, "best");
        d.match = null;
      }
      return { steps, result, lost, score: sc };
    }
    case "claim": {
      if (!d.pending) fail("Không có thẻ thưởng để nhận");
      const id = String(b.card);
      if (!d.pending.cards.includes(id)) fail("Thẻ này không thuộc bộ bài của đối thủ");
      d.box[id] = (d.box[id] || 0) + 1; d.pending = null;
      return { got: id };
    }
    case "trade": {
      if (d.match) fail("Đang có trận dở — đấu xong rồi hãy đổi bài");
      const r = String(b.rank), ri = RANKS.indexOf(r);
      if (ri < 0) fail("Hạng không hợp lệ");
      if (ri >= RANKS.length - 1) fail("Hạng SR là cao nhất, không đổi lên được");
      const spares = Object.keys(d.box).filter((id) => byId[id]?.rank === r && d.box[id] > 1).sort((a, c) => power(byId[a]) - power(byId[c]));
      const pay = [];
      for (const id of spares) for (let k = 1; k < d.box[id] && pay.length < 5; k++) pay.push(id);
      if (pay.length < 5) fail(`Cần 5 lá trùng hạng ${r} (đang có ${pay.length})`);
      const pool = deck.filter((c) => c.rank === RANKS[ri + 1]);
      if (!pool.length) fail("Chưa có thẻ ở hạng kế trên");
      for (const id of pay) d.box[id]--;
      const got = pool[Math.floor(Math.random() * pool.length)].id;
      d.box[got] = (d.box[got] || 0) + 1;
      return { traded: pay, got };
    }
    case "forfeit": {
      let lost = null;
      if (d.match) { d.rec.l++; d.match = null; lost = takeCard(d, byId, "random"); }
      return { lost };
    }
    default: fail("Thao tác không hợp lệ");
  }
}
