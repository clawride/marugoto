import "./globals.css";
import "./boss.css";
import "./listen.css";
import "./rank.css";
import "./gamble.css";
import "./characters.css";
import { GameProvider } from "@/components/Game";
import Header from "@/components/Header";
import Sky from "@/components/Sky";
import { SvgDefs } from "@/components/Icons";
import { ProfileGate } from "@/components/Profile";

export const metadata = {
  title: "Sổ Tay Từ Vựng Teyvat · Marugoto B1-1",
  description: "Kiểm tra từ vựng tiếng Nhật Marugoto 中級1 (B1-1) theo từng Topic/Part — phong cách Genshin Impact",
};

export const viewport = { themeColor: "#0b0f22", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Noto+Serif+JP:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://gi.yatta.moe" />
      </head>
      <body>
        <SvgDefs />
        <Sky />
        <GameProvider>
          <Header />
          <main className="wrap">{children}</main>
          <ProfileGate />
        </GameProvider>
      </body>
    </html>
  );
}
