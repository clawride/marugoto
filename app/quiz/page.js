"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGame } from "@/components/Game";
import MediaPanel, { preloadMedia } from "@/components/MediaPanel";
import { Ico } from "@/components/Icons";
import { shuffle, pickRand, starsFor, ELEM } from "@/lib/data";
import { nbTopic, nbWords, secOf, topicLabel, meaningsNear } from "@/lib/notebook";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { sfx } from "@/lib/sfx";

const PER_CORRECT = 10;
const LINES_OK = ["Chính xác! Giỏi quá đi~", "Tuyệt vời, Nhà Lữ Hành!", "Đúng rồi! Cứ thế phát huy nhé!", "Hoàn hảo! Từ này bạn nắm chắc rồi.", "Quá đỉnh! Thêm Nguyên Thạch nè~", "Hừm, không tệ chút nào!", "Trí nhớ tốt đấy, tiếp tục nào!"];
const LINES_BAD = ["Không sao, nhớ kỹ lần sau nhé!", "Ui, suýt nữa thôi! Ghi nhớ nghĩa này nha.", "Đừng nản, ai cũng từng sai mà~", "Từ này hơi khó nhỉ? Lát nữa làm lại nhé!", "Hãy đọc to từ này vài lần cho nhớ nào!"];

export default function QuizPage() {
  return <Suspense fallback={null}><Quiz /></Suspense>;
}

function makeOptions(item) {
  const near = meaningsNear(item.t);
  const bad = new Set([item.m.trim().toLowerCase()]);
  const opts = [];
  const tryAdd = (m) => { const k = m.trim().toLowerCase(); if (opts.length < 3 && !bad.has(k)) { bad.add(k); opts.push(m); } };
  shuffle(near.same).forEach(tryAdd);
  if (opts.length < 3) shuffle(near.book).forEach(tryAdd);
  const all = shuffle([...opts, item.m]);
  return { all, ans: all.indexOf(item.m) };
}

function speak(item) {
  try {
    const u = new SpeechSynthesisUtterance((item.r || item.w).split("/")[0].replace(/[～（）()]/g, ""));
    u.lang = "ja-JP"; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch {}
}

function Quiz() {
  const sp = useSearchParams();
  const router = useRouter();
  const { S, update } = useGame();
  const t = sp.get("t") || "1", key = sp.get("k") || "all", count = +sp.get("n") || 20, retry = sp.get("retry") === "1";

  const [list, setList] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [stat, setStat] = useState({ correct: 0, wrong: [], streak: 0, earned: 0 });
  const [done, setDone] = useState(null);
  const [floats, setFloats] = useState([]);

  // Khởi tạo danh sách câu hỏi
  useEffect(() => {
    let words;
    if (retry || sp.get("ss") === "1") { try { words = JSON.parse(sessionStorage.getItem("retryWords") || "[]"); } catch { words = []; } }
    else words = shuffle(nbWords(t, key)).slice(0, count);
    setList(shuffle(words)); setIdx(0); setPicked(null); setDone(null);
    setStat({ correct: 0, wrong: [], streak: 0, earned: 0 });
  }, [t, key, count, retry, sp]);

  const item = list?.[idx];
  const opts = useMemo(() => (item ? makeOptions(item) : null), [item]);
  const buddy = useMemo(() => (item ? pickRand(CHARS) : null), [item]);
  const line = useMemo(() => pickRand(picked === opts?.ans ? LINES_OK : LINES_BAD), [picked, opts]);
  useEffect(() => { if (item && S) preloadMedia(item, S.imgTab); }, [item, S]);

  const answer = useCallback((i, ev) => {
    if (picked !== null || !opts) return;
    setPicked(i);
    const ok = i === opts.ans;
    if (ok) {
      const streak = stat.streak + 1;
      const gain = PER_CORRECT + (streak % 5 === 0 ? 10 : 0);
      setStat((s) => ({ ...s, correct: s.correct + 1, streak, earned: s.earned + gain }));
      update((s) => { s.primo += gain; s.total += 1; });
      sfx.correct(); setTimeout(() => sfx.primo(), 250);
      const r = ev?.currentTarget?.getBoundingClientRect?.() || { left: innerWidth / 2, width: 0, top: innerHeight / 2 };
      const id = Math.random();
      setFloats((f) => [...f, { id, x: r.left + r.width / 2 - 20, y: r.top, gain }]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1200);
    } else {
      setStat((s) => ({ ...s, streak: 0, wrong: [...s.wrong, item] }));
      sfx.wrong();
    }
    setTimeout(() => { const r = document.getElementById("rev"); if (r && r.getBoundingClientRect().bottom > innerHeight) r.scrollIntoView({ behavior: "smooth", block: "end" }); }, 80);
  }, [picked, opts, stat.streak, item, update]);

  const next = useCallback(() => {
    if (picked === null || !list) return;
    sfx.click();
    if (idx < list.length - 1) { setIdx(idx + 1); setPicked(null); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    // Kết thúc
    const total = list.length, c = stat.correct, pct = Math.round((c / total) * 100);
    let bonus = 0, newBest = false;
    if (!retry) {
      if (pct === 100 && total >= 5) bonus = 50; else if (pct >= 90 && total >= 5) bonus = 20;
      update((s) => {
        s.primo += bonus;
        const k = `t${t}_${key}`, prev = s.best[k];
        if (!prev || pct > prev.pct || (pct === prev.pct && total > prev.t)) { s.best[k] = { c, t: total, pct }; newBest = true; }
      });
    }
    setDone({ total, c, pct, bonus, newBest, earned: stat.earned + bonus, wrong: stat.wrong });
    sfx.summary();
    window.scrollTo({ top: 0 });
  }, [picked, list, idx, stat, retry, t, key, update]);

  useEffect(() => {
    const h = (e) => {
      if (done || !opts) return;
      if (picked === null && /^[1-4]$/.test(e.key)) answer(+e.key - 1);
      else if (picked !== null && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [answer, next, picked, done, opts]);

  if (!S || !list) return null;
  const TT = nbTopic(t);
  const sec = TT ? secOf(TT, key) : { vi: "" };
  if (!list.length) return <p style={{ marginTop: 40 }}>Không có câu hỏi. <Link href={`/topic/${t}`}>Quay lại</Link></p>;
  if (done) return <Result t={t} k={key} retry={retry} done={done} list={list} router={router} />;

  const ok = picked !== null && picked === opts.ans;
  const showK = (S.showKana || picked !== null) && item.r && item.r !== item.w;
  const el = ELEM[buddy.el];
  return (
    <>
      <Link href={`/topic/${t}`} className="back">‹ {TT ? topicLabel(TT) : "Topic"} · {sec.vi}{retry ? " (làm lại câu sai)" : ""}</Link>
      <div className="qtop">
        <span className="cnt">Câu {idx + 1}/{list.length}</span>
        <div className="prog"><div className="bar"><i style={{ width: `${(idx / list.length) * 100}%` }} /></div></div>
        <span>{stat.streak >= 2 ? `🔥 ${stat.streak}` : ""}</span>
        <span className="earn"><Ico id="pgm" />{stat.earned}</span>
      </div>
      <div className="parch qcard" key={item.w}>
        <div className="tools">
          <button className={`iconbtn ${S.showKana ? "on" : ""}`} title="Bật/tắt cách đọc" onClick={() => update((s) => { s.showKana = !s.showKana; })}>あ</button>
          <button className="iconbtn" title="Nghe phát âm" onClick={() => speak(item)}>🔊</button>
        </div>
        <div className="lab">Chọn <b>nghĩa tiếng Việt</b> đúng</div>
        <div className="word">{item.w}</div>
        <div className="kana">{showK ? item.r : ""}</div>
      </div>
      <div className="opts" key={`o${idx}`}>
        {opts.all.map((m, i) => {
          const cls = picked === null ? "" : i === opts.ans ? "ok" : i === picked ? "bad" : "dim";
          return <button key={i} className={`opt ${cls}`} disabled={picked !== null} onClick={(e) => answer(i, e)}><span className="k"><span>{i + 1}</span></span><span>{m}</span></button>;
        })}
      </div>
      {picked !== null && (
        <div id="rev" className="panel reveal">
          <MediaPanel item={item} ok={ok} />
          <div className="info">
            <div className={`verdict ${ok ? "ok" : "bad"}`}>{ok ? "✦ Chính xác!" : "✕ Chưa đúng rồi"}</div>
            <div className="w">{item.w}</div>
            <div className="r">{item.r}</div>
            <div className="m">{item.m}</div>
            {ok && <div className="gain">+{PER_CORRECT + (stat.streak % 5 === 0 ? 10 : 0)} <Ico id="pgm" /> Nguyên Thạch{stat.streak % 5 === 0 ? ` (thưởng chuỗi ${stat.streak})` : ""}</div>}
            <div className="buddy">
              <div className="av" style={{ "--elc": el.c }}><img src={charIcon(buddy)} alt="" /></div>
              <div className="bubble"><b>{buddy.vi}</b>{ok && stat.streak >= 5 ? `Chuỗi ${stat.streak} câu đúng liên tiếp! Không ai cản nổi bạn rồi!` : line}</div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="gbtn tri" onClick={next}><span className="c" />{idx === list.length - 1 ? "Xem kết quả" : "Câu tiếp theo"}</button>
            </div>
          </div>
        </div>
      )}
      <div className="hint">Phím tắt: 1–4 để chọn · Enter để sang câu tiếp</div>
      {floats.map((f) => <div key={f.id} className="float" style={{ left: f.x, top: f.y }}>+{f.gain} <Ico id="pgm" /></div>)}
    </>
  );
}

function Result({ t, k, retry, done, list, router }) {
  const { total, c, pct, bonus, newBest, earned, wrong } = done;
  const st = starsFor(pct);
  const TT = nbTopic(t);
  const sec = TT ? secOf(TT, k) : { vi: "" };
  const hero = useMemo(() => pickRand(pct >= 80 ? CHARS.filter((x) => x.rank === 5) : CHARS), [pct]);
  const [gif, setGif] = useState(null);
  const gifRef = useRef(false);
  useEffect(() => {
    if (gifRef.current) return; gifRef.current = true;
    const cat = pct === 100 ? pickRand(["dance", "happy", "highfive"]) : pct >= 80 ? pickRand(["thumbsup", "clap", "smile"]) : pct >= 60 ? pickRand(["nod", "wink", "pat"]) : pickRand(["cry", "pout", "facepalm"]);
    fetch(`https://nekos.best/api/v2/${cat}`).then((r) => r.json()).then((j) => setGif(j.results?.[0]?.url)).catch(() => {});
    [0, 1, 2].forEach((i) => i < st && setTimeout(() => sfx.star(i), 250 + i * 250));
  }, [pct, st]);
  const say = pct === 100 ? "Hoàn hảo tuyệt đối! Bạn đúng là thiên tài ngôn ngữ của Teyvat!" : pct >= 80 ? "Làm tốt lắm! Chỉ còn vài từ nữa là hoàn hảo rồi." : pct >= 60 ? "Khá lắm! Ôn lại các từ sai rồi thử lại nhé." : "Đừng nản chí! Làm lại các câu sai, mình tin bạn làm được!";
  const again = (words, isRetry) => {
    sessionStorage.setItem("retryWords", JSON.stringify(words));
    router.push(`/quiz?t=${encodeURIComponent(t)}&k=${k}&n=${words.length}&retry=${isRetry ? 1 : 0}&ss=1&r=${Date.now()}`);
  };
  return (
    <div className="panel result">
      <div className="rhero"><img src={charSplash(hero)} onError={(e) => { e.currentTarget.src = charIcon(hero); e.currentTarget.style.objectFit = "contain"; }} alt="" /><div className="say"><b>{hero.vi}:</b> {say}</div></div>
      <div style={{ fontSize: 13, letterSpacing: 3, color: "var(--gold)" }}>{(TT ? topicLabel(TT) : "TOPIC").toUpperCase()} · {sec.vi.toUpperCase()}{retry ? " · LÀM LẠI CÂU SAI" : ""}</div>
      <h2 style={{ marginTop: 8 }}>{pct === 100 ? "Hoàn Mỹ!" : pct >= 80 ? "Thử Thách Hoàn Thành!" : pct >= 60 ? "Khá lắm, Nhà Lữ Hành!" : "Cố lên, Nhà Lữ Hành!"}</h2>
      <div className="bigstars">{[0, 1, 2].map((i) => <span key={i} className={i < st ? "on" : ""} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>★</span>)}</div>
      <div className="score">{c}<small> / {total}</small> <small>({pct}%)</small>{newBest && <span className="newbest">Kỷ lục mới</span>}</div>
      <div className="rew"><Ico id="pgm" /> +{earned} Nguyên Thạch{bonus ? <small style={{ color: "var(--gold)" }}> (gồm thưởng {bonus})</small> : null}</div>
      {gif && <img className="rgif" src={gif} alt="" />}
      <div className="btnrow" style={{ marginTop: 22 }}>
        <Link href={`/topic/${t}`} className="gbtn x dark"><span className="c" />Về Topic</Link>
        {/* Làm lại: lấy lại toàn bộ danh sách */}
        <button className="gbtn" onClick={() => again(list, retry)}><span className="c" />Làm lại</button>
        {wrong.length > 0 && <button className="gbtn tri" onClick={() => again(wrong, true)}><span className="c" />Làm lại {wrong.length} câu sai</button>}
        <Link href="/wish" className="gbtn"><span className="c" />Cầu Nguyện</Link>
      </div>
      {wrong.length > 0 && (
        <div className="wronglist">
          <h3>Các từ trả lời sai ({wrong.length})</h3>
          <div className="wl">{wrong.map((w) => <div key={w.w}><b>{w.w}</b><i>{w.r}</i><p>{w.m}</p></div>)}</div>
        </div>
      )}
    </div>
  );
}
