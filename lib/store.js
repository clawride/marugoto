// Lưu hồ sơ & bảng xếp hạng — Supabase (Postgres). Chỉ dùng phía server.
// Bảng + hàm SQL: supabase/migrations/20261001000000_leaderboard.sql
// Biến môi trường: NEXT_PUBLIC_SUPABASE_URL (hoặc SUPABASE_URL) + SUPABASE_SECRET_KEY (hoặc SUPABASE_SERVICE_ROLE_KEY).
// Không có biến môi trường: khi chạy trên máy (dev) dùng bộ nhớ tạm để thử; trên production báo chưa cấu hình.
// LB_MEMORY=1 (bản offline) luôn dùng bộ nhớ tạm.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
export const LOCK_AFTER = 8, LOCK_MS = 10 * 60 * 1000; // sai mật khẩu 8 lần → khóa đăng nhập tài khoản đó 10 phút

// Mỗi kho có cùng các hàm:
//   createProfile(p) → false nếu trùng tên      getProfile(id) → hồ sơ | null
//   updateProfile(id, upd) → false nếu trùng tên  submitScores(id, [{board, score}])
//   leaderboard(board, me, limit) → { rows, me, count }
// Hồ sơ: { id, name, avatar, tokenHash, certs, username }
// Tài khoản: createAccount(p) → "ok" | "name" | "username" · findAccount(usernameLower) → { id, name, avatar, username, passwordHash, failed, lockedUntil } | null
//   setCredentials(id, { username, passwordHash }) → "ok" | "username" · noteLogin(id, ok) (đếm sai, khóa tạm) · addToken/hasToken (phiên nhiều thiết bị)
// Tiến độ: getSave(id) / headSave(id) → { data?, rev, updatedAt } | null · putSave(id, data, baseRev, force) → { ok, rev, updatedAt }

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
      const p = must(await db.from("profiles").select("id, name, avatar, token_hash, certs, username").eq("id", id).maybeSingle());
      return p && { id: p.id, name: p.name, avatar: p.avatar, tokenHash: p.token_hash, certs: p.certs, username: p.username };
    },
    async hasToken(id, hash) {
      const r = must(await db.from("profile_tokens").select("token_hash").eq("token_hash", hash).eq("user_id", id).maybeSingle());
      return !!r;
    },
    async addToken(id, hash) { must(await db.from("profile_tokens").insert({ token_hash: hash, user_id: id })); },
    async createAccount({ id, name, avatar, tokenHash, username, passwordHash }) {
      const { error } = await db.from("profiles").insert({ id, name, name_lower: name.toLowerCase(), avatar, token_hash: tokenHash, username, username_lower: username.toLowerCase(), password_hash: passwordHash });
      if (error?.code === "23505") return /username/.test(error.message) ? "username" : "name";
      if (error) throw error;
      return "ok";
    },
    async findAccount(usernameLower) {
      const p = must(await db.from("profiles").select("id, name, avatar, username, password_hash, failed_logins, locked_until").eq("username_lower", usernameLower).maybeSingle());
      return p && { id: p.id, name: p.name, avatar: p.avatar, username: p.username, passwordHash: p.password_hash, failed: p.failed_logins, lockedUntil: p.locked_until ? Date.parse(p.locked_until) : 0 };
    },
    async setCredentials(id, { username, passwordHash }) {
      const { error } = await db.from("profiles").update({ username, username_lower: username.toLowerCase(), password_hash: passwordHash, failed_logins: 0, locked_until: null }).eq("id", id);
      if (error?.code === "23505") return "username";
      if (error) throw error;
      return "ok";
    },
    async noteLogin(id, ok) {
      if (ok) { must(await db.from("profiles").update({ failed_logins: 0, locked_until: null }).eq("id", id)); return; }
      const p = must(await db.from("profiles").select("failed_logins").eq("id", id).maybeSingle());
      const n = (p?.failed_logins || 0) + 1;
      must(await db.from("profiles").update({ failed_logins: n, locked_until: n >= LOCK_AFTER ? new Date(Date.now() + LOCK_MS).toISOString() : null }).eq("id", id));
    },
    async headSave(id) {
      const r = must(await db.from("saves").select("rev, updated_at").eq("user_id", id).maybeSingle());
      return r && { rev: Number(r.rev), updatedAt: r.updated_at };
    },
    async getSave(id) {
      const r = must(await db.from("saves").select("data, rev, updated_at").eq("user_id", id).maybeSingle());
      return r && { data: r.data, rev: Number(r.rev), updatedAt: r.updated_at };
    },
    async putSave(id, data, baseRev, force) {
      const r = must(await db.rpc("put_save", { p_user: id, p_data: data, p_base: baseRev || 0, p_force: !!force }));
      return { ok: r.ok, rev: Number(r.rev), updatedAt: r.updatedAt };
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
  const g = globalThis.__teyvatMem3 || (globalThis.__teyvatMem3 = { users: new Map(), boards: new Map(), tokens: new Map(), saves: new Map() });
  const nameTaken = (name, id) => [...g.users.values()].some((u) => u.id !== id && u.name.toLowerCase() === name.toLowerCase());
  const pub = (r, i) => { const u = g.users.get(r.id); return { rank: i + 1, id: r.id, score: r.score, name: u?.name, avatar: u?.avatar, certs: u?.certs || "" }; };
  return {
    async createProfile({ id, name, avatar, tokenHash }) {
      if (nameTaken(name)) return false;
      g.users.set(id, { id, name, avatar, tokenHash, certs: "" });
      return true;
    },
    async getProfile(id) { return g.users.get(id) || null; },
    async hasToken(id, hash) { return g.tokens.get(hash) === id; },
    async addToken(id, hash) { g.tokens.set(hash, id); },
    async createAccount({ id, name, avatar, tokenHash, username, passwordHash }) {
      if (nameTaken(name)) return "name";
      if ([...g.users.values()].some((u) => u.username?.toLowerCase() === username.toLowerCase())) return "username";
      g.users.set(id, { id, name, avatar, tokenHash, certs: "", username, passwordHash, failed: 0, lockedUntil: 0 });
      return "ok";
    },
    async findAccount(lower) { return [...g.users.values()].find((u) => u.username?.toLowerCase() === lower) || null; },
    async setCredentials(id, { username, passwordHash }) {
      if ([...g.users.values()].some((u) => u.id !== id && u.username?.toLowerCase() === username.toLowerCase())) return "username";
      Object.assign(g.users.get(id), { username, passwordHash, failed: 0, lockedUntil: 0 });
      return "ok";
    },
    async noteLogin(id, ok) {
      const u = g.users.get(id);
      if (ok) { u.failed = 0; u.lockedUntil = 0; return; }
      u.failed = (u.failed || 0) + 1;
      if (u.failed >= LOCK_AFTER) u.lockedUntil = Date.now() + LOCK_MS;
    },
    async headSave(id) { const r = g.saves.get(id); return r && { rev: r.rev, updatedAt: r.updatedAt }; },
    async getSave(id) { return g.saves.get(id) || null; },
    async putSave(id, data, baseRev, force) {
      const cur = g.saves.get(id);
      if (cur && !force && cur.rev !== (baseRev || 0)) return { ok: false, rev: cur.rev, updatedAt: cur.updatedAt };
      const r = { data, rev: (cur?.rev || 0) + 1, updatedAt: new Date().toISOString() };
      g.saves.set(id, r);
      return { ok: true, rev: r.rev, updatedAt: r.updatedAt };
    },
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
  if (!u) return null;
  const h = await sha256(tok);
  if (u.tokenHash !== h && !(await store.hasToken(id, h))) return null;
  return u;
}
