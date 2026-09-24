"use client";
import { useEffect, useRef } from "react";

// Hiệu ứng sao băng ước nguyện — dựng lại bằng canvas (không dùng video gốc của game)
// rank 5: lõi vàng + đuôi hồng trắng · rank 4: lõi tím · rank 3: lõi xanh
const HEAD = {
  5: { core: [255, 214, 110], glow: [255, 170, 60], tail: [255, 190, 225], crystal: true },
  4: { core: [214, 170, 255], glow: [170, 110, 255], tail: [225, 200, 255], crystal: false },
  3: { core: [170, 220, 255], glow: [90, 160, 255], tail: [200, 230, 255], crystal: false },
};

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const ease = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const bez = (p0, p1, p2, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];

export default function MeteorCanvas({ rank = 3, multi = false, duration = 2900 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, g = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, raf;
    const resize = () => { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
    resize();
    addEventListener("resize", resize);
    const R = () => Math.random();
    const head = HEAD[rank] || HEAD[3];

    // Dải sáng: [điểm đầu, điểm uốn, điểm cuối] theo tỉ lệ màn hình; w = độ dày theo H
    const ribbons = [];
    const nCyan = multi ? 6 : 3;
    for (let i = 0; i < nCyan; i++) {
      const y = 0.06 + i * (0.4 / nCyan) + R() * 0.04;
      ribbons.push({
        p: [[-0.35, y + 0.18], [0.2, y - 0.06], [0.52 + R() * 0.16, y + 0.02]],
        w: 0.012 + R() * 0.02, len: 0.55 + R() * 0.2, d: 0.05 + i * 0.07 + R() * 0.1, dur: 1.5 + R() * 0.4,
        col: [150, 225, 255], hot: [235, 250, 255],
      });
    }
    // Dải chính (mang màu độ hiếm)
    ribbons.push({ p: [[-0.4, 0.62], [0.25, 0.5], [0.74, 0.74]], w: 0.07, len: 0.75, d: 0.18, dur: 1.9, col: head.tail, hot: [255, 255, 255], main: true });
    // Dải phụ hồng mảnh bên dưới
    ribbons.push({ p: [[-0.4, 0.8], [0.3, 0.7], [0.98, 0.76]], w: 0.018, len: 0.6, d: 0.3, dur: 1.8, col: [255, 170, 215], hot: [255, 240, 250] });

    const shards = Array.from({ length: 26 }, () => ({ x: R() * 1.1 - 0.1, y: R() * 0.7, l: 0.02 + R() * 0.04, v: 0.08 + R() * 0.18, a: R() * 6.28, d: R() * 1.2 }));
    const sparks = Array.from({ length: 60 }, () => ({ x: R(), y: R() * 0.8, r: 0.6 + R() * 1.6, v: 0.03 + R() * 0.08, d: R() * 1.5 }));
    const puffs = Array.from({ length: 22 }, (_, i) => ({ x: i / 21 + (R() - 0.5) * 0.04, y: 0.9 + R() * 0.06, r: 0.05 + R() * 0.06 }));
    const frags = Array.from({ length: 14 }, () => ({ ang: -0.5 + R() * 1.6, sp: 0.05 + R() * 0.12, s: 0.006 + R() * 0.012, rot: R() * 6.28 }));

    const start = performance.now();
    // Vẽ dải sáng thành khối liền, thuôn về đuôi (không bị lộ chấm tròn)
    const band = (pts, width, colr, a, off = 0) => {
      const N = pts.length - 1, L = [], Rr = [];
      for (let i = 0; i <= N; i++) {
        const p = pts[i], q = pts[Math.min(i + 1, N)], o = pts[Math.max(i - 1, 0)];
        let dx = q[0] - o[0], dy = q[1] - o[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
        const f = i / N, hw = (width * Math.pow(f, 1.25)) / 2;
        const ox = -dy * off, oy = dx * off;
        L.push([p[0] + ox - dy * hw, p[1] + oy + dx * hw]); Rr.push([p[0] + ox + dy * hw, p[1] + oy - dx * hw]);
      }
      const gr = g.createLinearGradient(pts[0][0], pts[0][1], pts[N][0], pts[N][1]);
      gr.addColorStop(0, rgba(colr, 0)); gr.addColorStop(0.55, rgba(colr, a * 0.55)); gr.addColorStop(1, rgba(colr, a));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(L[0][0], L[0][1]);
      for (let i = 1; i <= N; i++) g.lineTo(L[i][0], L[i][1]);
      for (let i = N; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]);
      g.closePath(); g.fill();
    };
    const drawRibbon = (rb, t) => {
      const k = ease((t - rb.d) / rb.dur);
      if (k <= 0) return null;
      const P = rb.p.map(([x, y]) => [x * W, y * H]);
      const tail = Math.max(0, k - rb.len);
      const N = 48, pts = [];
      for (let i = 0; i <= N; i++) {
        const [x, y] = bez(P[0], P[1], P[2], tail + ((k - tail) * i) / N);
        const wob = Math.sin(i * 0.35 + t * 6 + rb.d * 10) * rb.w * H * 0.12 * (1 - i / N);
        pts.push([x, y + wob]);
      }
      const fade = t > 2.35 ? Math.max(0, 1 - (t - 2.35) / 0.5) : 1;
      const w = rb.w * H;
      band(pts, w * 3.2, rb.col, 0.14 * fade);
      band(pts, w * 1.5, rb.col, 0.5 * fade);
      band(pts, w * 0.55, rb.hot, 0.95 * fade);
      // sợi mảnh bay theo (hiệu ứng "lông vũ")
      band(pts, w * 0.25, rb.hot, 0.55 * fade, w * 0.9);
      band(pts, w * 0.2, rb.col, 0.5 * fade, -w * 1.1);
      // đầu dải: quầng sáng tròn
      const [hx, hy] = pts[N], hr = w * 1.9;
      const hg = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
      hg.addColorStop(0, rgba([255, 255, 255], 0.95 * fade)); hg.addColorStop(0.35, rgba(rb.hot, 0.7 * fade)); hg.addColorStop(1, rgba(rb.col, 0));
      g.fillStyle = hg; g.beginPath(); g.arc(hx, hy, hr, 0, 6.28); g.fill();
      return pts[N];
    };

    const frame = (now) => {
      const t = (now - start) / 1000;
      // Bầu trời
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#23265e"); sky.addColorStop(0.45, "#4b4a98"); sky.addColorStop(0.78, "#b98fcc"); sky.addColorStop(0.9, "#f4c6e2"); sky.addColorStop(1, "#fbe3f0");
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = Math.min(1, t / 0.35);
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      // quầng sáng góc trái (luồng sáng xanh)
      const lg = g.createRadialGradient(0, H * 0.25, 0, 0, H * 0.25, W * 0.7);
      lg.addColorStop(0, "rgba(120,190,255,.55)"); lg.addColorStop(1, "rgba(120,190,255,0)");
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;

      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      // Đốm sáng
      for (const s of sparks) {
        const a = Math.max(0, Math.min(1, (t - s.d) * 2)) * (0.4 + 0.6 * Math.abs(Math.sin(t * 3 + s.x * 9)));
        g.fillStyle = `rgba(255,245,230,${a * 0.8})`;
        g.beginPath(); g.arc(((s.x + t * s.v) % 1.05) * W, s.y * H, s.r * dpr, 0, 6.28); g.fill();
      }
      // Tia cam đỏ
      for (const s of shards) {
        const a = Math.max(0, Math.min(1, (t - s.d) * 3)) * 0.8;
        const x = (s.x + t * s.v) * W, y = s.y * H, l = s.l * W;
        const gr = g.createLinearGradient(x, y, x + l, y + l * 0.35);
        gr.addColorStop(0, "rgba(255,120,90,0)"); gr.addColorStop(1, `rgba(255,150,110,${a})`);
        g.strokeStyle = gr; g.lineWidth = 1.6 * dpr;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + l * 0.35); g.stroke();
      }
      // Dải sáng
      let mainHead = null;
      for (const rb of ribbons) { const h = drawRibbon(rb, t); if (rb.main) mainHead = h; }

      // Đầu sao băng chính
      if (mainHead) {
        const [hx, hy] = mainHead;
        const pulse = 1 + 0.08 * Math.sin(t * 18);
        const rr = H * 0.11 * pulse * (rank === 5 ? 1.25 : 1);
        const hg = g.createRadialGradient(hx, hy, 0, hx, hy, rr * 2.2);
        hg.addColorStop(0, rgba([255, 255, 255], 0.95)); hg.addColorStop(0.18, rgba(head.core, 0.9)); hg.addColorStop(0.5, rgba(head.glow, 0.35)); hg.addColorStop(1, rgba(head.glow, 0));
        g.fillStyle = hg; g.beginPath(); g.arc(hx, hy, rr * 2.2, 0, 6.28); g.fill();
        if (head.crystal) {
          // Khối pha lê vàng + mảnh vỡ bay ra phía sau
          g.globalCompositeOperation = "source-over";
          const s = H * 0.06;
          g.save(); g.translate(hx + s * 0.2, hy); g.rotate(-0.25 + Math.sin(t * 2) * 0.05);
          const cg = g.createLinearGradient(-s, -s, s, s);
          cg.addColorStop(0, "#fff6c8"); cg.addColorStop(0.5, "#ffc24a"); cg.addColorStop(1, "#e07b1a");
          g.fillStyle = cg; g.shadowColor = "rgba(255,190,80,.9)"; g.shadowBlur = 30 * dpr;
          g.beginPath(); g.moveTo(-s * 1.2, -s * 0.5); g.lineTo(s * 0.9, -s * 0.8); g.lineTo(s * 1.3, s * 0.3); g.lineTo(-s * 0.4, s * 0.8); g.closePath(); g.fill();
          g.shadowBlur = 0;
          g.fillStyle = "rgba(255,255,235,.75)"; g.beginPath(); g.moveTo(-s * 1.2, -s * 0.5); g.lineTo(s * 0.9, -s * 0.8); g.lineTo(s * 0.1, -s * 0.05); g.closePath(); g.fill();
          g.fillStyle = "rgba(200,90,10,.35)"; g.beginPath(); g.moveTo(s * 0.1, -s * 0.05); g.lineTo(s * 1.3, s * 0.3); g.lineTo(-s * 0.4, s * 0.8); g.closePath(); g.fill();
          g.restore();
          for (const f of frags) {
            const age = Math.max(0, t - 0.6);
            const fx = hx - Math.cos(f.ang) * f.sp * age * W, fy = hy + Math.sin(f.ang) * f.sp * age * H * 0.4;
            g.save(); g.translate(fx, fy); g.rotate(f.rot + t * 3);
            g.fillStyle = `rgba(255,200,80,${Math.max(0, 0.9 - age * 0.35)})`;
            const q = f.s * H; g.fillRect(-q, -q * 0.4, q * 2, q * 0.8);
            g.restore();
          }
          g.globalCompositeOperation = "lighter";
        }
      }

      // Mây
      g.globalCompositeOperation = "source-over";
      for (const p of puffs) {
        const x = ((p.x + t * 0.006) % 1.05) * W, y = p.y * H, r = p.r * W;
        const cgd = g.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
        cgd.addColorStop(0, "rgba(255,255,255,.95)"); cgd.addColorStop(0.7, "rgba(240,225,245,.85)"); cgd.addColorStop(1, "rgba(230,210,240,0)");
        g.fillStyle = cgd; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill();
      }

      // Chớp sáng cuối
      if (t > 2.2 && mainHead) {
        const k = Math.min(1, (t - 2.2) / 0.45);
        const [hx, hy] = mainHead;
        const fr = g.createRadialGradient(hx, hy, 0, hx, hy, Math.max(W, H) * (0.2 + k * 1.3));
        fr.addColorStop(0, `rgba(255,255,255,${k})`); fr.addColorStop(0.6, `rgba(255,${rank === 5 ? 235 : 245},${rank === 5 ? 200 : 255},${k * 0.9})`); fr.addColorStop(1, `rgba(255,255,255,${k * 0.6})`);
        g.fillStyle = fr; g.fillRect(0, 0, W, H);
      }
      if (t < duration / 1000 + 0.5) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [rank, multi, duration]);
  return <canvas ref={ref} className="meteor-cv" aria-hidden="true" />;
}
