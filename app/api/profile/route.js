import GI from "@/data/genshin.json";
import { store, auth, sha256 } from "@/lib/store";

const AVATARS = new Set(GI.characters.map((c) => c.icon));
const NAME_RE = /^[\p{L}\p{N} _.\-]{2,20}$/u;

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const cleanName = (n) => String(n || "").normalize("NFC").replace(/\s+/g, " ").trim();
const TAKEN = "Tên này đã có người dùng, hãy chọn tên khác";

// Đăng ký hồ sơ: chỉ cần tên/nickname (+ ảnh đại diện nhân vật tùy chọn)
export async function POST(req) {
  if (!store) return bad("Bảng xếp hạng chưa được cấu hình", 503);
  const body = await req.json().catch(() => ({}));
  const name = cleanName(body.name);
  if (!NAME_RE.test(name)) return bad("Tên cần 2–20 ký tự (chữ, số, khoảng trắng, _ . -)");
  const avatar = AVATARS.has(body.avatar) ? body.avatar : "Qin";
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const token = crypto.randomUUID() + crypto.randomUUID();
  if (!(await store.createProfile({ id, name, avatar, tokenHash: await sha256(token) }))) return bad(TAKEN, 409);
  return Response.json({ id, token, name, avatar });
}

// Đổi tên / ảnh đại diện
export async function PATCH(req) {
  if (!store) return bad("Bảng xếp hạng chưa được cấu hình", 503);
  const body = await req.json().catch(() => ({}));
  const u = await auth(body.id, body.token);
  if (!u) return bad("Không xác thực được hồ sơ", 401);
  const upd = {};
  if (body.avatar && AVATARS.has(body.avatar)) upd.avatar = body.avatar;
  if (body.name !== undefined) {
    const name = cleanName(body.name);
    if (!NAME_RE.test(name)) return bad("Tên cần 2–20 ký tự (chữ, số, khoảng trắng, _ . -)");
    upd.name = name;
  }
  if (Object.keys(upd).length && !(await store.updateProfile(body.id, upd))) return bad(TAKEN, 409);
  return Response.json({ ok: true, name: upd.name || u.name, avatar: upd.avatar || u.avatar });
}
