"use client";
// Trang một bài của khóa học: 7 phần (từ vựng, nghe, kanji, đọc, ngữ pháp, điền từ, sắp xếp câu)
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import CourseRun from "@/components/course/CourseRun";
import QuestionSet from "@/components/QuestionSet";
import { AudioSetup } from "@/components/Listen";
import { Ico } from "@/components/Icons";
import BookPart from "@/components/course/BookPart";
import LenPicker from "@/components/course/LenPicker";
import { PARTS, STAR_REWARD, readingOf, trackLabel, vocabQs, kanjiQs, kanjiVocab, grammarQs, fillQs, orderQs, listenQs } from "@/lib/course";
import { starsFor, shuffle } from "@/lib/data";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";
import Rom from "@/components/Rom";
import LessonTabs from "@/components/course/LessonTabs";
import StudyContents from "@/components/course/StudyContents";

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
function VocabView({ L, showMeaning = true, showRomaji = false }) {
  const [f, setF] = useState("");
  const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const list = L.vocab.filter((v) => !f || [v.jp, v.kana, v.vi, ...(v.usage || [])].some((s) => s && normalize(s).includes(normalize(f))));
  return (
    <div className="panel a22list">
      <div className="a22tools"><label className="vocab-search"><span>Tìm từ trong bài</span><input type="search" className="nameinp" placeholder="Nhập tiếng Nhật hoặc nghĩa tiếng Việt…" value={f} onChange={(e) => setF(e.target.value)} /></label><span aria-live="polite">{list.length}/{L.vocab.length} từ</span></div>
      <div className="vtable">
        {list.map((v, i) => (
          <div key={i} className="vrow vocab-row">
            <button className="spk" onClick={() => speakLines([{ t: v.kana || v.jp }])} aria-label={`Nghe ${v.jp}`}>🔊</button>
            <div className="vocab-word"><b className="jpt">{v.jp}</b>{readingOf(v) && <span className="jpt kana">{readingOf(v)}</span>}{v.usage?.map((u) => <span key={u} className="vocab-usage jpt">{u}</span>)}{showRomaji && <Rom text={v.kana || v.jp} />}</div>
            {showMeaning && <span className="vi">{v.vi}</span>}<small className="vocab-type">{v.type}</small>
          </div>
        ))}
        {!list.length && <p role="status" className="hint">Chưa tìm thấy từ phù hợp. Thử cách đọc kana hoặc một phần nghĩa tiếng Việt.</p>}
      </div>
    </div>
  );
}
function KanjiView({ L, kpool }) {
  const list = kpool || L.kanji; // B1-2: hiện toàn bộ từ có chữ Hán của bài
  return (
    <div className="kgrid">
      {list.map((k, i) => (
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
              <Rom text={`${g.point || ""} ${g.explain || ""}`} />
              {g.examples.map((e, j) => (
                <div key={j} className="gex"><button className="spk" onClick={() => speakLines([{ t: e.jp }])}>🔊</button><div><span className="jpt">{e.jp}</span><Rom text={e.jp} /><small>{e.vi}</small></div></div>
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
      {(course.audioSetups || [{ lib: course.audio, folder: course.folder }]).map((a) => <AudioSetup key={a.folder} lib={a.lib} folder={a.folder} />)}
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

// 📘 Nội dung bài (khóa có course.study): đọc trước khi làm kiểm tra — mẫu câu kèm giải thích & ví dụ, hội thoại có nút nghe, bài đọc, từ vựng
// bật/tắt hiển thị, nhớ lựa chọn trong trình duyệt
function useShow(key, def = true) {
  const [v, setV] = useState(def);
  useEffect(() => { try { const s = localStorage.getItem(key); if (s != null) setV(s === "1"); } catch {} }, [key]);
  return [v, (x) => { setV(x); try { localStorage.setItem(key, x ? "1" : "0"); } catch {} }];
}
function StudyView({ L, onPractice }) {
  const say = (t) => speakLines([{ t }], { rate: 0.85 });
  const [ro, setRo] = useShow("st_ro", true);
  const [vi, setVi] = useShow("st_vi", true);
  const R = ({ text }) => (ro ? <Rom text={text} /> : null);
  const prefix = `study-${L.lesson}`;
  return (
    <div className="study-layout">
      <StudyContents lesson={L} prefix={prefix} />
      <div className="studyview">
      <div className="panel bkopts stopts">
        <label><input type="checkbox" checked={ro} onChange={(e) => setRo(e.target.checked)} /> Hiện phiên âm Latinh (romaji)</label>
        <label><input type="checkbox" checked={vi} onChange={(e) => setVi(e.target.checked)} /> Hiện nghĩa tiếng Việt của câu</label>
      </div>
      <section className="panel stsec" id={`${prefix}-grammar`} data-study-anchor>
        <h2>📐 文型・例文 <small>Mẫu câu và ví dụ</small></h2>
        {L.grammar.map((g, i) => (
          <div key={i} className="stgram" id={`${prefix}-grammar-${i}`} data-study-anchor>
            <div className="stpat"><b className="jpt">{g.point}</b><span>{g.vi}</span></div>
            <p>{g.explain}</p>
            <R text={`${g.point || ""} ${g.explain || ""}`} />
            {g.examples.map((e, j) => (
              <div key={j} className="gex"><button className="spk" onClick={() => say(e.jp)} aria-label="Nghe">🔊</button><div><span className="jpt">{e.jp}</span><R text={e.jp} />{vi && <small>{e.vi}</small>}</div></div>
            ))}
          </div>
        ))}
      </section>

      {!!L.reference?.length && <section className="panel stsec" id={`${prefix}-reference`} data-study-anchor>
        <h2>🗂 Bảng ghi nhớ</h2>
        {L.reference.map((table, i) => <div className="study-reference" key={i}>
          <h3>{table.title}</h3>
          <div className="reference-scroll" role="region" tabIndex={0} aria-label={table.title}>
            <table><caption className="sr-only">{table.title}</caption><thead><tr>{table.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
              <tbody>{table.rows.map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k}><span>{cell}</span>{ro && /[ぁ-ヿ一-鿿]/.test(cell) && <R text={cell} />}</td>)}</tr>)}</tbody>
            </table>
          </div>{table.note && <p className="study-note">{table.note}</p>}
        </div>)}
      </section>}

      <section className="panel stsec" id={`${prefix}-dialogue`} data-study-anchor>
        <h2>💬 会話 <small>Hội thoại · bấm 🔊 để nghe</small></h2>
        {L.listening.map((it, i) => (
          <div key={i} className="stdlg" id={`${prefix}-dialogue-${i}`} data-study-anchor>
            <div className="stdh"><b>{it.title}</b><button className="chip sm" onClick={() => speakLines(it.tts, { rate: 0.85 })}>▶ Nghe cả hội thoại</button></div>
            <p className="lsit">🎬 {it.situation}</p>
            <div className="stlines">
              {it.tts.map((l, k) => (
                <div key={k} className="stline"><b className="stsp">{l.sp}</b><button className="spk" onClick={() => say(l.t)} aria-label="Nghe">🔊</button><div><span className="jpt">{l.t}</span><R text={l.t} />{vi && l.vi && <small className="stvi">{l.vi}</small>}</div></div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {L.reading?.map((RD, i) => (
        <section key={i} className="panel stsec" id={`${prefix}-reading-${i}`} data-study-anchor>
          <h2>📖 Bài đọc <small>{RD.title}</small></h2>
          <div className="parch stread"><div className="rtext jpt">{RD.text.split("\n").filter(Boolean).map((p, k) => <div key={k}><p>{p}</p><R text={p} /></div>)}</div></div>
          {RD.glossary?.length > 0 && <div className="glist2">{RD.glossary.map((g, k) => <span key={k}><b className="jpt">{g.jp}</b> <i className="jpt">{g.r}</i>{vi && <> — {g.vi}</>}</span>)}</div>}
        </section>
      ))}

      <section className="panel stsec" id={`${prefix}-vocab`} data-study-anchor>
        <h2>🈶 Từ vựng <small>{L.vocab.length} từ</small></h2>
        <VocabView L={L} showMeaning={vi} showRomaji={ro} />
      </section>
      <section className="panel stsec study-practice" id={`${prefix}-practice`} data-study-anchor>
        <h2>🧩 Luyện sắp xếp câu <small>{L.order.length} câu mẫu</small></h2>
        <p>Đọc nghĩa rồi thử tự ghép các cụm từ. Mở câu mẫu để đối chiếu hoặc vào phần luyện tập để làm bài lấy sao.</p>
        {L.order.map((q, i) => <details key={i}><summary>Câu {i + 1}{vi ? ` · ${q.vi}` : " · Xem câu mẫu"}</summary><p className="jpt">{q.chunks.join(" ")}</p><R text={q.chunks.join(" ")} /></details>)}
        <button type="button" className="gbtn tri" onClick={onPractice}>Luyện sắp xếp câu</button>
      </section>
      <p className="hint" style={{ textAlign: "center" }}>Học xong thì chọn từng phần phía trên (Từ vựng, Nghe, Kanji, Điền từ, Sắp xếp câu…) để làm kiểm tra lấy sao.</p>
      </div>
    </div>
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
  // khóa có sách (A1 かつどう): thẻ đầu tiên "📖 Học theo sách", mở sẵn khi vào bài
  const books = course.books || (course.book ? [{ key: "book", ico: "📖", ...course.book }] : []);
  const tabs = [...(course.study ? [{ key: "study", label: "Nội dung bài", ico: "📘" }] : []), ...books.map((b) => ({ key: b.key, label: `Học theo sách ${b.short}`, ico: b.ico })), ...PARTS];
  const [tab, setTab] = useState(course.study ? "study" : books[0]?.key || "vocab");
  const bookTab = books.find((b) => b.key === tab);
  const [run, setRun] = useState(null);
  const [res, setRes] = useState(null);
  const [klen, setKlen] = useState(10);
  const save = useSavePart(store, lesson);
  const counts = useMemo(() => L && Object.fromEntries(Object.entries(MAKE).map(([k, f]) => [k, f(L).length])), [L]);
  // khóa có course.kanjiAll (B1-2): phần Kanji kiểm tra TOÀN BỘ từ vựng có chữ Hán của bài, chọn 10 · 20 · 30 · toàn bộ câu
  const kpool = useMemo(() => (L && course.kanjiAll ? kanjiVocab(L.vocab) : null), [L, course.kanjiAll]);
  const kn = kpool ? (klen && klen < kpool.length ? klen : kpool.length) : 0;
  if (kpool && counts) counts.kanji = kn;
  // phần Từ vựng của mọi khóa: chọn 10 · 20 · 30 · toàn bộ từ của bài
  const [vlen, setVlen] = useState(10);
  const vtotal = useMemo(() => (L ? new Set(L.vocab.map((v) => v.jp)).size : 0), [L]);
  const vn = vtotal ? (vlen && vlen < vtotal ? vlen : vtotal) : 0;
  if (vtotal && counts) counts.vocab = vn;
  if (!L) return <p style={{ marginTop: 40 }}>Không tìm thấy bài. <Link href={base}>{title}</Link></p>;
  if (!S) return null;
  const P = S[store]?.p || {};
  const lbl = (p) => course.partLabels?.[p.key] || p.label;
  const part = tabs.find((p) => p.key === tab);
  const start = () => { setRes(null); setRun(tab === "kanji" && kpool ? kanjiQs(L, kn, kpool).map((x) => ({ type: "mc", ...x })) : tab === "vocab" && vtotal ? vocabQs(L, vn).map((x) => ({ type: "mc", ...x })) : MAKE[tab](L)); sfx.open(); window.scrollTo({ top: 0, behavior: "smooth" }); };
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
      <LessonTabs tabs={tabs} active={tab} label={lbl} record={P} lesson={lesson} onChange={(key) => { setTab(key); setRun(null); setRes(null); sfx.click(); }} />

      {bookTab && !run && !res ? <BookPart key={`${bookTab.key}-${lesson}`} course={course} book={bookTab} lesson={lesson} stars={<Stars n={P[`${lesson}:${bookTab.key}`]?.stars} />} onQuiz={(qs) => { setRes(null); setRun(qs); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      : tab === "study" ? <><Host line={lines.hub?.[0]} /><StudyView L={L} onPractice={() => { setTab("order"); setRun(null); setRes(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></>
      : tab === "read" ? <ReadingPart key={lesson} L={L} save={save} course={course} /> : res ? (
        <Result course={course} res={res} onAgain={bookTab ? () => { setRes(null); setRun(null); } : start} onBack={() => { setRes(null); setRun(null); }} />
      ) : run ? (
        <CourseRun key={`${tab}-${lesson}`} course={course} qs={run} title={bookTab ? `Kiểm tra dịch câu · sách ${bookTab.short}` : lbl(part)} intro={lines[tab]} onFinish={(c, n) => { setRes(save(tab, c, n)); setRun(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      ) : (
        <>
          <Host line={lines[tab]} />
          <div className="panel a22start">
            <div><b>{part.ico} {lbl(part)}</b><span>{counts[tab]} câu · đúng ≥60% được 1 sao, ≥80% 2 sao, ≥95% 3 sao · mỗi sao mới +{STAR_REWARD} <Ico id="pgm" /></span></div>
            <button className="gbtn tri" onClick={start} disabled={!counts[tab]}><span className="c" />Bắt đầu kiểm tra</button>
          </div>
          {tab === "vocab" && vtotal > 0 && <LenPicker value={vlen && vlen < vtotal ? vlen : 0} onChange={setVlen} total={vtotal} />}
          {tab === "kanji" && kpool && <LenPicker value={klen && klen < kpool.length ? klen : 0} onChange={setKlen} total={kpool.length} />}
          {View && <View L={L} course={course} kpool={kpool} />}
        </>
      )}

      <div className="btnrow a22nav">
        {prev ? <Link href={`${base}/${prev.lesson}`} className="gbtn x dark"><span className="c" />‹ {unit} {prev.lesson}</Link> : <span />}
        {next && <Link href={`${base}/${next.lesson}`} className="gbtn"><span className="c" />{unit} {next.lesson} ›</Link>}
      </div>
    </div>
  );
}
