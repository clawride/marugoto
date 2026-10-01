import { store, sha256 } from "@/lib/store";
import { verifyPassword } from "@/lib/password";

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const WRONG = "Sai tên đăng nhập hoặc mật khẩu";

// Đăng nhập: { username, password } → cấp token riêng cho thiết bị này
export async function POST(req) {
  if (!store) return bad("Chưa cấu hình máy chủ lưu tài khoản", 503);
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password || password.length > 200) return bad(WRONG, 401);
  const a = await store.findAccount(username);
  if (!a?.passwordHash) { await verifyPassword(password, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="); return bad(WRONG, 401); } // giữ thời gian trả lời như nhau
  if (a.lockedUntil > Date.now()) return bad(`Sai mật khẩu quá nhiều lần, thử lại sau ${Math.ceil((a.lockedUntil - Date.now()) / 60000)} phút`, 429);
  if (!(await verifyPassword(password, a.passwordHash))) { await store.noteLogin(a.id, false); return bad(WRONG, 401); }
  await store.noteLogin(a.id, true);
  const token = crypto.randomUUID() + crypto.randomUUID();
  await store.addToken(a.id, await sha256(token));
  const head = await store.headSave(a.id);
  return Response.json({ id: a.id, token, name: a.name, avatar: a.avatar, username: a.username, cloud: head ? { rev: head.rev, updatedAt: head.updatedAt } : null });
}
