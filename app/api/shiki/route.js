// Khu thử nghiệm: ải đấu thẻ và vũ khí do quản trị thiết lập (công khai, chỉ đọc)
import { getShikiConfig } from "@/lib/shikiConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  let v = { cards: {}, weapons: {} };
  try { v = (await getShikiConfig()).cfg; } catch {}
  return Response.json(v, { headers: { "Cache-Control": "public, max-age=0, s-maxage=20, stale-while-revalidate=60" } });
}
