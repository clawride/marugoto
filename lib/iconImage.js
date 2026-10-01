// Biểu tượng của trang (la bàn + ngôi sao bốn cánh, giống logo trên thanh đầu trang) dạng PNG — dùng cho app/icon1.js và app/apple-icon.js
import { ImageResponse } from "next/og";

export function iconPng(px, radius) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#26357a,#0b0f22)", borderRadius: radius }}>
        <svg width={px * 0.92} height={px * 0.92} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="25" fill="none" stroke="#d3bc8e" strokeWidth="2" />
          <circle cx="32" cy="32" r="20" fill="none" stroke="#d3bc8e" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M32 7 36.5 27.5 57 32 36.5 36.5 32 57 27.5 36.5 7 32 27.5 27.5Z" fill="#f3d38a" />
          <circle cx="32" cy="32" r="5" fill="#131a36" stroke="#f3d38a" strokeWidth="1.6" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
