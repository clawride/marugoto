// Lưu hồ sơ & bảng xếp hạng — Supabase (Postgres). Chỉ dùng phía server.
// Bảng + hàm SQL: supabase/migrations/20261001000000_leaderboard.sql
// Biến môi trường: NEXT_PUBLIC_SUPABASE_URL (hoặc SUPABASE_URL) + SUPABASE_SECRET_KEY (hoặc SUPABASE_SERVICE_ROLE_KEY).
// Không có biến môi trường: khi chạy trên máy (dev) dùng bộ nhớ tạm để thử; trên production báo chưa cấu hình.
// LB_MEMORY=1 (bản offline) luôn dùng bộ nhớ tạm.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mỗi kho có cùng các hàm:
//   createProfile(p) → false nếu trùng tên      getProfile(id) → hồ sơ | null
//   updateProfile(id, upd) → false nếu trùng tên  submitScores(id, [{board, score}])
//   leaderboard(board, me, limit) → { rows, me, count }
// Hồ sơ: { id, name, avatar, tokenHash, certs }

function supabaseStore() {
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const must = ({ data, error }) => { if (error) throw error; return data; };
  const dupName = (error) => error?.code === "23505";
  return {
    async createProfile({ id, name, avatar, tokenHash }) {
      const { error } = await db.from("profiles").insert({ id, name, name_lower: name.toLowerCase(), avatar, token_hash: tokenHash });
      if (dupName(error)) return false;
      if (error) throw error;
      return true;
    },
    async getProfile(id) {
      const p = must(await db.from("profiles").select("id, name, avatar, token_hash, certs").eq("id", id).maybeSingle());
      return p && { id: p.id, name: p.name, avatar: p.avatar, tokenHash: p.token_hash, certs: p.certs };
    },
    async updateProfile(id, upd) {
      const row = { ...upd };
      if (upd.name !== undefined) row.name_lower = upd.name.toLowerCase();
      const { error } = await db.from("profiles").update(row).eq("id", id);
      if (dupName(error)) return false;
      if (error) throw error;
      return true;
    },
    async submitScores(id, scores) {
      if (scores.length) must(await db.rpc("submit_scores", { p_user: id, p_scores: scores }));
    },
    async leaderboard(board, me, limit) {
      return must(await db.rpc("leaderboard", { p_board: board, p_me: me || null, p_limit: limit }));
    },
  };
}

// Bộ nhớ tạm cho dev / bản offline — cùng cách xếp hạng với hàm SQL
function memoryStore() {
  const g = globalThis.__teyvatMem2 || (globalThis.__teyvatMem2 = { users: new Map(), boards: new Map() });
  const nameTaken = (name, id) => [...g.users.values()].some((u) => u.id !== id && u.name.toLowerCase() === name.toLowerCase());
  const pub = (r, i) => { const u = g.users.get(r.id); return { rank: i + 1, id: r.id, score: r.score, name: u?.name, avatar: u?.avatar, certs: u?.certs || "" }; };
  return {
    async createProfile({ id, name, avatar, tokenHash }) {
      if (nameTaken(name)) return false;
      g.users.set(id, { id, name, avatar, tokenHash, certs: "" });
      return true;
    },
    async getProfile(id) { return g.users.get(id) || null; },
    async updateProfile(id, upd) {
      if (upd.name !== undefined && nameTaken(upd.name, id)) return false;
      Object.assign(g.users.get(id), upd);
      return true;
    },
    async submitScores(id, scores) {
      for (const { board, score } of scores) {
        const m = g.boards.get(board) || (g.boards.set(board, new Map()), g.boards.get(board));
        const cur = m.get(id);
        if (!cur || score > cur.score) m.set(id, { score, at: Date.now() });
      }
    },
    async leaderboard(board, me, limit) {
      const all = [...(g.boards.get(board) || new Map())].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.score - a.score || a.at - b.at);
      const i = all.findIndex((r) => r.id === me);
      return { rows: all.slice(0, limit).map(pub), me: i < 0 ? null : pub(all[i], i), count: all.length };
    },
  };
}

export const store =
  process.env.LB_MEMORY === "1" ? memoryStore()
  : url && key ? supabaseStore()
  : process.env.NODE_ENV !== "production" ? memoryStore()
  : null;

export async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Xác thực người chơi bằng id + token bí mật (lưu trên máy người chơi)
export async function auth(id, tok) {
  if (!store || !id || !tok || typeof id !== "string" || typeof tok !== "string") return null;
  const u = await store.getProfile(id);
  if (!u || u.tokenHash !== (await sha256(tok))) return null;
  return u;
}
