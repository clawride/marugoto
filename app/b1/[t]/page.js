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
import { shuffle, pickRand, starsFor } from "@/lib/data";
import { kanjiQs, kanjiVocab, STAR_REWARD } from "@/lib/course";
import VOCAB from "@/data/vocab.json";
import LenPicker from "@/components/course/LenPicker";
import { Stars } from "@/components/kanji/KanjiLesson";
import { Ico } from "@/components/Icons";
import { speakLines, stopSpeak, ttsAvailable } from "@/lib/tts";
import { sfx } from "@/lib/sfx";
import BookPart from "@/components/course/BookPart";
import CourseRun from "@/components/course/CourseRun";
import { B11_BOOK_COURSE } from "@/components/courses";
import Rom from "@/components/Rom";

const TABS = [["book", "📖 Học theo sách 中級1"], ["kanji", "漢 Chữ & Kanji"], ["grammar", "📐 Ngữ pháp"], ["reading", "📖 Đọc dài"], ["listening", "🎧 Nghe"]];

export default function B1Topic() {
  const { t } = useParams();
  const T = b1Topic(+t);
  const { S } = useGame();
  const [tab, setTab] = useState("book");
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
        {TABS.map(([k, l]) => <button key={k} className={`chip dk ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); stopSpeak(); sfx.click(); }}>{l}{k === "kanji" && <Stars n={S?.b1?.p?.[`${T.topic}:kanji`]?.stars} />}</button>)}
      </div>
      {tab === "book" && <BookTab T={T} />}
      {tab === "kanji" && <KanjiTab T={T} />}
      {tab === "grammar" && <GrammarTab T={T} />}
      {tab === "reading" && <ReadingTab T={T} />}
      {tab === "listening" && <ListeningTab T={T} />}
    </>
  );
}

// 📖 Học theo sách まるごと 中級1: dựng lại Topic theo đúng sách + kiểm tra dịch câu cuối bài (điểm lưu ở S.b1.book[topic])
function BookTab({ T }) {
  const { S, update } = useGame();
  const [run, setRun] = useState(null);
  const [res, setRes] = useState(null);
  const C = B11_BOOK_COURSE, book = C.books[0];
  const best = S?.b1?.book?.[T.topic];
  const stars = (p) => (p >= 95 ? 3 : p >= 80 ? 2 : p >= 60 ? 1 : 0);
  if (run) return <CourseRun course={C} qs={run} title="Kiểm tra dịch câu · sách 中級1" intro={ZL.grammar} onFinish={(c, n) => {
    const pct = Math.round((c / n) * 100);
    update((s) => { s.b1 = s.b1 || {}; s.b1.book = s.b1.book || {}; s.b1.book[T.topic] = Math.max(s.b1.book[T.topic] || 0, pct); });
    setRes({ c, n, pct }); setRun(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }} />;
  if (res) return (
    <div className="panel result">
      <ZhongliHost line={res.pct >= 80 ? ZL.ok[1] : ZL.bad[1]} />
      <h2>Kết quả kiểm tra dịch câu</h2>
      <div className="score">{res.c}<small> / {res.n}</small> <small>({res.pct}% · {"★".repeat(stars(res.pct)) || "chưa có sao"})</small></div>
      <div className="btnrow"><button className="gbtn x dark" onClick={() => setRes(null)}><span className="c" />Về bài học</button></div>
    </div>
  );
  return <BookPart course={C} book={book} lesson={T.topic} stars={best != null ? <span className="bkbest">Tốt nhất: {best}% {"★".repeat(stars(best))}</span> : null} onQuiz={(qs) => { setRes(null); setRun(qs); window.scrollTo({ top: 0, behavior: "smooth" }); }} />;
}

// 漢 Chữ & Kanji: giống phần "Chữ & Kanji" của A1 → A2-2 — danh sách từ có chữ Hán của Topic (lấy từ phiếu luyện viết 中級1) + 10 câu đọc / viết, tính sao (S.b1.p["<Topic>:kanji"])
const KANJI_LINE = "Chữ Hán như từng viên đá nền — nhớ chắc cách đọc và mặt chữ thì từ vựng mới vững. Thử sức nào.";
function KanjiTab({ T }) {
  const { S, update } = useGame();
  const [run, setRun] = useState(null);
  const [res, setRes] = useState(null);
  const [len, setLen] = useState(10);
  // toàn bộ từ vựng có chữ Hán trong bảng 語彙表 của Topic (cùng nguồn với phần Từ vựng)
  const pool = useMemo(() => kanjiVocab(VOCAB.filter((t) => t.n === T.topic).flatMap((t) => t.sections.flatMap((s) => s.words.map(([jp, kana, vi]) => ({ jp, kana, vi}))))), [T.topic]);
  const nq = len && len < pool.length ? len : pool.length;
  const key = `${T.topic}:kanji`;
  const best = S?.b1?.p?.[key];
  const finish = (c, n) => {
    const pct = Math.round((c / n) * 100), stars = starsFor(pct);
    let reward = 0;
    update((s) => {
      s.b1 = s.b1 || {}; s.b1.p = s.b1.p || {};
      const r = s.b1.p[key] || { pct: 0, stars: 0, total: 0 };
      if (stars > r.stars) { reward = (stars - r.stars) * STAR_REWARD; s.primo += reward; r.stars = stars; }
      if (pct > r.pct || (pct === r.pct && n > r.total)) { r.pct = pct; r.total = n; }
      s.b1.p[key] = r;
    });
    setRes({ c, n, pct, stars, reward }); setRun(null); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const start = () => { setRes(null); setRun(kanjiQs(null, nq, pool).map((x) => ({ type: "mc", ...x }))); sfx.open(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  if (run) return <CourseRun course={B11_BOOK_COURSE} qs={run} title="Chữ & Kanji" intro={KANJI_LINE} onFinish={finish} />;
  if (res) return (
    <div className="panel result">
      <ZhongliHost line={res.stars >= 2 ? ZL.ok[1] : res.stars === 1 ? ZL.ok[2] : ZL.bad[1]} />
      <h2>Kết quả</h2>
      <div className="bigstars">{[0, 1, 2].map((i) => <span key={i} className={i < res.stars ? "on" : ""} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>★</span>)}</div>
      <div className="score">{res.c}<small> / {res.n}</small> <small>({res.pct}%)</small></div>
      {res.reward > 0 && <div className="rew"><Ico id="pgm" /> +{res.reward} Nguyên Thạch (sao mới)</div>}
      <div className="btnrow"><button className="gbtn x dark" onClick={() => setRes(null)}><span className="c" />Về bài học</button><button className="gbtn tri" onClick={start}><span className="c" />Làm lại</button></div>
    </div>
  );
  return (
    <>
      <ZhongliHost line={KANJI_LINE} />
      <div className="panel a22start">
        <div><b>漢 Chữ & Kanji</b><span>{nq} câu đọc / chọn chữ Hán, lấy từ {pool.length} từ có chữ Hán của Topic · đúng ≥60% được 1 sao, ≥80% 2 sao, ≥95% 3 sao · mỗi sao mới +{STAR_REWARD} <Ico id="pgm" />{best ? ` · tốt nhất ${best.pct}%` : ""}</span></div>
        <button className="gbtn tri" onClick={start} disabled={pool.length < 4}><span className="c" />Bắt đầu kiểm tra</button>
      </div>
      <LenPicker value={len && len < pool.length ? len : 0} onChange={setLen} total={pool.length} />
      <Link href={`/kanji/b1/topic/${T.topic}`} className="panel kjtool" onClick={() => sfx.page()} style={{ display: "block", marginTop: 12 }}>
        <b>🈶 Kiểm tra tổng hợp · các chữ Hán của Topic {T.topic}</b>
        <span> Nghĩa, cách đọc, đặt câu, đoán chữ (tối đa 30 câu){S?.kanji?.p?.[`b1:t${T.topic}`] ? ` · tốt nhất ${S.kanji.p[`b1:t${T.topic}`].pct}%` : ""}</span>
      </Link>
      <details className="panel" style={{ marginTop: 12, padding: "10px 14px" }}>
        <summary style={{ cursor: "pointer" }}><b>Xem {pool.length} từ có chữ Hán của Topic</b></summary>
        <div className="kgrid" style={{ marginTop: 10 }}>
          {pool.map((k) => (
            <button key={k.k} className="panel kcard" onClick={() => speakLines([{ t: k.r }])}>
              <b className="jpt">{k.k}</b><span className="jpt">{k.r}</span><small>{k.vi}</small>
            </button>
          ))}
        </div>
      </details>
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
                <Rom text={`${g.point || ""} ${g.explain || ""}`} />
                {g.examples.map((e, j) => (
                  <div key={j} className="gex">
                    {ttsAvailable() && <button className="iconbtn" onClick={() => speakLines([{ sp: "A", t: e.jp }])} title="Nghe">🔊</button>}
                    <div><span className="jpt">{e.jp}</span><Rom text={e.jp} /><small>{e.vi}</small></div>
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
