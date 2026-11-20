import { store } from "@/lib/store";
import { normalizeShiki } from "@/lib/shikihime";
import { buildDeck } from "@/lib/shikiCards";

// Cache only public configuration, never authentication or player state.
// Concurrent requests share one read; other instances refresh within 20 seconds.
const TTL = 20_000;
let cached = null, expires = 0, pending = null;

export function dropShikiConfigCache() {
  cached = null;
  expires = 0;
  pending = null;
}

export async function getShikiConfig() {
  if (cached && Date.now() < expires) return cached;
  if (pending) return pending;
  const request = (async () => {
    const cfg = normalizeShiki(store ? await store.getKV("shiki") : {});
    const deck = buildDeck();
    return { cfg, deck, byId: Object.fromEntries(deck.map((c) => [c.id, c])) };
  })();
  pending = request;
  try {
    const value = await request;
    if (pending === request) { cached = value; expires = Date.now() + TTL; }
    return value;
  } finally {
    if (pending === request) pending = null;
  }
}
