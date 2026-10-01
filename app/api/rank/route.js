import { store } from "@/lib/store";
import { ALL_BOARDS } from "@/lib/boards";

// GET /api/rank?board=overall&me=<id> → top 50 + hạng của mình
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const board = searchParams.get("board") || "overall";
  const me = searchParams.get("me");
  if (!store) return Response.json({ configured: false, rows: [] });
  if (!ALL_BOARDS.has(board)) return Response.json({ error: "Bảng không tồn tại" }, { status: 400 });
  const lb = await store.leaderboard(board, me, 50);
  const fix = (r) => r && { ...r, score: Number(r.score), name: r.name || "???", avatar: r.avatar || "Qin", certs: String(r.certs || "") };
  return Response.json(
    { configured: true, board, rows: lb.rows.map(fix), me: fix(lb.me), count: Number(lb.count) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
