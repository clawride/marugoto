// Khu thử nghiệm: chỉ số thẻ Shikihime / vũ khí do quản trị thiết lập (công khai, chỉ đọc)
import { store } from "@/lib/store";
import { normalizeShiki } from "@/lib/shikihime";

export const dynamic = "force-dynamic";

export async function GET() {
  let v = { cards: {}, weapons: {} };
  try { if (store) v = normalizeShiki((await store.getSettings()).shiki); } catch {}
  return Response.json(v, { headers: { "Cache-Control": "public, max-age=0, s-maxage=20, stale-while-revalidate=60" } });
}
