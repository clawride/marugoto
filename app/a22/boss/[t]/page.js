"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { useBattle, Arena, MCQ, starsOf } from "@/components/Battle";
import { A22Question } from "@/components/A22Run";
import { NahidaHost, ND, NAHIDA } from "@/components/Nahida";
import { Ico } from "@/components/Icons";
import { a22Boss, a22BossIcon, bossQueue, A22_BOSSES } from "@/lib/a22";
import { todayKey, rewardFor } from "@/lib/bosses";
import { charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";
import { sfx } from "@/lib/sfx";

const STAGES = { vocab: "Từ vựng", kanji: "Kanji", grammar: "Ngữ pháp", fill: "Điền từ", order: "Xếp câu", listen: "Nghe", read: "Đọc" };

export default function A22BossPage() {
  const { t } = useParams();
  const topic = +t;
  const boss = a22Boss(topic);
  const { S, update } = useGame();
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(null);
  const total = queue?.length || 1;
  const arenaBoss = useMemo(() => boss && { ...boss, img: a22BossIcon(boss), lv: Math.min(90, 40 + topic * 5), sub: `Boss Topic ${topic} · Marugoto A2-2` }, [boss, topic]);
  const B = useBattle(arenaBoss || { hp: 1 }, total, { exclude: ["Nahida"] });
  const { party, hp, setHp, fx, attacker, correct, answered, score, reset } = B;
  const start = useCallback(() => { setQueue(bossQueue(topic)); setIdx(0); reset(); setDone(null); }, [topic, reset]);
  useEffect(() => { if (boss) start(); }, [boss, start]);

  const next = useCallback(() => {
    sfx.click();
    if (idx < queue.length - 1) { setIdx(idx + 1); return; }
    const pct = Math.round((correct / total) * 100);
    const stars = starsOf(pct);
    const win = stars > 0;
    const today = todayKey();
    let reward = 0;
    update((s) => {
      s.a22 = s.a22 || {}; s.a22.boss = s.a22.boss || {};
      const b = s.a22.boss[topic] || { best: 0, cleared: false, reward: "", pct: 0, total: 0 };
      if (win) {
        b.cleared = true;
        b.best = Math.max(b.best, stars);
        if (b.reward !== today) { reward = rewardFor(stars); s.primo += reward; b.reward = today; }
      }
      if (pct > (b.pct || 0) || (pct === b.pct && total > (b.total || 0))) { b.pct = pct; b.total = total; }
      s.a22.boss[topic] = b;
    });
    if (win) { setHp(0); sfx.win(); }
    setDone({ pct, stars, win, reward });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [idx, queue, correct, total, topic, update, setHp]);

  if (!boss) return <p style={{ marginTop: 40 }}>Không tìm thấy boss. <Link href="/a22">Marugoto A2-2</Link></p>;
  if (!S || !queue) return null;
  const cur = queue[idx];
  const stageKeys = [...new Set(queue.map((q) => q.stage))];

  return (
    <>
      <Link href="/a22" className="back">‹ Marugoto A2-2</Link>
      <Arena boss={arenaBoss} hp={hp} fx={fx} attacker={attacker} party={party} />
      {!done && (
        <>
          <div className="stagebar">
            {stageKeys.map((k) => <span key={k} className={k === cur.stage ? "on" : stageKeys.indexOf(k) < stageKeys.indexOf(cur.stage) ? "past" : ""}>{STAGES[k]}</span>)}
            <b>{answered}/{total} · đúng {correct}</b>
          </div>
          {cur.type === "read" ? (
            <MCQ key={idx} q={cur} onScore={score} onNext={next} top={<>
              <NahidaHost line={ND.read} />
              <article className="reading inexam">
                <div className="rgenre">{cur.passage.genre}</div>
                <h3 className="jpt">{cur.passage.title}</h3>
                <div className="rtext jpt">{cur.passage.text.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>
              </article>
            </>} />
          ) : (
            <A22Question key={idx} q={cur} idx={idx} first={queue.findIndex((x) => x.type === "order") === idx} hostLine={ND[cur.stage] || ND.hub[0]} onScore={score} onNext={next} />
          )}
        </>
      )}
      {done && (
        <div className="panel result">
          <div className="rhero"><img src={done.win ? charSplash(pickRand(party)) : charSplash(NAHIDA)} alt="" /><div className="say">{done.win ? <><b>Tổ đội:</b> Boss đã bị hạ gục! Kiến thức của Topic {topic} đã vững rồi!</> : <><b>Nahida:</b> Boss vẫn còn đứng đó… ôn lại 2 bài của Topic này rồi quay lại nhé.</>}</div></div>
          <h2>{done.win ? "Đã Hạ Gục Boss!" : "Boss Rút Lui…"}</h2>
          <div className="bigstars">{[0, 1, 2].map((i) => <span key={i} className={i < done.stars ? "on" : ""} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>★</span>)}</div>
          <div className="score">{correct}<small> / {total}</small> <small>({done.pct}%)</small></div>
          {done.win && (done.reward > 0
            ? <div className="rew"><Ico id="pgm" /> +{done.reward} Nguyên Thạch (thưởng hôm nay)</div>
            : <div className="rew" style={{ fontSize: 14 }}>Hôm nay đã nhận thưởng boss này — quay lại vào ngày mai nhé</div>)}
          {!done.win && <p style={{ color: "#c9cbd6" }}>Cần đúng ít nhất 60% để hạ boss.</p>}
          <div className="btnrow" style={{ marginTop: 22 }}>
            <Link href="/a22" className="gbtn x dark"><span className="c" />Về A2-2</Link>
            <button className="gbtn" onClick={start}><span className="c" />Đánh lại</button>
            {done.win && topic < A22_BOSSES.length && <Link href={`/a22/boss/${topic + 1}`} className="gbtn tri"><span className="c" />Boss tiếp theo</Link>}
          </div>
        </div>
      )}
    </>
  );
}
