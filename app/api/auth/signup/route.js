import { getSite } from "@/lib/admin";
import GI from "@/data/genshin.json";
import { store, sha256 } from "@/lib/store";
import { hashPassword, checkPassword, USERNAME_RE, USERNAME_MSG } from "@/lib/password";
import { ICON_IDS, DEFAULT_ICON } from "@/lib/avatars";

const AVATARS = new Set([...GI.characters.map((c) => c.icon), ...ICON_IDS]);
const NAME_RE = /^[\p{L}\p{N} _.\-]{2,20}$/u;
const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const cleanName = (n) => String(n || "").normalize("NFC").replace(/\s+/g, " ").trim();

// Đăng ký tài khoản mới: { username, password, name?, avatar? } — tên hiển thị mặc định = username
export async function POST(req) {
  if (!store) return bad("Chưa cấu hình máy chủ lưu tài khoản", 503);
  if (!(await getSite()).signupEnabled) return bad("Hiện tại trang tạm đóng đăng ký tài khoản mới", 403);
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  if (!USERNAME_RE.test(username)) return bad(USERNAME_MSG);
  const pwErr = checkPassword(body.password);
  if (pwErr) return bad(pwErr);
  if (await store.findAccount(username.toLowerCase())) return bad("Tên đăng nhập này đã có người dùng", 409);
  const name = cleanName(body.name) || username;
  if (!NAME_RE.test(name)) return bad("Tên hiển thị cần 2–20 ký tự (chữ, số, khoảng trắng, _ . -)");
  const avatar = AVATARS.has(body.avatar) ? body.avatar : DEFAULT_ICON;
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const token = crypto.randomUUID() + crypto.randomUUID();
  const r = await store.createAccount({ id, name, avatar, tokenHash: await sha256(token), username, passwordHash: await hashPassword(body.password) });
  if (r === "username") return bad("Tên đăng nhập này đã có người dùng", 409);
  if (r === "name") return bad("Tên hiển thị này đã có người dùng, hãy chọn tên khác", 409);
  return Response.json({ id, token, name, avatar, username });
}
