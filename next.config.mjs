/** @type {import('next').NextConfig} */
const OFFLINE = process.env.OFFLINE_BUILD === "1";
const nextConfig = {
  reactStrictMode: true,
  // Header bảo mật cơ bản (không đặt CSP vì trang nạp ảnh/phông từ nhiều nguồn ngoài)
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    ] }, {
      source: "/shiki-duel/thumb-v1/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }, {
      // web app TiengNhat Gadget (public/gadget, tạo bởi tiengnhat-gadget/tools/build-web.mjs): service worker phủ cả /gadget
      source: "/gadget/sw.js",
      headers: [{ key: "Service-Worker-Allowed", value: "/gadget" }, { key: "Cache-Control", value: "no-cache" }],
    }];
  },
  // /gadget → trang tĩnh public/gadget/index.html; bản offline: /vvapi → VOICEVOX Engine trên máy
  async rewrites() {
    return [
      { source: "/gadget", destination: "/gadget/index.html" },
      ...(OFFLINE ? [{ source: "/vvapi/:path*", destination: "http://127.0.0.1:50021/:path*" }] : []),
    ];
  },
  // Máy ít RAM: đặt LOW_MEM=1 khi build để chỉ dùng 1 worker
  ...(process.env.LOW_MEM ? { experimental: { cpus: 1 } } : {}),
  // Bản offline (scripts/build-offline.mjs): gói gọn thành thư mục chạy độc lập, build riêng để không đụng .next của bản thường,
  // và chuyển tiếp /vvapi → VOICEVOX Engine trên máy (cùng địa chỉ với trang nên không vướng CORS)
  ...(OFFLINE ? {
    output: "standalone",
    distDir: ".next-offline",
  } : {}),
};

export default nextConfig;
