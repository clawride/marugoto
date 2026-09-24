"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBattle, Arena, NextBtn, Blank, BLANK_RE, MCQ, FillQ, starsOf } from "@/components/Battle";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { Ico } from "@/components/Icons";
import { ELEM, shuffle, pickRand } from "@/lib/data";
import { CHARS, charIcon, charSplash, elemIcon } from "@/lib/genshin";
import { BOSSES, bossOf, bossIcon, lessonOf, todayKey, rewardFor } from "@/lib/bosses";
import { sfx } from "@/lib/sfx";
import OrderQ from "@/components/OrderQ";

const STAGES = { vocab: "Từ vựng", grammar: "Ngữ pháp", order: "Yae Miko · Xếp câu", dialog: "Hội thoại" };
const YAE = CHARS.find((c) => c.en === "Yae Miko");
const YAE_LINES = {
  intro: ["Hừm~ Để xem Nhà Lữ Hành xếp câu có giỏi như lời đồn không nào.", "Thần Điện Narukami không nhận kẻ lười học đâu nhé. Xếp câu cho ta xem.", "Một câu tiếng Nhật đẹp cũng như một bài thơ — xếp cho đúng nào~"],
  ok: ["Ara~ cũng khá đấy.", "Fufu, không tệ. Ta bắt đầu thấy thú vị rồi.", "Được lắm. Câu tiếp theo sẽ không dễ vậy đâu~"],
  bad: ["Fufu, sai rồi. Nhìn kỹ câu đúng đi nào.", "Ôi chao~ thứ tự đó làm ta bật cười đấy.", "Chưa đúng. Nhớ vị trí trợ từ và động từ cuối câu nhé~"],
  next: ["Câu tiếp theo đây~", "Nào, thử câu này xem.", "Đừng để ta thất vọng nhé~"],
};
const YAE_HOST = YAE && { name: YAE.vi, icon: charIcon(YAE), lines: YAE_LINES };

function buildQueue(L) {
  const q = [];
  const voc = shuffle(L.vocab).slice(0, 4);
  voc.forEach((v, i) => {
    const others = shuffle(L.vocab.filter((x) => x !== v && x.vi !== v.vi && x.jp !== v.jp)).slice(0, 3);
    const toVi = i % 2 === 0;
    q.push({
      stage: "vocab", type: "mc", jpPrompt: toVi, prompt: toVi ? v.jp : v.vi, sub: toVi ? "Chọn nghĩa tiếng Việt" : "Chọn từ tiếng Nhật",
      opts: shuffle([v, ...others]).map((x) => (toVi ? x.vi : x.jp)), jpOpts: !toVi, answer: toVi ? v.vi : v.jp, explain: `${v.jp} — ${v.vi}`,
    });
  });
  shuffle(L.fill).slice(0, 4).forEach((f) => q.push({ stage: "grammar", type: "fill", q: f.q, opts: shuffle(f.opts), answer: f.opts[f.a], vi: f.vi, explain: f.hint }));
  shuffle(L.order).slice(0, 3).forEach((o) => q.push({ stage: "order", type: "order", chunks: o.chunks, vi: o.vi }));
  const d = pickRand(L.dialogs);
  const npc = pickRand(CHARS.filter((c) => c.en !== "Yae Miko"));
  q.push({ stage: "dialog", type: "dialog", dialog: d, npc });
  return q;
}
const scoringCount = (q) => q.reduce((a, x) => a + (x.type === "dialog" ? x.dialog.turns.filter((t) => t.me).length : 1), 0);

export default function BossBattle() {
  const { l } = useParams();
  const lesson = +l;
  const boss = bossOf(lesson), L = lessonOf(lesson);
  const { S, update } = useGame();
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(null);
  const total = queue ? scoringCount(queue) : 1;
  const arenaBoss = useMemo(() => boss && { ...boss, img: bossIcon(boss), lv: Math.min(90, 10 + lesson * 5) }, [boss, lesson]);
  const B = useBattle(arenaBoss || { hp: 1 }, total, { exclude: ["Yae Miko"] });
  const { party, hp, setHp, fx, attacker, correct, answered, score, reset } = B;
  const start = useCallback(() => { if (!L) return; setQueue(buildQueue(L)); setIdx(0); reset(); setDone(null); }, [L, reset]);
  useEffect(() => { start(); }, [start]);

  const next = useCallback(() => {
    sfx.click();
    if (idx < queue.length - 1) { setIdx(idx + 1); return; }
    const pct = Math.round((correct / total) * 100);
    const stars = starsOf(pct);
    const win = stars > 0;
    const today = todayKey();
    let reward = 0;
    update((s) => {
      s.boss = s.boss || {};
      const b = s.boss[lesson] || { best: 0, cleared: false, reward: "" };
      if (win) {
        b.cleared = true;
        b.best = Math.max(b.best, stars);
        if (b.reward !== today) { reward = rewardFor(stars); s.primo += reward; b.reward = today; }
      }
      s.boss[lesson] = b;
      s.bossPct = s.bossPct || {};
      const bp = s.bossPct[lesson];
      if (!bp || pct > bp.pct || (pct === bp.pct && total > bp.total)) s.bossPct[lesson] = { pct, total };
    });
    if (win) { setHp(0); sfx.win(); }
    setDone({ pct, stars, win, reward });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [idx, queue, correct, total, lesson, update]);

  if (!boss || !L) return <p style={{ marginTop: 40 }}>Không tìm thấy boss. <Link href="/boss">Quay lại</Link></p>;
  if (!S || !queue) return null;
  const locked = lesson > 1 && !S.boss?.[lesson - 1]?.cleared;
  if (locked) return <p style={{ marginTop: 40 }}>Boss này chưa mở. Hãy hạ boss bài {lesson - 1} trước. <Link href="/boss" style={{ color: "var(--gold2)" }}>Danh sách boss</Link></p>;

  const cur = queue[idx];
  const stageKeys = Object.keys(STAGES);

  return (
    <>
      <Link href="/boss" className="back">‹ Danh sách boss</Link>
      <Arena boss={arenaBoss} hp={hp} fx={fx} attacker={attacker} party={party} />

      {!done && (
        <>
          <div className="stagebar">
            {stageKeys.map((k) => <span key={k} className={k === cur.stage ? "on" : stageKeys.indexOf(k) < stageKeys.indexOf(cur.stage) ? "past" : ""}>{STAGES[k]}</span>)}
            <b>{answered}/{total} · đúng {correct}</b>
          </div>
          {cur.type === "mc" && <MCQ key={idx} q={cur} onScore={score} onNext={next} />}
          {cur.type === "fill" && <FillQ key={idx} q={cur} onScore={score} onNext={next} />}
          {cur.type === "order" && <OrderQ key={idx} q={cur} onScore={score} onNext={next} first={queue.findIndex((x) => x.type === "order") === idx} host={YAE_HOST} />}
          {cur.type === "dialog" && <DialogQ key={idx} q={cur} onScore={score} onNext={next} />}
        </>
      )}

      {done && (
        <div className="panel result">
          <div className="rhero"><img src={done.win ? charSplash(pickRand(party)) : charSplash(YAE)} alt="" /><div className="say">{done.win ? <><b>Tổ đội:</b> Boss đã bị hạ gục! Tiếp tục phát huy nhé!</> : <><b>{YAE.vi}:</b> Fufu~ boss vẫn còn đứng đó. Ôn lại rồi quay lại nhé.</>}</div></div>
          <h2>{done.win ? "Đã Hạ Gục Boss!" : "Boss Rút Lui…"}</h2>
          <div className="bigstars">{[0, 1, 2].map((i) => <span key={i} className={i < done.stars ? "on" : ""} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>★</span>)}</div>
          <div className="score">{correct}<small> / {total}</small> <small>({done.pct}%)</small></div>
          {done.win && (done.reward > 0
            ? <div className="rew"><Ico id="pgm" /> +{done.reward} Nguyên Thạch (thưởng hôm nay)</div>
            : <div className="rew" style={{ fontSize: 14 }}>Hôm nay đã nhận thưởng boss này — quay lại vào ngày mai nhé</div>)}
          {!done.win && <p style={{ color: "#c9cbd6" }}>Cần đúng ít nhất 60% để hạ boss và mở khóa bài tiếp theo.</p>}
          <div className="btnrow" style={{ marginTop: 22 }}>
            <Link href="/boss" className="gbtn x dark"><span className="c" />Danh sách boss</Link>
            <button className="gbtn" onClick={start}><span className="c" />Đánh lại</button>
            {done.win && lesson < BOSSES.length && <Link href={`/boss/${lesson + 1}`} className="gbtn tri"><span className="c" />Boss tiếp theo</Link>}
          </div>
        </div>
      )}
    </>
  );
}

function DialogQ({ q, onScore, onNext }) {
  const { dialog, npc } = q;
  const [step, setStep] = useState(0); // chỉ số lượt đang chờ
  const [log, setLog] = useState([]);
  const [pick, setPick] = useState(null);
  const endRef = useRef(null);
  const el = ELEM[npc.el];

  // tự thêm các lượt NPC cho tới lượt của người chơi
  useEffect(() => {
    const t = dialog.turns[step];
    if (!t || !t.npc) return;
    const timer = setTimeout(() => { setLog((l) => [...l, { who: "npc", text: t.npc, vi: t.vi }]); setStep((s) => s + 1); sfx.hover(); }, step === 0 ? 300 : 700);
    return () => clearTimeout(timer);
  }, [step, dialog]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [log, pick]);

  const t = dialog.turns[step];
  const finished = step >= dialog.turns.length;
  const answer = (o) => {
    if (pick !== null) return;
    const right = t.opts[t.a];
    const ok = o === right;
    setPick(o); onScore(ok);
    const text = t.me === "fill" ? t.q.replace(BLANK_RE, right) : right;
    setTimeout(() => { setLog((l) => [...l, { who: "me", text, vi: t.vi, ok, wrong: ok ? null : o }]); setPick(null); setStep((s) => s + 1); }, 900);
  };

  return (
    <div className="parch bq dlg">
      <div className="dlghead" style={{ "--pc": el.c }}>
        <img src={charIcon(npc)} alt="" /><div><b>{npc.vi}</b><small>{dialog.scene}</small></div>
      </div>
      <div className="chat">
        {log.map((m, i) => (
          <div key={i} className={`msg ${m.who}`}>
            {m.who === "npc" && <img src={charIcon(npc)} alt="" />}
            <div className={`bub ${m.ok === false ? "was-bad" : ""}`}>
              <span className="jpt">{m.text}</span>
              {m.vi && <small>{m.vi}</small>}
              {m.wrong && <em>Bạn chọn: {m.wrong}</em>}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {t && t.me && (
        <div className="myturn">
          <div className="lab">{t.me === "choose" ? "Chọn câu trả lời phù hợp" : "Điền vào chỗ trống trong câu trả lời"}</div>
          {t.me === "fill" && <div className="bprompt jp sm"><Blank text={t.q} fill={pick !== null ? t.opts[t.a] : null} state={pick === null ? "" : pick === t.opts[t.a] ? "ok" : "bad"} /></div>}
          <div className={t.me === "choose" ? "opts one" : "chipsopt"}>
            {t.opts.map((o, i) => {
              const cls = pick === null ? "" : o === t.opts[t.a] ? "ok" : o === pick ? "bad" : "dim";
              return t.me === "choose"
                ? <button key={i} className={`opt jpopt ${cls}`} disabled={pick !== null} onClick={() => answer(o)}><span className="k"><span>{i + 1}</span></span><span>{o}</span></button>
                : <button key={i} className={`chipo ${cls}`} disabled={pick !== null} onClick={() => answer(o)}>{o}</button>;
            })}
          </div>
        </div>
      )}
      {finished && <NextBtn onNext={onNext} />}
    </div>
  );
}
