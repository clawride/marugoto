"use client";
// Thẻ một chữ Hán: nghĩa tiếng Việt · âm On/Kun · cấu tạo (bộ chỉ nghĩa / phần chỉ âm) · mẹo nhớ · mẹo đọc · từ · câu ví dụ · chữ dễ nhầm
import Link from "next/link";
import { KIDX, COMPS, compName, compLabel, kunParts, toHira, levelOf } from "@/lib/kanjiProg";
import { speakLines } from "@/lib/tts";

const say = (t) => speakLines([{ t }], { rate: 0.85 });
const POS = { left: "bên trái", right: "bên phải", top: "phía trên", bottom: "phía dưới", tare: "bao trên-trái", nyo: "bao dưới-trái", kamae: "bao ngoài", nyoc: "bao dưới-trái" };

export const kanjiHref = (k) => `/kanji/c/${encodeURIComponent(k)}`;

// Từ có chữ đang học được tô đậm; cách đọc tô đậm phần của chữ đó
export function WordLine({ w, k }) {
  const r = w.r || w.w;
  const i = w.kr ? r.indexOf(w.kr) : -1;
  return (
    <li className="kjword">
      <button className="spk" onClick={() => say(r)} aria-label="Nghe">🔊</button>
      <span className="jpt kjw">{[...w.w].map((c, j) => <span key={j} className={c === k ? "hl" : ""}>{c}</span>)}</span>
      <span className="jpt kjr">{i < 0 ? r : <>{r.slice(0, i)}<b>{w.kr}</b>{r.slice(i + w.kr.length)}</>}</span>
      <span className="kjv">{w.vi}</span>
    </li>
  );
}

export function KunLabel({ r }) {
  const [a, b] = kunParts(r);
  return <span className="jpt kun">{a}{b && <small>{b}</small>}</span>;
}

export default function KanjiCard({ E, compact = false }) {
  if (!E) return null;
  const L = levelOf(E.lv);
  return (
    <article className="panel kjcard">
      <div className="kjtop">
        <button className="kjglyph jpt" onClick={() => say(E.words?.[0]?.r || toHira(E.on?.[0] || "") || E.k)} title="Bấm để nghe">{E.k}</button>
        <div className="kjhead">
          <div className="kjvi">{E.vi}</div>
          <div className="kjmeta">{E.sc} nét{E.jlpt ? ` · JLPT cũ N${E.jlpt}` : ""}{L ? ` · ${L.ico} ${L.name}` : ""}</div>
          <div className="kjreads">
            {E.on?.length > 0 && <div><i>On</i>{E.on.map((o) => <button key={o} className="chip sm jpt" onClick={() => say(toHira(o))}>{o}</button>)}</div>}
            {E.kun?.length > 0 && <div><i>Kun</i>{E.kun.map((r) => <button key={r} className="chip sm" onClick={() => say(kunParts(r).join(""))}><KunLabel r={r} /></button>)}</div>}
          </div>
        </div>
      </div>

      {E.comps?.length > 0 && (
        <div className="kjsec">
          <h4>🧩 Cấu tạo</h4>
          <div className="kjcomps">
            {E.comps.filter((c) => c.el).map((c, i) => (
              <span key={i} className={`kjcomp ${c.rad ? "rad" : ""} ${c.phon ? "phon" : ""}`}>
                <b className="jpt">{c.el}</b>
                <span>{compLabel(c.el)}</span>
                <small>{[POS[c.pos], c.rad && "chỉ nghĩa", c.phon && "chỉ âm"].filter(Boolean).join(" · ")}</small>
              </span>
            ))}
          </div>
          <p>{E.explain}</p>
        </div>
      )}
      {!E.comps?.length && <div className="kjsec"><h4>🧩 Cấu tạo</h4><p>{E.explain}</p></div>}

      <div className="kjsec memo"><h4>🧠 Mẹo nhớ</h4><p>{E.mnemonic}</p></div>
      <div className="kjsec tip">
        <h4>💡 Mẹo đọc</h4>
        <p>{E.tip}</p>
        {E.fam?.members?.length > 0 && (
          <div className="kjfam">
            <span>Cùng phần <b className="jpt">{E.fam.phon}</b>{E.fam.phonOn?.[0] ? <> ({E.fam.phonOn[0]})</> : null}:</span>
            {E.fam.members.slice(0, 8).map((m) => (
              <Link key={m.k} href={kanjiHref(m.k)} className="chip sm"><b className="jpt">{m.k}</b> {m.on?.[0] || ""}</Link>
            ))}
          </div>
        )}
      </div>

      {E.words?.length > 0 && (
        <div className="kjsec"><h4>📚 Từ vựng</h4><ul className="kjwords">{E.words.map((w) => <WordLine key={w.w} w={w} k={E.k} />)}</ul></div>
      )}
      {!compact && E.ex?.length > 0 && (
        <div className="kjsec"><h4>✏️ Câu ví dụ</h4>
          {E.ex.map((e, i) => (
            <p key={i} className="kjex"><button className="spk" onClick={() => say(e.jp)}>🔊</button> <span className="jpt">{e.jp.split(e.w).flatMap((p, j, a) => (j < a.length - 1 ? [p, <b key={j}>{e.w}</b>] : [p]))}</span><br /><small>{e.vi}</small></p>
          ))}
        </div>
      )}
      {E.similar?.length > 0 && (
        <div className="kjsec"><h4>👀 Dễ nhầm với</h4>
          {E.similar.map((s) => (
            <p key={s.k} className="kjsim">
              {KIDX[s.k] ? <Link href={kanjiHref(s.k)} className="jpt">{s.k}</Link> : <b className="jpt">{s.k}</b>}
              {KIDX[s.k] && <small> {KIDX[s.k][0]}</small>} — {s.note}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
