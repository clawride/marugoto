"use client";
// Trang một bài của khóa học: 7 phần (từ vựng, nghe, kanji, đọc, ngữ pháp, điền từ, sắp xếp câu)
import { useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import CourseRun from "@/components/course/CourseRun";
import QuestionSet from "@/components/QuestionSet";
import { AudioSetup } from "@/components/Listen";
import { Ico } from "@/components/Icons";
import { PARTS, STAR_REWARD, readingOf, trackLabel, vocabQs, kanjiQs, grammarQs, fillQs, orderQs, listenQs } from "@/lib/course";
import { starsFor, shuffle } from "@/lib/data";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const Stars = ({ n = 0 }) => <span className="a22stars">{[0, 1, 2].map((i) => <i key={i} className={i < n ? "on" : ""}>★</i>)}</span>;

// Lưu kết quả một phần; thưởng Nguyên Thạch cho mỗi sao MỚI đạt được
function useSavePart(store, lesson) {
  const { update } = useGame();
  return (key, correct, total) => {
    const pct = Math.round((correct / total) * 100);
    const stars = starsFor(pct);
    let reward = 0;
    update((s) => {
      s[store] = s[store] || {}; s[store].p = s[store].p || {};
      const id = `${lesson}:${key}`;
      const r = s[store].p[id] || { pct: 0, stars: 0, total: 0 };
      if (stars > r.stars) { reward = (stars - r.stars) * STAR_REWARD; s.primo += reward; r.stars = stars; }
      if (pct > r.pct || (pct === r.pct && total > r.total)) { r.pct = pct; r.total = total; }
      s[store].p[id] = r;
    });
    return { pct, stars, reward, correct, total };
  };
}

function Result({ course, res, onAgain, onBack }) {
  const { Host, lines } = course;
  return (
    <div className="panel result">
      <Host line={res.stars >= 2 ? lines.ok[1] : res.stars === 1 ? lines.ok[2] : lines.bad[1]} />
      <h2>Kết quả</h2>
      <div className="bigstars">{[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? "on" : ""} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>★</span>)}</div>
      <div className="score">{res.correct}<small> / {res.total}</small> <small>({res.pct}%)</small></div>
      {res.reward > 0 && <div className="rew"><Ico id="pgm" /> +{res.reward} Nguyên Thạch (sao mới)</div>}
      <div className="btnrow"><button className="gbtn x dark" onClick={onBack}><span className="c" />Về bài học</button><button className="gbtn tri" onClick={onAgain}><span className="c" />Làm lại</button></div>
    </div>
  );
}

// ===== nội dung xem trước của từng phần =====
function VocabView({ L }) {
  const [f, setF] = useState("");
  const list = L.vocab.filter((v) => !f || v.jp.includes(f) || v.kana?.includes(f) || v.vi.toLowerCase().includes(f.toLowerCase()));
  return (
    <div className="panel a22list">
      <div className="a22tools"><input className="nameinp" placeholder="Tìm từ…" value={f} onChange={(e) => setF(e.target.value)} /><span>{L.vocab.length} từ</span></div>
      <div className="vtable">
        {list.map((v, i) => (
          <div key={i} className="vrow">
            <button className="spk" onClick={() => speakLines([{ t: v.kana || v.jp }])} aria-label="Nghe">🔊</button>
            <b className="jpt">{v.jp}</b><span className="jpt kana">{readingOf(v)}</span><span className="vi">{v.vi}</span><small>{v.type}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
function KanjiView({ L }) {
  return (
    <div className="kgrid">
      {L.kanji.map((k, i) => (
        <button key={i} className="panel kcard" onClick={() => speakLines([{ t: k.r }])}>
          <b className="jpt">{k.k}</b><span className="jpt">{k.r}</span><small>{k.vi}</small>
        </button>
      ))}
    </div>
  );
}
function GrammarView({ L }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="glist">
      {L.grammar.map((g, i) => (
        <div key={i} className={`panel gitem ${open === i ? "open" : ""}`}>
          <button className="ghead" onClick={() => setOpen(open === i ? -1 : i)}><b className="jpt">{g.point}</b><span className="gvi">{g.vi}</span></button>
          {open === i && (
            <div className="gbody">
              <p>{g.explain}</p>
              {g.examples.map((e, j) => (
                <div key={j} className="gex"><button className="spk" onClick={() => speakLines([{ t: e.jp }])}>🔊</button><div><span className="jpt">{e.jp}</span><small>{e.vi}</small></div></div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
function ListenView({ L, course }) {
  return (
    <>
      <AudioSetup lib={course.audio} folder={course.folder} />
      <div className="panel a22list">
        {L.listening.map((it, i) => (
          <div key={i} className="lrow"><span className="trk">{trackLabel(it)}</span><div><b className="jpt">{it.title}</b><small>{it.situation}</small></div><em>{it.questions.length} câu</em></div>
        ))}
      </div>
    </>
  );
}

function ReadingPart({ L, save, course }) {
  const { Host, lines } = course;
  const [i, setI] = useState(0);
  const [done, setDone] = useState(null);
  const R = L.reading[i];
  const qs = useMemo(() => R ? R.questions.map((q) => { const opts = shuffle(q.opts); return { ...q, opts, a: opts.indexOf(q.opts[q.a]) }; }) : [], [R]);
  if (!R) return <p>Chưa có bài đọc.</p>;
  return (
    <>
      <Host line={lines.read} />
      {L.reading.length > 1 && <div className="chips">{L.reading.map((_, k) => <button key={k} className={`chip ${k === i ? "on" : ""}`} onClick={() => { setI(k); setDone(null); }}>Bài đọc {k + 1}</button>)}</div>}
      <article className="parch reading">
        <div className="rgenre">{R.genre}</div>
        <h2 className="jpt">{R.title}</h2>
        <div className="rtext jpt">{R.text.split("\n").filter(Boolean).map((p, k) => <p key={k}>{p}</p>)}</div>
        {R.glossary?.length > 0 && (
          <details className="glossary"><summary>Xem từ khó ({R.glossary.length})</summary>
            <div className="glist2">{R.glossary.map((g, k) => <span key={k}><b className="jpt">{g.jp}</b> <i className="jpt">{g.r}</i> — {g.vi}</span>)}</div>
          </details>
        )}
      </article>
      <div className="parch qwrap">
        {/* nhiều bài đọc: tính sao theo bài đọc tốt nhất */}
        <QuestionSet key={i} questions={qs} onSubmit={(c, n) => setDone(save("read", c, n))} />
        {done && <div className="qscore">{done.reward > 0 && <><Ico id="pgm" /> +{done.reward} · </>}<Stars n={done.stars} /></div>}
      </div>
    </>
  );
}

const MAKE = {
  vocab: (L) => vocabQs(L).map((x) => ({ type: "mc", ...x })),
  kanji: (L) => kanjiQs(L).map((x) => ({ type: "mc", ...x })),
  grammar: (L) => grammarQs(L).map((x) => ({ type: "mc", ...x })),
  fill: (L) => fillQs(L).map((x) => ({ type: "fill", ...x })),
  order: (L) => orderQs(L).map((x) => ({ type: "order", ...x })),
  listen: (L) => listenQs(L).map((x) => ({ type: "listen", ...x })),
};
const VIEW = { vocab: VocabView, kanji: KanjiView, grammar: GrammarView, listen: ListenView };

export default function LessonView({ course, lesson }) {
  const { C, store, base, title, unit, Host, lines } = course;
  const L = C.lessonOf(lesson);
  const { S } = useGame();
  const [tab, setTab] = useState("vocab");
  const [run, setRun] = useState(null);
  const [res, setRes] = useState(null);
  const save = useSavePart(store, lesson);
  const counts = useMemo(() => L && Object.fromEntries(Object.entries(MAKE).map(([k, f]) => [k, f(L).length])), [L]);
  if (!L) return <p style={{ marginTop: 40 }}>Không tìm thấy bài. <Link href={base}>{title}</Link></p>;
  if (!S) return null;
  const P = S[store]?.p || {};
  const lbl = (p) => course.partLabels?.[p.key] || p.label;
  const part = PARTS.find((p) => p.key === tab);
  const start = () => { setRes(null); setRun(MAKE[tab](L)); sfx.open(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const View = VIEW[tab];
  const prev = C.lessonOf(lesson - 1), next = C.lessonOf(lesson + 1);

  return (
    <div className={`th-${store}`}>
      <Link href={base} className="back">‹ {title}</Link>
      <div className="pagehead a22head">
        <div className="tag">{course.unitTag(L)}</div>
        <h1 className="jpt">{L.title}</h1>
        <p>{L.titleVi}</p>
        {L.cando?.length > 0 && <ul className="cando">{L.cando.map((c, i) => <li key={i}>{c}</li>)}</ul>}
      </div>
      <div className="chips a22tabs">
        {PARTS.map((p) => (
          <button key={p.key} className={`chip dk ${tab === p.key ? "on" : ""}`} onClick={() => { setTab(p.key); setRun(null); setRes(null); sfx.click(); }}>
            <span className="pi">{p.ico}</span>{lbl(p)}<Stars n={P[`${lesson}:${p.key}`]?.stars} />
          </button>
        ))}
      </div>

      {tab === "read" ? <ReadingPart key={lesson} L={L} save={save} course={course} /> : res ? (
        <Result course={course} res={res} onAgain={start} onBack={() => { setRes(null); setRun(null); }} />
      ) : run ? (
        <CourseRun key={`${tab}-${lesson}`} course={course} qs={run} title={lbl(part)} intro={lines[tab]} onFinish={(c, n) => { setRes(save(tab, c, n)); setRun(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      ) : (
        <>
          <Host line={lines[tab]} />
          <div className="panel a22start">
            <div><b>{part.ico} {lbl(part)}</b><span>{counts[tab]} câu · đúng ≥60% được 1 sao, ≥80% 2 sao, ≥95% 3 sao · mỗi sao mới +{STAR_REWARD} <Ico id="pgm" /></span></div>
            <button className="gbtn tri" onClick={start} disabled={!counts[tab]}><span className="c" />Bắt đầu kiểm tra</button>
          </div>
          {View && <View L={L} course={course} />}
        </>
      )}

      <div className="btnrow a22nav">
        {prev ? <Link href={`${base}/${prev.lesson}`} className="gbtn x dark"><span className="c" />‹ {unit} {prev.lesson}</Link> : <span />}
        {next && <Link href={`${base}/${next.lesson}`} className="gbtn"><span className="c" />{unit} {next.lesson} ›</Link>}
      </div>
    </div>
  );
}
