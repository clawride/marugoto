"use client";
import { useEffect, useRef } from "react";

// Nền trời sao + đốm sáng vàng trôi nhẹ
export default function Sky() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, g = cv.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const stars = [], motes = [];
    const resize = () => {
      w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
    };
    resize();
    for (let i = 0; i < 140; i++) stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28, s: 0.5 + Math.random() * 1.5 });
    for (let i = 0; i < 26; i++) motes.push({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + 1, vx: (Math.random() - 0.5) * 0.00012, vy: -0.00008 - Math.random() * 0.00016, p: Math.random() * 6.28 });
    const draw = (t) => {
      g.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(s.p + t * 0.001 * s.s));
        g.fillStyle = `rgba(255,255,255,${a})`;
        g.beginPath(); g.arc(s.x * w, s.y * h, s.r * dpr, 0, 6.28); g.fill();
      }
      for (const m of motes) {
        m.x += m.vx; m.y += m.vy;
        if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
        const a = 0.35 + 0.35 * Math.sin(m.p + t * 0.002);
        const x = m.x * w, y = m.y * h, r = m.r * dpr * 4;
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, `rgba(255,220,140,${a})`); grd.addColorStop(1, "rgba(255,220,140,0)");
        g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}
