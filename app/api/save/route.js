import { store, auth } from "@/lib/store";

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const MAX = 3_000_000; // ký tự JSON
// Chỉ lưu tiến độ học; thông tin đăng nhập của máy này (profile, token) không bao giờ lên đám mây
const strip = (d) => { const x = { ...d }; for (const k of ["profile", "profileSkip", "syncSig", "gamblePending"]) delete x[k]; return x; };

// Đồng bộ tiến độ học của tài khoản: { id, token, op: "head" | "get" | "put", data?, baseRev?, force? }
export async function POST(req) {
  if (!store) return bad("Chưa cấu hình máy chủ lưu tài khoản", 503);
  const body = await req.json().catch(() => ({}));
  const u = await auth(body.id, body.token);
  if (!u) return bad("Không xác thực được hồ sơ", 401);
  if (!u.username) return bad("Cần đăng ký tài khoản để lưu tiến độ", 403);
  const noStore = { headers: { "Cache-Control": "no-store" } };
  if (body.op === "head") return Response.json({ save: await store.headSave(u.id) }, noStore);
  if (body.op === "get") return Response.json({ save: await store.getSave(u.id) }, noStore);
  if (body.op === "put") {
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) return bad("Dữ liệu không hợp lệ");
    const data = strip(body.data);
    if (JSON.stringify(data).length > MAX) return bad("Tiến độ quá lớn để lưu", 413);
    const r = await store.putSave(u.id, data, Number(body.baseRev) || 0, body.force === true);
    return Response.json(r, { status: r.ok ? 200 : 409, ...noStore });
  }
  return bad("Thao tác không hợp lệ");
}
