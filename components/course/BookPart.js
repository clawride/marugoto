"use client";
// Học theo sách (Marugoto 入門 A1: 📖 かつどう Katsudou, 📘 りかい Rikai): dựng lại từng mục, từng bài tập như sách, kèm romaji + nghĩa tiếng Việt;
// lời thoại bài nghe & đáp án mở khi cần; bài tập bấm được (nối, điền, chọn, sắp xếp) và hộp ngữ pháp (Rikai).
// Cuối bài: ✍️ kiểm tra dịch câu (Nhật → Việt, Việt → Nhật, xếp câu).
// Dữ liệu: public/book/<sách>/<bài>.json (tạo bởi scripts/build-book.mjs từ data/book/*.json)
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Player, AudioSetup } from "@/components/Listen";
import { speakLines } from "@/lib/tts";
import { shuffle } from "@/lib/data";
import { sfx } from "@/lib/sfx";

const KIND = {
  "listen-say": ["👂→👄", "きいて いいましょう", "Nghe rồi nói theo"],
  listen: ["👂", "ききましょう", "Nghe"],
  pair: ["👥", "ペアで はなしましょう", "Luyện nói theo cặp"],
  read: ["📖", "よみましょう", "Đọc"],
  write: ["✏️", "かきましょう", "Viết"],
  portfolio: ["📁", "ポートフォリオに いれましょう", "Lưu vào hồ sơ học tập"],
  kana: ["あ", "もじ", "Chữ viết"],
  match: ["🔤", "", "Nối / chọn chữ cái"],
  fill: ["✏️", "", "Điền vào chỗ trống"],
  choose: ["☑️", "", "Chọn đáp án"],
  order: ["🧩", "", "Sắp xếp câu"],
  grammar: ["📐", "ぶんぽう", "Ngữ pháp"],
  other: ["•", "", ""],
};
// Tranh minh họa: ảnh いらすとや (hiển thị trực tiếp từ irasutoya.com, không sao chép) — mất mạng thì hiện emoji
export function Pic({ img, em, alt, big }) {
  const [bad, setBad] = useState(false);
  if (img && !bad) return <img className={`bkimg ${big ? "big" : ""}`} src={img} alt={alt || ""} title={alt || ""} loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} />;
  return em ? <span className="bkem" title={alt}>{em}</span> : null;
}
const Prefix = createContext("sa"); // tên file audio của sách: sa060.mp3 (Katsudou) · sc054.mp3 (Rikai)
const CIRCLED = "⓪①②③④⑤⑥⑦⑧⑨⑩";
const say = (jp) => speakLines([{ t: jp }], { rate: 0.85 });
const trackKey = (t, p = "sa") => `${p}${/^\d+_\d+$/.test(t) ? t.split("_").map(Number).join("_") : t}.mp3`; // "1_05" → "#1_5.mp3" (B1-1)
// ["061","065"] → 061…065
const tracksOf = (a = []) => {
  if (a.length === 2 && +a[1] > +a[0] && +a[1] - +a[0] < 12) return Array.from({ length: +a[1] - +a[0] + 1 }, (_, i) => String(+a[0] + i).padStart(3, "0"));
  return a;
};

function useBook(book, lesson) {
  const [B, setB] = useState(undefined);
  useEffect(() => {
    let on = true; setB(undefined);
    fetch(book.url(lesson)).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((d) => on && setB(d));
    return () => { on = false; };
  }, [book, lesson]);
  return B;
}

// ——— bài tập bấm được (sách Rikai): nối chữ cái, điền chỗ trống, chọn đáp án, sắp xếp câu ———
const norm = (x) => (x || "").replace(/[\s　。、．，]/g, "");
function OrderItem({ it, val, set, chk }) {
  const pool = useMemo(() => shuffle(it.chunks.map((c, i) => [c, i])), [it]);
  const picked = val ? val.split("|").map(Number) : [];
  const right = picked.map((i) => it.chunks[i]).join("") === it.chunks.join("");
  return (
    <div className="bkorder">
      <div className={`bkorderans jpt ${chk ? (right ? "ok" : "bad") : ""}`}>{it.pre && <span className="bkfix">{it.pre} </span>}{picked.map((i) => it.chunks[i]).join(" ") || "…"}{(it.post || it.after) && <span className="bkfix"> {it.post || it.after}</span>}</div>
      <div className="bkorderpool">
        {pool.map(([c, i]) => <button key={i} className="chip sm jpt" disabled={picked.includes(i)} onClick={() => set([...picked, i].join("|"))}>{c}</button>)}
        <button className="chip sm" onClick={() => set("")}>↺</button>
      </div>
      {chk && !right && <em className="bkexa jpt">{[it.pre, ...it.chunks, it.post || it.after].filter(Boolean).join(" ")}</em>}
    </div>
  );
}
function Exercise({ A, show }) {
  const init = () => Object.fromEntries((A.items || []).flatMap((it) =>
    A.kind === "fill" ? (it.example || []).map((j) => [`${it.no}-${j}`, it.blanks[j]])
      : it.example ? [[`${it.no}`, A.kind === "order" ? it.chunks.map((_, i) => i).join("|") : it.a]] : []));
  const [v, setV] = useState(init);
  const [chk, setChk] = useState(false);
  const set = (k, x) => { setV((o) => ({ ...o, [k]: x })); setChk(false); };
  let total = 0, ok = 0;
  const rows = A.items.map((it) => {
    const k = `${it.no}`;
    if (A.kind === "match") {
      const ex = !!it.example, right = v[k] === it.a || !!it.alt?.includes(v[k]);
      if (!ex) { total++; if (right) ok++; }
      return (
        <div key={k} className="bkex">
          <span className="bkexn">{it.no}</span>
          <span className="bkexq">{it.pic ? <span className="bkpicq">{it.em || it.img ? <Pic img={it.img} em={it.em} alt={it.pic} /> : "🖼"}<small>{it.pic}</small></span> : <><span className="jpt">{it.q?.jp}</span>{show.kana !== false && it.q?.kana && <small className="bkkana jpt">{it.q.kana}</small>}{show.vi && it.q?.vi && <small className="bkvi">{it.q.vi}</small>}</>}</span>
          <select value={v[k] || ""} disabled={ex} className={chk && !ex ? (right ? "ok" : "bad") : ""} onChange={(e) => set(k, e.target.value)}>
            <option value="">—</option>
            {(A.choices || []).map((c) => <option key={c.k} value={c.k}>{c.k} · {c.jp}</option>)}
          </select>
          {chk && !ex && !right && <em className="bkexa">→ {it.a} · {(A.choices || []).find((c) => c.k === it.a)?.jp}</em>}
        </div>
      );
    }
    if (A.kind === "fill") {
      let bi = -1;
      const parts = (it.jp || "").split(/（([①-⑳])）/);
      const nodes = parts.map((p, i) => {
        if (i % 2 === 0) return <span key={i} className="jpt">{p}</span>;
        bi++;
        const j = bi, kk = `${it.no}-${j}`, ex = (it.example || []).includes(j), ans = (it.blanks || [])[j] || "";
        const right = norm(v[kk]) === norm(ans) || (Array.isArray(it.alt?.[j]) && it.alt[j].some((x) => norm(x) === norm(v[kk])));
        if (!ex) { total++; if (right) ok++; }
        const cls = chk && !ex ? (right ? "ok" : "bad") : "";
        return (
          <span key={i} className="bkblank">
            （{A.opts?.includes(ans) // chỗ trống có đáp án trong danh sách thì chọn, còn lại thì gõ
              ? <select value={v[kk] || ""} disabled={ex} className={cls} onChange={(e) => set(kk, e.target.value)}><option value="">　</option>{A.opts.map((o) => { const c = A.choices?.find((x) => x.k === o); return <option key={o} value={o}>{c ? `${o} · ${c.jp}` : o}</option>; })}</select>
              : <input value={v[kk] || ""} disabled={ex} className={cls} size={Math.max(2, [...ans].length + 1)} onChange={(e) => set(kk, e.target.value)} />}）
            {chk && !ex && !right && <em className="bkexa jpt">{ans}</em>}
          </span>
        );
      });
      return (
        <div key={k} className="bkex fill">
          <span className="bkexn">{it.no}</span>
          <div>
            {it.sp && <b className="bksp jpt">{it.sp}：</b>}{nodes}{it.hint && <small className="bkhint jpt"> 💡 {it.hint}</small>}
            {chk && <>{it.form && <small className="bkexa jpt">→ {Array.isArray(it.form) ? it.form.join("、") : it.form}</small>}{it.kana && <small className="bkkana jpt">{it.kana}</small>}{show.ro && it.ro && <small className="bkro">{it.ro}</small>}{it.vi && <small className="bkvi">{it.vi}</small>}</>}
          </div>
        </div>
      );
    }
    if (A.kind === "choose") {
      const ex = !!it.example, right = v[k] === it.a || !!it.alt?.includes(v[k]);
      if (!ex) { total++; if (right) ok++; }
      return (
        <div key={k} className="bkex choose">
          <span className="bkexn">{it.label || it.no}</span>
          <div>
            <span className="jpt">{it.q?.jp}</span>{show.kana !== false && it.q?.kana && <small className="bkkana jpt">{it.q.kana}</small>}{show.vi && it.q?.vi && <small className="bkvi">{it.q.vi}</small>}
            <div className="bkopts2">{(it.opts || []).map((o) => <button key={o} disabled={ex} className={`chip sm jpt ${v[k] === o ? (chk ? (right ? "ok" : "bad") : "on") : ""}`} onClick={() => set(k, o)}>{o}</button>)}</div>
            {chk && !ex && !right && <em className="bkexa jpt">→ {it.a}</em>}
          </div>
        </div>
      );
    }
    if (A.kind === "order") {
      const val = v[k] || "", right = !!val && val.split("|").map((i) => it.chunks[+i]).join("") === it.chunks.join("");
      if (!it.example) { total++; if (right) ok++; }
      return (
        <div key={k} className="bkex">
          <span className="bkexn">{it.no}</span>
          <div style={{ flex: 1 }}>{it.jp && <div className="jpt bkframe">{it.jp}</div>}{it.pic && <span className="bkpicq">{it.em || it.img ? <Pic img={it.img} em={it.em} alt={it.pic} /> : "🖼"}<small>{it.pic}</small></span>}<OrderItem it={it} val={val} set={(x) => set(k, x)} chk={chk} />{show.vi && it.vi && <small className="bkvi">{it.vi}</small>}</div>
        </div>
      );
    }
    return null;
  });
  return (
    <div className="bkexs">
      {A.choices?.length > 0 && (
        <div className="bkchoices">{A.choices.map((c) => <span key={c.k}><b>{c.k}</b> <span className="jpt">{c.jp}</span>{show.kana !== false && c.kana && <small className="bkkana jpt"> ({c.kana})</small>}{show.ro && c.ro && <i> {c.ro}</i>}{show.vi && c.vi && <small> · {c.vi}</small>}</span>)}</div>
      )}
      {rows}
      <div className="bkexbar">
        <button className="gbtn sm" onClick={() => { setChk(true); if (ok === total) sfx.correct?.(); else sfx.click(); }}><span className="c" />✔ Kiểm tra</button>
        <button className="chip sm" onClick={() => { setV(init()); setChk(false); }}>Làm lại</button>
        {chk && <b className={ok === total ? "pass" : ""}>Đúng {ok}/{total}</b>}
      </div>
    </div>
  );
}
function Grammar({ list, show }) {
  return (
    <div className="bkgram">
      {list.map((g, i) => (
        <div key={i} className="bkgbox">
          <div className="bkgpat jpt">{g.pattern}</div>
          <div className="bkgvi">{g.vi}</div>
          <p>{g.explain}</p>
          {g.examples?.map((e, j) => <Line key={j} {...e} show={show} />)}
        </div>
      ))}
    </div>
  );
}

function useOpt(key, def) {
  const [v, setV] = useState(def);
  useEffect(() => { try { const s = localStorage.getItem(key); if (s != null) setV(s === "1"); } catch {} }, [key]);
  return [v, (x) => { setV(x); try { localStorage.setItem(key, x ? "1" : "0"); } catch {} }];
}

const Line = ({ jp, kana, ro: r, vi, show, slot, sp }) => (
  <div className="bkline">
    {sp && <span className="bksp jpt">{sp}</span>}
    <button className="bkspk" onClick={() => say(kana || jp)} aria-label="Nghe">🔊</button>
    <div>
      <span className="jpt bkjp">{slot ? jp.split(slot).flatMap((p, i, a) => (i < a.length - 1 ? [p, <mark key={i}>{slot}</mark>] : [p])) : jp}</span>
      {show.kana !== false && kana && <small className="bkkana jpt">{kana}</small>}
      {show.ro && r && <small className="bkro">{r}</small>}
      {show.vi && vi && <small className="bkvi">{vi}</small>}
    </div>
  </div>
);

function Script({ sc, lib, show }) {
  const [open, setOpen] = useState(false);
  const prefix = useContext(Prefix);
  return (
    <div className="bkscript">
      <div className="bkscripth">
        <b>{sc.title && !/^\d+$/.test(sc.title) ? sc.title : sc.no != null ? `Bài nghe ${sc.no}` : "Bài nghe"}{sc.audio ? ` · track ${sc.audio}` : ""}</b>
        <button className="chip sm" onClick={() => setOpen(!open)}>{open ? "Ẩn lời thoại" : "📜 Xem lời thoại"}</button>
      </div>
      {sc.audio && <Player file={trackKey(sc.audio, prefix)} lib={lib} autoPlay={false} tts={sc.lines.map((l) => ({ t: l.kana || l.jp }))} />}
      {open && sc.note && <p className="bktask">💡 {sc.note}</p>}
      {open && <div className="bkdlg">{sc.lines.map((l, i) => (
        <div key={i} className="bkturn"><span className="bksp jpt">{l.sp}</span><Line {...l} show={show} /></div>
      ))}</div>}
    </div>
  );
}

function Act({ A, lib, show }) {
  const [ico, jpName, viName] = KIND[A.kind] || KIND.other;
  const [ans, setAns] = useState(false);
  const prefix = useContext(Prefix);
  const tracks = tracksOf(A.audio);
  if (Array.isArray(A.words)) A = { ...A, words: { items: A.words } }; // Rikai: words là mảng từ
  const wordTts = A.words?.items?.map((w) => ({ t: w.jp })) || [];
  // dạng bài tập bấm được: theo kind, hoặc đoán từ câu hỏi (bài đọc có câu ○/×, chọn ngày…)
  const it0 = A.items?.[0];
  const exKind = !it0 ? null : ["match", "fill", "choose", "order"].includes(A.kind) ? A.kind
    : it0.chunks ? "order" : it0.blanks ? "fill" : it0.opts ? "choose" : A.choices && it0.a ? "match" : null;
  return (
    <div className={`bkact k-${A.kind}`}>
      <div className="bkacth">
        {(A.n > 0 || (typeof A.n === "string" && A.n)) && <span className="bkn">{A.n}</span>}{(A.sub || A.part) && <span className="bksub">{A.sub || A.part}</span>}
        <span className="bkico" title={viName}>{ico}</span>
        {jpName && <span className="bkkind"><span className="jpt">{jpName}</span> · {viName}</span>}
        {A.cando && <span className="bkcando">Can-do {A.cando}{A.cando2 ? `・${A.cando2}` : ""}</span>}
        {A.portfolio && <span className="bkcando bkpf" title="ポートフォリオに いれましょう — cất vào hồ sơ học tập">📁 portfolio</span>}
      </div>
      {A.ask && <div className="bkask"><b className="jpt">{A.ask.jp}</b>{show.kana !== false && A.ask.kana && <small className="bkkana jpt">{A.ask.kana}</small>}{A.ask.en && <i>{A.ask.en}</i>}{show.vi && <small>{A.ask.vi}</small>}</div>}
      {A.parts?.map((p, i) => <div key={i} className="bkask bkpart"><b className="jpt">{p.no} {p.jp}</b>{p.en && <i>{p.en}</i>}{show.vi && p.vi && <small>{p.vi}</small>}</div>)}
      {A.title?.jp && <div className="bkask"><b className="jpt">{A.title.jp}</b>{show.ro && A.title.ro && <i>{A.title.ro}</i>}{show.vi && A.title.vi && <small>{A.title.vi}</small>}</div>}
      {A.task && <p className="bktask">📝 {A.task}</p>}
      {A.grid?.length > 0 && <div className="bkgrid2 jpt">{A.grid.map((row, i) => <div key={i}>{[...row].map((c, j) => <span key={j}>{c}</span>)}</div>)}</div>}
      {A.steps?.map((p, i) => <div key={i} className="bkask bkpart"><b className="jpt">{p.no} {p.jp}</b>{p.en && <i>{p.en}</i>}{show.vi && p.vi && <small>{p.vi}</small>}</div>)}
      {A.table?.some((t) => !t.rows) && <ol className="bkpeople">{A.table.filter((t) => !t.rows).map((t, i) => <li key={i}><span className="jpt">{t.name || t.jp}</span>{t.pic && <small className="bkvi"> · 🖼 {t.pic}</small>}</li>)}</ol>}
      {A.table?.filter((t) => t.rows).map((t, i) => (
        <div key={i} className="bktable">
          <b className="jpt">{t.title?.jp}</b>{t.title?.vi && <small> · {t.title.vi}</small>}
          <div className="bktscroll">
            <table><tbody>{t.rows.map((r, j) => (
              <tr key={j}><th>{r.label}</th>{r.cells.map((c, k) => <td key={k}>{c && <button onClick={() => say(c.jp)}><b className="jpt">{c.jp}</b>{show.ro && <small>{c.ro}</small>}</button>}</td>)}</tr>
            ))}</tbody></table>
          </div>
        </div>
      ))}
      {A.fields?.length > 0 && <div className="bkfields">{A.fields.map((f, i) => <span key={i}><b className="jpt">{f.jp}</b>{show.ro && f.ro && <i> {f.ro}</i>}{show.vi && f.vi && <small> · {f.vi}</small>}：<u>　　　　</u></span>)}</div>}
      {tracks.length > 0 && !A.scripts?.length && (
        <div className="bktracks">{tracks.map((t) => <Player key={t} file={trackKey(t, prefix)} lib={lib} autoPlay={false} tts={wordTts} />)}</div>
      )}
      {A.words && (
        <div className="bkwords">
          {(A.words.group || A.words.verb) && (
            <div className="bkgroup">
              {A.words.group && <span className="bkgrp"><b className="jpt">{A.words.group.jp}</b>{show.ro && <small>{A.words.group.ro}</small>}{show.vi && <small>{A.words.group.vi}</small>}</span>}
              {A.words.verb && <span className="bkverb"><b className="jpt">{A.words.verb.jp}</b>{show.ro && <small>{A.words.verb.ro}</small>}{show.vi && <small>{A.words.verb.vi}</small>}</span>}
            </div>
          )}
          <div className="bkgrid">
            {A.words.items.map((w, i) => (
              <button key={i} className="bkword" onClick={() => say(w.kana || w.jp)} title="Bấm để nghe">
                {w.k && <span className="bkk">{w.k}</span>}
                {(w.em || w.img) && <span className="bkwem"><Pic img={w.img} em={w.em} alt={w.vi} /></span>}
                {w.group && <span className="bkwgrp jpt">{w.group}</span>}
                <b className="jpt">{w.jp}</b>
                {show.kana !== false && w.kana && <small className="bkkana jpt">{w.kana}</small>}
                {show.ro && w.ro && <small className="bkro">{w.ro}</small>}
                {show.vi && <small className="bkvi">{w.vi}</small>}
              </button>
            ))}
          </div>
        </div>
      )}
      {A.frame?.length > 0 && <div className="bkframes jpt">{A.frame.map((l, i) => <div key={i}>{l}</div>)}</div>}
      {A.model?.length > 0 && <div className="bkmodel">{A.model.map((m, i) => <Line key={i} {...m} show={show} />)}</div>}
      {A.text?.length > 0 && <div className="bktext">{A.text.map((t, i) => <Line key={i} {...t} show={show} />)}</div>}
      {A.notesAudio && <Player file={trackKey(A.notesAudio, prefix)} lib={lib} autoPlay={false} tts={(A.notes || []).map((n) => ({ t: n.jp }))} />}
      {A.notes?.length > 0 && <div className="bknotes">{A.notes.map((n, i) => <div key={i} className="bknote"><Line {...n} show={{ ro: show.ro, vi: true }} /></div>)}</div>}
      {A.grammar?.length > 0 && <Grammar list={A.grammar} show={show} />}
      {exKind && <Exercise A={exKind === A.kind ? A : { ...A, kind: exKind }} show={show} />}
      {A.scripts?.map((sc, i) => <Script key={i} sc={sc} lib={lib} show={show} />)}
      {A.questions?.map((q, i) => <p key={i} className="bktask">💬 <span className="jpt">{q.jp}</span>{show.vi && q.vi && <> — {q.vi}</>}</p>)}
      {(A.answer || A.model?.some((m) => m.fill)) && (
        <div className="bkanswer">
          <button className="chip sm" onClick={() => setAns(!ans)}>{ans ? "Ẩn đáp án" : "✔ Xem đáp án"}</button>
          {ans && A.answer && <p className="jpt">{A.answer}</p>}
          {ans && A.model?.some((m) => m.fill) && <p className="jpt">{A.model.filter((m) => m.fill).map((m, i) => <span key={i}>{i + 1}. {m.fill}　</span>)}</p>}
        </div>
      )}
    </div>
  );
}

// Câu hỏi kiểm tra dịch câu: Nhật → Việt, Việt → Nhật, xếp câu (câu A1 viết cách theo cụm)
export function bookQs(B, n = 12) {
  const pool = B?.quiz || [];
  const pick = shuffle(pool).slice(0, n);
  const mc = (prompt, right, wrongs, extra) => ({ prompt, opts: shuffle([right, ...shuffle([...new Set(wrongs.filter((w) => w && w !== right))]).slice(0, 3)]), answer: right, ...extra });
  return pick.map((x, i) => {
    const others = pool.filter((y) => y.jp !== x.jp);
    const chunks = x.jp.replace(/[。？！?!]$/, "").split(/[\s　]+/).filter(Boolean);
    const exp = `${x.jp}${x.kana ? `【${x.kana}】` : ""}${x.ro ? ` (${x.ro})` : ""} — ${x.vi}`;
    if (i % 3 === 2 && chunks.length >= 3 && chunks.length <= 8) return { type: "order", chunks, vi: x.vi };
    return i % 3 === 0
      ? mc(x.jp, x.vi, others.map((y) => y.vi), { sub: `Dịch câu · chọn nghĩa tiếng Việt${x.kana ? ` · đọc: ${x.kana}` : ""}`, jpPrompt: true, explain: exp })
      : mc(x.vi, x.jp, others.map((y) => y.jp), { sub: "Dịch câu · chọn câu tiếng Nhật", jpOpts: true, explain: exp });
  });
}

export default function BookPart({ course, book: bk, lesson, stars, onQuiz }) {
  const book = bk || { key: "book", ...course.book };
  const B = useBook(book, lesson);
  const [ro, setRo] = useOpt("bk_ro", true);
  const [vi, setVi] = useOpt("bk_vi", true);
  const [kana, setKana] = useOpt("bk_kana", true);
  const show = { ro, vi, kana };
  const lib = book.lib || course.audio; // A2-1: mỗi sách một thư mục audio riêng
  const hasKana = useMemo(() => JSON.stringify(B || {}).includes('"kana":'), [B]);
  if (B === undefined) return <p className="hint">Đang tải bài học…</p>;
  if (!B) return <p className="panel hint">Bài này chưa có phần học theo sách {book.short}.</p>;
  return (
    <Prefix.Provider value={(typeof book.prefix === "function" ? book.prefix(lesson) : book.prefix) || "sa"}>
    <div className="bkwrap">
      <div className="panel bkhead">
        <div className="bkbook">{book.ico || "📖"} {book.name} · だい{B.lesson}か{B.page ? ` · sách tr.${B.page}` : ""}</div>
        <h2 className="jpt">{B.title.jp}</h2>
        {B.title.kana && <div className="bkkana jpt">{B.title.kana}</div>}
        <p>{B.title.ro && <i>{B.title.ro}</i>} {B.title.vi}</p>
        {B.cando?.length > 0 && <ul className="bkcandos">{B.cando.map((c, i) => <li key={i}><span className="bkcando">{c.n ? `Can-do ${c.n}` : "Mục tiêu"}</span> <span className="jpt">{c.jp}</span> — {c.vi}</li>)}</ul>}
        {B.before?.length > 0 && <div className="bkbefore"><b className="jpt">べんきょうする まえに</b> <small>Trước khi học</small>{B.before.map((q, i) => <Line key={i} {...q} show={show} />)}</div>}
        {B.notes?.length > 0 && <div className="bkbefore bkbasic"><b className="jpt">きほんぶん</b> <small>Câu cơ bản của bài</small>{B.notes.map((q, i) => <Line key={i} {...q} show={show} />)}</div>}
        <div className="bkopts">
          {hasKana && <label><input type="checkbox" checked={kana} onChange={(e) => setKana(e.target.checked)} /> Hiện cách đọc (kana)</label>}
          <label><input type="checkbox" checked={ro} onChange={(e) => setRo(e.target.checked)} /> Hiện romaji</label>
          <label><input type="checkbox" checked={vi} onChange={(e) => setVi(e.target.checked)} /> Hiện nghĩa tiếng Việt</label>
        </div>
      </div>
      <AudioSetup lib={lib} folder={book.folder || course.folder} />
      {B.sections.map((S, si) => (
        <section key={si} className="panel bksec">
          <h3><span className="bkno">{CIRCLED[S.no] || S.no}</span> <span className="jpt">{S.title.jp}</span>{S.title.ro && <small className="bkro">{S.title.ro}</small>}<small className="bkvi">{S.title.vi}</small>{S.part && <span className="bkcando bkpart2 jpt" title={S.part.vi || ""}>{typeof S.part === "string" ? S.part : S.part.jp}</span>}{S.page && <em className="bkpage">tr.{S.page}</em>}</h3>
          {S.acts.map((A, i) => <Act key={i} A={A} lib={lib} show={show} />)}
        </section>
      ))}
      {B.culture && (
        <section className="panel bksec bkculture">
          <h3>🌏 <span className="jpt">{B.culture.title?.jp || "せいかつと ぶんか"}</span><small className="bkvi">{B.culture.title?.vi}</small></h3>
          {B.culture.intro && <p className="bktask">{typeof B.culture.intro === "string" ? B.culture.intro : <><span className="jpt">{B.culture.intro.jp}</span>{B.culture.intro.vi && <> — {B.culture.intro.vi}</>}</>}</p>}
          {(B.culture.ask || B.culture.q) && <Line {...(B.culture.ask || B.culture.q)} show={show} />}
          {B.culture.lines?.length > 0 && <div className="bkdlg">{B.culture.lines.map((l, i) => <div key={i} className="bkturn"><span className="bksp jpt">{l.sp}</span><Line {...l} sp={undefined} show={show} /></div>)}</div>}
          {B.culture.choices?.length > 0 && <div className="bktext">{B.culture.choices.map((c, i) => <div key={i} className="bkline"><b className="bkk" style={{ position: "static" }}>{c.k}</b><Line {...c} show={show} /></div>)}</div>}
          {B.culture.vi && <p className="bktask">{B.culture.vi}</p>}
          {B.culture.note && <p className="bktask">💡 {typeof B.culture.note === "string" ? B.culture.note : B.culture.note.vi}</p>}
          {B.culture.text?.length > 0 && <div className="bktext">{B.culture.text.map((t, i) => <Line key={i} {...t} show={show} />)}</div>}
          {B.culture.items?.length > 0 && <ol>{B.culture.items.map((it, i) => <li key={i}>{it.jp && <span className="jpt">{it.jp} </span>}{it.kana && show.kana !== false && <small className="bkkana jpt">{it.kana}</small>}{it.vi}</li>)}</ol>}
          {B.culture.pics?.length > 0 && <ul className="bkpics">{B.culture.pics.map((p, i) => <li key={i}>🖼 {p}</li>)}</ul>}
          {B.culture.questions?.map((q, i) => <p key={i} className="bktask">💬 {q.jp && <span className="jpt">{q.jp} </span>}{q.vi}</p>)}
        </section>
      )}
      <div className="panel bkquiz">
        <div><b>✍️ Kiểm tra dịch câu</b><span>{Math.min(12, B.quiz?.length || 0)} câu lấy từ bài vừa học trong sách {book.short}: chọn nghĩa tiếng Việt, chọn câu tiếng Nhật, xếp lại câu · đúng ≥60% được 1 sao, ≥80% 2 sao, ≥95% 3 sao</span></div>
        {stars}
        <button className="gbtn tri" onClick={() => { sfx.open(); onQuiz(bookQs(B)); }} disabled={!B.quiz?.length}><span className="c" />Bắt đầu kiểm tra</button>
      </div>
      {JSON.stringify(B).includes('"img":') && <p className="hint bkcredit">Tranh minh họa: <a href="https://www.irasutoya.com/" target="_blank" rel="noreferrer">いらすとや</a> (hiển thị trực tiếp từ trang gốc; khi không có mạng sẽ hiện biểu tượng thay thế).</p>}
      {book.check && (
        <Link href={`${book.check}#l${B.lesson}`} className="panel bkquiz bkchecklink">
          <div><b>✅ <span className="jpt">にほんごチェック</span> · だい{B.lesson}か</b><span>Tự chấm sao các câu cơ bản của bài này và tập trả lời câu hỏi 「にほんごで いいましょう」{book.checkPages ? ` (sách tr.${book.checkPages})` : ""}</span></div>
        </Link>
      )}
      {book.kiroku && (
        <Link href={`${book.kiroku}#t${B.lesson}`} className="panel bkquiz bkchecklink">
          <div><b>📒 <span className="jpt">学習記録シート</span> · Topic {B.lesson}</b><span>Tự đánh giá 5 Can-do của Topic này (★ まだ難しかった → ★★★ 十分にできた), ghi わたしだけのフレーズ và nhật ký trải nghiệm tiếng Nhật{book.kirokuPages ? ` (sách tr.${book.kirokuPages})` : ""}</span></div>
        </Link>
      )}
    </div>
    </Prefix.Provider>
  );
}
