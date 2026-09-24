// Lưu hồ sơ & bảng xếp hạng — Upstash Redis (Vercel Marketplace). Chỉ dùng phía server.
// Biến môi trường: KV_REST_API_URL + KV_REST_API_TOKEN (tự có khi nối Upstash trong Vercel)
//   hoặc UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
// Không có biến môi trường: khi chạy trên máy (dev) dùng bộ nhớ tạm để thử; trên production báo chưa cấu hình.
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Bộ nhớ tạm cho môi trường dev — cùng các lệnh Redis mà app dùng
function memoryRedis() {
  const g = globalThis.__teyvatMem || (globalThis.__teyvatMem = { h: new Map(), z: new Map() });
  const hash = (k) => g.h.get(k) || (g.h.set(k, new Map()), g.h.get(k));
  const zset = (k) => g.z.get(k) || (g.z.set(k, new Map()), g.z.get(k));
  const sorted = (k) => [...zset(k).entries()].sort((a, b) => b[1] - a[1]);
  return {
    async hsetnx(k, f, v) { const m = hash(k); if (m.has(f)) return 0; m.set(f, v); return 1; },
    async hset(k, obj) { const m = hash(k); Object.entries(obj).forEach(([f, v]) => m.set(f, v)); return 1; },
    async hget(k, f) { return hash(k).get(f) ?? null; },
    async hdel(k, f) { return hash(k).delete(f) ? 1 : 0; },
    async hgetall(k) { const m = g.h.get(k); return m ? Object.fromEntries(m) : null; },
    async zadd(k, opts, e) { const m = zset(k); const cur = m.get(e.member); if (!opts?.gt || cur == null || e.score > cur) m.set(e.member, e.score); return 1; },
    async zscore(k, member) { return zset(k).get(member) ?? null; },
    async zrevrank(k, member) { const i = sorted(k).findIndex(([m]) => m === member); return i < 0 ? null : i; },
    async zcard(k) { return zset(k).size; },
    async zrange(k, start, stop) { return sorted(k).slice(start, stop + 1).flatMap(([m, s]) => [m, s]); },
    pipeline() {
      const ops = [], self = this;
      const p = new Proxy({}, { get: (_, name) => name === "exec" ? async () => Promise.all(ops.map((f) => f())) : (...a) => { ops.push(() => self[name](...a)); return p; } });
      return p;
    },
  };
}

export const redis = url && token ? new Redis({ url, token }) : process.env.NODE_ENV !== "production" || process.env.LB_MEMORY === "1" ? memoryRedis() : null;
export const isMemory = !(url && token);

// Lấy top N của một bảng: trả về [[id, score], ...]
export async function topOf(board, n) {
  let raw;
  if (isMemory) raw = await redis.zrange(`lb:${board}`, 0, n - 1);
  else raw = await redis.zrange(`lb:${board}`, 0, n - 1, { rev: true, withScores: true });
  const out = [];
  for (let i = 0; i < raw.length; i += 2) out.push([String(raw[i]), Number(raw[i + 1])]);
  return out;
}

export async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Xác thực người chơi bằng id + token bí mật (lưu trên máy người chơi)
export async function auth(id, tok) {
  if (!redis || !id || !tok || typeof id !== "string" || typeof tok !== "string") return null;
  const u = await redis.hgetall(`u:${id}`);
  if (!u || u.tokenHash !== (await sha256(tok))) return null;
  return u;
}
