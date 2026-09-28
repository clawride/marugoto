"use client";
// 📖 Học theo sách (Marugoto 入門 A1 かつどう): dựng lại từng mục ①②③, từng hoạt động như sách, kèm romaji + nghĩa tiếng Việt;
// lời thoại bài nghe & đáp án mở khi cần. Cuối bài: ✍️ kiểm tra dịch câu (Nhật → Việt, Việt → Nhật, xếp câu).
// Dữ liệu: public/book/<khóa>/<bài>.json (chép từ sách, xem scripts/… và data/a1-katsudou.json)
import { useEffect, useState } from "react";
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
  other: ["•", "", ""],
};
const CIRCLED = "⓪①②③④⑤⑥⑦⑧⑨⑩";
const say = (jp) => speakLines([{ t: jp }], { rate: 0.85 });
const trackKey = (t) => `sa${t}.mp3`;
// ["061","065"] → 061…065
const tracksOf = (a = []) => {
  if (a.length === 2 && +a[1] > +a[0] && +a[1] - +a[0] < 12) return Array.from({ length: +a[1] - +a[0] + 1 }, (_, i) => String(+a[0] + i).padStart(3, "0"));
  return a;
};

function useBook(course, lesson) {
  const [B, setB] = useState(undefined);
  useEffect(() => {
    let on = true; setB(undefined);
    fetch(course.book.url(lesson)).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((d) => on && setB(d));
    return () => { on = false; };
  }, [course, lesson]);
  return B;
}
function useOpt(key, def) {
  const [v, setV] = useState(def);
  useEffect(() => { try { const s = localStorage.getItem(key); if (s != null) setV(s === "1"); } catch {} }, [key]);
  return [v, (x) => { setV(x); try { localStorage.setItem(key, x ? "1" : "0"); } catch {} }];
}

const Line = ({ jp, ro: r, vi, show, slot, sp }) => (
  <div className="bkline">
    {sp && <span className="bksp jpt">{sp}</span>}
    <button className="bkspk" onClick={() => say(jp)} aria-label="Nghe">🔊</button>
    <div>
      <span className="jpt bkjp">{slot ? jp.split(slot).flatMap((p, i, a) => (i < a.length - 1 ? [p, <mark key={i}>{slot}</mark>] : [p])) : jp}</span>
      {show.ro && r && <small className="bkro">{r}</small>}
      {show.vi && vi && <small className="bkvi">{vi}</small>}
    </div>
  </div>
);

function Script({ sc, lib, show }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bkscript">
      <div className="bkscripth">
        <b>{sc.no != null ? `Bài nghe ${sc.no}` : "Bài nghe"}{sc.audio ? ` · track ${sc.audio}` : ""}</b>
        <button className="chip sm" onClick={() => setOpen(!open)}>{open ? "Ẩn lời thoại" : "📜 Xem lời thoại"}</button>
      </div>
      {sc.audio && <Player file={trackKey(sc.audio)} lib={lib} autoPlay={false} tts={sc.lines.map((l) => ({ t: l.jp }))} />}
      {open && <div className="bkdlg">{sc.lines.map((l, i) => (
        <div key={i} className="bkturn"><span className="bksp jpt">{l.sp}</span><Line {...l} show={show} /></div>
      ))}</div>}
    </div>
  );
}

function Act({ A, lib, show }) {
  const [ico, jpName, viName] = KIND[A.kind] || KIND.other;
  const [ans, setAns] = useState(false);
  const tracks = tracksOf(A.audio);
  const wordTts = A.words?.items?.map((w) => ({ t: w.jp })) || [];
  return (
    <div className={`bkact k-${A.kind}`}>
      <div className="bkacth">
        <span className="bkn">{A.n}</span>{(A.sub || A.part) && <span className="bksub">{A.sub || A.part}</span>}
        <span className="bkico" title={viName}>{ico}</span>
        {jpName && <span className="bkkind"><span className="jpt">{jpName}</span> · {viName}</span>}
        {A.cando && <span className="bkcando">Can-do {A.cando}</span>}
      </div>
      {A.ask && <div className="bkask"><b className="jpt">{A.ask.jp}</b>{A.ask.en && <i>{A.ask.en}</i>}{show.vi && <small>{A.ask.vi}</small>}</div>}
      {A.parts?.map((p, i) => <div key={i} className="bkask bkpart"><b className="jpt">{p.no} {p.jp}</b>{p.en && <i>{p.en}</i>}{show.vi && p.vi && <small>{p.vi}</small>}</div>)}
      {A.task && <p className="bktask">📝 {A.task}</p>}
      {tracks.length > 0 && !A.scripts?.length && (
        <div className="bktracks">{tracks.map((t) => <Player key={t} file={trackKey(t)} lib={lib} autoPlay={false} tts={wordTts} />)}</div>
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
              <button key={i} className="bkword" onClick={() => say(w.jp)} title="Bấm để nghe">
                {w.k && <span className="bkk">{w.k}</span>}
                {w.group && <span className="bkwgrp jpt">{w.group}</span>}
                <b className="jpt">{w.jp}</b>
                {show.ro && w.ro && <small className="bkro">{w.ro}</small>}
                {show.vi && <small className="bkvi">{w.vi}</small>}
              </button>
            ))}
          </div>
        </div>
      )}
      {A.model?.length > 0 && <div className="bkmodel">{A.model.map((m, i) => <Line key={i} {...m} show={show} />)}</div>}
      {A.text?.length > 0 && <div className="bktext">{A.text.map((t, i) => <Line key={i} {...t} show={show} />)}</div>}
      {A.notesAudio && <Player file={trackKey(A.notesAudio)} lib={lib} autoPlay={false} tts={(A.notes || []).map((n) => ({ t: n.jp }))} />}
      {A.notes?.length > 0 && <div className="bknotes">{A.notes.map((n, i) => <div key={i} className="bknote"><Line {...n} show={{ ro: show.ro, vi: true }} /></div>)}</div>}
      {A.scripts?.map((sc, i) => <Script key={i} sc={sc} lib={lib} show={show} />)}
      {A.questions?.map((q, i) => <p key={i} className="bktask">💬 <span className="jpt">{q.jp}</span>{show.vi && q.vi && <> — {q.vi}</>}</p>)}
      {A.answer && (
        <div className="bkanswer">
          <button className="chip sm" onClick={() => setAns(!ans)}>{ans ? "Ẩn đáp án" : "✔ Xem đáp án"}</button>
          {ans && <p className="jpt">{A.answer}</p>}
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
    const exp = `${x.jp}${x.ro ? ` (${x.ro})` : ""} — ${x.vi}`;
    if (i % 3 === 2 && chunks.length >= 3 && chunks.length <= 8) return { type: "order", chunks, vi: x.vi };
    return i % 3 === 0
      ? mc(x.jp, x.vi, others.map((y) => y.vi), { sub: "Dịch câu · chọn nghĩa tiếng Việt", jpPrompt: true, explain: exp })
      : mc(x.vi, x.jp, others.map((y) => y.jp), { sub: "Dịch câu · chọn câu tiếng Nhật", jpOpts: true, explain: exp });
  });
}

export default function BookPart({ course, lesson, stars, onQuiz }) {
  const B = useBook(course, lesson);
  const [ro, setRo] = useOpt("bk_ro", true);
  const [vi, setVi] = useOpt("bk_vi", true);
  const show = { ro, vi };
  const lib = course.audio;
  if (B === undefined) return <p className="hint">Đang tải bài học…</p>;
  if (!B) return <p className="panel hint">Bài này chưa có phần học theo sách.</p>;
  return (
    <div className="bkwrap">
      <div className="panel bkhead">
        <div className="bkbook">📖 {course.book.name} · だい{B.lesson}か{B.page ? ` · sách tr.${B.page}` : ""}</div>
        <h2 className="jpt">{B.title.jp}</h2>
        <p>{B.title.ro && <i>{B.title.ro}</i>} {B.title.vi}</p>
        {B.cando?.length > 0 && <ul className="bkcandos">{B.cando.map((c) => <li key={c.n}><span className="bkcando">Can-do {c.n}</span> <span className="jpt">{c.jp}</span> — {c.vi}</li>)}</ul>}
        <div className="bkopts">
          <label><input type="checkbox" checked={ro} onChange={(e) => setRo(e.target.checked)} /> Hiện romaji</label>
          <label><input type="checkbox" checked={vi} onChange={(e) => setVi(e.target.checked)} /> Hiện nghĩa tiếng Việt</label>
        </div>
      </div>
      <AudioSetup lib={lib} folder={course.folder} />
      {B.sections.map((S) => (
        <section key={S.no} className="panel bksec">
          <h3><span className="bkno">{CIRCLED[S.no] || S.no}</span> <span className="jpt">{S.title.jp}</span>{S.title.ro && <small className="bkro">{S.title.ro}</small>}<small className="bkvi">{S.title.vi}</small>{S.page && <em className="bkpage">tr.{S.page}</em>}</h3>
          {S.acts.map((A, i) => <Act key={i} A={A} lib={lib} show={show} />)}
        </section>
      ))}
      {B.culture && (
        <section className="panel bksec bkculture">
          <h3>🌏 <span className="jpt">{B.culture.title.jp || "せいかつと ぶんか"}</span><small className="bkvi">{B.culture.title.vi}</small></h3>
          <ol>{(B.culture.items || []).map((it, i) => <li key={i}>{it.jp && <span className="jpt">{it.jp} </span>}{it.vi}</li>)}</ol>
          {B.culture.questions?.map((q, i) => <p key={i} className="bktask">💬 {q.jp && <span className="jpt">{q.jp} </span>}{q.vi}</p>)}
        </section>
      )}
      <div className="panel bkquiz">
        <div><b>✍️ Kiểm tra dịch câu</b><span>{Math.min(12, B.quiz?.length || 0)} câu lấy từ bài vừa học: chọn nghĩa tiếng Việt, chọn câu tiếng Nhật, xếp lại câu · đúng ≥60% được 1 sao, ≥80% 2 sao, ≥95% 3 sao</span></div>
        {stars}
        <button className="gbtn tri" onClick={() => { sfx.open(); onQuiz(bookQs(B)); }} disabled={!B.quiz?.length}><span className="c" />Bắt đầu kiểm tra</button>
      </div>
    </div>
  );
}
