"use client";
// Một bài Chữ Hán (~10 chữ): 📜 Học chữ · ✍️ Tập viết · 🧠 Ghi nhớ · 📖 Tập đọc · ✏️ Đặt câu · 🔮 Đoán chữ
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { MCQ, FillQ } from "@/components/Battle";
import OrderQ from "@/components/OrderQ";
import StrokeBoard from "@/components/kana/StrokeBoard";
import KanjiCard from "@/components/kanji/KanjiCard";
import { KazuhaHost, KZ, KAZUHA } from "@/components/Kazuha";
import { Ico } from "@/components/Icons";
import { charIcon } from "@/lib/genshin";
import { KLEVELS, KIDX, PARTS, SCORED, levelOf, lessonOf, lessonKey, loadLevel, loadStrokes, memoQs, readQs, sentQs, guessQs } from "@/lib/kanjiProg";
import { starsFor, pickRand } from "@/lib/data";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

export const STAR_REWARD = 20;
export const Stars = ({ n = 0 }) => <span className="a22stars">{[0, 1, 2].map((i) => <i key={i} className={i < n ? "on" : ""}>★</i>)}</span>;
const say = (t) => speakLines([{ t }], { rate: 0.85 });
export const KZ_ORDER_HOST = KAZUHA && { name: "Kazuha", icon: charIcon(KAZUHA), lines: { intro: [KZ.sentence], next: ["Câu tiếp theo nào.", "Ghép lại cho trôi như dòng nước."], ok: KZ.ok, bad: KZ.bad } };

// Lưu sao của một phần; thưởng Nguyên Thạch cho sao mới
export function useKanjiSave() {
  const { update } = useGame();
  return (key, pct, total) => {
    const stars = starsFor(pct);
    let reward = 0;
    update((s) => {
      s.kanji = s.kanji || {}; s.kanji.p = s.kanji.p || {};
      const r = s.kanji.p[key] || { pct: 0, stars: 0, total: 0 };
      if (stars > r.stars) { reward = (stars - r.stars) * STAR_REWARD; s.primo += reward; r.stars = stars; }
      if (pct > r.pct || (pct === r.pct && total > r.total)) { r.pct = pct; r.total = total; }
      s.kanji.p[key] = r;
    });
    return { pct, stars, reward };
  };
}

// Dữ liệu một cấp (nạp theo yêu cầu) + các chữ đã học tính đến bài này
export function useLevelData(lv) {
  const [D, setD] = useState(null);
  useEffect(() => { let on = true; loadLevel(lv).then((d) => on && setD(d)); return () => { on = false; }; }, [lv]);
  return D;
}
export function learnedUpTo(lv, n) {
  const set = new Set();
  for (const L of KLEVELS) {
    for (const les of L.lessons) { if (L.id === lv && les.n > n) return set; [...les.k].forEach((k) => set.add(k)); }
    if (L.id === lv) return set;
  }
  return set;
}

// Chạy một chuỗi câu hỏi (trắc nghiệm / điền / sắp xếp)
export function KQuiz({ qs, intro, title, onFinish }) {
  const [i, setI] = useState(0);
  const [c, setC] = useState(0);
  const [line, setLine] = useState(intro);
  const q = qs[i];
  useEffect(() => { if (q?.listen) { const t = setTimeout(() => say(q.listen), 350); return () => clearTimeout(t); } }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return null;
  const score = (ok) => { if (ok) setC((x) => x + 1); setLine(pickRand(ok ? KZ.ok : KZ.bad)); ok ? sfx.correct() : sfx.wrong(); };
  const next = () => { if (i + 1 >= qs.length) onFinish(c, qs.length); else { setI(i + 1); setLine(intro); } };
  const top = <><KazuhaHost line={line} />{q.listen && <div className="klisten"><button className="gbtn tri" onClick={() => say(q.listen)}><span className="c" />🔊 Nghe lại</button></div>}</>;
  return (
    <>
      <div className="stagebar"><span className="on">{title}</span><b>Câu {i + 1}/{qs.length} · đúng {c}</b></div>
      {q.type === "order" ? <OrderQ key={i} q={q} onScore={score} onNext={next} first={i === 0} host={KZ_ORDER_HOST} />
        : q.type === "fill" ? <FillQ key={i} q={{ ...q, sub: "Chọn từ điền vào chỗ trống" }} onScore={score} onNext={next} top={<KazuhaHost line={line} />} />
          : <MCQ key={i} q={q} onScore={score} onNext={next} top={top} />}
    </>
  );
}

// ===== 📜 Học chữ =====
function LearnTab({ list, strokes }) {
  const [i, setI] = useState(0);
  const E = list[i];
  return (
    <>
      <KazuhaHost line={KZ.learn} />
      <div className="kpick">{list.map((x, j) => <button key={x.k} className={`kchip jpt ${j === i ? "on" : ""}`} onClick={() => { setI(j); sfx.click(); }}>{x.k}</button>)}</div>
      <div className="kjlearn">
        <KanjiCard E={E} />
        <div className="panel kpadwrap"><h4 style={{ margin: "0 0 8px" }}>Thứ tự nét</h4>{strokes?.[E.k] ? <StrokeBoard key={E.k} char={E.k} paths={strokes[E.k]} mode="watch" size={240} /> : <p className="hint">Đang tải nét chữ…</p>}</div>
      </div>
      <div className="btnrow">
        {i > 0 && <button className="gbtn x dark" onClick={() => setI(i - 1)}><span className="c" />‹ Chữ trước</button>}
        {i < list.length - 1 && <button className="gbtn" onClick={() => { setI(i + 1); sfx.click(); }}><span className="c" />Chữ tiếp ›</button>}
      </div>
    </>
  );
}

// ===== ✍️ Tập viết =====
function WriteTab({ list, strokes, skey }) {
  const { S, update } = useGame();
  const save = useKanjiSave();
  const [i, setI] = useState(0);
  const [mode, setMode] = useState("watch");
  const E = list[i];
  const best = S.kanji?.w || {};
  const onResult = ({ mode: m, score }) => {
    if (m !== "free") { if (m === "trace") setTimeout(() => setMode("free"), 900); return; }
    const nb = { ...best, [E.k]: Math.max(best[E.k] || 0, score) };
    update((s) => { s.kanji = s.kanji || {}; s.kanji.w = { ...(s.kanji.w || {}), [E.k]: nb[E.k] }; });
    save(skey, Math.round(list.reduce((a, x) => a + (nb[x.k] || 0), 0) / list.length), list.length);
  };
  return (
    <>
      <KazuhaHost line={KZ.write} />
      <div className="kpick">{list.map((x, j) => <button key={x.k} className={`kchip jpt ${j === i ? "on" : ""} ${best[x.k] >= 80 ? "s3" : best[x.k] >= 60 ? "s2" : best[x.k] ? "s1" : ""}`} onClick={() => { setI(j); setMode("watch"); sfx.click(); }}>{x.k}</button>)}</div>
      <div className="kwrite">
        <div className="panel kinfo">
          <div className="kbig jpt">{E.k}</div>
          <div className="krom">{E.vi}</div>
          <div className="kmeta">{E.sc} nét{best[E.k] ? <> · điểm viết tốt nhất <b>{best[E.k]}</b></> : null}</div>
          <p><b>🧩</b> {E.explain}</p>
          <p><b>✒️ Viết đẹp:</b> viết từ trên xuống dưới, từ trái sang phải; nét ngang trước nét sổ; bộ bên trái viết hẹp hơn để nhường chỗ cho phần bên phải. Giữ chữ cân trong ô, dùng đường chữ thập làm mốc.</p>
        </div>
        <div className="panel kpadwrap">
          <div className="kmodes">{[["watch", "1 · Xem thứ tự nét"], ["trace", "2 · Tô theo nét"], ["free", "3 · Tự viết & chấm"]].map(([k, t]) => <button key={k} className={`chip ${mode === k ? "on" : ""}`} onClick={() => { setMode(k); sfx.click(); }}>{t}</button>)}</div>
          {strokes?.[E.k] ? <StrokeBoard key={`${E.k}-${mode}`} char={E.k} paths={strokes[E.k]} mode={mode} onResult={onResult} /> : <p className="hint">Đang tải nét chữ…</p>}
        </div>
      </div>
      <p className="hint" style={{ textAlign: "center" }}>Sao của phần viết = điểm trung bình khi <b>tự viết & chấm</b> các chữ trong bài.</p>
    </>
  );
}

// ===== các phần kiểm tra =====
const PART_INFO = {
  memo: { line: KZ.memo, title: "Ghi nhớ", desc: "Nhìn chữ đoán nghĩa, chọn chữ theo nghĩa, nghĩa của từ chứa chữ, nhận chữ qua mẹo nhớ", make: memoQs },
  read: { line: KZ.read, title: "Tập đọc", desc: "Đọc từ, đọc âm của chữ trong từ, nghe và chọn từ", make: readQs },
  sent: { line: KZ.sentence, title: "Đặt câu", desc: "Điền từ vào câu, chọn đúng chữ Hán cho từ, sắp xếp câu", make: sentQs },
  guess: { line: KZ.guess, title: "Đoán chữ", desc: "Đoán âm từ phần chỉ âm; đoán nghĩa từ bộ chỉ nghĩa và từ nghĩa từng chữ trong từ ghép", make: guessQs },
};
function QuizTab({ part, list, pool, learned, skey }) {
  const P = PART_INFO[part];
  const save = useKanjiSave();
  const [qs, setQs] = useState(null);
  const [res, setRes] = useState(null);
  const start = () => { const q = part === "guess" ? P.make(list, pool, learned) : P.make(list, pool); setQs(q); sfx.open(); };
  if (qs) return qs.length ? <KQuiz qs={qs} intro={P.line} title={P.title} onFinish={(c, n) => { setRes(save(skey, Math.round((c / n) * 100), n)); setQs(null); }} /> : <p>Chưa đủ dữ liệu để tạo câu hỏi.</p>;
  return (
    <>
      <KazuhaHost line={P.line} />
      {part === "guess" && <GuessTips list={list} />}
      {res && <div className="panel kdone"><Stars n={res.stars} /> Đúng {res.pct}%{res.reward > 0 && <> · <Ico id="pgm" /> +{res.reward}</>}</div>}
      <div className="panel a22start">
        <div><b>{PARTS.find((p) => p.key === part).ico} {P.title}</b><span>{P.desc} · đúng ≥60% được 1 sao, ≥80% 2 sao, ≥95% 3 sao · mỗi sao mới +{STAR_REWARD} <Ico id="pgm" /></span></div>
        <button className="gbtn tri" onClick={start}><span className="c" />Bắt đầu</button>
      </div>
    </>
  );
}

// Tóm tắt mẹo đoán của các chữ trong bài
function GuessTips({ list }) {
  return (
    <div className="panel kjtips">
      <h4>🔮 Mẹo đoán của bài này <Link href="/kanji/meo" className="chip sm">Xem toàn bộ mẹo ›</Link></h4>
      <ul>{list.map((E) => <li key={E.k}><b className="jpt">{E.k}</b> <small>{E.vi}</small> — {E.tip}</li>)}</ul>
    </div>
  );
}

export default function KanjiLesson({ lv, n }) {
  const { S } = useGame();
  const L = levelOf(lv), les = lessonOf(lv, n);
  const D = useLevelData(lv);
  const [strokes, setStrokes] = useState(null);
  const [tab, setTab] = useState("learn");
  useEffect(() => { loadStrokes(lv).then(setStrokes); }, [lv]);
  const list = useMemo(() => (D && les ? [...les.k].map((k) => D[k]).filter(Boolean) : []), [D, les]);
  // câu hỏi & phương án nhiễu chỉ dùng chữ đã học: các bài trước trong cấp + bài hiện tại
  const pool = useMemo(() => (D ? Object.values(D).filter((E) => (KIDX[E.k]?.[2] || 0) <= +n) : []), [D, n]);
  const learned = useMemo(() => learnedUpTo(lv, +n), [lv, n]);
  if (!L || !les) return <p style={{ marginTop: 40 }}>Không tìm thấy bài. <Link href="/kanji">Chữ Hán</Link></p>;
  if (!S) return null;
  const P = S.kanji?.p || {}, key = lessonKey(lv, n);
  const idx = L.lessons.findIndex((x) => x.n === +n);
  const prev = L.lessons[idx - 1], next = L.lessons[idx + 1];
  return (
    <div className="th-kanji">
      <Link href={`/kanji?lv=${lv}`} className="back">‹ Chữ Hán · {L.name}</Link>
      <div className="pagehead a22head">
        <div className="tag">{L.ico} CHỮ HÁN {L.name} · BÀI {n}/{L.lessons.length}</div>
        <h1 className="jpt kjtitle">{les.k}</h1>
        <p>{les.k.length} chữ · Topic {les.t.join(", ")}</p>
      </div>
      <div className="chips a22tabs">
        {PARTS.map((p) => <button key={p.key} className={`chip dk ${tab === p.key ? "on" : ""}`} onClick={() => { setTab(p.key); sfx.click(); }}>{p.ico} {p.vi}{p.scored !== false && <Stars n={P[`${key}:${p.key}`]?.stars} />}</button>)}
      </div>
      {!D ? <p className="hint" style={{ textAlign: "center" }}>Đang tải dữ liệu chữ…</p> : (
        <>
          {tab === "learn" && <LearnTab key={`l${key}`} list={list} strokes={strokes} />}
          {tab === "write" && <WriteTab key={`w${key}`} list={list} strokes={strokes} skey={`${key}:write`} />}
          {PART_INFO[tab] && <QuizTab key={`${tab}${key}`} part={tab} list={list} pool={pool} learned={learned} skey={`${key}:${tab}`} />}
        </>
      )}
      <div className="btnrow a22nav">
        {prev ? <Link href={`/kanji/${lv}/${prev.n}`} className="gbtn x dark"><span className="c" />‹ Bài {prev.n}</Link> : <span />}
        {next ? <Link href={`/kanji/${lv}/${next.n}`} className="gbtn"><span className="c" />Bài {next.n} ›</Link> : <Link href={`/kanji/${lv}/test`} className="gbtn"><span className="c" />Kiểm tra {L.name} ›</Link>}
      </div>
    </div>
  );
}

export { SCORED };
