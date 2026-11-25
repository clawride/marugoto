// Cấu hình trang công khai (banner, bảo trì, hệ số thưởng, đề ẩn, công tắc chat/đăng ký/gadget, mục ủng hộ) — do trang quản trị điều chỉnh
// Ảnh QR ủng hộ không gửi ở đây (cho nhẹ) — chỉ gửi donate.qrv; ảnh lấy ở /api/site/qr?v=<qrv>
import { getSite } from "@/lib/admin";
import { publicSite } from "@/lib/siteCfg";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSite();
  return Response.json(publicSite(s), { headers: { "Cache-Control": "public, max-age=0, s-maxage=20, stale-while-revalidate=60" } });
}
