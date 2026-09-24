import { redis, topOf } from "@/lib/store";
import { ALL_BOARDS } from "@/lib/boards";

// GET /api/rank?board=overall&me=<id> → top 50 + hạng của mình
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const board = searchParams.get("board") || "overall";
  const me = searchParams.get("me");
  if (!redis) return Response.json({ configured: false, rows: [] });
  if (!ALL_BOARDS.has(board)) return Response.json({ error: "Bảng không tồn tại" }, { status: 400 });
  const top = await topOf(board, 50);
  const ids = top.map(([id]) => id);
  if (me && !ids.includes(me)) ids.push(me);
  const users = await Promise.all(ids.map((id) => redis.hgetall(`u:${id}`)));
  const info = Object.fromEntries(ids.map((id, i) => [id, users[i]]));
  const rows = top.map(([id, score], i) => ({ rank: i + 1, id, score, name: info[id]?.name || "???", avatar: info[id]?.avatar || "Qin", certs: String(info[id]?.certs || "") }));
  let mine = null;
  if (me) {
    const r = await redis.zrevrank(`lb:${board}`, me);
    if (r !== null && r !== undefined) mine = { rank: r + 1, id: me, score: Number(await redis.zscore(`lb:${board}`, me)), name: info[me]?.name, avatar: info[me]?.avatar, certs: String(info[me]?.certs || "") };
  }
  const count = await redis.zcard(`lb:${board}`);
  return Response.json({ configured: true, board, rows, me: mine, count }, { headers: { "Cache-Control": "no-store" } });
}
