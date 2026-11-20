// POST { id, token, action, ... } · dữ liệu người chơi lưu ở site_settings["shiki:<id>"] (chỉ máy chủ đọc/ghi).
//   state                       → hồ sơ + trận đang đấu (nếu có)
//   starter                     → rút 5 thẻ khởi đầu (mỗi tài khoản 1 lần)
//   deck   { deck: [5 id] }     → chọn bộ bài (chỉ thẻ đang có)
//   start  { op, rules, auto }  → bắt đầu trận với đối thủ op (đã mở khóa) · auto = tự đánh, chỉ cho ải đã thắng
//   finish { matchId, moves }    → phát lại nước đi và xác nhận kết quả ván trên trình duyệt
//   move   { hand, cell }       → đặt thẻ thứ hand trên tay vào ô cell; máy chủ đi tiếp nước của đối thủ
//   claim  { card }             → thắng xong chọn 1 thẻ của đối thủ
//   trade  { rank }             → đổi 5 lá TRÙNG (bản thừa, giữ lại 1 bản mỗi thẻ) cùng hạng lấy 1 lá ngẫu nhiên hạng kế trên
//   forfeit                     → bỏ trận (tính thua, bị lấy 1 lá ngẫu nhiên)
// Luật phạt: THUA trận → mất 1 lá hạng cao nhất trong Hộp bài · BỎ trận → mất 1 lá ngẫu nhiên · hòa không mất.
// Không lấy lá nếu Hộp bài sẽ còn dưới 5 loại thẻ (để luôn đủ bộ bài đấu tiếp).
import { store, auth } from "@/lib/store";
import { getShikiConfig } from "@/lib/shikiConfig";
import { boosted, rankRangesOf, isMaxed, BOOST_COST, SIDES, drawCards, OPPONENTS, opById, legacyCharId, oppDeck, stageDeck, makeBoard, place, aiMove, score, power, rankIdx } from "@/lib/shikiCards";
import { DUEL_MODE, replayDuel, duelResult, stageLevel } from "@/lib/shikiDuel";
import { RANKS } from "@/lib/shikihime";

export const dynamic = "force-dynamic";
const H = { headers: { "Cache-Control": "no-store" } };
const bad = (msg, status = 400) => Response.json({ error: msg }, { status, ...H });
const RULE_KEYS = ["open", "same", "plus", "combo", "elemental"];
const keyOf = (uid) => `shiki:${uid}`;

// Freeze only the ten cards used by the game. An admin edit during a duel cannot change its replay.
// Lá của người chơi dùng chỉ số đã cường hóa (d.boost).
function enableLocal(m, byId, d, ranges) {
  const ids = [...m.hands.me, ...m.hands.foe, ...m.cells.filter(Boolean).map((c) => c.id)];
  const statsOf = (id) => (m.hands.me.includes(id) && d?.boost?.[id] && ranges ? boosted(byId[id], d.boost[id], ranges) : byId[id]);
  m.cards = Object.fromEntries(ids.map((id) => { const c = statsOf(id); return [id, { id, n: c.n, el: c.el, rank: c.rank }]; }));
  m.mode = DUEL_MODE;
  m.ai = 2; // máy không nhìn bài úp của người chơi
  m.id = crypto.randomUUID();
}
class StaleState extends Error {}
// Lấy 1 lá khỏi Hộp bài theo cách chọn ("best" = hạng cao nhất, mạnh nhất · "random") → id thẻ bị lấy, hoặc null nếu được bảo vệ
const MIN_KINDS = 5;
// 5 lá người chơi đã mang vào trận (trận cũ chưa lưu thì suy ra: các lá trong trận không thuộc bộ của boss)
const playedCards = (m) => m.meAll || Object.keys(m.cards || {}).filter((id) => !(m.foeAll || []).includes(id));
function takeCard(d, byId, how) {
  const kinds = Object.keys(d.box).filter((id) => d.box[id] > 0 && byId[id]);
  // chỉ được lấy lá còn thừa (trùng) hoặc khi hộp vẫn còn ≥ MIN_KINDS loại sau khi lấy
  let ok = kinds.filter((id) => d.box[id] > 1 || kinds.length > MIN_KINDS);
  if (Array.isArray(how)) { ok = ok.filter((id) => how.includes(id)); how = "pick"; }
  if (!ok.length) return null;
  let id;
  if (how === "pick") id = ok[Math.floor(Math.random() * ok.length)];
  else if (how === "best") id = ok.sort((a, b) => rankIdx(byId[b].rank) - rankIdx(byId[a].rank) || power(byId[b]) - power(byId[a]))[0];
  else { const pool = ok.flatMap((x) => Array(d.box[x]).fill(x)); id = pool[Math.floor(Math.random() * pool.length)]; }
  d.box[id]--;
  if (d.box[id] <= 0) {
    delete d.box[id];
    if (d.boost) delete d.boost[id];
    // lá bị lấy đang trong bộ bài → bù lá mạnh nhất còn lại để bộ bài vẫn đủ 5
    if (d.deck.includes(id)) {
      d.deck = d.deck.filter((x) => x !== id);
      const fill = Object.keys(d.box).filter((x) => d.box[x] > 0 && byId[x] && !d.deck.includes(x)).sort((p, q) => rankIdx(byId[q].rank) - rankIdx(byId[p].rank) || power(byId[q]) - power(byId[p]))[0];
      if (fill) d.deck.push(fill);
    }
  }
  return id;
}

// Tiến độ lưu theo id nhân vật (beatC) — bản đồ có 120 ải, thứ tự ải có thể đổi mà không mất tiến độ.
// Dữ liệu cũ lưu theo số thứ tự 15 ải (beat, match.op, pending.op) → đổi sang id nhân vật khi đọc.
function migrate(d) {
  if (!d.beatC) {
    d.beatC = {};
    for (const [k, v] of Object.entries(d.beat || {})) { const id = legacyCharId(Number(k)); if (id && v > 0) d.beatC[id] = v; }
  }
  for (const x of [d.match, d.pending]) if (x && x.opId == null && x.op != null) x.opId = legacyCharId(Number(x.op));
  d.tried ||= {};
  for (const id of Object.keys(d.beatC)) d.tried[id] ||= 1;
}
const triedIdx = (d) => OPPONENTS.filter((o) => d.tried[o.char.id]).map((o) => o.i);

// Ván đầu với một boss: xáo Hộp bài, rút 5 lá có hạng tương xứng với 5 lá của boss (thiếu hạng đó thì lấy hạng thấp hơn gần nhất).
// Bộ đã xáo được lưu (d.draft) cho tới khi vào trận — không xáo lại được để lấy bộ đẹp hơn.
function draftFor(d, op, deck, byId, cfg) {
  const boss = stageDeck(op, deck, cfg);
  const own = Object.keys(d.box).filter((id) => d.box[id] > 0 && byId[id]);
  if (d.draft?.opId === op.char.id && d.draft.deck.length === 5 && d.draft.deck.every((id) => d.box[id] > 0 && byId[id])) return { deck: d.draft.deck, boss };
  const ranges = rankRangesOf(deck), rk = (x) => (boosted(byId[x], d.boost?.[x], ranges) || byId[x]).rank; // hạng sau cường hóa
  const used = new Set(), out = [];
  const pick = (list) => { const left = list.filter((id) => !used.has(id)); if (!left.length) return null; const id = left[Math.floor(Math.random() * left.length)]; used.add(id); return id; };
  for (const bc of [...boss].sort((a, b) => rankIdx(b.rank) - rankIdx(a.rank))) {
    let id = null;
    for (let ri = rankIdx(bc.rank); ri >= 0 && !id; ri--) id = pick(own.filter((x) => rk(x) === RANKS[ri]));
    if (!id) id = pick([...own].sort((a, b) => rankIdx(rk(a)) - rankIdx(rk(b)))); // không có hạng thấp hơn → lá yếu nhất còn lại
    if (id) out.push(id);
  }
  d.draft = { opId: op.char.id, deck: out };
  return { deck: out, boss };
}
const opOf = (x) => (x?.opId != null ? opById(x.opId) : null) || OPPONENTS[x?.op];
const beatIdx = (d) => Object.fromEntries(OPPONENTS.filter((o) => d.beatC[o.char.id] > 0).map((o) => [o.i, d.beatC[o.char.id]]));
// mở khóa: thắng ải nào thì mở mọi ải tới ngay sau ải xa nhất đã thắng
const maxBeat = (d) => Math.max(-1, ...OPPONENTS.filter((o) => d.beatC[o.char.id] > 0).map((o) => o.i));

// trận đang đấu → dạng gửi cho trình duyệt (ẩn bài trên tay đối thủ nếu không bật luật Lật bài)
function view(m) {
  if (!m) return null;
  if (m.mode === DUEL_MODE) {
    const { foeAll, ...local } = m;
    return { ...local, op: opOf(m)?.i ?? m.op };
  }
  return { op: m.op, rules: m.rules, els: m.els, cells: m.cells, turn: m.turn, hands: { me: m.hands.me, foe: m.rules.open ? m.hands.foe : m.hands.foe.length } };
}
const pub = (d, extra = {}) => Response.json({ draws: d.draws || 0, box: d.box, starter: d.starter, deck: d.deck, beat: beatIdx(d), tried: triedIdx(d), boost: d.boost || {}, rec: d.rec, pending: d.pending && { ...d.pending, op: opOf(d.pending)?.i ?? d.pending.op }, match: view(d.match), ...extra }, H);

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
  const started = performance.now();
  const timings = [];
  async function timed(name, operation) {
    const start = performance.now();
    try { return await operation(); }
    finally { timings.push(`${name};dur=${(performance.now() - start).toFixed(1)}`); }
  }
  let response;
  try { response = await handleAction(req, timed); }
  catch (error) {
    if (!(error instanceof StaleState)) throw error;
    response = bad("Trạng thái đã thay đổi. Hãy thử lại.", 409);
  }
  timings.unshift(`shiki;dur=${(performance.now() - started).toFixed(1)}`);
  response.headers.set("Server-Timing", timings.join(", "));
  return response;
}

async function handleAction(req, timed) {
  if (!store) return bad("Chưa cấu hình máy chủ", 503);
  const b = await req.json().catch(() => ({}));
  const u = await timed("auth", () => auth(b.id, b.token));
  if (!u) return bad("Cần đăng nhập để chơi Đấu thẻ", 401);
  const k = keyOf(u.id);
  const previous = await timed("read", () => store.getKV(k));
  const d = { box: {}, deck: [], starter: null, beat: {}, rec: { w: 0, l: 0, d: 0 }, match: null, pending: null, ...structuredClone(previous) };
  migrate(d);
  const save = async () => {
    d.rev = crypto.randomUUID();
    if (!await timed("write", () => store.replaceKV(k, d, previous))) throw new StaleState();
  };
  const local = b.mode === DUEL_MODE;
  if (b.action === "state") {
    // Upgrade a legacy match at its saved position, retaining its board, hands and rewards.
    if (local && d.match && !d.match.mode) {
      const cfg = await timed("config", getShikiConfig);
      enableLocal(d.match, cfg.byId, d, rankRangesOf(cfg.deck));
      await save();
    }
    return pub(d);
  }
  if (b.action === "finish" && !d.match && d.receipt && d.receipt.id === b.matchId) return pub(d, d.receipt);
  const { cfg, deck, byId } = await timed("config", getShikiConfig);

  switch (b.action) {
    case "starter": {
      if (d.starter) return bad("Tài khoản đã rút bài khởi đầu");
      const got = drawCards(deck, 5);
      for (const c of got) d.box[c.id] = (d.box[c.id] || 0) + 1;
      d.starter = got.map((c) => c.id); d.deck = d.starter.slice();
      await save();
      return pub(d, { drawn: d.starter });
    }

    // lượt rút thẻ do quản trị tặng: mỗi lượt rút 1 lá theo tỉ lệ hạng
    case "draw": {
      if (!(d.draws > 0)) return bad("Bạn không còn lượt rút thẻ");
      // all = rút hết số lượt đang có (tối đa 200 lá một lần); mỗi lá rút độc lập nên có thể trùng
      const times = b.all ? Math.min(200, d.draws) : 1, drawn = [];
      for (let k = 0; k < times; k++) { const [got] = drawCards(deck, 1); d.box[got.id] = (d.box[got.id] || 0) + 1; drawn.push(got.id); }
      d.draws -= times;
      await save();
      return pub(d, { drawn });
    }

    case "deck": {
      const ids = Array.isArray(b.deck) ? [...new Set(b.deck.map(String))].slice(0, 5) : [];
      if (ids.some((id) => !(d.box[id] > 0))) return bad("Chỉ chọn được thẻ có trong Hộp bài");
      d.deck = ids; await save();
      return pub(d);
    }

    // xem bộ bài được xáo cho ván đầu với boss (op) · đã đấu boss này rồi thì { free: true }
    case "firstDeck": {
      const op = OPPONENTS[Number(b.op)];
      if (!op) return bad("Không có đối thủ này");
      if (d.tried[op.char.id]) return pub(d, { free: true });
      const { deck: mine, boss } = draftFor(d, op, deck, byId, cfg);
      await save();
      return pub(d, { draft: mine, bossRanks: boss.map((c) => c.rank) });
    }

    case "start": {
      if (d.match) {
        if (local && !d.match.mode) { enableLocal(d.match, byId, d, rankRangesOf(deck)); await save(); }
        return pub(d);
      }
      if (d.pending) return bad("Hãy nhận thẻ thưởng của trận trước");
      const op = OPPONENTS[Number(b.op)];
      if (!op) return bad("Không có đối thủ này");
      if (op.i > maxBeat(d) + 1) return bad("Ải này chưa mở khóa");
      if (b.auto && !(d.beatC[op.char.id] > 0)) return bad("Chỉ tự đánh được ải đã thắng — ải này hãy tự tay đánh.");
      // Save the selected deck with the match, instead of one write per click.
      const first = !d.tried[op.char.id];
      const selected = first ? draftFor(d, op, deck, byId, cfg).deck : b.deck === undefined ? d.deck : b.deck;
      if (!Array.isArray(selected) || selected.length !== 5) return bad("Cần đủ 5 thẻ trong bộ bài");
      const mine = selected.map(String).filter((id) => d.box[id] > 0 && byId[id]);
      if (new Set(mine).size !== 5) return bad("Cần đủ 5 thẻ trong bộ bài");
      const rules = Object.fromEntries(RULE_KEYS.map((k) => [k, b.rules?.[k] === true]));
      const bd = makeBoard(rules);
      const m = { op: op.i, opId: op.char.id, rules, els: bd.els, cells: bd.cells, hands: { me: mine.slice(), foe: stageDeck(op, deck, cfg).map((c) => c.id) }, turn: Math.random() < 0.5 ? "me" : "foe" };
      m.foeAll = m.hands.foe.slice();
      m.meAll = m.hands.me.slice(); // 5 lá người chơi mang vào trận (thua thì mất ngẫu nhiên 1 lá trong số này)
      // độ khó máy: người chơi chọn 1–4, không chọn thì tăng dần theo thứ tự đối thủ
      m.level = [1, 2, 3, 4].includes(Number(b.level)) ? Number(b.level) : stageLevel(op, cfg);
      const steps = [];
      if (local) enableLocal(m, byId, d, rankRangesOf(deck));
      else if (m.turn === "foe") steps.push(aiStep(m, byId, op.ai));
      if (first) { d.tried[op.char.id] = 1; d.draft = null; } else d.deck = mine.slice(); // ván đầu không ghi đè bộ bài tự chọn
      d.match = m; await save();
      return pub(d, { steps, first: steps.length ? "foe" : "me" });
    }

    case "finish": {
      const m = d.match;
      if (!m || m.mode !== DUEL_MODE || m.id !== b.matchId) return bad("Ván này đã thay đổi. Hãy tải lại trang.", 409);
      const empty = m.cells.filter((c) => !c).length;
      const count = m.turn === "me" ? Math.ceil(empty / 2) : Math.floor(empty / 2);
      if (!Array.isArray(b.moves) || b.moves.length !== count) return bad("Lịch sử ván chưa đủ.");
      let final;
      try { final = replayDuel(m, b.moves).match; }
      catch { return bad("Lịch sử nước đi không hợp lệ."); }
      if (final.turn !== "done") return bad("Ván chưa kết thúc.");
      const { result, score: tally } = duelResult(final);
      d.rec[result]++;
      if (result === "w") {
        const op = opOf(m);
        d.beatC[op.char.id] = (d.beatC[op.char.id] || 0) + 1;
        d.pending = { op: op.i, opId: op.char.id, cards: m.foeAll };
      }
      const lost = result === "l" ? takeCard(d, byId, playedCards(m)) : null;
      d.receipt = { id: m.id, result, score: tally, lost };
      d.match = null;
      await save();
      return pub(d, d.receipt);
    }
    case "move": {
      const m = d.match;
      if (!m) return bad("Không có trận nào đang diễn ra");
      if (m.mode === DUEL_MODE) return bad("Hãy tải lại trang để tiếp tục ván trên thiết bị.", 409);
      if (m.turn !== "me") return bad("Chưa tới lượt bạn");
      const hi = Number(b.hand), ci = Number(b.cell);
      if (!Number.isInteger(hi) || hi < 0 || hi >= m.hands.me.length) return bad("Thẻ không hợp lệ");
      if (!Number.isInteger(ci) || ci < 0 || ci > 8 || m.cells[ci]) return bad("Ô không hợp lệ");
      const op = opOf(m);
      const steps = [step(m, byId, "me", hi, ci)];
      if (m.cells.some((c) => !c)) steps.push(aiStep(m, byId, op.ai));
      let result = null, lost = null;
      if (m.cells.every(Boolean)) {
        const sc = score(m.cells, m.hands);
        result = sc.me > sc.foe ? "w" : sc.me < sc.foe ? "l" : "d";
        d.rec[result]++;
        if (result === "w") { d.beatC[op.char.id] = (d.beatC[op.char.id] || 0) + 1; d.pending = { op: op.i, opId: op.char.id, cards: m.foeAll }; }
        if (result === "l") lost = takeCard(d, byId, playedCards(m));
        d.last = { match: view(m), result, score: sc };
        d.match = null;
      }
      await save();
      if (!result && b.compact === true) {
        return Response.json({ match: view(m), steps }, H);
      }
      return pub(d, { steps, result, lost, final: result ? d.last.match : undefined, score: result ? d.last.score : undefined });
    }

    case "claim": {
      if (!d.pending) return bad("Không có thẻ thưởng để nhận");
      const id = String(b.card);
      if (!d.pending.cards.includes(id)) return bad("Thẻ này không thuộc bộ bài của đối thủ");
      d.box[id] = (d.box[id] || 0) + 1; d.pending = null;
      await save();
      return pub(d, { got: id });
    }

    // đổi nhanh: đổi hết các nhóm 5 lá trùng từ hạng thấp lên cao (lá vừa đổi được có thể tiếp tục đổi lên hạng trên)
    // Cường hóa: hủy 2 bản trùng của lá này → +1 vào một cạnh ngẫu nhiên chưa đạt 10
    case "boost": {
      if (d.match) return bad("Đang có trận dở — đấu xong rồi hãy cường hóa");
      const id = String(b.card), base = byId[id];
      if (!base || !(d.box[id] > 0)) return bad("Bạn không có lá này");
      if (d.box[id] < BOOST_COST + 1) return bad(`Cần thêm ${BOOST_COST + 1 - d.box[id]} lá trùng (luôn giữ lại 1 lá)`);
      d.boost ||= {};
      const ranges = rankRangesOf(deck), before = boosted(base, d.boost[id], ranges) || base;
      if (isMaxed(before)) return bad("Lá này đã đạt điểm tối đa");
      const sides = SIDES.filter((k) => before.n[k] < 10), side = sides[Math.floor(Math.random() * sides.length)];
      d.box[id] -= BOOST_COST;
      d.boost[id] = { ...(d.boost[id] || {}), [side]: ((d.boost[id] || {})[side] || 0) + 1 };
      const after = boosted(base, d.boost[id], ranges);
      await save();
      return pub(d, { boosted: { id, side, from: before.rank, to: after.rank, n: after.n } });
    }

    case "tradeAll": {
      if (d.match) return bad("Đang có trận dở — đấu xong rồi hãy đổi bài");
      const gots = [];
      let paid = 0;
      for (let ri = 0; ri < RANKS.length - 1; ri++) {
        const r = RANKS[ri], pool = deck.filter((c) => c.rank === RANKS[ri + 1]);
        if (!pool.length) continue;
        for (let guard = 0; guard < 500; guard++) {
          const spares = Object.keys(d.box).filter((id) => byId[id]?.rank === r && d.box[id] > 1).sort((a, c) => power(byId[a]) - power(byId[c]));
          const pay = [];
          for (const id of spares) for (let k = 1; k < d.box[id] && pay.length < 5; k++) pay.push(id);
          if (pay.length < 5) break;
          for (const id of pay) d.box[id]--;
          const got = pool[Math.floor(Math.random() * pool.length)].id;
          d.box[got] = (d.box[got] || 0) + 1;
          gots.push(got); paid += 5;
        }
      }
      if (!gots.length) return bad("Chưa có hạng nào đủ 5 lá trùng để đổi");
      await save();
      return pub(d, { gots, paid });
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
      await save();
      return pub(d, { traded: pay, got });
    }

    case "forfeit": {
      if ((d.match?.mode === DUEL_MODE || b.matchId) && d.match?.id !== b.matchId) return bad("Ván này đã thay đổi.", 409);
      let lost = null;
      if (d.match) { d.rec.l++; d.match = null; lost = takeCard(d, byId, "random"); await save(); }
      return pub(d, { lost });
    }
    default: return bad("Thao tác không hợp lệ");
  }
}
