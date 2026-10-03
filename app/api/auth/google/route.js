import { getSite } from "@/lib/admin";
import { store, sha256, auth } from "@/lib/store";
import { verifyGoogleCredential, GOOGLE_CLIENT_ID } from "@/lib/google";
import { DEFAULT_ICON } from "@/lib/avatars";

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const NAME_RE = /^[\p{L}\p{N} _.\-]{2,20}$/u;
const rnd = (n) => String(Math.floor(Math.random() * 10 ** n)).padStart(n, "0");

// tên đăng nhập tự sinh từ phần trước @ của Gmail (chỉ chữ không dấu, số, _ .)
function usernameBase(email) {
  let b = String(email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "").replace(/^\.+|\.+$/g, "").slice(0, 16);
  if (b.length < 3) b = "user" + b;
  return b;
}
// tên hiển thị lấy từ tên tài khoản Google, bỏ ký tự không hợp lệ
function displayBase(g, fallback) {
  const n = String(g.name || g.givenName || "").normalize("NFC").replace(/[^\p{L}\p{N} _.\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 20).trim();
  return NAME_RE.test(n) ? n : fallback;
}
async function freeUsername(email) {
  const base = usernameBase(email);
  for (let i = 0; i < 12; i++) {
    const u = i === 0 ? base : `${base.slice(0, 16)}${rnd(i < 6 ? 2 : 4)}`;
    if (!(await store.findAccount(u.toLowerCase()))) return u;
  }
  return "user" + rnd(8);
}
const loginResult = async (p, g, token) => {
  const head = await store.headSave(p.id);
  return Response.json({ id: p.id, token, name: p.name, avatar: p.avatar, username: p.username, google: g.email, cloud: head ? { rev: head.rev, updatedAt: head.updatedAt } : null });
};

// Đăng nhập / đăng ký bằng Google: { credential } (ID token từ nút Google)
//   · Google đã gắn hồ sơ → đăng nhập (cấp token mới cho thiết bị này)
//   · gửi kèm { id, token } của hồ sơ đang dùng (chưa gắn Google) → gắn Google vào hồ sơ đó, giữ nguyên điểm & tiến độ
//   · còn lại → tạo tài khoản mới (tên đăng nhập tự sinh từ Gmail, không có mật khẩu)
export async function POST(req) {
  if (!store) return bad("Chưa cấu hình máy chủ lưu tài khoản", 503);
  if (!GOOGLE_CLIENT_ID) return bad("Trang chưa bật đăng nhập bằng Google", 503);
  const body = await req.json().catch(() => ({}));
  const g = await verifyGoogleCredential(body.credential);
  if (!g) return bad("Không xác minh được tài khoản Google, hãy thử lại", 401);

  const found = await store.findGoogle(g.sub);
  // { link: true }: chỉ muốn gắn Google vào hồ sơ đang dùng — không tự chuyển sang hồ sơ khác
  if (body.link && found && found.id !== body.id) return bad("Tài khoản Google này đã gắn với một hồ sơ khác", 409);
  if (found?.banned) return bad("Tài khoản này đã bị khóa. Liên hệ quản trị viên nếu cần.", 403);
  if (!found && !body.link && !(await getSite()).signupEnabled) return bad("Hiện tại trang tạm đóng đăng ký tài khoản mới", 403);
  if (found) {
    const token = crypto.randomUUID() + crypto.randomUUID();
    await store.addToken(found.id, await sha256(token));
    return loginResult(found, g, token);
  }

  // gắn vào hồ sơ đang đăng nhập trên máy này
  if (body.id && body.token) {
    const u = await auth(body.id, body.token);
    if (u && !u.googleSub) {
      const username = u.username ? null : await freeUsername(g.email);
      const r = await store.setGoogle(u.id, { sub: g.sub, email: g.email, username });
      if (r === "ok") return loginResult({ ...u, username: u.username || username }, g, body.token);
    }
    if (body.link) return bad(u?.googleSub ? "Hồ sơ này đã gắn một tài khoản Google khác" : "Không gắn được Google vào hồ sơ này", 409);
  }

  // tạo tài khoản mới
  let username = await freeUsername(g.email);
  const base = displayBase(g, username);
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256(token);
  let name = base;
  for (let i = 0; i < 15; i++) {
    const r = await store.createAccount({ id, name, avatar: DEFAULT_ICON, tokenHash, username, passwordHash: null, googleSub: g.sub, googleEmail: g.email });
    if (r === "ok") return loginResult({ id, name, avatar: DEFAULT_ICON, username }, g, token);
    if (r === "google") { // vừa có yêu cầu khác tạo trước → đăng nhập vào hồ sơ đó
      const f = await store.findGoogle(g.sub);
      if (f) { await store.addToken(f.id, tokenHash); return loginResult(f, g, token); }
    }
    if (r === "username") username = `${usernameBase(g.email).slice(0, 14)}${rnd(4)}`;
    if (r === "name") name = `${base.slice(0, 16).trim()} ${rnd(i < 8 ? 2 : 3)}`;
  }
  return bad("Không tạo được tài khoản, hãy thử lại", 500);
}
