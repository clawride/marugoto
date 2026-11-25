// TiengNhat Gadget — bản web app (tiengnhat.online/gadget): thay cho preload/Electron.
// · cài đặt lưu trong trình duyệt (localStorage), ảnh nền trong IndexedDB
// · tài khoản: tự nhận người đang đăng nhập trên tiengnhat.online (cùng trang) hoặc đăng nhập trong gadget
// · kéo thả thẻ trong trang (vẫn có hiệu ứng như bản máy tính)
// · thông số máy: lấy từ TiengNhat Gadget bản máy tính nếu đang chạy (http://127.0.0.1:47219), không thì đo những gì trình duyệt cho phép
(function () {
  const KEY = "tng_gadget_cfg";
  const DEF = {
    bg: "", bgAlpha: 0.72, imgAlpha: 0.55, blur: 10, hue: 330, fx: null, wordEvery: 15, level: "all", lesson: "all",
    show: { rank: true, word: true, cpu: true, gpu: true, vram: true, ram: true, disk: true, net: true, topCpu: true, topGpu: true, topNet: true },
    user: null, noSite: false, pos: null, margin: 0, version: "web",
  };
  const load = () => { try { const c = JSON.parse(localStorage.getItem(KEY)) || {}; return { ...DEF, ...c, show: { ...DEF.show, ...(c.show || {}) } }; } catch { return { ...DEF }; } };
  let cfg = load();
  const save = () => { try { const { bg, ...rest } = cfg; localStorage.setItem(KEY, JSON.stringify({ ...rest, bg: bg && bg.startsWith("blob:") ? "idb" : bg })); } catch {} };
  const hs = {};
  const emit = (ch, d) => hs[ch]?.(d);

  // người đang đăng nhập trên trang (components/Game.js lưu ở localStorage "teyvat_b11_v2".profile)
  function siteUser() {
    try { const p = JSON.parse(localStorage.getItem("teyvat_b11_v2"))?.profile; return p?.id ? { id: p.id, name: p.name, avatar: p.avatar, username: p.username } : null; } catch { return null; }
  }
  const user = () => cfg.user || (cfg.noSite ? null : siteUser());

  // ——— ảnh nền: IndexedDB ———
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open("tng_gadget", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  async function idbSet(k, v) { const db = await idb(); return new Promise((res) => { const t = db.transaction("kv", "readwrite"); v == null ? t.objectStore("kv").delete(k) : t.objectStore("kv").put(v, k); t.oncomplete = () => res(); t.onerror = () => res(); }); }
  async function idbGet(k) { const db = await idb(); return new Promise((res) => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); }
  let bgUrl = "";
  async function loadBg() {
    if (cfg.bg !== "idb") return;
    try { const b = await idbGet("bg"); if (b) { bgUrl = URL.createObjectURL(b); cfg.bg = bgUrl; } else cfg.bg = ""; } catch { cfg.bg = ""; }
  }

  // ——— kéo thả trong trang ———
  const card = () => document.getElementById("card");
  let mouse = { x: 0, y: 0 }, drag = null;
  document.addEventListener("pointermove", (e) => {
    mouse = { x: e.clientX, y: e.clientY };
    if (!drag) return;
    const c = card(), W = vw(), H = innerHeight, r = c.getBoundingClientRect();
    const nx = phone() ? Math.min(Math.max(4, e.clientX - drag.ox), Math.max(4, W - r.width - 4)) : Math.min(Math.max(-r.width + 80, e.clientX - drag.ox), W - 80), ny = Math.min(Math.max(0, e.clientY - drag.oy), Math.max(0, document.documentElement.scrollHeight - 60));
    const now = performance.now(), dt = Math.max(1, now - drag.t);
    emit("drag:vel", { vx: (nx - drag.lx) / dt * 16, vy: (ny - drag.ly) / dt * 16 });
    drag.lx = nx; drag.ly = ny; drag.t = now;
    c.style.left = nx + "px"; c.style.top = ny + "px";
  }, true);
  // điện thoại / màn hẹp: thẻ rộng theo màn hình, nằm giữa
  const vw = () => document.documentElement.clientWidth || innerWidth; // chiều rộng hiển thị thật (innerWidth có thể lớn hơn trên điện thoại)
  const phone = () => vw() < 560 || matchMedia("(pointer: coarse) and (hover: none)").matches;
  const pointerDown = (e) => { mouse = { x: e.clientX, y: e.clientY }; };
  document.addEventListener("pointerdown", pointerDown, true);
  function place() {
    const c = card(); if (!c) return;
    document.body.classList.toggle("phone", phone());
    const w = c.offsetWidth, h = c.offsetHeight;
    let x = cfg.pos?.x, y = cfg.pos?.y;
    if (phone()) { x = Math.max(4, (vw() - w) / 2); y = y == null ? 10 : y; }
    if (x == null) { x = (vw() - w) / 2; y = Math.max(16, (innerHeight - h) / 2); }
    if (!phone()) { x = Math.min(Math.max(-w + 80, x), vw() - 80); y = Math.min(Math.max(0, y), innerHeight - 60); } else y = Math.max(0, Math.min(y, innerHeight - 80));
    c.style.left = x + "px"; c.style.top = y + "px";
  }
  addEventListener("resize", place);

  // ——— thông số máy ———
  const BRIDGE = "http://127.0.0.1:47219/sys";
  let bridgeOk = false, bridgeFails = 0, fps = 60;
  // đo FPS: chạy 1 giây mỗi 10 giây (vòng requestAnimationFrame liên tục làm điện thoại nóng, giật)
  function measureFps() { let n = 0; const t0 = performance.now(); const f = () => { n++; const dt = performance.now() - t0; if (dt < 1000 && n < 90) requestAnimationFrame(f); else fps = n * 1000 / Math.max(1, dt); }; requestAnimationFrame(f); } // tối đa 1 giây / 90 khung
  measureFps(); setInterval(() => { if (!document.hidden) measureFps(); }, 10000);
  let gpuName = "";
  try { const gl = document.createElement("canvas").getContext("webgl"); const ext = gl && gl.getExtension("WEBGL_debug_renderer_info"); gpuName = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ""; gpuName = gpuName.replace(/^ANGLE \((.*)\)$/, "$1").replace(/,\s*(Direct3D|D3D).*$/i, "").replace(/^[^,]+,\s*/, ""); } catch {}
  let battery = null; navigator.getBattery?.().then((b) => (battery = b)).catch(() => {});
  async function browserSys() {
    const rows = [];
    const fmtB = (b) => { const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0; while (b >= 1024 && i < 4) { b /= 1024; i++; } return b.toFixed(i >= 3 ? 1 : 0) + " " + u[i]; };
    rows.push({ k: "CPU", show: "cpu", val: `${navigator.hardwareConcurrency || "?"} luồng`, p: 0, sub: phone() ? "Số nhân xử lý của máy" : "Trình duyệt không cho đọc % CPU" });
    if (gpuName) rows.push({ k: "GPU", show: "gpu", val: `${Math.round(fps)} FPS`, p: Math.min(100, fps / 60 * 100), sub: gpuName, warn: 101 });
    const pm = performance.memory;
    if (pm) rows.push({ k: "RAM tab", show: "ram", val: `${fmtB(pm.usedJSHeapSize)} / ${fmtB(pm.jsHeapSizeLimit)}`, p: pm.usedJSHeapSize / pm.jsHeapSizeLimit * 100, sub: navigator.deviceMemory ? `Máy có khoảng ${navigator.deviceMemory}+ GB RAM` : "" });
    try { const e = await navigator.storage.estimate(); rows.push({ k: "Lưu trữ", show: "disk", val: `${fmtB(e.usage || 0)} / ${fmtB(e.quota || 0)}`, p: (e.usage || 0) / (e.quota || 1) * 100, sub: "Dung lượng trình duyệt dành cho trang" }); } catch {}
    const cn = navigator.connection;
    rows.push({ k: navigator.onLine ? "Mạng" : "Mất mạng", show: "net", val: cn?.downlink ? `${cn.downlink} Mbps` : navigator.onLine ? "Online" : "Offline", p: cn?.downlink ? Math.min(100, cn.downlink) : navigator.onLine ? 100 : 0, sub: cn ? `${(cn.effectiveType || "").toUpperCase()}${cn.rtt ? ` · ping ~${cn.rtt} ms` : ""}` : "", warn: 101 });
    if (battery) rows.push({ k: "Pin", show: "cpu", val: `${Math.round(battery.level * 100)}%${battery.charging ? " ⚡" : ""}`, p: battery.level * 100, sub: battery.charging ? "Đang sạc" : "Đang dùng pin", warn: 101 });
    // trình duyệt chặn trang gọi vào máy (quyền "Truy cập mạng cục bộ") → chỉ cách mở
    let perm = "";
    try { perm = (await navigator.permissions.query({ name: "local-network-access" })).state; } catch {}
    const note = phone() ? "" : perm === "denied"
      ? `Trình duyệt đang <b>chặn quyền truy cập mạng cục bộ</b> nên chưa đọc được TiengNhat Gadget trên máy. Bấm biểu tượng ⓘ/ổ khóa cạnh địa chỉ trang → <b>Truy cập mạng cục bộ: Cho phép</b> → tải lại trang.`
      : `Muốn xem CPU, GPU, VRAM, ổ HDD/SSD, Wi-Fi: chạy <b>TiengNhat Gadget</b> bản máy tính rồi để trang này mở (trình duyệt sẽ hỏi quyền truy cập mạng cục bộ → chọn Cho phép).`;
    return { rows, note, topNote: "Top 5 phần mềm ngốn CPU / GPU / mạng chỉ có khi TiengNhat Gadget bản máy tính đang chạy." };
  }
  async function poll() {
    let d = null;
    if (!phone() && (bridgeFails < 3 || Date.now() % 15 < 2)) { // không có gadget máy tính → thử lại thưa hơn
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 900);
        const r = await fetch(BRIDGE, { signal: ctl.signal, cache: "no-store", targetAddressSpace: "local" });
        clearTimeout(t);
        if (r.ok) { const j = await r.json(); if (j && j.cpu) d = j; }
      } catch {}
    }
    if (d) { if (!bridgeOk) emit("toast", "🖥 Đã kết nối TiengNhat Gadget trên máy"); bridgeOk = true; bridgeFails = 0; emit("sys", d); }
    else { bridgeOk = false; bridgeFails++; emit("sys", await browserSys()); }
  }

  // ——— cài làm ứng dụng (PWA) ———
  let installEvt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; emit("cfg", {}); });
  addEventListener("appinstalled", () => { installEvt = null; emit("cfg", {}); });
  // service worker: tự cập nhật khi có bản mới (sw.js mang mã băm nội dung → đổi theo mỗi lần build web app)
  // kiểm tra khi mở, khi quay lại tab, mỗi 30 phút; SW mới tự kích hoạt → tab đang ẩn thì tải lại, đang xem thì báo
  if ("serviceWorker" in navigator) {
    let reg = null, had = !!navigator.serviceWorker.controller, fresh = false;
    navigator.serviceWorker.register("/gadget/sw.js", { scope: "/gadget", updateViaCache: "none" }).then((r) => { reg = r; r.update().catch(() => {}); }).catch(() => {});
    const check = () => reg?.update().catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!had) { had = true; return; }
      if (document.hidden) location.reload();
      else { fresh = true; emit("toast", "✨ Đã có phiên bản mới — đang tải lại…"); setTimeout(() => location.reload(), 1800); }
    });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); else if (fresh) location.reload(); });
    setInterval(check, 30 * 60 * 1000);
  }

  let kanjiP = null, siteP = null; const strokeP = {};
  window.gadget = {
    platform: "web",
    getCfg: async () => { await loadBg(); setTimeout(place, 0); setTimeout(place, 600); return { ...cfg, user: user() }; },
    setCfg: async (p) => { cfg = { ...cfg, ...p, show: { ...cfg.show, ...(p.show || {}) } }; save(); return { ...cfg, user: user() }; },
    pickBg: () => new Promise((res) => {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      inp.onchange = async () => {
        const f = inp.files?.[0]; if (!f) return res(cfg.bg);
        await idbSet("bg", f); if (bgUrl) URL.revokeObjectURL(bgUrl); bgUrl = URL.createObjectURL(f);
        cfg.bg = bgUrl; save(); res(bgUrl);
      };
      inp.click();
    }),
    clearBg: async () => { await idbSet("bg", null); if (bgUrl) URL.revokeObjectURL(bgUrl); bgUrl = ""; cfg.bg = ""; save(); return ""; },
    site: () => (siteP ||= fetch("/api/site", { cache: "no-store" }).then((r) => r.json())),
    words: () => fetch("/gadget/words.json").then((r) => r.json()).catch(() => []),
    kanji: () => (kanjiP ||= fetch("/gadget/kanji.json").then((r) => r.json()).catch(() => ({}))),
    strokes: async (k) => { // nét KanjiVG: file theo cấp có sẵn trên trang (/kanji/strokes-a1.json…)
      const K = await window.gadget.kanji(), f = K?.[k]?.f; if (!f) return null;
      strokeP[f] ||= fetch(`/kanji/strokes-${f}.json`).then((r) => r.json()).catch(() => ({}));
      return (await strokeP[f])[k] || null;
    },
    analyze: async (text) => {
      try {
        const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: String(text || "").slice(0, 600) }) });
        const j = await r.json().catch(() => ({}));
        return j.sentences ? { ok: true, sentences: j.sentences } : { ok: false, error: j.error || `Lỗi ${r.status}` };
      } catch { return { ok: false, error: navigator.onLine ? "Không kết nối được trang" : "Đang mất mạng" }; }
    },
    rank: async () => {
      const u = user();
      try {
        const r = await fetch(`/api/rank?board=overall${u?.id ? `&me=${encodeURIComponent(u.id)}` : ""}`, { cache: "no-store" });
        const j = await r.json();
        return { ok: true, configured: j.configured, count: j.count || 0, me: j.me || null, top: (j.rows || []).slice(0, 3), at: Date.now() };
      } catch (e) { return { ok: false, error: navigator.onLine ? "Không kết nối được trang" : "Đang mất mạng" }; }
    },
    login: async (username, password) => {
      try {
        const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
        const j = await r.json();
        if (j.error) return { ok: false, error: j.error };
        cfg.user = { id: j.id, name: j.name, avatar: j.avatar, username: j.username }; cfg.noSite = false; save();
        return { ok: true, user: cfg.user };
      } catch { return { ok: false, error: "Không kết nối được trang" }; }
    },
    logout: async () => { cfg.user = null; cfg.noSite = true; save(); return true; },
    openSite: (p) => { window.open(typeof p === "string" && p.startsWith("/") ? p : "/", "_blank", "noopener"); },
    dragStart: () => { const c = card(), r = c.getBoundingClientRect(); drag = { ox: mouse.x - r.left, oy: mouse.y - r.top, lx: r.left, ly: r.top, t: performance.now() }; },
    dragEnd: () => { if (!drag) return; drag = null; const c = card(); cfg.pos = { x: parseFloat(c.style.left) || 0, y: parseFloat(c.style.top) || 0 }; save(); },
    ignoreMouse() {}, resize() {}, hide() {}, quit: () => { location.href = "/"; },
    canInstall: () => !!installEvt,
    install: async () => { if (!installEvt) return false; installEvt.prompt(); const r = await installEvt.userChoice.catch(() => null); installEvt = null; return r?.outcome === "accepted"; },
    on: (ch, f) => { hs[ch] = f; },
  };
  setTimeout(poll, 300); setInterval(poll, 2000);

  // quản trị tắt Gadget (trang quản trị → gadgetEnabled) → che trang bằng thông báo
  fetch("/api/site", { cache: "no-store" }).then((r) => r.json()).then((s) => {
    if (s?.gadgetEnabled !== false) return;
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;inset:0;z-index:999;display:grid;place-items:center;background:rgba(8,5,20,.92);color:#f6f3ff;font:15px 'Segoe UI',sans-serif;text-align:center;padding:20px";
    d.innerHTML = `<div><div style="font-size:44px">🛠</div><p style="margin:10px 0 16px">TiengNhat Gadget đang tạm tắt.<br>Bạn quay lại sau nhé!</p><a href="/" style="color:#fff;background:linear-gradient(135deg,#ff5f9e,#a259ff);padding:9px 20px;border-radius:99px;text-decoration:none;font-weight:700">Về tiengnhat.online</a></div>`;
    document.body.appendChild(d);
  }).catch(() => {});
})();
