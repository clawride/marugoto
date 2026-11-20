// Run: node --experimental-vm-modules scripts/check-shiki-performance.mjs
// Exercise the real API and card engine with an isolated database, never live data.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SourceTextModule, SyntheticModule } from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rows = new Map(), counts = { config: 0, read: 0, write: 0, auth: 0 };
let failConfig = false;
const store = {
  async getKV(key) {
    if (key === "shiki") {
      counts.config++;
      if (failConfig) throw new Error("database unavailable");
    } else counts.read++;
    return structuredClone(rows.get(key) ?? null);
  },
  async setKV(key, value) { counts.write++; rows.set(key, structuredClone(value)); },
  async replaceKV(key, value, previous) {
    const current = rows.get(key);
    if (Boolean(previous) !== Boolean(current) || previous?.rev !== current?.rev) return false;
    await this.setKV(key, value);
    return true;
  },
  async getSettings() { throw new Error("Must not read all site settings"); },
};
const modules = new Map();
const storeModule = new SyntheticModule(["store", "auth"], function () {
  this.setExport("store", store);
  this.setExport("auth", async (id, token) => {
    counts.auth++;
    return token === "valid" ? { id } : null;
  });
});
modules.set(path.join(root, "lib/store.js"), storeModule);
async function moduleFor(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const source = await readFile(filename, "utf8");
  const mod = filename.endsWith(".json")
    ? new SyntheticModule(["default"], function () { this.setExport("default", JSON.parse(source)); })
    : new SourceTextModule(source, { identifier: filename });
  modules.set(filename, mod);
  return mod;
}
const route = await moduleFor(path.join(root, "app/api/shiki/play/route.js"));
await route.link(async (specifier, parent) => {
  let target = specifier.startsWith("@/") ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(parent.identifier), specifier);
  if (!path.extname(target)) target += ".js";
  return moduleFor(target);
});
await route.evaluate();
const cache = modules.get(path.join(root, "lib/shikiConfig.js")).namespace;
const engine = modules.get(path.join(root, "lib/shikiCards.js")).namespace;
async function request(action, body = {}, token = "valid") {
  const response = await route.namespace.POST(new Request("http://localhost/api/shiki/play", {
    method: "POST", body: JSON.stringify({ id: "test-player", token, action, ...body }),
  }));
  assert.match(response.headers.get("Server-Timing"), /^shiki;dur=/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  return { status: response.status, data: await response.json() };
}

assert.equal((await request("state", {}, "invalid")).status, 401);
assert.equal(counts.read, 0, "Unauthenticated requests cannot read player data");
await request("state");
assert.equal(counts.config, 0, "State must not load configuration");
await Promise.all(Array.from({ length: 25 }, () => cache.getShikiConfig()));
assert.equal(counts.config, 1, "Concurrent configuration reads must coalesce");
cache.dropShikiConfigCache();
failConfig = true;
await assert.rejects(cache.getShikiConfig(), /unavailable/);
failConfig = false;
await cache.getShikiConfig();
assert.equal(counts.config, 3, "Failed reads must be retried");

const initial = await request("starter");
assert.equal(initial.status, 200);
assert.equal(new Set(initial.data.drawn).size, 5);
assert.equal((await request("starter")).status, 400);
assert.ok(initial.data.drawn.every((id) => id.startsWith("g")));
const playerKey = "shiki:test-player";
// The first visit drafts the player's hand. Exercise manual deck validation on a repeat visit.
rows.get(playerKey).tried[engine.OPPONENTS[0].char.id] = 1;
assert.equal((await request("start", { op: 0, deck: Array(5).fill(initial.data.deck[0]) })).status, 400);
assert.equal((await request("start", { op: 0, deck: [...initial.data.deck.slice(0, 4), "not-owned"] })).status, 400);
assert.equal((await request("start", { op: 0, deck: {} })).status, 400);
assert.equal((await request("start", { op: 1, deck: initial.data.deck })).status, 400);

const selected = initial.data.deck.toReversed();
let response = await request("start", { op: 0, deck: selected, rules: { open: false, same: true, plus: true, combo: true, elemental: true } });
assert.equal(response.status, 200);
assert.deepEqual(response.data.deck, selected, "Starting must persist the selected deck in the same write");
assert.equal(typeof response.data.match.hands.foe, "number", "Closed rule must hide the opponent hand");
const readsBeforeMoves = counts.config;
let compactBytes = 0, fullBytes = 0, moveCount = 0;
while (response.data.match) {
  const cell = response.data.match.cells.findIndex((c) => !c);
  const compact = moveCount++ !== 0; // Old clients still receive the full envelope.
  response = await request("move", { hand: 0, cell, compact });
  assert.equal(response.status, 200);
  if (compact && !response.data.result) {
    assert.deepEqual(Object.keys(response.data).sort(), ["match", "steps"]);
    const full = (await request("state")).data;
    assert.deepEqual(response.data.match, full.match);
    assert.equal(typeof response.data.match.hands.foe, "number");
    compactBytes += Buffer.byteLength(JSON.stringify(response.data));
    fullBytes += Buffer.byteLength(JSON.stringify({ ...full, steps: response.data.steps, result: null, lost: null }));
  } else {
    assert.ok(response.data.box && response.data.rec);
  }
}
assert.ok(compactBytes > 0 && compactBytes < fullBytes);
console.log(`Ongoing turns compared (raw JSON, same board & inventory): ${fullBytes} bytes full, ${compactBytes} bytes compact.`);
assert.ok(["w", "l", "d"].includes(response.data.result));
assert.equal(response.data.score.me + response.data.score.foe, 10);
assert.equal(counts.config, readsBeforeMoves, "Warm match moves must not read configuration again");
if (response.data.pending) assert.equal((await request("claim", { card: response.data.pending.cards[0] })).status, 200);
assert.equal((await request("start", { op: 0 })).status, 200, "Older clients can omit deck");
assert.equal((await request("forfeit")).status, 200);
assert.equal((await request("state")).data.match, null);

// Exercise every opponent's AI and special-rule combinations without network IO.
const { deck } = await cache.getShikiConfig();
const start = performance.now();
for (const op of engine.OPPONENTS) {
  const rules = { same: true, plus: true, combo: true, elemental: true };
  const board = engine.makeBoard(rules);
  const hands = { me: deck.slice(0, 5), foe: engine.oppDeck(op, deck) };
  const move = engine.aiMove(board, hands, rules, op.ai);
  assert.ok(move.card && move.i >= 0 && move.i < 9);
}
console.log(`PASS: auth, configuration coalescing/retry, deck validation, match, rewards, forfeit, hidden hands. ${engine.OPPONENTS.length} AI openings: ${(performance.now() - start).toFixed(1)}ms total.`, counts);

// New clients play every intermediate move offline. Replay against an independent
// exhaustive endgame search, and settle only once even if two tabs submit together.
const duel = modules.get(path.join(root, "lib/shikiDuel.js")).namespace;
function perfectMargin(m) {
  if (m.turn === "done") {
    const s = duel.duelResult(m).score;
    return s.foe - s.me;
  }
  const outcomes = [];
  for (const id of m.hands[m.turn]) for (let i = 0; i < 9; i++) {
    if (!m.cells[i]) outcomes.push(perfectMargin(duel.duelMove(m, id, i).match));
  }
  return m.turn === "me" ? Math.min(...outcomes) : Math.max(...outcomes);
}

async function checkLocalMatch(migrate) {
  const rules = { open: !migrate, same: true, plus: true, combo: true, elemental: true };
  let j = await request("start", { op: 0, rules, level: 4, mode: migrate ? undefined : duel.DUEL_MODE });
  if (migrate) {
    const cell = j.data.match.cells.findIndex((c) => !c);
    const old = await request("move", { hand: 0, cell });
    j = await request("state", { mode: duel.DUEL_MODE });
    assert.deepEqual(j.data.match.cells, old.data.match.cells);
    assert.deepEqual(j.data.match.hands.me, old.data.match.hands.me);
  }
  const initial = j.data.match, moves = [], before = { ...counts };
  assert.equal(initial.mode, duel.DUEL_MODE);
  let m = duel.computerReply(initial).match;
  let solvedEndgame = false;
  while (m.turn !== "done") {
    const move = { id: m.hands.me[0], cell: m.cells.findIndex((c) => !c) };
    moves.push(move);
    m = duel.duelMove(m, move.id, move.cell).match;
    if (m.turn === "foe") {
      const next = duel.computerReply(m).match;
      if (!solvedEndgame && m.cells.filter((c) => !c).length <= 5) {
        if (m.rules.open) assert.equal(perfectMargin(next), perfectMargin(m));
        solvedEndgame = true;
      }
      m = next;
    }
    // Simulate closing the tab and restoring exactly the same board.
    assert.deepEqual(duel.replayDuel(initial, JSON.parse(JSON.stringify(moves))).match, m);
  }
  assert.ok(solvedEndgame);
  assert.deepEqual(counts, before, "Taking turns must perform zero API/auth/storage calls");
  const body = { matchId: initial.id, moves };
  assert.equal((await request("move", { hand: 0, cell: 0 })).status, 409);
  assert.equal((await request("forfeit", { matchId: "another-game" })).status, 409);
  assert.equal((await request("finish", { ...body, moves: [] })).status, 400);
  assert.equal((await request("finish", { ...body, moves: moves.map(() => ({ id: "unowned", cell: -1 })) })).status, 400);
  const beforeSettling = counts.write;
  const batch = await Promise.all([request("finish", body), request("finish", body)]);
  const settled = batch.find((r) => r.status === 200);
  assert.ok(settled);
  assert.ok(batch.every((r) => [200, 409].includes(r.status)));
  assert.equal(counts.write - beforeSettling, 1);
  const { result, score } = duel.duelResult(m);
  assert.equal(settled.data.result, result);
  assert.deepEqual(settled.data.score, score);
  assert.equal(settled.data.rec[result], j.data.rec[result] + 1);
  const retry = await request("finish", body);
  assert.deepEqual(retry.data, settled.data);
  assert.equal(counts.write - beforeSettling, 1);
  if (retry.data.pending) await request("claim", { card: retry.data.pending.cards[0] });
}
await checkLocalMatch(false);
await checkLocalMatch(true);
console.log("PASS: browser turns, deterministic restore, migration, optimal endgame, concurrent/retried settlement.");

const retired = "0101010101";
const validIds = new Set(deck.map((card) => card.id));
assert.equal(validIds.size, 120);
assert.ok(deck.every((card) => card.gi));
for (const op of engine.OPPONENTS) {
  const hand = engine.stageDeck(op, deck, { stages: { [op.char.id]: { deck: Array(5).fill(retired) } } });
  assert.equal(new Set(hand.map((card) => card.id)).size, 5);
  assert.ok(hand.every((card) => validIds.has(card.id)));
}
const keep = deck[0].id;
const legacy = {
  box: { [retired]: 4, [keep]: 3 }, boost: { [keep]: { t: 1 }, [retired]: { b: 2 } },
  deck: [keep, retired], starter: [retired], rec: { w: 14, l: 2, d: 7 }, draws: 3,
  beatC: { [engine.OPPONENTS[0].char.id]: 14 }, draft: { deck: [retired] },
  match: { hands: { me: [retired], foe: [] }, cells: Array(9).fill(null) },
  pending: { op: 0, cards: [keep, retired, "removed2", "removed3", "removed4"] },
};
rows.set(playerKey, structuredClone(legacy));
const converted = (await request("state")).data;
assert.equal(Object.keys(converted.box).length, 5);
assert.ok(Object.keys(converted.box).every((id) => validIds.has(id)));
assert.equal(converted.box[keep], 3);
assert.deepEqual(converted.boost, { [keep]: { t: 1 } });
assert.deepEqual(converted.rec, legacy.rec);
assert.equal(converted.draws, 3);
assert.equal(converted.beat[0], 14);
assert.equal(converted.deck[0], keep);
assert.ok(converted.deck.every((id) => converted.box[id] > 0));
assert.equal(converted.match, null);
assert.equal(rows.get(playerKey).draft, null);
assert.equal(new Set(converted.pending.cards).size, 5);
assert.ok(converted.pending.cards.every((id) => validIds.has(id)));
assert.equal(converted.pending.cards[0], keep);
const afterUpgrade = counts.write;
assert.deepEqual((await request("state")).data, converted);
assert.equal(counts.write, afterUpgrade);
assert.equal((await request("claim", { card: retired })).status, 400);
assert.equal((await request("claim", { card: keep })).status, 200);
assert.equal((await request("deck", { deck: [retired] })).status, 400);
assert.ok((await request("draw", { all: true })).data.drawn.every((id) => validIds.has(id)));
rows.set(playerKey, { box: { [retired]: 10 }, deck: Array(5).fill(retired), starter: [retired] });
const oldOnly = (await request("state")).data;
assert.equal(new Set(oldOnly.deck).size, 5);
assert.ok(oldOnly.deck.every((id) => oldOnly.box[id] === 1 && validIds.has(id)));
assert.equal((await request("starter")).status, 400);
assert.equal((await request("start", { op: 0 })).status, 200);
console.log("PASS: Genshin-only catalog, 120 boss decks, existing collections, pending rewards and starter recovery.");

assert.equal((await request("sell", { card: oldOnly.deck[0], count: 1 })).status, 400);
const sixIds = deck.slice(0, 6).map((card) => card.id);
const saleId = sixIds[0];
rows.set(playerKey, {
  genshinOnly: true, starter: sixIds.slice(0, 5), deck: sixIds.slice(0, 5),
  box: { ...Object.fromEntries(sixIds.map((id) => [id, 1])), [saleId]: 2 },
  boost: { [saleId]: { t: 1 } },
});
const sell = (card, count) => request("sell", { card, count });
const simultaneous = await Promise.all([sell(saleId, 2), sell(saleId, 2)]);
assert.deepEqual(simultaneous.map((r) => r.status).sort(), [200, 409]);
const firstSale = simultaneous.find((r) => r.status === 200).data;
assert.equal(firstSale.box[saleId], 1);
assert.deepEqual(firstSale.boost[saleId], { t: 1 });
assert.equal(firstSale.draws, 1);
assert.equal((await sell(saleId, 2)).status, 409);
const lastCopy = await sell(saleId, 1);
assert.equal(lastCopy.status, 200);
assert.equal(lastCopy.data.draws, 2);
assert.equal(lastCopy.data.box[saleId], undefined);
assert.equal(lastCopy.data.boost[saleId], undefined);
assert.deepEqual(lastCopy.data.deck, sixIds.slice(1));
assert.equal((await sell(saleId, 1)).status, 400);
assert.equal((await sell(sixIds[1], 1)).status, 400);
assert.equal((await request("state")).data.draws, 2);
const redeem = await request("draw");
assert.equal(redeem.status, 200);
assert.equal(redeem.data.drawn.length, 1);
assert.equal(redeem.data.draws, 1);
console.log("PASS: selling cards, concurrent requests, deck repair, five-kind minimum and draw redemption.");
