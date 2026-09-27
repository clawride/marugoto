"use client";
// Vùng viết tay tự do trên ô kẻ của phiếu (như viết bút lên giấy): chuột / ngón tay / bút cảm ứng
import { useEffect, useRef } from "react";

export default function SheetPad({ cols, rows, cell, clearKey, className = "" }) {
  const ref = useRef(null), last = useRef(null);
  const W = cols * cell, H = rows * cell;
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#1b2233";
  }, [W, H, clearKey]);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)]; };
  const down = (e) => { e.preventDefault(); ref.current.setPointerCapture(e.pointerId); last.current = pos(e); };
  const move = (e) => {
    if (!last.current) return;
    const p = pos(e), g = ref.current.getContext("2d");
    g.lineWidth = Math.max(2, cell / 16) * (e.pressure && e.pointerType === "pen" ? 0.6 + e.pressure : 1);
    g.beginPath(); g.moveTo(...last.current); g.lineTo(...p); g.stroke();
    last.current = p;
  };
  const up = () => { last.current = null; };
  return (
    <canvas ref={ref} className={`kwpad ${className}`} style={{ width: W, height: H, "--c": `${cell}px` }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} aria-label="Ô tập viết" />
  );
}
