import { store, auth } from "@/lib/store";
import { hashPassword, checkPassword, USERNAME_RE, USERNAME_MSG } from "@/lib/password";

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });

// Gắn tên đăng nhập + mật khẩu cho hồ sơ nickname đã có (giữ nguyên điểm xếp hạng): { id, token, username, password }
// Chỉ dành cho hồ sơ chưa có tài khoản
export async function POST(req) {
  if (!store) return bad("Chưa cấu hình máy chủ lưu tài khoản", 503);
  const body = await req.json().catch(() => ({}));
  const u = await auth(body.id, body.token);
  if (!u) return bad("Không xác thực được hồ sơ", 401);
  if (u.username) return bad("Hồ sơ này đã có tài khoản", 409);
  const username = String(body.username || "").trim();
  if (!USERNAME_RE.test(username)) return bad(USERNAME_MSG);
  const pwErr = checkPassword(body.password);
  if (pwErr) return bad(pwErr);
  const r = await store.setCredentials(u.id, { username, passwordHash: await hashPassword(body.password) });
  if (r === "username") return bad("Tên đăng nhập này đã có người dùng", 409);
  return Response.json({ ok: true, username });
}
