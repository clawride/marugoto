"use client";
import { useEffect, useRef, useState } from "react";

export default function LessonTabs({ tabs, active, onChange, label, record, lesson }) {
  const rail = useRef(null);
  const moved = useRef(false);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = rail.current;
    const measure = () => setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    const size = new ResizeObserver(measure);
    size.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    const wheel = (e) => {
      if (e.ctrlKey || el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const next = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + e.deltaY));
      if (next !== el.scrollLeft) { el.scrollLeft = next; e.preventDefault(); }
    };
    let drag = null;
    const down = (e) => {
      moved.current = false;
      if (e.pointerType === "mouse" && e.button === 0) drag = { x: e.clientX, left: el.scrollLeft };
    };
    const move = (e) => {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) > 6) moved.current = true;
      if (moved.current) { el.scrollLeft = drag.left + drag.x - e.clientX; el.classList.add("dragging"); }
    };
    const up = () => { drag = null; el.classList.remove("dragging"); };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    measure();
    return () => { size.disconnect(); el.removeEventListener("scroll", measure); el.removeEventListener("wheel", wheel); el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, []);
  useEffect(() => {
    const el = rail.current, selected = el.querySelector('[aria-current="page"]');
    if (!selected) return;
    const a = el.getBoundingClientRect(), b = selected.getBoundingClientRect();
    if (b.left < a.left) el.scrollLeft -= a.left - b.left + 8;
    else if (b.right > a.right) el.scrollLeft += b.right - a.right + 8;
  }, [active]);
  const slide = (d) => rail.current.scrollBy({ left: d * Math.max(160, rail.current.clientWidth * .7), behavior: "smooth" });
  return (
    <nav className="lesson-tabs" aria-label="Các phần của bài học">
      <button type="button" className="rail-arrow" aria-label="Cuộn các phần sang trái" disabled={!edges.left} onClick={() => slide(-1)}>‹</button>
      <div ref={rail} className="chips a22tabs lesson-tab-rail">
        {tabs.map((p) => {
          const selected = active === p.key;
          const stars = record[`${lesson}:${p.key}`]?.stars || 0;
          return <button key={p.key} type="button" className={`chip dk ${selected ? "on" : ""}`} aria-current={selected ? "page" : undefined} onClick={(e) => { if (moved.current) { moved.current = false; e.preventDefault(); return; } onChange(p.key); }}>
            <span className="pi" aria-hidden="true">{p.ico}</span><span>{label(p)}</span>
            {p.key !== 'study' && <span className="tab-stars" aria-label={`${stars}/3 sao`}>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>}
          </button>;
        })}
      </div>
      <button type="button" className="rail-arrow" aria-label="Cuộn các phần sang phải" disabled={!edges.right} onClick={() => slide(1)}>›</button>
    </nav>
  );
}
