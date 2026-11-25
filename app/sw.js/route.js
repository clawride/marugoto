// Service worker của toàn trang (/sw.js, phạm vi "/") — sinh lúc build, mang mã phiên bản của bản build
// → mỗi lần deploy, nội dung tệp đổi → trình duyệt phát hiện bản mới, tự cài, kích hoạt ngay (skipWaiting + clients.claim)
//   và xóa bộ nhớ đệm cũ; trang (components/PwaRegister.js) báo "đã có phiên bản mới" / tự tải lại khi tab đang ẩn.
// Chiến lược: trang HTML → mạng trước, mất mạng thì bản đã lưu hoặc /offline.html · /_next/static (tên có mã băm) → bộ nhớ đệm trước
//             dữ liệu tĩnh (/book, /kanji, /vn, ảnh…) → trả bản đã lưu ngay rồi cập nhật ngầm · /api và /gadget (có SW riêng) → bỏ qua
export const dynamic = "force-static";

const VERSION = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now());

const SW = `const V = ${JSON.stringify(String(VERSION).slice(0, 40))};
const PAGES = "tn-pages-" + V, STATIC = "tn-static-" + V, DATA = "tn-data-" + V;
const PRECACHE = ["/offline.html", "/manifest.webmanifest", "/pwa/icon-192", "/pwa/icon-512"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(PRECACHE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("tn-") && !k.endsWith(V)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });

const put = (name, req, res) => { if (res && res.ok && res.type === "basic") { const c = res.clone(); caches.open(name).then((x) => x.put(req, c)); } return res; };

self.addEventListener("fetch", (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.startsWith("/api/") || u.pathname === "/sw.js" || u.pathname === "/gadget" || u.pathname.startsWith("/gadget/")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => put(PAGES, req, r)).catch(() => caches.match(req).then((r) => r || caches.match("/offline.html"))));
    return;
  }
  if (u.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((x) => put(STATIC, req, x))));
    return;
  }
  if (/^\\/(book|kanji|vn|romaji|library|listen|exams|pwa|donate)\\//.test(u.pathname) || /\\.(png|jpe?g|webp|svg|mp3|json)$/.test(u.pathname)) {
    e.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req).then((x) => put(DATA, req, x)).catch(() => hit);
      return hit || net;
    }));
  }
});
`;

export function GET() {
  return new Response(SW, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate", "Service-Worker-Allowed": "/" } });
}
