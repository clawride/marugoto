import GI from "@/data/genshin.json";
import { redis, auth, sha256 } from "@/lib/store";

const AVATARS = new Set(GI.characters.map((c) => c.icon));
const NAME_RE = /^[\p{L}\p{N} _.\-]{2,20}$/u;

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const cleanName = (n) => String(n || "").normalize("NFC").replace(/\s+/g, " ").trim();

// Đăng ký hồ sơ: chỉ cần tên/nickname (+ ảnh đại diện nhân vật tùy chọn)
export async function POST(req) {
  if (!redis) return bad("Bảng xếp hạng chưa được cấu hình", 503);
  const body = await req.json().catch(() => ({}));
  const name = cleanName(body.name);
  if (!NAME_RE.test(name)) return bad("Tên cần 2–20 ký tự (chữ, số, khoảng trắng, _ . -)");
  const avatar = AVATARS.has(body.avatar) ? body.avatar : "Qin";
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const ok = await redis.hsetnx("names", name.toLowerCase(), id);
  if (!ok) return bad("Tên này đã có người dùng, hãy chọn tên khác", 409);
  const token = crypto.randomUUID() + crypto.randomUUID();
  await redis.hset(`u:${id}`, { name, avatar, tokenHash: await sha256(token), created: Date.now() });
  return Response.json({ id, token, name, avatar });
}

// Đổi tên / ảnh đại diện
export async function PATCH(req) {
  if (!redis) return bad("Bảng xếp hạng chưa được cấu hình", 503);
  const body = await req.json().catch(() => ({}));
  const u = await auth(body.id, body.token);
  if (!u) return bad("Không xác thực được hồ sơ", 401);
  const upd = {};
  if (body.avatar && AVATARS.has(body.avatar)) upd.avatar = body.avatar;
  if (body.name !== undefined) {
    const name = cleanName(body.name);
    if (!NAME_RE.test(name)) return bad("Tên cần 2–20 ký tự (chữ, số, khoảng trắng, _ . -)");
    if (name.toLowerCase() !== String(u.name).toLowerCase()) {
      const ok = await redis.hsetnx("names", name.toLowerCase(), body.id);
      if (!ok) return bad("Tên này đã có người dùng, hãy chọn tên khác", 409);
      await redis.hdel("names", String(u.name).toLowerCase());
    }
    upd.name = name;
  }
  if (Object.keys(upd).length) await redis.hset(`u:${body.id}`, upd);
  return Response.json({ ok: true, name: upd.name || u.name, avatar: upd.avatar || u.avatar });
}
