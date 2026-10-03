"use client";
// Thông báo toàn trang + màn hình bảo trì (do trang quản trị bật). Quản trị viên và trang /quan-tri không bị chặn bởi bảo trì.
import { usePathname } from "next/navigation";
import { useGame } from "@/components/Game";
import { useSite, useAdmin } from "@/lib/useSite";

export default function SiteGate() {
  const site = useSite();
  const { S } = useGame();
  const path = usePathname() || "";
  const admin = useAdmin(S);
  const onAdmin = path.startsWith("/quan-tri");
  const down = site.maintenance.on && !onAdmin && admin !== true;
  return (
    <>
      {site.banner.text && !onAdmin && <div className={`sitebanner ${site.banner.level}`} role="status">{site.banner.text}</div>}
      {site.maintenance.on && admin === true && !onAdmin && <div className="sitebanner warn" role="status">🛠 Đang BẢO TRÌ — chỉ quản trị viên thấy trang này. Người khác thấy màn hình bảo trì.</div>}
      {down && (
        <div className="sitedown" role="alert">
          <div>
            <div className="sdico">🛠</div>
            <h1>Trang đang bảo trì</h1>
            <p>{site.maintenance.message || "Sổ Tay Teyvat đang được cập nhật. Bạn quay lại sau ít phút nhé!"}</p>
          </div>
        </div>
      )}
    </>
  );
}
