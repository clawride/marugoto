"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { ZhongliHost, ZL } from "@/components/Zhongli";
import QuestionSet from "@/components/QuestionSet";
import { FillQ } from "@/components/Battle";
import ScriptPlayer from "@/components/ScriptPlayer";
import { b1Topic } from "@/lib/b1";
import { shuffle, pickRand } from "@/lib/data";
import { speakLines, stopSpeak, ttsAvailable } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const TABS = [["grammar", "📐 Ngữ pháp"], ["reading", "📖 Đọc dài"], ["listening", "🎧 Nghe"]];

export default function B1Topic() {
  const { t } = useParams();
  const T = b1Topic(+t);
  const [tab, setTab] = useState("grammar");
  useEffect(() => () => stopSpeak(), []);
  if (!T) return <p style={{ marginTop: 40 }}>Không tìm thấy Topic. <Link href="/b1">Học Viện B1-1</Link></p>;
  return (
    <>
      <Link href="/b1" className="back">‹ Học Viện B1-1</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>TOPIC {T.topic}</p>
        <h1 style={{ fontFamily: "var(--jp)" }}>{T.title}</h1>
        <p>{T.titleVi}</p>
        <div className="orn"><span /></div>
      </div>
      <div className="chips rtabs" style={{ justifyContent: "center" }}>
        {TABS.map(([k, l]) => <button key={k} className={`chip dk ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); stopSpeak(); sfx.click(); }}>{l}</button>)}
      </div>
      {tab === "grammar" && <GrammarTab T={T} />}
      {tab === "reading" && <ReadingTab T={T} />}
      {tab === "listening" && <ListeningTab T={T} />}
    </>
  );
}

function GrammarTab({ T }) {
  const { update } = useGame();
  const [open, setOpen] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState(null);
  const start = () => { setQuiz(shuffle(T.grammarQ).slice(0, 10).map((g) => ({ ...g, optsS: shuffle(g.opts) }))); setIdx(0); setScore(0); setLast(null); sfx.open(); };
  if (quiz) {
    const done = idx >= quiz.length;
    if (done) {
      const pct = Math.round((score / quiz.length) * 100);
      return (
        <div className="panel result">
          <ZhongliHost line={pct >= 80 ? ZL.ok[1] : ZL.bad[1]} />
          <h2>Kết quả luyện ngữ pháp</h2>
          <div className="score">{score}<small> / {quiz.length}</small> <small>({pct}%)</small></div>
          <div className="btnrow"><button className="gbtn x dark" onClick={() => setQuiz(null)}><span className="c" />Về bài học</button><button className="gbtn tri" onClick={start}><span className="c" />Làm lại</button></div>
        </div>
      );
    }
    const g = quiz[idx];
    return (
      <>
        <div className="stagebar"><span className="on">Luyện ngữ pháp</span><b>Câu {idx + 1}/{quiz.length} · đúng {score}</b></div>
        {/* Nghĩa tiếng Việt và tên điểm ngữ pháp chỉ hiện sau khi trả lời, để không lộ đáp án */}
        <FillQ key={idx} q={{ sub: "Chọn đáp án đúng", q: g.q, opts: g.optsS, answer: g.opts[g.a], explain: g.hint,
          after: <div className="bvi">{g.vi}{T.grammar[g.point] && <><br /><small>📐 {T.grammar[g.point].point}</small></>}</div> }}
          top={<ZhongliHost line={last === null ? ZL.grammar : pickRand(last ? ZL.ok : ZL.bad)} />}
          onScore={(ok) => { setLast(ok); if (ok) setScore((s) => s + 1); }}
          onNext={() => {
            const n = idx + 1;
            if (n >= quiz.length) {
              const pct = Math.round(((score) / quiz.length) * 100);
              update((s) => { s.b1 = s.b1 || {}; s.b1.g = s.b1.g || {}; s.b1.g[T.topic] = Math.max(s.b1.g[T.topic] || 0, pct); });
            }
            setIdx(n); setLast(null);
          }} />
      </>
    );
  }
  return (
    <>
      <ZhongliHost line={ZL.grammar} />
      <div className="glist">
        {T.grammar.map((g, i) => (
          <div key={i} className={`panel gitem ${open === i ? "open" : ""}`}>
            <button className="ghead" onClick={() => setOpen(open === i ? -1 : i)}>
              <span className="gpart">Part {g.part}</span>
              <b className="jpt">{g.point}</b>
              <span className="gvi">{g.vi}</span>
            </button>
            {open === i && (
              <div className="gbody">
                <p>{g.explain}</p>
                {g.examples.map((e, j) => (
                  <div key={j} className="gex">
                    {ttsAvailable() && <button className="iconbtn" onClick={() => speakLines([{ sp: "A", t: e.jp }])} title="Nghe">🔊</button>}
                    <div><span className="jpt">{e.jp}</span><small>{e.vi}</small></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="btnrow"><button className="gbtn tri" onClick={start}><span className="c" />Luyện tập 10 câu</button></div>
    </>
  );
}

function ReadingTab({ T }) {
  const { S, update } = useGame();
  const [i, setI] = useState(0);
  const [gl, setGl] = useState(false);
  const P = T.reading[i];
  const qs = useMemo(() => P.questions, [P]);
  return (
    <>
      <ZhongliHost line={ZL.reading} />
      <div className="chips">{T.reading.map((p, k) => <button key={k} className={`chip dk ${i === k ? "on" : ""}`} onClick={() => setI(k)}>Bài {k + 1}{S?.b1?.r?.[`${T.topic}-${k}`] != null ? ` · ${S.b1.r[`${T.topic}-${k}`]}%` : ""}</button>)}</div>
      <article className="parch reading" key={i}>
        <div className="rgenre">{P.genre}</div>
        <h2 className="jpt">{P.title}</h2>
        <div className="rtext jpt">{P.text.split("\n").map((para, k) => <p key={k}>{para}</p>)}</div>
        {P.glossary?.length > 0 && (
          <div className="glossary">
            <button className="chip" onClick={() => setGl(!gl)}>{gl ? "Ẩn" : "Xem"} từ khó ({P.glossary.length})</button>
            {gl && <div className="glist2">{P.glossary.map((w, k) => <span key={k}><b className="jpt">{w.jp}</b> <i className="jpt">{w.r}</i> — {w.vi}</span>)}</div>}
          </div>
        )}
      </article>
      <div className="parch qwrap" key={`q${i}`}>
        <QuestionSet questions={qs} onSubmit={(c, n) => update((s) => { s.b1 = s.b1 || {}; s.b1.r = s.b1.r || {}; const k = `${T.topic}-${i}`; s.b1.r[k] = Math.max(s.b1.r[k] || 0, Math.round((c / n) * 100)); })} />
      </div>
    </>
  );
}

function ListeningTab({ T }) {
  const { S, update } = useGame();
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const L = T.listening[i];
  return (
    <>
      <ZhongliHost line={ZL.listening} />
      <div className="chips">{T.listening.map((p, k) => <button key={k} className={`chip dk ${i === k ? "on" : ""}`} onClick={() => { setI(k); setDone(false); stopSpeak(); }}>Bài {k + 1}{S?.b1?.l?.[`${T.topic}-${k}`] != null ? ` · ${S.b1.l[`${T.topic}-${k}`]}%` : ""}</button>)}</div>
      <div className="parch qwrap" key={i}>
        <h3 className="jpt" style={{ margin: "0 0 4px" }}>{L.title}</h3>
        <p className="lsit">🎬 {L.situation}</p>
        <ScriptPlayer lines={L.lines} showScript={done} />
        <QuestionSet questions={L.questions} onSubmit={(c, n) => { setDone(true); update((s) => { s.b1 = s.b1 || {}; s.b1.l = s.b1.l || {}; const k = `${T.topic}-${i}`; s.b1.l[k] = Math.max(s.b1.l[k] || 0, Math.round((c / n) * 100)); }); }} />
        {done && <p className="hint">Lời thoại đã hiện phía trên — bấm ▶ để nghe lại và đối chiếu.</p>}
      </div>
    </>
  );
}
