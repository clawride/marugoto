"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { ZhongliHost, ZL } from "@/components/Zhongli";
import QuestionSet from "@/components/QuestionSet";
import ScriptPlayer from "@/components/ScriptPlayer";
import { Ico } from "@/components/Icons";
import { examOf, buildExam, SECTIONS, scaled, verdict, PASS_TOTAL, PASS_SECTION, EXCELLENT, MAX, REWARD_PASS, REWARD_EXCELLENT, certId } from "@/lib/b1";
import { stopSpeak } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function ExamPage() {
  const { n } = useParams();
  const ex = examOf(+n);
  const { S, update } = useGame();
  const [phase, setPhase] = useState("intro"); // intro | sec | result
  const [sec, setSec] = useState(0);
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState({ lang: {}, read: {}, listen: {} });
  const [counts, setCounts] = useState({});
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [review, setReview] = useState(false);
  const submitRef = useRef(null);

  // Hết giờ → tự nộp phần đang làm
  useEffect(() => {
    if (phase !== "sec") return;
    const t = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(t); setTimeout(() => submitRef.current?.(true), 0); return 0; } return l - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase, sec]);
  useEffect(() => {
    if (phase !== "sec") return;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    addEventListener("beforeunload", h); return () => removeEventListener("beforeunload", h);
  }, [phase]);
  useEffect(() => () => stopSpeak(), []);

  const begin = () => {
    setPaper(buildExam(ex)); setAnswers({ lang: {}, read: {}, listen: {} }); setCounts({});
    setSec(0); setLeft(SECTIONS[0].minutes * 60); setPhase("sec"); setResult(null); setReview(false);
    sfx.open(); window.scrollTo({ top: 0 });
  };

  // Chấm một phần
  const grade = useCallback((key) => {
    if (key === "lang") return { c: paper.lang.filter((q, i) => answers.lang[i] === q.a).length, t: paper.lang.length };
    const blocks = paper[key];
    let c = 0, t = 0;
    blocks.forEach((b, bi) => b.questions.forEach((q, qi) => { t++; if (answers[key][`${bi}-${qi}`] === q.a) c++; }));
    return { c, t };
  }, [paper, answers]);

  const submitSection = useCallback((auto = false) => {
    const key = SECTIONS[sec].key;
    if (!auto) {
      const g = grade(key);
      const answered = key === "lang" ? Object.keys(answers.lang).length : Object.keys(answers[key]).length;
      if (answered < g.t && !confirm(`Bạn còn ${g.t - answered} câu chưa trả lời. Nộp phần này?`)) return;
    }
    stopSpeak();
    const g = grade(key);
    const nextCounts = { ...counts, [key]: g };
    setCounts(nextCounts);
    if (sec < SECTIONS.length - 1) {
      setSec(sec + 1); setLeft(SECTIONS[sec + 1].minutes * 60); sfx.page(); window.scrollTo({ top: 0 });
      return;
    }
    // Kết thúc bài thi
    const scores = Object.fromEntries(SECTIONS.map((s) => [s.key, scaled(nextCounts[s.key].c, nextCounts[s.key].t)]));
    const v = verdict(scores);
    let reward = 0;
    const date = new Date().toISOString().slice(0, 10);
    update((s) => {
      s.b1 = s.b1 || {}; s.b1.ex = s.b1.ex || {};
      const r = s.b1.ex[ex.n] || { best: 0, attempts: 0 };
      r.attempts = (r.attempts || 0) + 1;
      if (v.total > r.best) { r.best = v.total; r.scores = scores; }
      if (v.passed) {
        if (!r.passed || v.total >= (r.certTotal || 0)) { r.certTotal = v.total; r.certScores = scores; r.date = date; r.excellent = v.excellent; r.id = certId(ex.n, s.profile?.name || "Nhà Lữ Hành", date); }
        r.passed = true;
        if (!r.rewarded) { reward += REWARD_PASS; r.rewarded = true; }
        if (v.excellent && !r.exRewarded) { reward += REWARD_EXCELLENT; r.exRewarded = true; }
      }
      s.primo += reward;
      s.b1.ex[ex.n] = r;
    });
    setResult({ scores, ...v, reward });
    setPhase("result");
    v.passed ? sfx.win() : sfx.wrong();
    window.scrollTo({ top: 0 });
  }, [sec, grade, answers, counts, update, ex]);
  submitRef.current = submitSection;

  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href="/b1">Học Viện B1-1</Link></p>;
  if (!S) return null;
  const rec = S.b1?.ex?.[ex.n];

  if (phase === "intro") return (
    <>
      <Link href="/b1" className="back">‹ Học Viện B1-1</Link>
      <div className="panel examintro">
        <div className="tag">KỲ THI CHỨNG CHỈ · KIỂU JLPT</div>
        <h1>{ex.name}</h1>
        <p className="t2">{ex.sub} · Giám khảo: Zhongli</p>
        <ZhongliHost big line={ZL.examIntro} />
        <table className="extable">
          <thead><tr><th>Phần</th><th>Nội dung</th><th>Thời gian</th><th>Điểm sàn</th></tr></thead>
          <tbody>
            <tr><td className="jpt">言語知識</td><td>12 câu từ vựng + 13 câu ngữ pháp</td><td>30 phút</td><td>{PASS_SECTION}/60</td></tr>
            <tr><td className="jpt">読解</td><td>3 bài đọc dài · 15 câu</td><td>35 phút</td><td>{PASS_SECTION}/60</td></tr>
            <tr><td className="jpt">聴解</td><td>5 bài nghe · 15 câu · mỗi bài nghe tối đa 2 lần</td><td>30 phút</td><td>{PASS_SECTION}/60</td></tr>
          </tbody>
        </table>
        <p className="exrule">Đỗ khi tổng điểm ≥ <b>{PASS_TOTAL}/{MAX}</b> và mỗi phần ≥ <b>{PASS_SECTION}/60</b>. Đạt ≥ <b>{EXCELLENT}</b> là <b>Xuất sắc</b>. Đỗ lần đầu thưởng <b>{REWARD_PASS.toLocaleString("vi-VN")}</b> <Ico id="pgm" />, Xuất sắc lần đầu thêm <b>{REWARD_EXCELLENT}</b> <Ico id="pgm" />.</p>
        <p className="exrule">Chứng chỉ sẽ ghi tên: <b>{S.profile?.name || "Nhà Lữ Hành"}</b>{!S.profile && <> — <Link href="/rank" style={{ color: "var(--gold2)" }}>đăng ký tên</Link> trước để chứng chỉ có tên của bạn</>}.</p>
        {rec && <p className="exrule">Lần trước: điểm cao nhất <b>{rec.best}/{MAX}</b> · {rec.passed ? (rec.excellent ? "🏅 Xuất sắc" : "✅ Đã đỗ") : "Chưa đỗ"} · đã thi {rec.attempts} lần {rec.passed && <Link href={`/b1/cert/${ex.n}`} style={{ color: "var(--gold2)", marginLeft: 8 }}>📜 Xem chứng chỉ</Link>}</p>}
        <div className="btnrow"><button className="gbtn tri" onClick={begin}><span className="c" />Bắt đầu thi</button></div>
      </div>
    </>
  );

  if (phase === "result" && result) return (
    <>
      <Link href="/b1" className="back">‹ Học Viện B1-1</Link>
      <div className={`panel examresult ${result.passed ? "pass" : "fail"}`}>
        <ZhongliHost big line={result.excellent ? ZL.excellent : result.passed ? ZL.pass : ZL.fail} />
        <h1>{result.passed ? (result.excellent ? "XUẤT SẮC · 優" : "ĐỖ · 合格") : "CHƯA ĐẠT · 不合格"}</h1>
        <div className="extotal"><b>{result.total}</b><small>/{MAX}</small></div>
        <div className="exbars">
          {SECTIONS.map((s) => {
            const v = result.scores[s.key], ok = v >= PASS_SECTION;
            return (
              <div key={s.key} className={`exbar ${ok ? "" : "low"}`}>
                <div className="exlab"><span className="jpt">{s.jp}</span><small>{s.vi}</small></div>
                <div className="track"><i style={{ width: `${(v / 60) * 100}%` }} /><em style={{ left: `${(PASS_SECTION / 60) * 100}%` }} /></div>
                <b>{v}/60</b>
              </div>
            );
          })}
        </div>
        {!result.passed && result.sectionFail.length > 0 && <p className="exrule">Phần dưới điểm sàn: {result.sectionFail.map((k) => SECTIONS.find((s) => s.key === k).vi).join(", ")}.</p>}
        {result.reward > 0 && <div className="rew"><Ico id="pgm" /> +{result.reward.toLocaleString("vi-VN")} Nguyên Thạch</div>}
        <div className="btnrow">
          <Link href="/b1" className="gbtn x dark"><span className="c" />Học Viện</Link>
          <button className="gbtn" onClick={() => setReview(!review)}><span className="c" />{review ? "Ẩn đáp án" : "Xem lại đáp án"}</button>
          <button className="gbtn" onClick={begin}><span className="c" />Thi lại</button>
          {result.passed && <Link href={`/b1/cert/${ex.n}`} className="gbtn tri"><span className="c" />📜 Nhận chứng chỉ</Link>}
        </div>
      </div>
      {review && SECTIONS.map((s) => <Section key={s.key} k={s.key} paper={paper} answers={answers} setAnswers={() => {}} submitted />)}
    </>
  );

  const cur = SECTIONS[sec];
  return (
    <>
      <div className="exhead">
        <div><b className="jpt">{cur.jp}</b><small>Phần {sec + 1}/3 · {cur.vi}</small></div>
        <div className={`extimer ${left < 120 ? "warn" : ""}`}>⏱ {fmt(left)}</div>
        <button className="gbtn sm tri" onClick={() => submitSection(false)}><span className="c" />{sec < 2 ? "Nộp phần này" : "Nộp bài"}</button>
      </div>
      <Section k={cur.key} paper={paper} answers={answers} setAnswers={setAnswers} />
      <div className="btnrow"><button className="gbtn tri" onClick={() => submitSection(false)}><span className="c" />{sec < 2 ? "Nộp phần này và sang phần tiếp" : "Nộp bài thi"}</button></div>
    </>
  );
}

function Section({ k, paper, answers, setAnswers, submitted = false }) {
  const setFor = (prefix) => (fn) => setAnswers((all) => {
    const cur = {};
    Object.entries(all[k]).forEach(([key, v]) => { if (key.startsWith(prefix)) cur[key.slice(prefix.length)] = v; });
    const nx = typeof fn === "function" ? fn(cur) : fn;
    const merged = { ...Object.fromEntries(Object.entries(all[k]).filter(([key]) => !key.startsWith(prefix))) };
    Object.entries(nx).forEach(([i, v]) => { merged[prefix + i] = v; });
    return { ...all, [k]: merged };
  });
  const pick = (prefix) => Object.fromEntries(Object.entries(answers[k]).filter(([key]) => key.startsWith(prefix)).map(([key, v]) => [key.slice(prefix.length), v]));

  if (k === "lang") return (
    <div className="parch qwrap">
      <h3 className="jpt">問題 · 文字・語彙・文法</h3>
      <p className="lsit">Câu 1–12: chọn nghĩa đúng của từ. Câu 13–25: chọn đáp án đúng điền vào （　）.</p>
      <QuestionSet questions={paper.lang.map((q) => (q.type === "vocab" ? { ...q, q: q.q } : q))} answers={answers.lang} setAnswers={(fn) => setAnswers((all) => ({ ...all, lang: typeof fn === "function" ? fn(all.lang) : fn }))} hideSubmit submitted={submitted} />
    </div>
  );
  let num = 1;
  return paper[k].map((b, bi) => {
    const from = num; num += b.questions.length;
    return (
      <div key={bi} className="parch qwrap">
        {k === "read" ? (
          <article className="reading inexam">
            <div className="rgenre">{b.genre}</div>
            <h3 className="jpt">{b.title}</h3>
            <div className="rtext jpt">{b.text.split("\n").map((p, i) => <p key={i}>{p}</p>)}</div>
          </article>
        ) : (
          <>
            <h3 className="jpt">{b.title}</h3>
            <p className="lsit">🎬 {b.situation}</p>
            <ScriptPlayer lines={b.lines} maxPlays={submitted ? 99 : 2} showScript={submitted} />
          </>
        )}
        <QuestionSet questions={b.questions} answers={pick(`${bi}-`)} setAnswers={setFor(`${bi}-`)} hideSubmit submitted={submitted} numberFrom={from} />
      </div>
    );
  });
}
