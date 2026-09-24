"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { NahidaHost, ND } from "@/components/Nahida";
import A22Run from "@/components/A22Run";
import QuestionSet from "@/components/QuestionSet";
import { AudioSetup } from "@/components/Listen";
import { Ico } from "@/components/Icons";
import { A22_AUDIO } from "@/lib/audioLib";
import { a22Lesson, readingOf, A22, PARTS, STAR_REWARD, vocabQs, kanjiQs, grammarQs, fillQs, orderQs, listenQs } from "@/lib/a22";
import { starsFor, shuffle } from "@/lib/data";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const Stars = ({ n = 0 }) => <span className="a22stars">{[0, 1, 2].map((i) => <i key={i} className={i < n ? "on" : ""}>★</i>)}</span>;

// Lưu kết quả một phần; thưởng Nguyên Thạch cho mỗi sao MỚI đạt được
function useSavePart(lesson) {
  const { update } = useGame();
  return (key, correct, total) => {
    const pct = Math.round((correct / total) * 100);
    const stars = starsFor(pct);
    let reward = 0;
    update((s) => {
      s.a22 = s.a22 || {}; s.a22.p = s.a22.p || {};
      const id = `${lesson}:${key}`;
      const r = s.a22.p[id] || { pct: 0, stars: 0, total: 0 };
      if (stars > r.stars) { reward = (stars - r.stars) * STAR_REWARD; s.primo += reward; r.stars = stars; }
      if (pct > r.pct || (pct === r.pct && total > r.total)) { r.pct = pct; r.total = total; }
      s.a22.p[id] = r;
    });
    return { pct, stars, reward, correct, total };
  };
}

function Result({ res, onAgain, onBack }) {
  return (
    <div className="panel result">
      <NahidaHost line={res.stars >= 2 ? ND.ok[1] : res.stars === 1 ? ND.ok[2] : ND.bad[1]} />
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
function ListenView({ L }) {
  return (
    <>
      <AudioSetup lib={A22_AUDIO} folder="New Marugoto A2-2 audio" />
      <div className="panel a22list">
        {L.listening.map((it, i) => (
          <div key={i} className="lrow"><span className="trk">{it.src === "R" ? "Rikai" : "Katsudou"} {it.track}</span><div><b className="jpt">{it.title}</b><small>{it.situation}</small></div><em>{it.questions.length} câu</em></div>
        ))}
      </div>
    </>
  );
}

function ReadingPart({ L, save }) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(null);
  const R = L.reading[i];
  const qs = useMemo(() => R ? R.questions.map((q) => { const opts = shuffle(q.opts); return { ...q, opts, a: opts.indexOf(q.opts[q.a]) }; }) : [], [R]);
  if (!R) return <p>Chưa có bài đọc.</p>;
  return (
    <>
      <NahidaHost line={ND.read} />
      {L.reading.length > 1 && <div className="chips">{L.reading.map((_, k) => <button key={k} className={`chip ${k === i ? "on" : ""}`} onClick={() => { setI(k); setDone(null); }}>Bài {k + 1}</button>)}</div>}
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

export default function A22LessonPage() {
  const { l } = useParams();
  const lesson = +l;
  const L = a22Lesson(lesson);
  const { S } = useGame();
  const [tab, setTab] = useState("vocab");
  const [run, setRun] = useState(null);
  const [res, setRes] = useState(null);
  const save = useSavePart(lesson);
  if (!L) return <p style={{ marginTop: 40 }}>Không tìm thấy bài. <Link href="/a22">Marugoto A2-2</Link></p>;
  if (!S) return null;
  const P = S.a22?.p || {};
  const part = PARTS.find((p) => p.key === tab);
  const start = () => { setRes(null); setRun(MAKE[tab](L)); sfx.open(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const View = VIEW[tab];
  const prev = A22.find((x) => x.lesson === lesson - 1), next = A22.find((x) => x.lesson === lesson + 1);

  return (
    <>
      <Link href="/a22" className="back">‹ Marugoto A2-2</Link>
      <div className="pagehead a22head">
        <div className="tag">TOPIC {L.topic} · {L.topicTitle} · だい{lesson}か</div>
        <h1 className="jpt">{L.title}</h1>
        <p>{L.titleVi}</p>
        {L.cando?.length > 0 && <ul className="cando">{L.cando.map((c, i) => <li key={i}>{c}</li>)}</ul>}
      </div>
      <div className="chips a22tabs">
        {PARTS.map((p) => (
          <button key={p.key} className={`chip dk ${tab === p.key ? "on" : ""}`} onClick={() => { setTab(p.key); setRun(null); setRes(null); sfx.click(); }}>
            <span className="pi">{p.ico}</span>{p.label}<Stars n={P[`${lesson}:${p.key}`]?.stars} />
          </button>
        ))}
      </div>

      {tab === "read" ? <ReadingPart key={lesson} L={L} save={save} /> : res ? (
        <Result res={res} onAgain={start} onBack={() => { setRes(null); setRun(null); }} />
      ) : run ? (
        <A22Run key={`${tab}-${lesson}`} qs={run} title={part.label} intro={ND[tab]} onFinish={(c, n) => { setRes(save(tab, c, n)); setRun(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      ) : (
        <>
          <NahidaHost line={ND[tab]} />
          <div className="panel a22start">
            <div><b>{part.ico} {part.label}</b><span>{Math.min(part.n, MAKE[tab](L).length)} câu · đúng ≥60% được 1 sao, ≥80% 2 sao, ≥95% 3 sao · mỗi sao mới +{STAR_REWARD} <Ico id="pgm" /></span></div>
            <button className="gbtn tri" onClick={start} disabled={!MAKE[tab](L).length}><span className="c" />Bắt đầu kiểm tra</button>
          </div>
          {View && <View L={L} />}
        </>
      )}

      <div className="btnrow a22nav">
        {prev ? <Link href={`/a22/${prev.lesson}`} className="gbtn x dark"><span className="c" />‹ Bài {prev.lesson}</Link> : <span />}
        {next && <Link href={`/a22/${next.lesson}`} className="gbtn"><span className="c" />Bài {next.lesson} ›</Link>}
      </div>
    </>
  );
}
