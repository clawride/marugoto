import "./globals.css";
import "./boss.css";
import "./listen.css";
import "./rank.css";
import "./gamble.css";
import "./characters.css";
import "./wishfx.css";
import "./b1.css";
import "./a22.css";
import "./kana.css";
import "./kanji.css";
import { GameProvider } from "@/components/Game";
import Header from "@/components/Header";
import Sky from "@/components/Sky";
import { SvgDefs } from "@/components/Icons";
import { ProfileGate } from "@/components/Profile";

export const metadata = {
  title: "Sổ Tay Từ Vựng Teyvat · Marugoto A1–B1",
  description: "Học tiếng Nhật Marugoto A1 → B1-1: bảng chữ cái, từ vựng, nghe, kanji, ngữ pháp, thi chứng chỉ — phong cách Genshin Impact",
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
