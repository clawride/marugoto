/** @type {import('next').NextConfig} */
const OFFLINE = process.env.OFFLINE_BUILD === "1";
const nextConfig = {
  reactStrictMode: true,
  // Máy ít RAM: đặt LOW_MEM=1 khi build để chỉ dùng 1 worker
  ...(process.env.LOW_MEM ? { experimental: { cpus: 1 } } : {}),
  // Bản offline (scripts/build-offline.mjs): gói gọn thành thư mục chạy độc lập, build riêng để không đụng .next của bản thường,
  // và chuyển tiếp /vvapi → VOICEVOX Engine trên máy (cùng địa chỉ với trang nên không vướng CORS)
  ...(OFFLINE ? {
    output: "standalone",
    distDir: ".next-offline",
    async rewrites() { return [{ source: "/vvapi/:path*", destination: "http://127.0.0.1:50021/:path*" }]; },
  } : {}),
};

export default nextConfig;
