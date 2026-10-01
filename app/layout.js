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
import "./vn.css";
import "./book.css";
import "./plain.auto.css";
import "./plain.css";
import "./motion.css";
import "./rank-fun.css";
import { GameProvider } from "@/components/Game";
import Header from "@/components/Header";
import Sky from "@/components/Sky";
import { SvgDefs } from "@/components/Icons";
import { ProfileGate } from "@/components/Profile";
import PlainGate from "@/components/PlainGate";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Sổ Tay Từ Vựng Teyvat · Marugoto A1–B1", template: "%s · Sổ Tay Teyvat" },
  openGraph: { title: "Sổ Tay Từ Vựng Teyvat · Marugoto A1–B1", description: "Học tiếng Nhật Marugoto A1 → B1: từ vựng, nghe, kanji, ngữ pháp, thi chứng chỉ", url: SITE_URL, siteName: "Sổ Tay Từ Vựng Teyvat", locale: "vi_VN", type: "website" },
  description: "Học tiếng Nhật Marugoto A1 → B1-1: bảng chữ cái, từ vựng, nghe, kanji, ngữ pháp, thi chứng chỉ — phong cách Genshin Impact",
};

const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";

export const viewport ={ themeColor: "#0b0f22", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* giao diện mặc định = cơ bản; ai đã chọn giao diện game (lưu ở lib/uiTheme.js) thì giữ game. Đặt trước khi vẽ trang để không nháy */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("ui_theme")!=="game")document.documentElement.dataset.ui="plain"}catch(e){document.documentElement.dataset.ui="plain"}` }} />
        {OFFLINE ? (
          // Bản offline: phông chữ đã tải sẵn trong public/fonts (scripts/build-offline.mjs)
          // eslint-disable-next-line @next/next/no-css-tags
          <link href="/fonts/fonts.css" rel="stylesheet" />
        ) : (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif:wght@400;600;700&family=Noto+Serif+JP:wght@400;600;700&family=Noto+Color+Emoji&display=swap" rel="stylesheet" />
            <link rel="preconnect" href="https://gi.yatta.moe" />
          </>
        )}
      </head>
      <body>
        <SvgDefs />
        <Sky />
        <GameProvider>
          <Header />
          <main className="wrap"><PlainGate>{children}</PlainGate></main>
          <ProfileGate />
        </GameProvider>
      </body>
    </html>
  );
}
