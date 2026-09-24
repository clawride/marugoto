"use client";
// Xếp các cụm từ thành câu đúng — dùng cho boss A2-1 (Yae Miko) và A2-2 (Nahida)
import { useMemo, useState } from "react";
import { NextBtn } from "@/components/Battle";
import { shuffle, pickRand } from "@/lib/data";
import { sfx } from "@/lib/sfx";

// host: { name, icon, lines: { intro[], next[], ok[], bad[] } }
export default function OrderQ({ q, onScore, onNext, first, host }) {
  const pool0 = useMemo(() => {
    const idxs = q.chunks.map((_, i) => i);
    let s = shuffle(idxs), tries = 0;
    while (s.every((v, i) => v === i) && tries++ < 10) s = shuffle(idxs);
    return s;
  }, [q]);
  const [picked, setPicked] = useState([]);
  const [result, setResult] = useState(null);
  const line = useMemo(() => pickRand(first ? host.lines.intro : host.lines.next), [first, host]);
  const [say, setSay] = useState(line);
  const add = (i) => { if (result) return; setPicked((p) => [...p, i]); sfx.click(); };
  const remove = (k) => { if (result) return; setPicked((p) => p.filter((_, j) => j !== k)); };
  const check = () => {
    const ok = picked.every((v, i) => q.chunks[v] === q.chunks[i]);
    setResult(ok ? "ok" : "bad"); onScore(ok); setSay(pickRand(ok ? host.lines.ok : host.lines.bad));
  };
  return (
    <div className="parch bq yae">
      <div className="yaehead">
        <img src={host.icon} alt={host.name} />
        <div className="bubble"><b>{host.name}</b>{say}</div>
      </div>
      <div className="lab">Xếp các cụm từ thành câu đúng</div>
      <div className="bvi">“{q.vi}”</div>
      <div className={`tray ${result || ""}`}>
        {picked.length === 0 && <span className="trayph">Chạm vào các cụm từ bên dưới theo đúng thứ tự…</span>}
        {picked.map((v, k) => <button key={k} className="chunk in" onClick={() => remove(k)}>{q.chunks[v]}</button>)}
      </div>
      {result === "bad" && <div className="bexp">Câu đúng: <b className="jpt">{q.chunks.join(" ")}</b></div>}
      <div className="pool">
        {pool0.map((v) => (picked.includes(v) ? <span key={v} className="chunk ghost">{q.chunks[v]}</span> : <button key={v} className="chunk" onClick={() => add(v)}>{q.chunks[v]}</button>))}
      </div>
      {!result && (
        <div className="btnrow">
          <button className="gbtn x dark" onClick={() => setPicked([])} disabled={!picked.length}><span className="c" />Xếp lại</button>
          <button className="gbtn tri" onClick={check} disabled={picked.length !== q.chunks.length}><span className="c" />Kiểm tra</button>
        </div>
      )}
      {result && <NextBtn onNext={onNext} />}
    </div>
  );
}
