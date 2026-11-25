// Service worker của web app /gadget: lưu sẵn giao diện + bộ từ vựng để mở nhanh và xem từ khi mất mạng.
// API (/api/*) và ảnh ngoài luôn lấy từ mạng.
const CACHE = "tng-gadget-289f9552d8";
const SHELL = ["/gadget", "/gadget/style.css", "/gadget/fx.js", "/gadget/stroke.js", "/gadget/renderer.js", "/gadget/web.js", "/gadget/words.json", "/gadget/kanji.json", "/gadget/icon-192.png", "/gadget/icon-180.png", "/gadget/icon-512.png", "/gadget/manifest.webmanifest"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("tng-gadget-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || !(u.pathname === "/gadget" || u.pathname.startsWith("/gadget/"))) return;
  // mạng trước (luôn bản mới), mất mạng thì dùng bản đã lưu
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match("/gadget"))));
});
