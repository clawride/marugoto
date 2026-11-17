"use client";
import { useEffect, useState } from "react";

export default function StudyContents({ lesson, prefix }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: "-160px 0px -45% 0px" });
    document.querySelectorAll(`[id^="${prefix}"][data-study-anchor]`).forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [prefix]);
  const link = (id, title, nested = false) => <a key={id} href={`#${prefix}-${id}`} className={`${nested ? "sub" : ""} ${active === `${prefix}-${id}` ? "on" : ""}`} aria-current={active === `${prefix}-${id}` ? "location" : undefined} onClick={() => setOpen(false)}>{title}</a>;
  return <aside className={`study-toc ${open ? "expanded" : ""}`}>
    <h2 className="study-toc-heading">Mục lục bài học</h2>
    <button type="button" className="study-toc-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={`${prefix}-nav`}>Mục lục bài học <span aria-hidden="true">{open ? "▴" : "▾"}</span></button>
    <nav id={`${prefix}-nav`} aria-label="Mục lục bài học">
      {link("grammar", `Mẫu câu · ${lesson.grammar.length} mục`)}
      {lesson.grammar.map((g, i) => link(`grammar-${i}`, g.point, true))}
      {!!lesson.reference?.length && link("reference", "Bảng ghi nhớ")}
      {link("dialogue", `Hội thoại · ${lesson.listening.length} bài nghe`)}
      {lesson.listening.map((it, i) => link(`dialogue-${i}`, `${i + 1}. ${it.title}`, true))}
      {lesson.reading.map((it, i) => link(`reading-${i}`, `Bài đọc ${i + 1} · ${it.title}`))}
      {link("vocab", `Từ vựng · ${lesson.vocab.length} từ`)}
      {link("practice", "Luyện sắp xếp câu")}
    </nav>
  </aside>;
}
