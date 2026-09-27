"use client";
// Giao diện cơ bản: các mục game (Cầu Nguyện, Nhân Vật & truyện nhân vật, Túi Đồ) bị ẩn —
// mở thẳng đường dẫn thì hiện thông báo kèm nút chuyển sang giao diện game.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUITheme, setUITheme } from "@/lib/uiTheme";
import { isGamePath } from "@/lib/programs";

export default function PlainGate({ children }) {
  const path = usePathname();
  const ui = useUITheme();
  if (ui !== "plain" || !isGamePath(path)) return children;
  return (
    <div className="panel plaingate">
      <h2>🎮 Mục này chỉ có ở giao diện game</h2>
      <p>Giao diện học tập cơ bản ẩn các phần trò chơi (Cầu Nguyện, Nhân Vật và truyện nhân vật, Túi Đồ). Tiến độ học của bạn vẫn được giữ nguyên.</p>
      <div className="btnrow">
        <button className="gbtn" onClick={() => setUITheme("game")}><span className="c" />Chuyển sang giao diện game</button>
        <Link href="/" className="chip dk">‹ Về trang chủ</Link>
      </div>
    </div>
  );
}
