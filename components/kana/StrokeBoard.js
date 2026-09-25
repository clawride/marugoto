"use client";
// Bảng luyện viết chữ kana: xem thứ tự nét · tô theo nét mờ (chấm từng nét) · viết tự do (chấm cả chữ, sửa nét)
// Nét mẫu: KanjiVG (http://kanjivg.tagaini.net) © Ulrich Apel, CC BY-SA 3.0
import { useCallback, useEffect, useRef, useState } from "react";
import { KANA_STROKES } from "@/lib/kana";
import { resample, samplePath, checkStroke, checkWhole } from "@/lib/strokeCheck";
import { sfx } from "@/lib/sfx";

const V = 109; // hệ toạ độ KanjiVG
const startOf = (d) => { const m = d.match(/^M\s*([\d.]+)[ ,]([\d.]+)/); return m ? [+m[1], +m[2]] : [0, 0]; };

// Hoạt ảnh vẽ lần lượt từng nét
function StrokeAnim({ paths, playKey, only }) {
  return (
    <g key={playKey}>
      {paths.map((d, i) => (only == null || only === i) && (
        <path key={i} d={d} className="kstroke anim" pathLength="1" style={{ animationDelay: `${(only == null ? i : 0) * 0.75}s` }} />
      ))}
    </g>
  );
}

// mode: "watch" | "trace" | "free"
export default function StrokeBoard({ char, mode, onResult, size = 300 }) {
  const paths = KANA_STROKES[char] || [];
  const [tpl, setTpl] = useState([]);
  useEffect(() => { setTpl(paths.map((d) => samplePath(d))); }, [char]); // eslint-disable-line react-hooks/exhaustive-deps
  const [strokes, setStrokes] = useState([]); // nét tay đã chấp nhận (trace) / đã viết (free)
  const [levels, setLevels] = useState([]); // good | ok cho từng nét đã chấp nhận
  const [cur, setCur] = useState(null);
  const [msg, setMsg] = useState(null);
  const [demo, setDemo] = useState(null); // chỉ số nét đang minh hoạ lại
  const [playKey, setPlayKey] = useState(0);
  const [result, setResult] = useState(null);
  const svgRef = useRef(null);
  const drawing = useRef(false);

  const reset = useCallback(() => { setStrokes([]); setLevels([]); setCur(null); setMsg(null); setDemo(null); setResult(null); setPlayKey((k) => k + 1); }, []);
  useEffect(() => { reset(); }, [char, mode, reset]);

  const toPt = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * V, ((e.clientY - r.top) / r.height) * V];
  };
  const down = (e) => {
    if (mode === "watch" || result) return;
    if (mode === "trace" && strokes.length >= paths.length) return;
    e.preventDefault(); svgRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true; setCur([toPt(e)]); setDemo(null);
  };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); const p = toPt(e); setCur((c) => (c ? [...c, p] : [p])); };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const pts = cur || [];
    setCur(null);
    if (pts.length < 2 || !tpl.length) return;
    const u = resample(pts);
    if (mode === "trace") {
      const k = strokes.length;
      const r = checkStroke(u, tpl, k, [...Array(k).keys()]);
      setMsg({ level: r.level, text: r.msg });
      if (r.ok) {
        const ns = [...strokes, pts], nl = [...levels, r.level];
        setStrokes(ns); setLevels(nl); sfx.click();
        if (ns.length === paths.length) {
          const good = nl.filter((l) => l === "good").length;
          const score = Math.round(((good + (nl.length - good) * 0.7) / nl.length) * 100);
          setResult({ score, strokes: [], notes: [] });
          setMsg({ level: "good", text: `Hoàn thành! Tô đúng ${paths.length}/${paths.length} nét.` });
          sfx.correct(); onResult?.({ mode, score });
        }
      } else { setDemo(k); sfx.wrong(); }
    } else if (mode === "free") {
      setStrokes((s) => [...s, pts]); sfx.click();
    }
  };

  const grade = () => {
    if (!strokes.length || !tpl.length) return;
    const r = checkWhole(strokes.map((s) => resample(s)), tpl);
    setResult(r);
    r.score >= 70 ? sfx.correct() : sfx.wrong();
    onResult?.({ mode, score: r.score });
  };
  const undo = () => { if (result) return; setStrokes((s) => s.slice(0, -1)); setLevels((l) => l.slice(0, -1)); setMsg(null); };

  const inkColor = (i) => {
    if (mode === "free" && result) { const lv = result.strokes[i]?.level; return lv === "good" ? "#3fa34d" : lv === "ok" ? "#d9a21b" : "#d0453a"; }
    if (mode === "trace") return levels[i] === "good" ? "#2f6fd1" : "#8a55c9";
    return "#2a2a38";
  };
  const line = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const nextStart = mode === "trace" && strokes.length < paths.length ? startOf(paths[strokes.length]) : null;

  return (
    <div className="kboard">
      <svg ref={svgRef} viewBox={`0 0 ${V} ${V}`} width={size} height={size} className={`kpad ${mode}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} style={{ touchAction: "none" }}>
        {/* ô chữ thập (田字格) để canh cân đối */}
        <rect x="1" y="1" width={V - 2} height={V - 2} className="kgrid-box" />
        <line x1={V / 2} y1="2" x2={V / 2} y2={V - 2} className="kgrid-line" />
        <line x1="2" y1={V / 2} x2={V - 2} y2={V / 2} className="kgrid-line" />
        {/* nét mẫu */}
        {mode === "watch" && <StrokeAnim paths={paths} playKey={playKey} />}
        {mode === "trace" && paths.map((d, i) => <path key={i} d={d} className={`kstroke ghost ${i < strokes.length ? "done" : ""}`} />)}
        {mode === "free" && result && paths.map((d, i) => <path key={i} d={d} className="kstroke ref" />)}
        {demo != null && <StrokeAnim paths={paths} playKey={`d${demo}-${playKey}`} only={demo} />}
        {/* số thứ tự nét */}
        {(mode === "watch" || (mode === "free" && result)) && paths.map((d, i) => { const [x, y] = startOf(d); return <text key={i} x={x - 4} y={y - 2} className="knum">{i + 1}</text>; })}
        {nextStart && <><circle cx={nextStart[0]} cy={nextStart[1]} r="3.2" className="kstart" /><text x={nextStart[0] + 4} y={nextStart[1] - 3} className="knum">{strokes.length + 1}</text></>}
        {/* nét tay */}
        {strokes.map((s, i) => <path key={i} d={line(s)} className="kink" style={{ stroke: inkColor(i) }} />)}
        {cur && <path d={line(cur)} className="kink" style={{ stroke: "#2a2a38" }} />}
      </svg>

      <div className="kctl">
        {mode === "watch" && <button className="gbtn sm" onClick={() => setPlayKey((k) => k + 1)}><span className="c" />▶ Xem lại thứ tự nét</button>}
        {mode !== "watch" && <>
          <button className="gbtn sm x dark" onClick={undo} disabled={!strokes.length || !!result}><span className="c" />↶ Xoá nét</button>
          <button className="gbtn sm x dark" onClick={reset}><span className="c" />Viết lại</button>
          {mode === "free" && !result && <button className="gbtn sm tri" onClick={grade} disabled={!strokes.length}><span className="c" />Chấm điểm</button>}
        </>}
      </div>

      {msg && mode === "trace" && <div className={`kmsg ${msg.level}`}>{msg.text}</div>}
      {mode === "trace" && !msg && <div className="kmsg hint">Tô theo nét mờ, bắt đầu từ chấm tròn (nét {Math.min(strokes.length + 1, paths.length)}/{paths.length}).</div>}
      {mode === "free" && !result && <div className="kmsg hint">Viết chữ <b className="jpt">{char}</b> vào ô ({paths.length} nét), rồi bấm Chấm điểm.</div>}
      {mode === "free" && result && (
        <div className="kresult">
          <div className="kscore"><b>{result.score}</b><small>/100</small><span>Hình dáng {result.shape} · Cân đối {result.balance}</span></div>
          <ul>
            {result.notes.map((n, i) => <li key={`n${i}`} className="bad">{n}</li>)}
            {result.strokes.map((s, i) => s.level !== "good" && (
              <li key={i} className={s.level}>{s.msg} <button className="linkbtn" onClick={() => setDemo(i)}>xem nét {i + 1}</button></li>
            ))}
            {result.strokes.every((s) => s.level === "good") && !result.notes.length && <li className="good">Tuyệt đẹp! Các nét đều đúng thứ tự, đúng chiều và cân đối.</li>}
          </ul>
          <div className="klegend"><i style={{ background: "#3fa34d" }} />đẹp <i style={{ background: "#d9a21b" }} />tạm được <i style={{ background: "#d0453a" }} />cần sửa · nét xanh nhạt là nét mẫu</div>
        </div>
      )}
    </div>
  );
}
