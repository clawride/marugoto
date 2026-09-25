import { redis, auth } from "@/lib/store";
import { ALL_BOARDS, encode } from "@/lib/boards";

// Gửi kỷ lục: { id, token, entries: [{board, pct, total}], overall }
// Server chỉ giữ điểm cao nhất của mỗi người (ZADD GT)
export async function POST(req) {
  if (!redis) return Response.json({ error: "Bảng xếp hạng chưa được cấu hình" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (!(await auth(body.id, body.token))) return Response.json({ error: "Không xác thực được hồ sơ" }, { status: 401 });
  const entries = Array.isArray(body.entries) ? body.entries.slice(0, 300) : [];
  const p = redis.pipeline();
  let n = 0;
  for (const e of entries) {
    const pct = Number(e.pct), total = Number(e.total);
    if (!ALL_BOARDS.has(e.board) || e.board === "overall" || !(pct >= 0 && pct <= 100) || !(total >= 1 && total <= 5000)) continue;
    p.zadd(`lb:${e.board}`, { gt: true }, { score: encode(pct, total), member: body.id });
    n++;
  }
  const ov = Number(body.overall);
  if (ov >= 0 && ov <= 10_000_000) { p.zadd("lb:overall", { gt: true }, { score: Math.round(ov), member: body.id }); n++; }
  if (Array.isArray(body.certs)) { const c = body.certs.filter((x) => /^(?:[1-3]|[ACDE][12]|F[1-3])\*?$/.test(String(x))).slice(0, 14).join(","); p.hset(`u:${body.id}`, { certs: c }); n++; }
  if (n) await p.exec();
  return Response.json({ ok: true, saved: n });
}
