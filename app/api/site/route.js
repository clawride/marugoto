// Cấu hình trang công khai (banner, bảo trì, hệ số thưởng, đề ẩn, công tắc chat/đăng ký) — do trang quản trị điều chỉnh
import { getSite } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSite();
  return Response.json(s, { headers: { "Cache-Control": "public, max-age=0, s-maxage=20, stale-while-revalidate=60" } });
}
