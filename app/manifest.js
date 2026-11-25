// PWA: tiengnhat.online cài được như ứng dụng trên điện thoại và máy tính (Next tự gắn <link rel="manifest"> vào mọi trang)
// /gadget có manifest + service worker riêng (public/gadget) nên được cài thành ứng dụng thứ hai.
export default function manifest() {
  return {
    id: "/",
    name: "Sổ Tay Từ Vựng Teyvat · tiengnhat.online",
    short_name: "Tiếng Nhật",
    description: "Học tiếng Nhật Marugoto A1 → B1-2, Minna: từ vựng, nghe, kanji, ngữ pháp, thi chứng chỉ",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    background_color: "#0b0f22",
    theme_color: "#0b0f22",
    lang: "vi",
    categories: ["education"],
    icons: [
      { src: "/pwa/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Sổ Tay Từ Vựng", short_name: "Sổ Tay", url: "/#sotay", icons: [{ src: "/pwa/icon-192", sizes: "192x192", type: "image/png" }] },
      { name: "TiengNhat Gadget", short_name: "Gadget", url: "/gadget", icons: [{ src: "/gadget/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Bảng xếp hạng", short_name: "Xếp hạng", url: "/rank", icons: [{ src: "/pwa/icon-192", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
