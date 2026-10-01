// Chép hồ sơ + bảng xếp hạng từ Upstash Redis sang Supabase (chạy 1 lần, chạy lại không sao).
// Cần: KV_REST_API_URL + KV_REST_API_TOKEN (Upstash) và NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY.
// Chạy bằng workflow .github/workflows/migrate-upstash.yml (lấy biến môi trường từ Vercel).
import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const kvUrl = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL, kvToken = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
const sbUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, sbKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const missing = [!kvUrl && "KV_REST_API_URL", !kvToken && "KV_REST_API_TOKEN", !sbUrl && "NEXT_PUBLIC_SUPABASE_URL", !sbKey && "SUPABASE_SECRET_KEY"].filter(Boolean);
if (missing.length) { console.error("Thiếu biến môi trường:", missing.join(", ")); process.exit(1); }

const redis = new Redis({ url: kvUrl, token: kvToken });
const db = createClient(sbUrl, sbKey, { auth: { persistSession: false, autoRefreshToken: false } });

// 1. Bảng điểm: mọi khóa lb:*
const boards = {};
let cursor = "0";
do {
  const [next, keys] = await redis.scan(cursor, { match: "lb:*", count: 500 });
  cursor = String(next);
  for (const k of keys) {
    const raw = await redis.zrange(k, 0, -1, { withScores: true });
    const list = [];
    for (let i = 0; i < raw.length; i += 2) list.push([String(raw[i]), Number(raw[i + 1])]);
    boards[k.slice(3)] = list;
  }
} while (cursor !== "0");

// 2. Hồ sơ: mọi người có trong bảng "names" hoặc có điểm
const ids = new Set(Object.values((await redis.hgetall("names")) || {}).map(String));
Object.values(boards).forEach((l) => l.forEach(([id]) => ids.add(id)));
const users = [];
for (const id of ids) {
  const u = await redis.hgetall(`u:${id}`);
  if (u?.tokenHash) users.push({ id, ...u });
}
console.log(`Upstash: ${users.length} hồ sơ, ${Object.keys(boards).length} bảng điểm`);

// 3. Ghi hồ sơ — đã có id trên Supabase thì giữ nguyên; trùng tên với người khác thì thêm hậu tố
const { data: have, error: e1 } = await db.from("profiles").select("id");
if (e1) throw e1;
const exist = new Set(have.map((r) => r.id));
let added = 0, renamed = 0;
for (const u of users) {
  if (exist.has(u.id)) continue;
  const base = String(u.name || `Lữ khách ${u.id.slice(0, 4)}`);
  for (let i = 0; ; i++) {
    const name = i ? `${base.slice(0, 17)}_${i + 1}` : base;
    const row = { id: u.id, name, name_lower: name.toLowerCase(), avatar: u.avatar || "Qin", token_hash: u.tokenHash, certs: String(u.certs || "") };
    if (u.created) row.created_at = new Date(Number(u.created)).toISOString();
    const { error } = await db.from("profiles").insert(row);
    if (!error) { added++; if (i) { renamed++; console.log(`Trùng tên: ${base} → ${name}`); } break; }
    if (error.code !== "23505" || i > 20) throw error;
  }
  exist.add(u.id);
}

// 4. Ghi điểm (hàm submit_scores chỉ giữ điểm cao hơn)
const byUser = {};
for (const [board, list] of Object.entries(boards))
  for (const [id, score] of list) if (exist.has(id)) (byUser[id] ||= []).push({ board, score: Math.round(score) });
let saved = 0;
for (const [id, scores] of Object.entries(byUser)) {
  const { data, error } = await db.rpc("submit_scores", { p_user: id, p_scores: scores });
  if (error) throw error;
  saved += data;
}

const { count } = await db.from("profiles").select("*", { count: "exact", head: true });
console.log(`Xong: thêm ${added} hồ sơ (${renamed} đổi tên vì trùng), ghi ${saved} điểm. Supabase hiện có ${count} hồ sơ.`);
