"use client";
// Câu hỏi kiểu đoạn văn cho boss tổng hợp (まとめ問題):
//  - type "passage": đoạn văn / hội thoại có nhiều chỗ trống （①）（②）… — chọn lần lượt từng chỗ
//  - type "read": bài đọc (thư, thông báo…) + các câu nhận định, chọn ◯ (đúng) hoặc × (sai)
import { useEffect, useRef, useState } from "react";
import { NextBtn } from "@/components/Battle";
import { sfx } from "@/lib/sfx";

const MARK = /（([①-⑳])）/g;
const NUM = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

export default function MatomeQ({ q, sub, onScore, onNext }) {
  const read = q.type === "read";
  const items = read ? q.statements : q.blanks;
  const [cur, setCur] = useState(0);
  const [picks, setPicks] = useState([]); // lựa chọn của người chơi cho từng mục
  const [showVi, setShowVi] = useState(false);
  const endRef = useRef(null);
  const finished = cur >= items.length;
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [cur]);

  const right = (it) => (read ? (it.a ? "◯" : "×") : it.opts[it.a]);
  const choose = (o) => {
    if (finished || picks[cur] !== undefined) return;
    const it = items[cur], ok = o === right(it);
    setPicks((p) => { const n = [...p]; n[cur] = o; return n; });
    onScore(ok);
    if (ok) sfx.click();
    setTimeout(() => setCur((c) => c + 1), ok ? 650 : 1300);
  };

  // đoạn văn: thay （①） bằng ô trống (đã điền / đang chọn)
  const renderText = (text) => {
    if (read) return text;
    const out = []; let last = 0, m; MARK.lastIndex = 0;
    while ((m = MARK.exec(text))) {
      out.push(text.slice(last, m.index));
      const i = NUM.indexOf(m[1]), it = items[i], p = picks[i];
      const state = p === undefined ? (i === cur ? "cur" : "") : p === right(it) ? "ok" : "bad";
      out.push(<span key={m.index} className={`blank ${state}`}><small className="bnum">{m[1]}</small>{p === undefined ? "　　" : right(it)}</span>);
      last = m.index + m[0].length;
    }
    out.push(text.slice(last));
    return out;
  };

  const it = items[cur];
  return (
    <div className="parch bq mtq">
      <div className="lab">{sub}</div>
      {q.title && <div className="mttitle jpt">{q.title}</div>}
      <div className="mtext jpt">{renderText(q.text)}</div>
      {q.vi && <button type="button" className="mtvi-btn" onClick={() => setShowVi((v) => !v)}>{showVi ? "Ẩn bản dịch" : "Xem bản dịch"}</button>}
      {showVi && q.vi && <div className="bvi mtvi">{q.vi}</div>}

      <ol className="mtlist">
        {items.map((x, i) => {
          if (i > cur) return null;
          const p = picks[i], done = p !== undefined, ok = done && p === right(x);
          return (
            <li key={i} className={done ? (ok ? "ok" : "bad") : "cur"}>
              <div className="mtq-h">{read ? <span className="jpt">{x.s}</span> : <>Chỗ trống <b>{NUM[i]}</b></>}</div>
              {!done && i === cur && (
                <div className={read ? "chipsopt mtox" : "chipsopt"}>
                  {(read ? ["◯", "×"] : x.opts).map((o) => <button key={o} className="chipo" onClick={() => choose(o)}>{o}</button>)}
                </div>
              )}
              {done && <div className="bexp">{ok ? "✦ Chính xác! " : `✕ Bạn chọn ${p} — đáp án: ${right(x)}. `}{x.explain}{read && x.vi ? <><br /><small>{x.vi}</small></> : null}</div>}
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />
      {finished && <NextBtn onNext={onNext} />}
      {!finished && it && <div className="mtprog">{cur + 1}/{items.length}</div>}
    </div>
  );
}
