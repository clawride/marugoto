"use client";
// 📝 Phòng thi luyện đề (JLPT / 級): làm theo từng phần thi có giờ; chọn đáp án → khóa ngay, hiện đáp án + lời giải
// (phiên âm Latinh, dịch, tách từ). Không đổi được đáp án cho đến hết bài. Hết bài → chấm theo thang JLPT + CEFR,
// thống kê sai bao nhiêu câu ở từng 問題. Bài làm dở lưu trên máy (localStorage) để tải lại trang không mất.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import Sentence, { ViewBar, say } from "@/components/library/Sentence";
import { speakLines, stopSpeak } from "@/lib/tts";
import { allQuestions, gradeExam, scoringOf, fmtTime, CEFR_VI, kindById, JLPT } from "@/lib/exams";
import { sfx } from "@/lib/sfx";
import { examLevelOf } from "@/lib/boards";
import { examRw } from "@/lib/rewards";
import { useSite, useAdmin } from "@/lib/useSite";
import { Ico } from "@/components/Icons";

const KEY = (id) => `exam_run_${id}`;
const load = (id) => { try { return JSON.parse(localStorage.getItem(KEY(id)) || "null"); } catch { return null; } };
const save = (id, r) => { try { r ? localStorage.setItem(KEY(id), JSON.stringify(r)) : localStorage.removeItem(KEY(id)); } catch {} };
const NUM = "①②③④⑤⑥";

// đề bài: [[chữ]] → gạch chân, xuống dòng giữ nguyên
function QText({ t }) {
  if (!t) return null;
  return <>{String(t).split("\n").map((line, i) => (
    <span key={i}>{i > 0 && <br />}{line.split(/(\[\[.+?\]\])/).map((x, j) => (/^\[\[.+\]\]$/.test(x) ? <u key={j}>{x.slice(2, -2)}</u> : x))}</span>
  ))}</>;
}
const Choice = ({ c }) => (typeof c === "string" && c.startsWith("img:") ? <img src={c.slice(4)} alt="" className="exchimg" /> : <QText t={c} />);

function Listen({ Q, qid, real, played, onPlayed }) {
  const [on, setOn] = useState(false);
  const used = real && played;
  const play = async () => {
    if (on) { stopSpeak(); setOn(false); return; }
    if (used) return;
    setOn(true); onPlayed(qid); sfx.click();
    if (Q.audioUrl) {
      const a = new Audio(Q.audioUrl);
      await new Promise((r) => { a.onended = a.onerror = r; a.play().catch(r); });
    } else {
      const sps = [...new Set(Q.audio.map((l) => l.sp || "A"))];
      await speakLines(Q.audio.map((l) => ({ t: l.jp, sp: l.sp || "A", g: l.g || (sps.indexOf(l.sp || "A") % 2 ? "m" : "f") })), { rate: 0.92 });
    }
    setOn(false);
  };
  return (
    <button className={`exlisten ${on ? "on" : ""}`} onClick={play} disabled={used && !on}>
      {on ? "⏹ Đang phát…" : used ? "🔇 Đã nghe (thi thật: nghe 1 lần)" : "▶ Nghe"}
    </button>
  );
}

function Explain({ Q, open }) {
  const [show, setShow] = useState(open);
  if (!Q.ex && !Q.audio?.some((l) => l.words)) return null;
  const ex = Q.ex || {};
  return (
    <div className="exex">
      <button className="lbmore" onClick={() => setShow(!show)}>{show ? "▾ Ẩn lời giải" : "▸ Xem lời giải chi tiết"}</button>
      {show && <>
        {!!Q.audio?.length && <div className="exscript"><h5>🎧 Nội dung bài nghe</h5>{Q.audio.map((l, i) => (l.words ? <Sentence key={i} s={l} speaker={l.sp} /> : <p key={i} className="jpt">{l.sp ? `${l.sp}：` : ""}{l.jp}</p>))}</div>}
        {ex.s && <div className="exsent"><h5>📖 Câu hoàn chỉnh</h5><Sentence s={ex.s} defaultOpen /></div>}
        {ex.vi && <p className="exvi">💡 {ex.vi}</p>}
        {!!ex.choices?.length && (
          <table className="exchtab"><tbody>{ex.choices.map((c, i) => (
            <tr key={i} className={i === Q.answer ? "ok" : ""}>
              <td>{NUM[i]}</td>
              <td><button className="lbcell jpt" onClick={() => say(c.r || c.jp)}>{c.jp}</button>{c.r && c.r !== c.jp && <small className="jpt"> {c.r}</small>}</td>
              <td><i className="lbro">{c.ro}</i></td><td>{c.vi}</td>
            </tr>
          ))}</tbody></table>
        )}
      </>}
    </div>
  );
}

function QuestionCard({ Q, qid, no, ans, onAnswer, locked, real, played, onPlayed, review, gain }) {
  const done = ans != null;
  const showChoices = done || !Q.hideChoices;
  return (
    <div className={`panel exq ${done ? (ans === Q.answer ? "right" : "wrong") : ""}`} id={`q-${qid}`}>
      <div className="exqhead">
        <span className="exqno">{no}</span>
        {done && <b className={ans === Q.answer ? "exok" : "exbad"}>{ans === Q.answer ? "✓ Đúng" : ans === -1 ? "✗ Bỏ trống" : "✗ Sai"}</b>}
        {done && !!gain && <span className="exgem" title="Nguyên Thạch nhận được"><Ico id="pgm" /> +{gain}</span>}
      </div>
      {!!Q.audio?.length || Q.audioUrl ? <Listen Q={Q} qid={qid} real={real} played={played} onPlayed={onPlayed} /> : null}
      {Q.img && <img src={Q.img} alt="" className="exqimg" />}
      {Q.q && (Q.audio?.length && !Q.hideChoices && !done && !review
        ? <p className="exqhid">🎧 Câu hỏi được đọc trong bài nghe (như thi thật) — sẽ hiện sau khi bạn trả lời.</p>
        : <p className="exqtext jpt"><QText t={Q.q} /></p>)}
      <div className="exchoices">
        {Q.choices.map((c, i) => (
          <button key={i} disabled={done || locked}
            className={`exch jpt ${done && i === Q.answer ? "ok" : ""} ${done && i === ans && i !== Q.answer ? "bad" : ""}`}
            onClick={() => onAnswer(qid, i)}>
            <span className="exchn">{i + 1}</span>{showChoices ? <Choice c={c} /> : <i className="exhid">(nghe lựa chọn {i + 1})</i>}
          </button>
        ))}
      </div>
      {done && <Explain Q={Q} open={!review} />}
    </div>
  );
}

function PassageView({ P, revealed }) {
  const [an, setAn] = useState(false);
  if (!P.passage) return null;
  return (
    <div className="panel expassage">
      {P.passage.title && <h4 className="jpt">{P.passage.title}</h4>}
      <div className="jpt exptext"><QText t={P.passage.text} /></div>
      {revealed && !!P.passage.sentences?.length && <>
        <button className="lbmore" onClick={() => setAn(!an)}>{an ? "▾ Ẩn phân tích bài đọc" : "▸ Phân tích bài đọc (furigana · Latinh · dịch · tách từ)"}</button>
        {an && <div className="exsent">{P.passage.sentences.map((s, i) => <Sentence key={i} s={s} no={i + 1} />)}</div>}
      </>}
    </div>
  );
}

export default function ExamPaper({ E }) {
  const { S: G, update } = useGame();
  const site = useSite(), isAdmin = useAdmin(G);
  const Qs = useMemo(() => allQuestions(E), [E]);
  const [run, setRun] = useState(undefined); // undefined = đang đọc lưu trữ
  const runRef = useRef(null);
  const set = useCallback((fn) => setRun((r) => { const n = fn(structuredClone(r)); runRef.current = n; save(E.id, n); return n; }), [E.id]);
  useEffect(() => { const r = load(E.id); runRef.current = r; setRun(r); return () => stopSpeak(); }, [E.id]);

  const S = run && E.sections[run.si];
  const secQs = run ? Qs.filter((x) => x.si === run.si) : [];
  const real = run?.mode === "real";

  const finishSection = useCallback(() => set((r) => {
    stopSpeak();
    // câu bỏ trống trong phần này → tính sai, khóa luôn
    for (const x of Qs) if (x.si === r.si && r.answers[x.id] == null) r.answers[x.id] = -1;
    if (r.si + 1 < E.sections.length) { r.si++; r.phase = "between"; }
    else { r.phase = "done"; r.finishedAt = Date.now(); }
    return r;
  }), [set, Qs, E.sections.length]);

  // đồng hồ của phần đang làm (chỉ chế độ thi thật, phần có giờ)
  useEffect(() => {
    if (!run || run.phase !== "sec" || !real || !(S?.minutes > 0)) return;
    const t = setInterval(() => {
      const r = runRef.current; if (!r || r.phase !== "sec") return;
      const left = (r.left[r.si] ?? S.minutes * 60) - 1;
      if (left <= 0) { clearInterval(t); finishSection(); sfx.open(); return; }
      set((x) => { x.left[x.si] = left; return x; });
    }, 1000);
    return () => clearInterval(t);
  }, [run?.phase, run?.si, real]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (run?.phase !== "sec") return;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    addEventListener("beforeunload", h); return () => removeEventListener("beforeunload", h);
  }, [run?.phase]);

  // lưu kết quả vào hồ sơ (một lần)
  const result = useMemo(() => (run?.phase === "done" ? gradeExam(E, run.answers) : null), [run?.phase, run?.answers, E]);
  useEffect(() => {
    if (!result || run.saved) return;
    const RW = examRw(E, site.examMult), bonus = { done: 0, pass: 0, great: 0 };
    update((s) => {
      s.exam ||= {};
      const o = s.exam[E.id] || { best: 0, tries: 0 };
      o.tries++; o.best = Math.max(o.best, result.total);
      // thưởng một lần cho mỗi đề: nộp hết đề · đỗ lần đầu · xuất sắc (≥ 90% điểm) lần đầu
      if (!o.doneRw) { o.doneRw = true; bonus.done = RW.done; }
      if (result.passed && !o.passRw) { o.passRw = true; bonus.pass = RW.pass; }
      if (result.passed && result.total >= 0.9 * result.max) { if (!o.greatRw) { o.greatRw = true; bonus.great = RW.great; } o.great = true; }
      s.primo += bonus.done + bonus.pass + bonus.great;
      o.last = { t: run.finishedAt, total: result.total, passed: result.passed, cefr: result.cefr, right: result.right, count: result.count };
      if (result.passed) {
        o.passed = true;
        // giấy chứng nhận: giữ lần đỗ có điểm cao nhất
        if (!o.cert || result.total > o.cert.total) {
          const d = new Date(run.finishedAt), pad = (x) => String(x).padStart(2, "0");
          o.cert = {
            title: E.title, level: E.level, levelLabel: E.kind === "kyu" ? `JLPT cũ ${E.level} → quy đổi ${result.eq}` : `JLPT ${E.level}`,
            eq: result.eq || "", date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
            no: `TV-${(result.eq || E.level).replace("級", "K")}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            total: result.total, max: result.max, pass: result.pass, cefr: result.cefr,
            groups: result.groups.map((g) => ({ jp: g.jp, score: g.score, max: g.max })),
            old: result.old ? { total: result.old.total, max: result.old.max } : null,
          };
        }
      }
      s.exam[E.id] = o;
    });
    set((r) => { r.saved = true; r.bonus = bonus; return r; });
    if (bonus.done + bonus.pass + bonus.great > 0) setTimeout(() => sfx.primo(), 300);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (mode) => { sfx.open(); setRun(() => { const r = { mode, started: Date.now(), si: 0, phase: "sec", answers: {}, left: {}, played: {} }; runRef.current = r; save(E.id, r); return r; }); };
  // trả lời: khóa đáp án; đúng → cộng Nguyên Thạch ngay (lần đầu đúng câu này nhiều hơn các lần sau) + 1 câu đúng vào điểm xếp hạng
  const answer = (qid, i) => {
    if (runRef.current?.answers[qid] != null) return;
    const idx = Qs.findIndex((x) => x.id === qid), ok = i === Qs[idx]?.Q.answer;
    (ok ? sfx.correct : sfx.wrong)();
    let gain = 0;
    if (ok) {
      const RW = examRw(E, site.examMult);
      update((s) => {
        s.exam ||= {};
        const o = (s.exam[E.id] ||= { best: 0, tries: 0 });
        const rw = (o.rw || "").padEnd(Qs.length, "0");
        gain = rw[idx] === "1" ? RW.again : RW.first;
        o.rw = rw.slice(0, idx) + "1" + rw.slice(idx + 1);
        s.primo += gain; s.total = (s.total || 0) + 1;
      });
      setTimeout(() => sfx.primo(), 200);
    }
    set((r) => { if (r.answers[qid] == null) { r.answers[qid] = i; if (gain) { r.gains = { ...(r.gains || {}), [qid]: gain }; r.earned = (r.earned || 0) + gain; } } return r; });
  };
  const played = (qid) => set((r) => { r.played[qid] = true; return r; });
  const reset = () => { if (!confirm("Xóa bài làm hiện tại và làm lại từ đầu?")) return; stopSpeak(); save(E.id, null); runRef.current = null; setRun(null); };

  const K = kindById(E.kind);
  const back = <Link href={`/de-thi/${E.kind}`} className="back" onClick={() => sfx.page()}>‹ {K?.name || "Luyện đề thi"}</Link>;
  if (run === undefined) return <p className="hint" style={{ textAlign: "center", marginTop: 40 }}>Đang mở đề…</p>;
  // đề bị quản trị tạm ẩn (quản trị vẫn mở được để kiểm tra)
  if (site.hiddenExams.includes(E.id) && isAdmin !== true) return <>{back}<div className="panel lbsec" style={{ marginTop: 16, textAlign: "center" }}><h2>🔒 Đề này đang tạm ẩn</h2><p>Đề đang được kiểm tra lại, bạn quay lại sau nhé. Hãy chọn đề khác trong danh sách.</p></div></>;

  // ——— giới thiệu ———
  if (!run) {
    const sc = scoringOf(E);
    return (
      <>
        {back}
        <div className="pagehead" style={{ marginTop: 10 }}>
          <p style={{ letterSpacing: 2, margin: "0 0 6px" }} className="jpt">{E.jp || K?.jp}</p>
          <h1>{E.title}</h1>
          {E.source && <p>Nguồn: {E.source}</p>}
          <div className="orn"><span /></div>
        </div>
        <div className="panel lbsec">
          <h2>📋 Cấu trúc đề</h2>
          <table className="vnvocab extab"><thead><tr><th>Phần thi</th><th>Số câu</th><th>Thời gian</th></tr></thead><tbody>
            {E.sections.map((S2, i) => <tr key={i}><td className="jpt">{S2.jp}</td><td>{S2.parts.reduce((a, P) => a + P.questions.length, 0)} câu</td><td>{S2.minutes ? `${S2.minutes} phút` : "—"}</td></tr>)}
          </tbody></table>
          <h3>🎯 Cách chấm</h3>
          <ul>
            {sc.groups.map((g) => <li key={g.id}><b className="jpt">{g.jp}</b>: 0–{g.max} điểm{g.min ? `, điểm sàn ${g.min}` : ""}</li>)}
            <li>Đỗ khi tổng ≥ <b>{sc.pass}</b>/{sc.groups.reduce((a, g) => a + g.max, 0)}{sc.groups.some((g) => g.min) ? " và không phần nào dưới điểm sàn" : ""}.</li>
            {sc.eq && <li>Sau đó <b>quy đổi sang JLPT mới {sc.eq}</b> (cấp tương đương chính thức): chấm lại theo thang {JLPT[sc.eq].groups.map((g) => `${g.jp} ${g.max}`).join(" · ")} (tổng 180, đỗ ≥ {JLPT[sc.eq].pass}, có điểm sàn).</li>}
            {!!sc.cefr?.length && <li>Quy đổi CEFR (khung châu Âu) theo bảng chính thức của JLPT{sc.eq ? ` ${sc.eq}` : ""}: {sc.cefr.map(([m, c]) => `≥ ${m}/180 → ${c}`).join(" · ")}</li>}
          </ul>
          <h3>💎 Phần thưởng</h3>
          {(() => { const W = examRw(E, site.examMult); return (
            <ul>
              <li>Mỗi câu <b>trả lời đúng</b>: <b>+{W.first}</b> <Ico id="pgm" /> Nguyên Thạch (làm lại câu đã từng đúng: +{W.again}) và +1 vào <b>Điểm Mạo Hiểm</b>.</li>
              <li>Nộp hết đề lần đầu: <b>+{W.done}</b> · đỗ lần đầu: <b>+{W.pass}</b> · xuất sắc (từ 90% điểm): <b>+{W.great}</b>. Đỗ còn được cộng điểm xếp hạng, và điểm đề lên bảng <b>Thi thử JLPT</b>.</li>
              <li>{E.kind === "kyu" ? "Đề cũ 級 khó và dài hơn" : "Đề JLPT"} nên thưởng nhiều hơn các bài luyện thường (đố vui: 10 Nguyên Thạch mỗi câu).</li>
            </ul>
          ); })()}
          <h3>📌 Lưu ý</h3>
          <ul>
            <li>Chọn đáp án là <b>chốt luôn</b>: đáp án đúng và lời giải (phiên âm Latinh, dịch, tách từ) hiện ngay, <b>không sửa được</b> cho đến hết bài.</li>
            <li>Làm xong phần nào thì nộp phần đó; không quay lại phần trước. Câu bỏ trống tính là sai.</li>
            <li>Điểm là <b>ước tính</b> theo tỉ lệ câu đúng — JLPT thật dùng phương pháp quy đổi riêng.</li>
          </ul>
          <div className="exstart">
            <button className="gbtn tri" onClick={() => start("real")}><span className="c" />⏱ Thi thật (tính giờ · nghe 1 lần)</button>
            <button className="gbtn" onClick={() => start("practice")}><span className="c" />📖 Luyện tập (không giờ · nghe lại thoải mái)</button>
          </div>
        </div>
      </>
    );
  }

  // ——— giữa hai phần thi ———
  if (run.phase === "between") return (
    <>
      {back}
      <div className="panel lbsec exbetween">
        <h2>✅ Đã nộp phần trước</h2>
        <p>Phần tiếp theo: <b className="jpt">{S.jp}</b> — {secQs.length} câu{real && S.minutes ? ` · ${S.minutes} phút` : ""}</p>
        <button className="gbtn tri" onClick={() => set((r) => { r.phase = "sec"; return r; })}><span className="c" />Bắt đầu phần thi</button>
      </div>
    </>
  );

  // ——— kết quả ———
  if (run.phase === "done") {
    const R = result;
    return (
      <>
        {back}
        <div className="pagehead" style={{ marginTop: 10 }}>
          <p style={{ letterSpacing: 2, margin: "0 0 6px" }}>KẾT QUẢ · {E.title}</p>
          <h1 className={R.passed ? "expass" : "exfail"}>{R.passed ? "🎉 ĐỖ" : "Chưa đỗ"} · {R.total}/{R.max} điểm</h1>
          <p>{R.eq ? `Quy đổi JLPT ${R.eq} · ` : ""}Đúng {R.right}/{R.count} câu · điểm đỗ {R.pass}{R.grade ? ` · ${R.grade}` : ""}</p>
          {R.old && <p className="exold">Thang JLPT cũ {E.level}: <b>{R.old.total}/{R.old.max}</b> ({R.old.passed ? "đạt" : "chưa đạt"} mức đỗ {R.old.pass}) · {R.old.groups.map((g) => `${g.jp} ${g.score}/${g.max}`).join(" · ")}</p>}
          <div className="orn"><span /></div>
        </div>
        {examLevelOf(E.id) && (
          <p className="exrankln">
            <Link href={`/rank?board=jl:${examLevelOf(E.id)}`} onClick={() => sfx.page()}>🏆 Xem bảng xếp hạng thi thử {E.kind === "kyu" ? `${E.level} (quy đổi)` : `JLPT ${E.level}`} ›</Link>
            {!G?.profile?.username && <small> · Đăng nhập để điểm của bạn được ghi lên bảng</small>}
          </p>
        )}
        {(() => {
          const b = run.bonus || {}, per = run.earned || 0, all = per + (b.done || 0) + (b.pass || 0) + (b.great || 0);
          if (!all) return null;
          return (
            <div className="panel exrw">
              <b><Ico id="pgm" /> +{all.toLocaleString("vi-VN")} Nguyên Thạch trong lượt làm này</b>
              <ul>
                {per > 0 && <li>Trả lời đúng: <b>+{per.toLocaleString("vi-VN")}</b></li>}
                {b.done > 0 && <li>Hoàn thành đề lần đầu: <b>+{b.done}</b></li>}
                {b.pass > 0 && <li>Đỗ lần đầu: <b>+{b.pass}</b></li>}
                {b.great > 0 && <li>Xuất sắc (từ 90% điểm): <b>+{b.great}</b></li>}
              </ul>
              <small>Mỗi câu đúng cũng được cộng vào <b>Điểm Mạo Hiểm</b>; đỗ đề thi cộng thêm điểm xếp hạng. {E.kind === "kyu" ? "Đề cũ 級" : "Đề JLPT"} thưởng nhiều hơn các bài luyện thường.</small>
            </div>
          );
        })()}
        {R.passed && <div className="excertcta panel"><span>🎓</span><div><b>Chúc mừng bạn đã đỗ!</b><p>Bạn nhận được Giấy chứng nhận luyện thi (bố cục kiểu phiếu điểm JLPT) — tải về dạng ảnh PNG.</p></div><Link href={`/de-thi/chung-nhan/${E.id}`} className="gbtn tri" onClick={() => sfx.page()}><span className="c" />Xem giấy chứng nhận</Link></div>}
        <div className="exresgrid">
          <div className="panel excefr">
            <small>Trình độ CEFR (khung châu Âu){R.eq ? ` · theo JLPT ${R.eq}` : ""}</small>
            <b>{R.cefr || "—"}</b>
            <p>{R.cefr ? CEFR_VI[R.cefr] : R.passed ? "Kỳ thi này không quy đổi CEFR" : "Chưa đạt mức đỗ nên chưa quy đổi CEFR"}</p>
          </div>
          <div className="panel lbsec" style={{ margin: 0 }}>
            <h3 style={{ marginTop: 0 }}>Điểm từng phần{R.eq ? ` (thang JLPT ${R.eq})` : ""}</h3>
            <table className="vnvocab extab"><tbody>{R.groups.map((g) => (
              <tr key={g.id} className={g.okMin ? "" : "bad"}>
                <td className="jpt">{g.jp}<br /><small>{g.vi}</small></td>
                <td><b>{g.score}</b>/{g.max}</td>
                <td>{g.min ? (g.okMin ? `✓ ≥ sàn ${g.min}` : `✗ dưới sàn ${g.min}`) : ""}</td>
                <td>{g.right}/{g.n} câu</td>
              </tr>
            ))}</tbody></table>
          </div>
        </div>
        <div className="panel lbsec">
          <h2>📊 Số câu sai từng phần</h2>
          <table className="vnvocab extab"><thead><tr><th>Phần thi</th><th>問題</th><th>Sai / Tổng</th><th></th></tr></thead><tbody>
            {R.parts.map((p, i) => (
              <tr key={i}>
                <td className="jpt">{p.sec}</td><td className="jpt">{p.part} {p.title && <small>{p.title}</small>}</td>
                <td><b className={p.wrong ? "exbad" : "exok"}>{p.wrong}</b> / {p.n}{p.blank ? <small> (bỏ trống {p.blank})</small> : null}</td>
                <td><div className="bar exbar"><i style={{ width: `${Math.round(((p.n - p.wrong) / p.n) * 100)}%` }} /></div></td>
              </tr>
            ))}
          </tbody></table>
          <p className="hint">Điểm quy đổi tuyến tính theo tỉ lệ câu đúng (ước tính). JLPT thật dùng phương pháp quy đổi cân bằng độ khó nên điểm thật có thể chênh vài điểm.</p>
        </div>
        <Review E={E} Qs={Qs} answers={run.answers} />
        <div className="lbfoot">
          <Link href={`/de-thi/${E.kind}`} className="chip dk" onClick={() => sfx.page()}>‹ Danh sách đề</Link>
          <button className="gbtn tri" onClick={reset}><span className="c" />Làm lại từ đầu</button>
        </div>
      </>
    );
  }

  // ——— đang làm một phần thi ———
  const left = run.left[run.si] ?? (S.minutes || 0) * 60;
  const nDone = secQs.filter((x) => run.answers[x.id] != null).length;
  let no = 0;
  return (
    <>
      <div className="exbar-top">
        <div><b className="jpt">{S.jp}</b><small>Phần {run.si + 1}/{E.sections.length} · {E.title}</small></div>
        <span className="exprog">{nDone}/{secQs.length} câu</span>
        {real && S.minutes ? <span className={`extimer ${left < 300 ? "low" : ""}`}>⏱ {fmtTime(left)}</span> : <span className="extimer">📖 Luyện tập</span>}
        <button className="chip sm" onClick={() => { if (nDone < secQs.length && !confirm(`Còn ${secQs.length - nDone} câu chưa làm (tính là sai). Nộp phần này?`)) return; finishSection(); }}>Nộp phần này ›</button>
      </div>
      <div className="lbbar exview"><ViewBar /></div>
      {S.parts.map((P, pi) => {
        const pq = secQs.filter((x) => x.pi === pi);
        const allDone = pq.every((x) => run.answers[x.id] != null);
        return (
          <section key={pi} className="expart">
            <h2 className="exparth"><span className="jpt">{P.jp}</span> {P.title && <small>{P.title}</small>}</h2>
            {P.instr && <p className="exinstr jpt">{P.instr}</p>}
            {P.instrVi && <p className="exinstrvi">{P.instrVi}</p>}
            <PassageView P={P} revealed={allDone} />
            {pq.map((x) => { no++; return (
              <QuestionCard key={x.id} Q={x.Q} qid={x.id} no={x.Q.no ?? no} ans={run.answers[x.id]} onAnswer={answer}
                gain={run.gains?.[x.id]} real={real} played={!!run.played[x.id]} onPlayed={played} />
            ); })}
          </section>
        );
      })}
      <div className="lbfoot">
        <button className="chip dk" onClick={reset}>Bỏ bài, làm lại</button>
        <button className="gbtn tri" onClick={() => { if (nDone < secQs.length && !confirm(`Còn ${secQs.length - nDone} câu chưa làm (tính là sai). Nộp phần này?`)) return; finishSection(); }}>
          <span className="c" />{run.si + 1 < E.sections.length ? "Nộp phần này, sang phần tiếp" : "Nộp bài, xem kết quả"}
        </button>
      </div>
    </>
  );
}

// xem lại sau khi thi: lọc câu sai / tất cả
function Review({ E, Qs, answers }) {
  const [all, setAll] = useState(false);
  const list = Qs.filter((x) => all || answers[x.id] !== x.Q.answer);
  return (
    <section className="lbsec2">
      <h2 className="a22th"><span>🔁 Xem lại</span> <small>{all ? "Tất cả câu hỏi" : `${list.length} câu sai / bỏ trống`}</small>
        <button className="chip sm" style={{ marginLeft: "auto" }} onClick={() => setAll(!all)}>{all ? "Chỉ câu sai" : "Xem tất cả"}</button></h2>
      <div className="lbbar exview"><ViewBar /></div>
      {!list.length && <p className="panel lbsec" style={{ textAlign: "center" }}>Không sai câu nào. Xuất sắc! 🎉</p>}
      {list.map((x, i) => (
        <div key={x.id}>
          <p className="exrevwhere jpt">{E.sections[x.si].jp} · {x.P.jp}{x.P.title ? ` ${x.P.title}` : ""}</p>
          {x.P.passage && (i === 0 || list[i - 1].P !== x.P) && <PassageView P={x.P} revealed />}
          <QuestionCard Q={x.Q} qid={x.id} no={x.Q.no ?? x.qi + 1} ans={answers[x.id]} onAnswer={() => {}} locked real={false} played={false} onPlayed={() => {}} review />
        </div>
      ))}
    </section>
  );
}
