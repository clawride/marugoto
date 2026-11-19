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
