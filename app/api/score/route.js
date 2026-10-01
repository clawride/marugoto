import { store, auth } from "@/lib/store";
import { ALL_BOARDS, encode } from "@/lib/boards";

// Gửi kỷ lục: { id, token, entries: [{board, pct, total}], overall, certs }
// Server chỉ giữ điểm cao nhất của mỗi người trên mỗi bảng
export async function POST(req) {
  if (!store) return Response.json({ error: "Bảng xếp hạng chưa được cấu hình" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (!(await auth(body.id, body.token))) return Response.json({ error: "Không xác thực được hồ sơ" }, { status: 401 });
  const entries = Array.isArray(body.entries) ? body.entries.slice(0, 300) : [];
  const scores = [];
  for (const e of entries) {
    const pct = Number(e.pct), total = Number(e.total);
    if (!ALL_BOARDS.has(e.board) || e.board === "overall" || !(pct >= 0 && pct <= 100) || !(total >= 1 && total <= 5000)) continue;
    scores.push({ board: e.board, score: encode(pct, total) });
  }
  const ov = Number(body.overall);
  if (ov >= 0 && ov <= 10_000_000) scores.push({ board: "overall", score: Math.round(ov) });
  await store.submitScores(body.id, scores);
  let n = scores.length;
  if (Array.isArray(body.certs)) {
    const certs = body.certs.filter((x) => /^(?:[1-3]|[ACDE][12]|F[1-3])\*?$/.test(String(x))).slice(0, 14).join(",");
    await store.updateProfile(body.id, { certs });
    n++;
  }
  return Response.json({ ok: true, saved: n });
}
