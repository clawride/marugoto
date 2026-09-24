/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Máy ít RAM: đặt LOW_MEM=1 khi build để chỉ dùng 1 worker
  ...(process.env.LOW_MEM ? { experimental: { cpus: 1 } } : {}),
};

export default nextConfig;
