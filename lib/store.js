// Lưu hồ sơ & bảng xếp hạng — Supabase (Postgres). Chỉ dùng phía server.
// Bảng + hàm SQL: supabase/migrations/20261001000000_leaderboard.sql
// Biến môi trường: NEXT_PUBLIC_SUPABASE_URL (hoặc SUPABASE_URL) + SUPABASE_SECRET_KEY (hoặc SUPABASE_SERVICE_ROLE_KEY).
// Không có biến môi trường: khi chạy trên máy (dev) dùng bộ nhớ tạm để thử; trên production báo chưa cấu hình.
// LB_MEMORY=1 (bản offline) luôn dùng bộ nhớ tạm.
import { createClient } from "@supabase/supabase-js";
import { GOOGLE_CLIENT_ID } from "@/lib/google";

// Cột Google chỉ được đọc khi đã bật đăng nhập Google (sau khi chạy migration 20261003000000_google.sql)
const GCOLS = GOOGLE_CLIENT_ID ? ", google_sub, google_email" : "";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
export const LOCK_AFTER = 8, LOCK_MS = 10 * 60 * 1000; // sai mật khẩu 8 lần → khóa đăng nhập tài khoản đó 10 phút

// Mỗi kho có cùng các hàm:
//   createProfile(p) → false nếu trùng tên      getProfile(id) → hồ sơ | null
//   updateProfile(id, upd) → false nếu trùng tên  submitScores(id, [{board, score}])
//   leaderboard(board, me, limit) → { rows, me, count }
// Hồ sơ: { id, name, avatar, tokenHash, certs, username }
// Google: findGoogle(sub) → hồ sơ | null · setGoogle(id, { sub, email, username? }) → "ok" | "google" | "username" · createAccount nhận thêm googleSub/googleEmail
// Tài khoản: createAccount(p) → "ok" | "name" | "username" | "google" · findAccount(usernameLower) → { id, name, avatar, username, passwordHash, failed, lockedUntil } | null
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
      const p = must(await db.from("profiles").select("id, name, avatar, token_hash, certs, username" + GCOLS).eq("id", id).maybeSingle());
      return p && { id: p.id, name: p.name, avatar: p.avatar, tokenHash: p.token_hash, certs: p.certs, username: p.username, googleSub: p.google_sub };
    },
    // Đăng nhập Google: tìm hồ sơ theo google_sub · gắn Google vào hồ sơ có sẵn → "ok" | "google" (Google này đã gắn hồ sơ khác)
    async findGoogle(sub) {
      const p = must(await db.from("profiles").select("id, name, avatar, username").eq("google_sub", sub).maybeSingle());
      return p && { id: p.id, name: p.name, avatar: p.avatar, username: p.username };
    },
    async setGoogle(id, { sub, email, username }) {
      const row = { google_sub: sub, google_email: email };
      if (username) Object.assign(row, { username, username_lower: username.toLowerCase() });
      const { error } = await db.from("profiles").update(row).eq("id", id);
      if (error?.code === "23505") return /google/.test(error.message) ? "google" : "username";
      if (error) throw error;
      return "ok";
    },
    async hasToken(id, hash) {
      const r = must(await db.from("profile_tokens").select("token_hash").eq("token_hash", hash).eq("user_id", id).maybeSingle());
      return !!r;
    },
    async addToken(id, hash) { must(await db.from("profile_tokens").insert({ token_hash: hash, user_id: id })); },
    async createAccount({ id, name, avatar, tokenHash, username, passwordHash, googleSub, googleEmail }) {
      const row = { id, name, name_lower: name.toLowerCase(), avatar, token_hash: tokenHash, username, username_lower: username.toLowerCase(), password_hash: passwordHash || null };
      if (googleSub) Object.assign(row, { google_sub: googleSub, google_email: googleEmail || null });
      const { error } = await db.from("profiles").insert(row);
      if (error?.code === "23505") return /google/.test(error.message) ? "google" : /username/.test(error.message) ? "username" : "name";
      if (error) throw error;
      return "ok";
    },
    async findAccount(usernameLower) {
      const p = must(await db.from("profiles").select("id, name, avatar, username, password_hash, failed_logins, locked_until" + GCOLS).eq("username_lower", usernameLower).maybeSingle());
      return p && { id: p.id, name: p.name, avatar: p.avatar, username: p.username, passwordHash: p.password_hash, failed: p.failed_logins, lockedUntil: p.locked_until ? Date.parse(p.locked_until) : 0, googleEmail: p.google_email };
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
    // Phòng chat: tin trong ngày (cũ → mới), tin gần đây của một người (chống spam), gửi tin, xóa tin của các ngày trước
    async chatToday(sinceIso, limit) {
      const rows = must(await db.from("chat_messages").select("id, user_id, name, avatar, body, created_at, reply_to").gte("created_at", sinceIso).order("id", { ascending: false }).limit(limit));
      return rows.reverse();
    },
    // Lumie (bot) gửi tin trả lời một người — ghi thẳng, không qua chống spam
    async chatBotPost(m) {
      return must(await db.from("chat_messages").insert({ user_id: m.userId, name: m.name, avatar: m.avatar, body: m.body, reply_to: m.replyTo }).select("id, user_id, name, avatar, body, created_at, reply_to").single());
    },
    // số câu Lumie đã trả lời hôm nay: cho một người và cho cả phòng
    async botCounts(botId, userId, sinceIso) {
      const q = (f) => f(db.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", botId).gte("created_at", sinceIso));
      const [mine, all] = await Promise.all([q((x) => x.eq("reply_to", userId)), q((x) => x)]);
      if (mine.error || all.error) throw mine.error || all.error;
      return { mine: mine.count || 0, all: all.count || 0 };
    },
    // gửi tin: chống spam + dọn tin ngày cũ ngay trong cơ sở dữ liệu → { message } | { error: "slow" | "burst" }
    async chatPost(m) {
      const r = must(await db.rpc("chat_post", { p_user: m.userId, p_name: m.name, p_avatar: m.avatar, p_body: m.body }));
      if (r.message) { const { id, user_id, name, avatar, body, created_at } = r.message; r.message = { id, user_id, name, avatar, body, created_at }; }
      return r;
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
    async createAccount({ id, name, avatar, tokenHash, username, passwordHash, googleSub, googleEmail }) {
      if (googleSub && [...g.users.values()].some((u) => u.googleSub === googleSub)) return "google";
      if (nameTaken(name)) return "name";
      if ([...g.users.values()].some((u) => u.username?.toLowerCase() === username.toLowerCase())) return "username";
      g.users.set(id, { id, name, avatar, tokenHash, certs: "", username, passwordHash: passwordHash || null, googleSub: googleSub || null, googleEmail: googleEmail || null, failed: 0, lockedUntil: 0 });
      return "ok";
    },
    async findGoogle(sub) { return [...g.users.values()].find((u) => u.googleSub === sub) || null; },
    async setGoogle(id, { sub, email, username }) {
      if ([...g.users.values()].some((u) => u.id !== id && u.googleSub === sub)) return "google";
      if (username && [...g.users.values()].some((u) => u.id !== id && u.username?.toLowerCase() === username.toLowerCase())) return "username";
      Object.assign(g.users.get(id), { googleSub: sub, googleEmail: email, ...(username ? { username } : {}) });
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
    async chatToday(sinceIso, limit) { return (g.chat ||= []).filter((m) => m.created_at >= sinceIso).slice(-limit); },
    async chatBotPost(m) {
      const row = { id: (g.chatId = (g.chatId || 0) + 1), user_id: m.userId, name: m.name, avatar: m.avatar, body: m.body, reply_to: m.replyTo, created_at: new Date().toISOString() };
      (g.chat ||= []).push(row);
      return row;
    },
    async botCounts(botId, userId, sinceIso) {
      const t = (g.chat || []).filter((x) => x.user_id === botId && x.created_at >= sinceIso);
      return { mine: t.filter((x) => x.reply_to === userId).length, all: t.length };
    },
    async chatPost(m) {
      const now = Date.now(), mine = (g.chat ||= []).filter((x) => x.user_id === m.userId && Date.parse(x.created_at) > now - 5 * 60e3);
      if (mine.length && now - Date.parse(mine[mine.length - 1].created_at) < 2500) return { error: "slow" };
      if (mine.length >= 15) return { error: "burst" };
      const row = { id: (g.chatId = (g.chatId || 0) + 1), user_id: m.userId, name: m.name, avatar: m.avatar, body: m.body, created_at: new Date().toISOString() };
      g.chat.push(row);
      return { message: row };
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
