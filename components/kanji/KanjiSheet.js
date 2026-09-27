"use client";
// Một phiếu luyện viết kanji (giống phiếu PDF Marugoto A2/B1 của JF Việt Nam)
//   Trang 1: bảng từ (chữ · cách đọc · Hán Việt · nghĩa) → hàng chữ mờ để tô → ô kẻ tập viết tự do
//   Trang 2: viết cách đọc / chữ Hán của phần gạch chân (chấm điểm) → bảng viết lại từng từ
//   Mỗi từ có nút ✍ luyện từng nét (xem thứ tự nét · tô theo · tự viết & chấm). Có nút 🖨 in phiếu.
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import StrokeBoard from "@/components/kana/StrokeBoard";
import SheetPad from "@/components/kanji/SheetPad";
import { useKanjiSave, Stars } from "@/components/kanji/KanjiLesson";
import { KANA_STROKES } from "@/lib/kana";
import { SHEETS, SHEET_BOOK, sheetOf, sheetKey, parseEx, checkAns, cellsOf, chunk, loadSheetStrokes } from "@/lib/kanjiSheets";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const GRID_ROWS = 6;
const isWritable = (c) => /[一-鿿々ぁ-ゖァ-ヺー]/.test(c);
const say = (t) => speakLines([{ t }], { rate: 0.85 });

// bề rộng một ô theo khung chứa (co giãn theo màn hình, không nhỏ hơn 30px)
function useCell(total, max = 64) {
  const [el, setEl] = useState(null); // ref dạng hàm: đo lại khi phiếu thật sự hiện ra
  const [cell, setCell] = useState(44);
  useLayoutEffect(() => {
    if (!el) return;
    const fit = () => { const w = el.clientWidth - 34; if (w > 0) setCell(Math.max(30, Math.min(max, Math.floor(w / total)))); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, [el, total, max]);
  return [setEl, cell];
}

function Head({ sh }) {
  const [name, setName] = useState("");
  useEffect(() => { try { setName(localStorage.getItem("kw_name") || ""); } catch {} }, []);
  return (
    <div className="kwhead">
      <span>{SHEET_BOOK}</span><span>トピック{sh.t}</span><span>漢字練習シート({sh.p})</span>
      <label>名前：<input value={name} onChange={(e) => { setName(e.target.value); try { localStorage.setItem("kw_name", e.target.value); } catch {} }} /></label>
    </div>
  );
}

// hàng chữ mờ: mỗi chữ nằm giữa một ô
const Trace = ({ text, cell }) => <span className="kwtrace jpt" style={{ "--c": `${cell}px` }}>{[...text].map((c, i) => <i key={i}>{c}</i>)}</span>;

// ——— Trang 1 ———
function PageOne({ sh, cell, clearKey, onPractice }) {
  let col = 1;
  const cols = sh.words.map((w) => { const n = cellsOf(w), c = col; col += n; return { w, n, c }; });
  return (
    <div className="kwtable" style={{ gridTemplateColumns: `repeat(${col - 1}, ${cell}px)`, "--c": `${cell}px` }}>
      {cols.map(({ w, n, c }) => {
        const span = { gridColumn: `${c} / span ${n}` };
        const tr = w.tr ? chunk(w.tr, 3) : [[w.w]];
        return (
          <Fragment key={w.w}>
            <button className="kwbig jpt" style={{ ...span, gridRow: 1 }} onClick={() => onPractice(w)} title="Luyện từng nét chữ này">
              <span>{w.w}{w.mark && <small className="kwmark">※</small>}</span>
              {w.sub && <small className="kwsub">{w.sub}</small>}
            </button>
            <div className="kwcell kwr jpt" style={{ ...span, gridRow: 2 }}>{w.r}</div>
            <div className="kwcell kwhv" style={{ ...span, gridRow: 3 }}>{w.hv}</div>
            <div className="kwcell kwvi" style={{ ...span, gridRow: 4 }}>{w.vi}</div>
            <div className="kwcell kwtr" style={{ ...span, gridRow: 5 }}>{tr[0].map((t, i) => <Trace key={i} text={t} cell={cell} />)}</div>
            {tr.length > 1 ? (
              <>
                <div className="kwgrid" style={{ ...span, gridRow: "6 / span 2" }}><SheetPad cols={n} rows={2} cell={cell} clearKey={clearKey} /></div>
                <div className="kwcell kwtr" style={{ ...span, gridRow: 8 }}>{tr.slice(1).flat().map((t, i) => <Trace key={i} text={t} cell={cell} />)}</div>
                <div className="kwgrid" style={{ ...span, gridRow: `9 / span ${GRID_ROWS - 3}` }}><SheetPad cols={n} rows={GRID_ROWS - 3} cell={cell} clearKey={clearKey} /></div>
              </>
            ) : (
              <div className="kwgrid" style={{ ...span, gridRow: `6 / span ${GRID_ROWS}` }}><SheetPad cols={n} rows={GRID_ROWS} cell={cell} clearKey={clearKey} /></div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ——— Trang 2 ———
function PageTwo({ sh, cell, clearKey, onPractice }) {
  const { S } = useGame();
  const save = useKanjiSave();
  const exs = useMemo(() => sh.ex.map(parseEx), [sh]);
  const blanks = useMemo(() => exs.flat().filter((x) => typeof x === "object"), [exs]);
  const [ans, setAns] = useState({});
  const [done, setDone] = useState(null); // { ok, total, stars, reward }
  const [show, setShow] = useState(false);
  useEffect(() => { setAns({}); setDone(null); setShow(false); }, [sh.id]);
  const best = S?.kanji?.p?.[`${sheetKey(sh.id)}:ex`];
  const check = () => {
    const ok = blanks.filter((b, i) => checkAns(ans[i], b)).length;
    const r = save(`${sheetKey(sh.id)}:ex`, Math.round((ok / blanks.length) * 100), blanks.length);
    setDone({ ok, total: blanks.length, ...r }); ok === blanks.length ? sfx.correct() : sfx.wrong?.();
  };
  let bi = -1;
  const rowCells = 12;
  return (
    <>
      <p className="kwinst">◆<u>　　　　</u>の 読み方と 書き方を 書いてください。 <b>Hãy viết cách đọc và cách viết của phần gạch chân.</b></p>
      <ol className="kwex">
        {exs.map((segs, i) => (
          <li key={i} className="jpt">
            {segs.map((x, j) => {
              if (typeof x === "string") return <span key={j}>{x}</span>;
              const k = ++bi, b = x, v = ans[k] || "", right = done && checkAns(v, b);
              return (
                <span key={j} className={`kwblank ${done ? (right ? "ok" : "bad") : ""}`}>
                  <u>{b.text}</u>
                  <span className="kwin">
                    <input value={v} onChange={(e) => { setAns((a) => ({ ...a, [k]: e.target.value })); setDone(null); }}
                      placeholder={b.kind === "read" ? "cách đọc" : "chữ Hán"} size={Math.max(4, b.ans[0].length + 1)} aria-label={`${b.text}: ${b.kind === "read" ? "viết cách đọc" : "viết chữ Hán"}`} />
                    {b.kind === "write" && <button className="kwpen" onClick={() => onPractice({ w: b.ans[0], r: b.text })} title="Luyện viết chữ Hán này">✍</button>}
                    {(show || (done && !right)) && <em className="kwans">{b.ans.join(" / ")}</em>}
                  </span>
                </span>
              );
            })}
          </li>
        ))}
      </ol>
      {sh.exNote && <p className="kwnote">{sh.exNote}</p>}
      <div className="kwactions">
        <button className="gbtn" onClick={check}><span className="c" />Chấm bài</button>
        <button className="gbtn x dark" onClick={() => { setShow((s) => !s); sfx.click(); }}><span className="c" />{show ? "Ẩn đáp án" : "Xem đáp án"}</button>
        <button className="chip dk" onClick={() => { setAns({}); setDone(null); setShow(false); }}>Làm lại</button>
        {done && <span className="kwscore">Đúng <b>{done.ok}/{done.total}</b> <Stars n={done.stars} />{done.reward > 0 && <> · +{done.reward} Nguyên Thạch</>}</span>}
        {!done && best && <span className="kwscore">Tốt nhất: <b>{best.pct}%</b> <Stars n={best.stars} /></span>}
      </div>
      <p className="hint">Gạch chân viết bằng kana → gõ <b>chữ Hán</b> (bộ gõ tiếng Nhật, hoặc bấm ✍ để luyện viết tay). Gạch chân có chữ Hán → gõ <b>cách đọc</b> bằng hiragana (gõ katakana cũng được chấm).</p>

      <div className="kwrows" style={{ "--c": `${cell}px`, gridTemplateColumns: `repeat(${rowCells}, ${cell}px)` }}>
        {sh.words.map((w) => {
          const t = (w.tr ? w.tr.filter((x) => !x.startsWith("～"))[0] : null) || w.w, n = Math.min([...t].length, rowCells - 2);
          return (
            <Fragment key={w.w}>
              <button className="kwcell kwtr kwrowtr" style={{ gridColumn: `1 / span ${n}` }} onClick={() => onPractice(w)}><Trace text={t} cell={cell} /></button>
              <div className="kwgrid" style={{ gridColumn: `${n + 1} / span ${rowCells - n}` }}><SheetPad cols={rowCells - n} rows={1} cell={cell} clearKey={clearKey} /></div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}

// ——— Luyện từng nét (chấm điểm) ———
function Practice({ w, strokes, onClose }) {
  const { S, update } = useGame();
  const chars = useMemo(() => [...w.w].filter(isWritable), [w]);
  const [i, setI] = useState(0);
  const [mode, setMode] = useState("watch");
  const c = chars[i];
  const isKanji = /[一-鿿々]/.test(c || "");
  const paths = isKanji ? strokes?.[c] : KANA_STROKES[c];
  const best = S?.kanji?.w || {};
  const onResult = ({ mode: m, score }) => {
    if (m === "trace") { setTimeout(() => setMode("free"), 900); return; }
    if (m === "free" && isKanji) update((s) => { s.kanji = s.kanji || {}; s.kanji.w = { ...(s.kanji.w || {}), [c]: Math.max(s.kanji.w?.[c] || 0, score) }; });
  };
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  if (!chars.length) return null;
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="parch dialog kwprac">
        <button className="kwclose" onClick={onClose} aria-label="Đóng">✕</button>
        <h2 className="jpt">{w.w} <small>{w.r}</small></h2>
        {w.vi && <p className="kwpvi">{w.vi}</p>}
        <div className="kpick">{chars.map((x, j) => <button key={j} className={`kchip jpt ${j === i ? "on" : ""} ${best[x] >= 80 ? "s3" : best[x] >= 60 ? "s2" : best[x] ? "s1" : ""}`} onClick={() => { setI(j); setMode("watch"); sfx.click(); }}>{x}</button>)}</div>
        <div className="kmodes">{[["watch", "1 · Xem thứ tự nét"], ["trace", "2 · Tô theo nét"], ["free", "3 · Tự viết & chấm"]].map(([k, t]) => <button key={k} className={`chip ${mode === k ? "on" : ""}`} onClick={() => { setMode(k); sfx.click(); }}>{t}</button>)}</div>
        {paths ? <StrokeBoard key={`${c}-${mode}-${i}`} char={c} paths={isKanji ? paths : undefined} mode={mode} onResult={onResult} size={260} />
          : <p className="hint">{strokes ? "Chưa có nét mẫu cho chữ này." : "Đang tải nét chữ…"}</p>}
        <div className="btnrow">
          <button className="chip dk" onClick={() => say(w.r?.replace(/（.*$/, "") || w.w)}>🔊 Nghe</button>
          {i < chars.length - 1 && <button className="gbtn sm" onClick={() => { setI(i + 1); setMode("watch"); }}><span className="c" />Chữ tiếp ›</button>}
        </div>
      </div>
    </div>
  );
}

export default function KanjiSheet({ id }) {
  const sh = sheetOf(id);
  const { S } = useGame();
  const [page, setPage] = useState(1);
  const [clearKey, setClearKey] = useState(0);
  const [prac, setPrac] = useState(null);
  const [strokes, setStrokes] = useState(null);
  useEffect(() => { loadSheetStrokes().then(setStrokes); }, []);
  const total = sh ? sh.words.reduce((a, w) => a + cellsOf(w), 0) : 10;
  const [box1, cell1] = useCell(total);
  const [box2, cell2] = useCell(12, 56);
  const onPractice = useCallback((w) => { setPrac(w); sfx.open?.(); }, []);
  if (!sh) return <p style={{ marginTop: 40 }}>Không tìm thấy phiếu. <Link href="/kanji/phieu">Danh sách phiếu</Link></p>;
  if (!S) return null;
  const idx = SHEETS.findIndex((x) => x.id === id), prev = SHEETS[idx - 1], next = SHEETS[idx + 1];
  return (
    <div className="kwsheet">
      <div className="kwbar noprint">
        <Link href="/kanji/phieu" className="back" onClick={() => sfx.page()}>‹ Phiếu luyện viết A2/B1</Link>
        <div className="chips">
          <button className={`chip dk ${page === 1 ? "on" : ""}`} onClick={() => setPage(1)}>1 · Tập viết</button>
          <button className={`chip dk ${page === 2 ? "on" : ""}`} onClick={() => setPage(2)}>2 · Bài tập</button>
          <button className="chip dk" onClick={() => { setClearKey((k) => k + 1); sfx.click(); }}>🧽 Xoá nét viết</button>
          <button className="chip dk" onClick={() => window.print()}>🖨 In phiếu</button>
        </div>
      </div>
      <p className="hint noprint">Viết trực tiếp lên ô kẻ bằng chuột, ngón tay hoặc bút cảm ứng. Bấm vào <b>chữ lớn</b> hoặc hàng <b>chữ mờ</b> để luyện từng nét có chấm điểm.</p>

      <div className={`kwpaper ${page === 1 ? "" : "kwhide"}`} ref={box1}>
        <Head sh={sh} />
        <PageOne sh={sh} cell={cell1} clearKey={clearKey} onPractice={onPractice} />
        {sh.notes?.map((n, i) => <p key={i} className="kwnote">{n}</p>)}
        <p className="kwfoot">©国際交流基金ベトナム日本文化交流センター</p>
      </div>
      <div className={`kwpaper ${page === 2 ? "" : "kwhide"}`} ref={box2}>
        <Head sh={sh} />
        <PageTwo sh={sh} cell={cell2} clearKey={clearKey} onPractice={onPractice} />
        <p className="kwfoot">©国際交流基金ベトナム日本文化交流センター</p>
      </div>

      <div className="kwnav noprint">
        {prev ? <Link href={`/kanji/phieu/${prev.id}`} className="chip dk" onClick={() => setPage(1)}>‹ Topic {prev.t} · phiếu {prev.p}</Link> : <span />}
        {next ? <Link href={`/kanji/phieu/${next.id}`} className="chip dk" onClick={() => setPage(1)}>Topic {next.t} · phiếu {next.p} ›</Link> : <span />}
      </div>
      {prac && <Practice w={prac} strokes={strokes} onClose={() => setPrac(null)} />}
    </div>
  );
}
