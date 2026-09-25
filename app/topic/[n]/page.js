"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/components/Game";
import { starsFor } from "@/lib/data";
import { nbTopic, nbWords, secOf, bookOf } from "@/lib/notebook";
import { sfx } from "@/lib/sfx";
import Portal from "@/components/Portal";

const Stars = ({ n }) => <span className="starsrow">{[0, 1, 2].map((i) => (i < n ? <span key={i}>★</span> : <span key={i} className="off">★</span>))}</span>;

export default function TopicPage() {
  const { n: ns } = useParams();
  const n = decodeURIComponent(ns);
  const T = nbTopic(n);
  const { S } = useGame();
  const [ask, setAsk] = useState(null);
  if (!T) return <p style={{ marginTop: 40 }}>Không tìm thấy Topic. <Link href="/">Về trang chủ</Link></p>;
  const rows = [{ key: "all", sub: "Tất cả từ của Topic (không trùng lặp)", count: nbWords(n, "all").length }].concat(T.sections.map((s) => ({ key: s.key, sub: s.sub, count: s.words.length })));
  return (
    <>
      <Link href="/" className="back" onClick={() => sfx.page()}>‹ Về Sổ Tay</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>{bookOf(T).full.toUpperCase()} · TOPIC {T.n}</p>
        <h1 style={{ fontFamily: "var(--jp)" }}>{T.title}</h1>
        <p>{T.vi}</p>
        <div className="orn"><span /></div>
      </div>
      <div className="slist">
        {rows.map((r) => {
          const b = S?.best[`t${n}_${r.key}`];
          const meta = secOf(T, r.key);
          return (
            <div key={r.key} className={`panel srow ${r.key === "all" ? "all" : ""}`}>
              <div className="ico"><span>{meta.ico}</span></div>
              <div className="txt"><b>{meta.vi}<small>{meta.jp}</small></b><div className="sub">{r.sub}</div></div>
              <div className="res">
                {b ? <><b>{b.c}/{b.t} · {b.pct}%</b><Stars n={starsFor(b.pct)} /></> : <><b style={{ color: "#8a8fa0" }}>—</b>chưa làm</>}
                <div>{r.count} từ</div>
              </div>
              <button className="gbtn sm tri" onClick={() => { sfx.open(); setAsk({ key: r.key, total: r.count }); }}><span className="c" />Bắt đầu</button>
            </div>
          );
        })}
      </div>
      {ask && <CountModal n={n} ask={ask} onClose={() => setAsk(null)} />}
    </>
  );
}

function CountModal({ n, ask, onClose }) {
  const { S, update } = useGame();
  const router = useRouter();
  const total = ask.total;
  const min = Math.min(5, total);
  const [val, setVal] = useState(Math.min(Math.max(S?.lastN || 20, min), total));
  const [kana, setKana] = useState(S?.showKana ?? true);
  const T = nbTopic(n);
  const meta = secOf(T, ask.key);
  const start = () => {
    update((s) => { s.showKana = kana; if (val < total) s.lastN = val; });
    sfx.click();
    router.push(`/quiz?t=${encodeURIComponent(n)}&k=${ask.key}&n=${val}`);
  };
  return (
    <Portal><div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="parch dialog">
        <h2>{meta.vi}</h2>
        <div className="jp">{bookOf(T).name} · トピック{T.n} · {T.title}{meta.jp ? ` · ${meta.jp}` : ""}</div>
        <hr />
        <div style={{ fontSize: 13, color: "var(--mute)", marginBottom: 6 }}>Số câu hỏi</div>
        <div className="qn">{val}<small> / {total}</small></div>
        <input type="range" min={min} max={total} value={val} onChange={(e) => setVal(+e.target.value)} />
        <div className="chips">
          {[10, 20, 30].filter((x) => x < total).map((x) => <button key={x} className={`chip ${val === x ? "on" : ""}`} onClick={() => setVal(x)}>{x}</button>)}
          <button className={`chip ${val === total ? "on" : ""}`} onClick={() => setVal(total)}>Tất cả ({total})</button>
        </div>
        <label className="opt-line"><input type="checkbox" checked={kana} onChange={(e) => setKana(e.target.checked)} /> Hiện cách đọc (hiragana) trong câu hỏi</label>
        <div className="btnrow">
          <button className="gbtn x dark" onClick={onClose}><span className="c" />Hủy</button>
          <button className="gbtn tri" onClick={start}><span className="c" />Bắt đầu</button>
        </div>
      </div>
    </div></Portal>
  );
}
