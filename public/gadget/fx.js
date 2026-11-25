// Hệ hạt cho gadget: tia sáng (sao 4 cánh, cộng sáng), cánh hoa anh đào, sóng xung kích, vệt sáng, pháo giấy
// FX.level: "max" | "low" | "off"
(function () {
  const cv = document.getElementById("fx");
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, ps = [], raf = 0, hue = 330, ambient = 0, lastT = 0;
  const FX = { level: "max" };
  window.FX = FX;

  function size() {
    dpr = window.devicePixelRatio || 1; W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", size); size();

  const rnd = (a, b) => a + Math.random() * (b - a);
  const mult = () => (FX.level === "max" ? 1 : FX.level === "low" ? 0.35 : 0);
  const col = (h, l = 70, a = 1) => `hsla(${h},100%,${l}%,${a})`;

  function add(p) { ps.push(p); if (ps.length > 900) ps.splice(0, ps.length - 900); if (!raf) raf = requestAnimationFrame(loop); }

  // ——— phát hạt ———
  FX.setHue = (h) => { hue = +h || 0; };
  FX.burst = (x, y, n = 40, o = {}) => {
    n = Math.round(n * mult()); const sp = o.speed || 5;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(0.3, 1) * sp;
      add({ t: Math.random() < 0.25 ? "petal" : "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), life: 0, max: rnd(40, 80), s: rnd(2, o.big ? 6 : 4.5), h: hue + rnd(-40, 140), rot: rnd(0, 6.28), vr: rnd(-0.2, 0.2), g: o.g ?? 0.06 });
    }
  };
  FX.ring = (x, y, o = {}) => {
    if (!mult()) return;
    add({ t: "ring", x, y, r: o.r0 || 6, vr: o.vr || 7, life: 0, max: o.max || 42, h: o.h ?? hue, w: o.w || 4 });
  };
  FX.confetti = (x, y, n = 70) => {
    n = Math.round(n * mult());
    for (let i = 0; i < n; i++) add({ t: "conf", x, y, vx: rnd(-6, 6), vy: rnd(-10, -3), life: 0, max: rnd(70, 120), s: rnd(4, 8), h: rnd(0, 360), rot: rnd(0, 6.28), vr: rnd(-0.3, 0.3), g: 0.22 });
  };
  // vệt sáng khi kéo: hạt sinh ở mép thẻ phía sau hướng di chuyển, bay ngược chiều (cửa sổ chạy theo con trỏ)
  FX.trail = (rect, vx, vy) => {
    const m = mult(); if (!m) return;
    const sp = Math.hypot(vx, vy); if (sp < 0.4) return;
    const n = Math.min(10, 1 + sp * 0.6) * m;
    for (let i = 0; i < n; i++) {
      const nx = -vx / sp, ny = -vy / sp; // phía sau
      const px = rect.left + rect.width / 2 + nx * rect.width * 0.5 + rnd(-1, 1) * rect.width * 0.5 * Math.abs(ny);
      const py = rect.top + rect.height / 2 + ny * rect.height * 0.5 + rnd(-1, 1) * rect.height * 0.5 * Math.abs(nx);
      add({ t: Math.random() < 0.35 ? "petal" : "spark", x: px, y: py, vx: -vx * rnd(0.3, 0.9) + rnd(-1, 1), vy: -vy * rnd(0.3, 0.9) + rnd(-1, 1), life: 0, max: rnd(25, 55), s: rnd(2, 5), h: hue + rnd(-30, 160), rot: rnd(0, 6.28), vr: rnd(-0.3, 0.3), g: 0.02 });
    }
    if (Math.random() < 0.25 * m) add({ t: "streak", x: rect.left + rnd(0, rect.width), y: rect.top + rnd(0, rect.height), vx: -vx * 1.4, vy: -vy * 1.4, life: 0, max: 22, h: hue + rnd(0, 120) });
  };
  // vỡ chữ: hạt sinh trong vùng chữ cũ
  FX.shatter = (rect, n = 60) => {
    n = Math.round(n * mult());
    for (let i = 0; i < n; i++) add({ t: "spark", x: rnd(rect.left, rect.right), y: rnd(rect.top, rect.bottom), vx: rnd(-4, 4), vy: rnd(-5, 1), life: 0, max: rnd(30, 60), s: rnd(1.5, 4), h: hue + rnd(-20, 120), rot: 0, vr: 0, g: 0.12 });
  };
  // cánh hoa trôi nhẹ quanh thẻ khi rảnh
  FX.ambient = (on) => { ambient = on ? 1 : 0; if (on && !raf) raf = requestAnimationFrame(loop); };

  // ——— vẽ ———
  function star(x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.28 : r; const a = (i / 8) * Math.PI * 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function petal(x, y, s, rot, h, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, -s * 1.6, 0, s * 1.6); g.addColorStop(0, `hsla(${h % 360},100%,92%,1)`); g.addColorStop(1, `hsla(${(h + 20) % 360},90%,72%,1)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -s * 1.6);
    ctx.bezierCurveTo(s * 1.3, -s * 0.9, s * 1.1, s * 1.1, 0, s * 1.6); ctx.bezierCurveTo(-s * 1.1, s * 1.1, -s * 1.3, -s * 0.9, 0, -s * 1.6);
    ctx.fill(); ctx.restore();
  }

  function loop(t) {
    const dt = Math.min(3, lastT ? (t - lastT) / 16.7 : 1); lastT = t;
    ctx.clearRect(0, 0, W, H);
    if (ambient && mult() && Math.random() < 0.05 * mult() * dt) {
      add({ t: "petal", x: rnd(0, W), y: -10, vx: rnd(-0.4, 0.6), vy: rnd(0.4, 1.1), life: 0, max: rnd(220, 380), s: rnd(2.5, 4.5), h: 330 + rnd(-15, 20), rot: rnd(0, 6.28), vr: rnd(-0.04, 0.04), g: 0, sway: rnd(0.6, 1.6) });
    }
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.life += dt;
      if (p.life >= p.max) { ps.splice(i, 1); continue; }
      const k = 1 - p.life / p.max;
      if (p.t === "ring") {
        p.r += p.vr * dt * (0.4 + k);
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = col(p.h, 72, k * 0.9); ctx.lineWidth = p.w * k + 0.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = col(p.h + 60, 85, k * 0.5); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2); ctx.stroke();
        continue;
      }
      p.vx *= 0.985; p.vy = p.vy * 0.985 + (p.g || 0) * dt;
      if (p.sway) p.vx += Math.sin((t / 600) + p.max) * 0.01 * p.sway;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt;
      if (p.t === "spark") {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = col(p.h, 70, k); star(p.x, p.y, p.s * (0.6 + k), p.rot);
        ctx.fillStyle = col(p.h, 95, k * 0.9); ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.35 * k + 0.4, 0, Math.PI * 2); ctx.fill();
      } else if (p.t === "petal") {
        ctx.globalCompositeOperation = "source-over";
        petal(p.x, p.y, p.s, p.rot, p.h, Math.min(1, k * 1.6));
      } else if (p.t === "streak") {
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * 4, p.y - p.vy * 4); g.addColorStop(0, col(p.h, 85, k)); g.addColorStop(1, col(p.h, 60, 0));
        ctx.strokeStyle = g; ctx.lineWidth = 2.2 * k; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4); ctx.stroke();
      } else if (p.t === "conf") {
        ctx.globalCompositeOperation = "source-over";
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.life * 0.25));
        ctx.fillStyle = col(p.h, 62, Math.min(1, k * 2)); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      }
    }
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    raf = ps.length || (ambient && mult()) ? requestAnimationFrame(loop) : 0;
    if (!raf) { lastT = 0; ctx.clearRect(0, 0, W, H); }
  }
})();
