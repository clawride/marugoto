// API trang quản trị — POST { id, token, action, ... }. Mọi thao tác kiểm lại quyền quản trị trên máy chủ;
// người không phải quản trị (hoặc chưa cấu hình quản trị) nhận 404 như thể đường dẫn không tồn tại.
import { store, sha256 } from "@/lib/store";
import { requireAdmin, isAdminUser, adminConfigured, getSite, dropSiteCache } from "@/lib/admin";
import { normalizeSite } from "@/lib/siteCfg";
import { hashPassword } from "@/lib/password";
import { ALL_BOARDS, boardLabel } from "@/lib/boards";
import { dayStartVN } from "@/lib/chat";

export const dynamic = "force-dynamic";
const NOPE = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
const bad = (msg, status = 400) => Response.json({ error: msg }, { status, headers: { "Cache-Control": "no-store" } });
const ok = (o = {}) => Response.json({ ok: true, ...o }, { headers: { "Cache-Control": "no-store" } });
const NAME_RE = /^[\p{L}\p{N} _.\-]{2,20}$/u;
const randPw = () => { const a = "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRTUVWXYZ2345679"; return Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => a[x % a.length]).join(""); };

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  if (!store || !adminConfigured()) return NOPE();
  const me = await requireAdmin(b);
  if (!me) return NOPE();
  const log = (action, target, detail) => store.adminLog(me.username || me.id, action, target, detail).catch(() => {});
  const who = async (id) => (typeof id === "string" && id ? store.getProfile(id) : null);

  switch (b.action) {
    case "whoami":
      return ok({ admin: true, name: me.name, username: me.username });

    case "overview": {
      const [stats, site] = await Promise.all([store.adminStats(dayStartVN().toISOString()), getSite(true)]);
      return ok({ stats, site, storage: process.env.LB_MEMORY === "1" ? "memory" : "supabase", env: process.env.NODE_ENV });
    }

    // ——— người dùng ———
    case "users": {
      const r = await store.adminUsers({ q: String(b.q || "").slice(0, 60), limit: 40, offset: Math.max(0, Number(b.offset) || 0) });
      return ok({ ...r, rows: r.rows.map((u) => ({ ...u, admin: isAdminUser(u) })) });
    }
    case "user": {
      const d = await store.adminUserDetail(String(b.uid || ""));
      return d ? ok({ user: { ...d, admin: isAdminUser(d) } }) : bad("Không có người dùng này", 404);
    }
    case "userOp": {
      const uid = String(b.uid || ""), t = await who(uid);
      if (!t) return bad("Không có người dùng này", 404);
      const protectedAcc = isAdminUser(t);
      switch (b.op) {
        case "ban":
          if (protectedAcc) return bad("Không khóa được tài khoản quản trị");
          await store.adminUpdate(uid, { banned: true, reason: String(b.reason || "").slice(0, 200) });
          await store.adminUpdate(uid, { revoke: await sha256(crypto.randomUUID()) });
          await log("ban", uid, { name: t.name, reason: b.reason || null });
          return ok();
        case "unban": await store.adminUpdate(uid, { banned: false }); await log("unban", uid, { name: t.name }); return ok();
        case "unlock": await store.adminUpdate(uid, { unlock: true }); await log("unlock", uid, { name: t.name }); return ok();
        case "revoke": await store.adminUpdate(uid, { revoke: await sha256(crypto.randomUUID()) }); await log("revoke-sessions", uid, { name: t.name }); return ok();
        case "rename": {
          const name = String(b.name || "").normalize("NFC").replace(/\s+/g, " ").trim();
          if (!NAME_RE.test(name)) return bad("Tên cần 2–20 ký tự (chữ, số, khoảng trắng, _ . -)");
          const from = t.name;
          const r = await store.adminUpdate(uid, { name });
          if (r === "name") return bad("Tên này đã có người dùng", 409);
          await log("rename", uid, { from, to: name }); return ok();
        }
        case "resetPassword": {
          if (!t.username) return bad("Hồ sơ này chưa có tài khoản (tên đăng nhập)");
          if (protectedAcc && t.id !== me.id) return bad("Không đặt lại mật khẩu của quản trị khác");
          const pw = randPw();
          await store.adminUpdate(uid, { passwordHash: await hashPassword(pw) });
          await store.adminUpdate(uid, { revoke: await sha256(crypto.randomUUID()) }); // đăng xuất mọi thiết bị
          await log("reset-password", uid, { name: t.name });
          return ok({ password: pw });
        }
        case "clearScores": await store.adminClearUserScores(uid); await log("clear-scores", uid, { name: t.name }); return ok();
        case "delete":
          if (protectedAcc) return bad("Không xóa được tài khoản quản trị");
          if (b.confirm !== t.name) return bad("Gõ đúng tên hiển thị của người dùng để xác nhận xóa");
          await store.adminDeleteUser(uid); await log("delete-user", uid, { name: t.name, username: t.username }); return ok();
        default: return bad("Thao tác không hợp lệ");
      }
    }

    // ——— bảng xếp hạng ———
    case "board": {
      const board = String(b.board || "overall");
      if (!ALL_BOARDS.has(board)) return bad("Bảng không tồn tại");
      const lb = await store.leaderboard(board, null, 100);
      return ok({ board, label: boardLabel(board), rows: lb.rows.map((r) => ({ id: r.id, rank: r.rank, name: r.name, score: Number(r.score) })), count: Number(lb.count) });
    }
    case "boardOp": {
      const board = String(b.board || "");
      if (!ALL_BOARDS.has(board)) return bad("Bảng không tồn tại");
      if (b.op === "delete") { await store.adminDeleteScore(board, String(b.uid || "")); await log("delete-score", String(b.uid), { board }); return ok(); }
      if (b.op === "clear") { if (b.confirm !== board) return bad("Gõ đúng mã bảng để xác nhận xóa cả bảng"); await store.adminClearBoard(board); await log("clear-board", board); return ok(); }
      return bad("Thao tác không hợp lệ");
    }

    // ——— phòng chat ———
    case "chat": return ok({ messages: await store.adminChatList(dayStartVN().toISOString(), 200) });
    case "chatOp": {
      if (b.op === "delete") { await store.adminChatDelete(Number(b.mid)); await log("chat-delete", String(b.mid)); return ok(); }
      if (b.op === "clear") { if (b.confirm !== "XOA") return bad("Gõ XOA để xác nhận"); await store.adminChatClear(dayStartVN().toISOString()); await log("chat-clear"); return ok(); }
      return bad("Thao tác không hợp lệ");
    }

    // ——— cấu hình trang ———
    case "setSite": {
      const next = normalizeSite(b.site);
      const prev = await getSite(true);
      for (const k of Object.keys(next)) if (JSON.stringify(next[k]) !== JSON.stringify(prev[k])) await store.setSetting(k, next[k]);
      dropSiteCache();
      await log("set-site", null, { changed: Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(prev[k])) });
      return ok({ site: await getSite(true) });
    }

    case "logs": return ok({ logs: await store.adminLogs(100) });
    default: return bad("Thao tác không hợp lệ");
  }
}

// Mọi phương thức khác (GET…) → như không có trang này
export const GET = NOPE, PUT = NOPE, DELETE = NOPE, PATCH = NOPE;
