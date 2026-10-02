"use client";
// Một câu tiếng Nhật trong Thư viện sách: chữ Nhật (có furigana) · phiên âm Latinh · dịch tiếng Việt · tách từ · ngữ pháp
// s = { jp, ro, vi, words: [{ w, r, ro, pos, base, vi }], grammar: [{ p, vi }], pt }
import { useEffect, useState } from "react";
import { speakLines, stopSpeak } from "@/lib/tts";

const KANJI = /[㐀-鿿々〆ヶ]/;
const toHira = (s) => (s || "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
export const say = (t) => speakLines([{ t }], { rate: 0.85 });

// ——— cài đặt hiển thị (lưu trên máy) ———
const VKEY = "lib_view";
const VDEF = { furi: true, ro: true, vi: true, words: false };
const subs = new Set();
let V = null;
function readV() {
  if (V) return V;
  try { V = { ...VDEF, ...JSON.parse(localStorage.getItem(VKEY) || "{}") }; } catch { V = { ...VDEF }; }
  return V;
}
export function useLibView() {
  const [v, setV] = useState(VDEF);
  useEffect(() => { setV(readV()); const f = (x) => setV(x); subs.add(f); return () => subs.delete(f); }, []);
  const set = (k, x) => { V = { ...readV(), [k]: x }; try { localStorage.setItem(VKEY, JSON.stringify(V)); } catch {} subs.forEach((f) => f(V)); };
  return [v, set];
}
export function ViewBar() {
  const [v, set] = useLibView();
  const T = [["furi", "Furigana"], ["ro", "Latinh"], ["vi", "Tiếng Việt"], ["words", "Mở sẵn tách từ"]];
  return (
    <div className="lbview" role="group" aria-label="Hiển thị">
      <span>Hiển thị:</span>
      {T.map(([k, l]) => <button key={k} className={`chip sm ${v[k] ? "on" : ""}`} aria-pressed={v[k]} onClick={() => set(k, !v[k])}>{v[k] ? "✓ " : ""}{l}</button>)}
    </div>
  );
}

// furigana cho một từ: chỉ đặt trên phần chữ Hán, bỏ phần kana giống nhau ở đầu/cuối (申します/もうします → 申[もう]します)
function Ruby({ w, r }) {
  if (!r || !KANJI.test(w)) return w;
  const R = toHira(r);
  let a = 0, b = 0;
  while (a < w.length && a < R.length && !KANJI.test(w[a]) && toHira(w[a]) === R[a]) a++;
  while (b < w.length - a && b < R.length - a && !KANJI.test(w[w.length - 1 - b]) && toHira(w[w.length - 1 - b]) === R[R.length - 1 - b]) b++;
  const mid = w.slice(a, w.length - b), rm = R.slice(a, R.length - b);
  if (!mid || !rm || toHira(mid) === rm) return w;
  return <>{w.slice(0, a)}<ruby>{mid}<rt>{rm}</rt></ruby>{w.slice(w.length - b)}</>;
}

const PUNCT = /^[\s、。！？!?「」『』（）()・…〜～ー:：，,.．\-—/]+$/;
export const isPunct = (w) => PUNCT.test(w);

// chữ Nhật có furigana: dùng danh sách từ nếu nối lại khớp câu gốc, không thì hiện câu gốc
export function JpText({ s, furi = true }) {
  const ws = s.words || [];
  const clean = (x) => (x || "").replace(/\s/g, "");
  if (!furi || !ws.length || clean(ws.map((w) => w.w).join("")) !== clean(s.jp)) return <>{s.jp}</>;
  return <>{ws.map((w, i) => <span key={i}><Ruby w={w.w} r={w.r} /></span>)}</>;
}

export function WordTable({ words }) {
  const list = (words || []).filter((w) => !isPunct(w.w));
  if (!list.length) return null;
  return (
    <div className="lbwords">
      {list.map((w, i) => (
        <button key={i} className="lbw" onClick={() => say(w.r || w.w)} title="Bấm để nghe">
          <b className="jpt">{w.w}</b>
          {w.r && w.r !== w.w && <span className="jpt lbwr">{w.r}</span>}
          <i>{w.ro}</i>
          <span className="lbwv">{w.vi}</span>
          {(w.pos || (w.base && w.base !== w.w)) && <small>{[w.pos, w.base && w.base !== w.w ? `← ${w.base}` : ""].filter(Boolean).join(" · ")}</small>}
        </button>
      ))}
    </div>
  );
}

export default function Sentence({ s, no, speaker, defaultOpen = null }) {
  const [v] = useLibView();
  const [open, setOpen] = useState(defaultOpen); // null = theo cài đặt chung
  const show = open ?? v.words;
  const hasMore = (s.words || []).length > 0 || (s.grammar || []).length > 0 || s.pt;
  return (
    <div className="lbsent">
      <div className="lbjp">
        {no != null && <span className="lbno">{no}</span>}
        {speaker && <span className="lbsp">{speaker}</span>}
        <span className="jpt lbtext">{<JpText s={s} furi={v.furi} />}</span>
        <button className="lbspk" onClick={() => say(s.jp)} aria-label="Nghe câu này" title="Nghe">🔊</button>
      </div>
      {v.ro && s.ro && <div className="lbro">{s.ro}</div>}
      {v.vi && s.vi && <div className="lbvi">{s.vi}</div>}
      {hasMore && <button className="lbmore" onClick={() => setOpen(!show)} aria-expanded={show}>{show ? "▾ Ẩn phân tích" : "▸ Tách từ & ngữ pháp"}</button>}
      {show && (
        <div className="lbana">
          <WordTable words={s.words} />
          {s.pt && <p className="lbpt">📐 {s.pt}</p>}
          {(s.grammar || []).map((g, i) => <p key={i} className="lbpt"><b className="jpt">📐 {g.p}</b> — {g.vi}</p>)}
        </div>
      )}
    </div>
  );
}

export { stopSpeak };
