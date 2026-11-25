// Ảnh mã QR ủng hộ duy trì tên miền (quản trị đặt ở trang quản trị). Đường dẫn kèm ?v=<qrv> nên được phép nhớ lâu.
import { getSite } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const qr = (await getSite())?.donate?.qr || "";
  if (!qr) return new Response("Chưa có mã QR", { status: 404 });
  if (qr.startsWith("https://")) return Response.redirect(qr, 302);
  const m = qr.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/);
  if (!m) return new Response("Ảnh không hợp lệ", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800", "X-Content-Type-Options": "nosniff" },
  });
}
