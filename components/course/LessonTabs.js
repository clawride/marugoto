"use client";
// Các phần của một bài học: lưới ô hiện ĐỦ mọi phần (trước đây là dải cuộn ngang có mũi tên, các phần sau bị khuất)
// Nhóm "Học" (nội dung bài, học theo sách) và "Luyện tập" (các phần có sao ★, kèm tổng sao của bài).
export default function LessonTabs({ tabs, active, onChange, label, record, lesson }) {
  const starsOf = (p) => record[`${lesson}:${p.key}`]?.stars || 0;
  const learn = tabs.filter((p) => p.key === "study" || !("n" in p) && /^Học theo sách|^Nội dung/.test(p.label || "")), learnKeys = new Set(learn.map((p) => p.key));
  const practice = tabs.filter((p) => !learnKeys.has(p.key));
  const got = practice.reduce((a, p) => a + starsOf(p), 0), max = practice.length * 3;
  const Tile = (p) => {
    const on = active === p.key, st = learnKeys.has(p.key) ? null : starsOf(p);
    return (
      <button key={p.key} type="button" className={`ltile ${on ? "on" : ""} ${st === 3 ? "full" : ""}`} aria-current={on ? "page" : undefined} onClick={() => onChange(p.key)}>
        <span className="lt-ico" aria-hidden="true">{p.ico}</span>
        <span className="lt-name">{label(p)}</span>
        {st != null && <span className="lt-stars" aria-label={`${st}/3 sao`}>{"★".repeat(st)}<i>{"☆".repeat(3 - st)}</i></span>}
      </button>
    );
  };
  return (
    <nav className="lesson-tabs" aria-label="Các phần của bài học">
      {learn.length > 0 && (
        <div className="lt-group learn">
          <div className="lt-head"><b>📘 Học</b></div>
          <div className="lt-grid">{learn.map(Tile)}</div>
        </div>
      )}
      <div className="lt-group">
        <div className="lt-head"><b>🎯 Luyện tập</b><span className="lt-total" title="Tổng sao của bài này">★ {got}/{max}</span></div>
        <div className="lt-grid">{practice.map(Tile)}</div>
      </div>
    </nav>
  );
}
