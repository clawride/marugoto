// Đấu thẻ Shikihime — MÁY CHỦ quyết định mọi thứ: rút khởi đầu, Hộp bài, chia bài đối thủ, kiểm tra & áp dụng từng nước đi,
// nước đi của máy, kết quả trận và thẻ thưởng. Trình duyệt chỉ gửi lệnh và hiển thị.
// POST { id, token, action, ... } · dữ liệu người chơi lưu ở site_settings["shiki:<id>"] (chỉ máy chủ đọc/ghi).
//   state                       → hồ sơ + trận đang đấu (nếu có)
//   starter                     → rút 5 thẻ khởi đầu (mỗi tài khoản 1 lần)
//   deck   { deck: [5 id] }     → chọn bộ bài (chỉ thẻ đang có)
//   start  { op, rules }        → bắt đầu trận với đối thủ op (đã mở khóa)
//   move   { hand, cell }       → đặt thẻ thứ hand trên tay vào ô cell; máy chủ đi tiếp nước của đối thủ
//   claim  { card }             → thắng xong chọn 1 thẻ của đối thủ
//   trade  { rank }             → đổi 5 lá TRÙNG (bản thừa, giữ lại 1 bản mỗi thẻ) cùng hạng lấy 1 lá ngẫu nhiên hạng kế trên
//   forfeit                     → bỏ trận (tính thua, bị lấy 1 lá ngẫu nhiên)
// Luật phạt: THUA trận → mất 1 lá hạng cao nhất trong Hộp bài · BỎ trận → mất 1 lá ngẫu nhiên · hòa không mất.
// Không lấy lá nếu Hộp bài sẽ còn dưới 5 loại thẻ (để luôn đủ bộ bài đấu tiếp).
import { store, auth } from "@/lib/store";
import { normalizeShiki } from "@/lib/shikihime";
import { buildDeck, drawCards, OPPONENTS, oppDeck, makeBoard, place, aiMove, score, power, rankIdx } from "@/lib/shikiCards";
import { RANKS } from "@/lib/shikihime";

export const dynamic = "force-dynamic";
const H = { headers: { "Cache-Control": "no-store" } };
const bad = (msg, status = 400) => Response.json({ error: msg }, { status, ...H });
const RULE_KEYS = ["open", "same", "plus", "combo", "elemental"];
const keyOf = (uid) => `shiki:${uid}`;

async function load(uid) {
  const d = (await store.getKV(keyOf(uid))) || {};
  return { box: d.box || {}, starter: d.starter || null, deck: d.deck || [], beat: d.beat || {}, rec: d.rec || { w: 0, l: 0, d: 0 }, match: d.match || null, pending: d.pending || null };
}
const save = (uid, d) => store.setKV(keyOf(uid), d);
// Lấy 1 lá khỏi Hộp bài theo cách chọn ("best" = hạng cao nhất, mạnh nhất · "random") → id thẻ bị lấy, hoặc null nếu được bảo vệ
const MIN_KINDS = 5;
function takeCard(d, byId, how) {
  const kinds = Object.keys(d.box).filter((id) => d.box[id] > 0 && byId[id]);
  // chỉ được lấy lá còn thừa (trùng) hoặc khi hộp vẫn còn ≥ MIN_KINDS loại sau khi lấy
  const ok = kinds.filter((id) => d.box[id] > 1 || kinds.length > MIN_KINDS);
  if (!ok.length) return null;
  let id;
  if (how === "best") id = ok.sort((a, b) => rankIdx(byId[b].rank) - rankIdx(byId[a].rank) || power(byId[b]) - power(byId[a]))[0];
  else { const pool = ok.flatMap((x) => Array(d.box[x]).fill(x)); id = pool[Math.floor(Math.random() * pool.length)]; }
  d.box[id]--;
  if (d.box[id] <= 0) {
    delete d.box[id];
    // lá bị lấy đang trong bộ bài → bù lá mạnh nhất còn lại để bộ bài vẫn đủ 5
    if (d.deck.includes(id)) {
      d.deck = d.deck.filter((x) => x !== id);
      const fill = Object.keys(d.box).filter((x) => d.box[x] > 0 && byId[x] && !d.deck.includes(x)).sort((p, q) => rankIdx(byId[q].rank) - rankIdx(byId[p].rank) || power(byId[q]) - power(byId[p]))[0];
      if (fill) d.deck.push(fill);
    }
  }
  return id;
}

// trận đang đấu → dạng gửi cho trình duyệt (ẩn bài trên tay đối thủ nếu không bật luật Lật bài)
function view(m) {
  if (!m) return null;
  return { op: m.op, rules: m.rules, els: m.els, cells: m.cells, turn: m.turn, hands: { me: m.hands.me, foe: m.rules.open ? m.hands.foe : m.hands.foe.length } };
}
const pub = (d, extra = {}) => Response.json({ box: d.box, starter: d.starter, deck: d.deck, beat: d.beat, rec: d.rec, pending: d.pending, match: view(d.match), ...extra }, H);

// Áp dụng một nước đi trên trạng thái trận (id thẻ) → bước để hiển thị
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

export async function POST(req) {
  if (!store) return bad("Chưa cấu hình máy chủ", 503);
  const b = await req.json().catch(() => ({}));
  const u = await auth(b.id, b.token);
  if (!u) return bad("Cần đăng nhập để chơi Đấu thẻ", 401);
  const cfg = normalizeShiki((await store.getSettings()).shiki);
  const deck = buildDeck(cfg), byId = Object.fromEntries(deck.map((c) => [c.id, c]));
  const d = await load(u.id);

  switch (b.action) {
    case "state": return pub(d);

    case "starter": {
      if (d.starter) return bad("Tài khoản đã rút bài khởi đầu");
      const got = drawCards(deck, 5);
      for (const c of got) d.box[c.id] = (d.box[c.id] || 0) + 1;
      d.starter = got.map((c) => c.id); d.deck = d.starter.slice();
      await save(u.id, d);
      return pub(d, { drawn: d.starter });
    }

    case "deck": {
      const ids = Array.isArray(b.deck) ? [...new Set(b.deck.map(String))].slice(0, 5) : [];
      if (ids.some((id) => !(d.box[id] > 0))) return bad("Chỉ chọn được thẻ có trong Hộp bài");
      d.deck = ids; await save(u.id, d);
      return pub(d);
    }

    case "start": {
      if (d.match) return pub(d); // đang có trận dở → trả lại trận đó
      if (d.pending) return bad("Hãy nhận thẻ thưởng của trận trước");
      const op = OPPONENTS[Number(b.op)];
      if (!op) return bad("Không có đối thủ này");
      if (op.i > 0 && !(d.beat[op.i - 1] > 0)) return bad("Đối thủ này chưa mở khóa");
      const mine = d.deck.filter((id) => d.box[id] > 0 && byId[id]);
      if (new Set(mine).size !== 5) return bad("Cần đủ 5 thẻ trong bộ bài");
      const rules = Object.fromEntries(RULE_KEYS.map((k) => [k, b.rules?.[k] === true]));
      const bd = makeBoard(rules);
      const m = { op: op.i, rules, els: bd.els, cells: bd.cells, hands: { me: mine.slice(), foe: oppDeck(op, deck).map((c) => c.id) }, turn: Math.random() < 0.5 ? "me" : "foe" };
      m.foeAll = m.hands.foe.slice();
      const steps = [];
      if (m.turn === "foe") steps.push(aiStep(m, byId, op.ai));
      d.match = m; await save(u.id, d);
      return pub(d, { steps, first: steps.length ? "foe" : "me" });
    }

    case "move": {
      const m = d.match;
      if (!m) return bad("Không có trận nào đang diễn ra");
      if (m.turn !== "me") return bad("Chưa tới lượt bạn");
      const hi = Number(b.hand), ci = Number(b.cell);
      if (!Number.isInteger(hi) || hi < 0 || hi >= m.hands.me.length) return bad("Thẻ không hợp lệ");
      if (!Number.isInteger(ci) || ci < 0 || ci > 8 || m.cells[ci]) return bad("Ô không hợp lệ");
      const op = OPPONENTS[m.op];
      const steps = [step(m, byId, "me", hi, ci)];
      if (m.cells.some((c) => !c)) steps.push(aiStep(m, byId, op.ai));
      let result = null, lost = null;
      if (m.cells.every(Boolean)) {
        const sc = score(m.cells, m.hands);
        result = sc.me > sc.foe ? "w" : sc.me < sc.foe ? "l" : "d";
        d.rec[result]++;
        if (result === "w") { d.beat[op.i] = (d.beat[op.i] || 0) + 1; d.pending = { op: op.i, cards: m.foeAll }; }
        if (result === "l") lost = takeCard(d, byId, "best");
        d.last = { match: view(m), result, score: sc };
        d.match = null;
      }
      await save(u.id, d);
      return pub(d, { steps, result, lost, final: result ? d.last.match : undefined, score: result ? d.last.score : undefined });
    }

    case "claim": {
      if (!d.pending) return bad("Không có thẻ thưởng để nhận");
      const id = String(b.card);
      if (!d.pending.cards.includes(id)) return bad("Thẻ này không thuộc bộ bài của đối thủ");
      d.box[id] = (d.box[id] || 0) + 1; d.pending = null;
      await save(u.id, d);
      return pub(d, { got: id });
    }

    case "trade": {
      if (d.match) return bad("Đang có trận dở — đấu xong rồi hãy đổi bài");
      const r = String(b.rank), ri = RANKS.indexOf(r);
      if (ri < 0) return bad("Hạng không hợp lệ");
      if (ri >= RANKS.length - 1) return bad("Hạng SR là cao nhất, không đổi lên được");
      // bản thừa của các thẻ hạng r, ưu tiên dùng thẻ yếu trước
      const spares = Object.keys(d.box).filter((id) => byId[id]?.rank === r && d.box[id] > 1).sort((a, c) => power(byId[a]) - power(byId[c]));
      const pay = [];
      for (const id of spares) for (let k = 1; k < d.box[id] && pay.length < 5; k++) pay.push(id);
      if (pay.length < 5) return bad(`Cần 5 lá trùng hạng ${r} (đang có ${pay.length})`);
      const next = RANKS[ri + 1], pool = deck.filter((c) => c.rank === next);
      if (!pool.length) return bad("Chưa có thẻ ở hạng kế trên");
      for (const id of pay) d.box[id]--;
      const got = pool[Math.floor(Math.random() * pool.length)].id;
      d.box[got] = (d.box[got] || 0) + 1;
      await save(u.id, d);
      return pub(d, { traded: pay, got });
    }

    case "forfeit": {
      let lost = null;
      if (d.match) { d.rec.l++; d.match = null; lost = takeCard(d, byId, "random"); await save(u.id, d); }
      return pub(d, { lost });
    }
    default: return bad("Thao tác không hợp lệ");
  }
}
