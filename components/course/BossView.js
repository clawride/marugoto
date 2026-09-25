"use client";
// Boss Topic của khóa học: trộn cả 7 phần, thưởng mỗi ngày khi hạ gục
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { useBattle, Arena, MCQ, starsOf } from "@/components/Battle";
import { CourseQuestion } from "@/components/course/CourseRun";
import { Ico } from "@/components/Icons";
import { bossIconUrl } from "@/lib/course";
import { todayKey, rewardFor } from "@/lib/bosses";
import { charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";
import { sfx } from "@/lib/sfx";

const STAGES = { vocab: "Từ vựng", kanji: "Kanji", grammar: "Ngữ pháp", fill: "Điền từ", order: "Xếp câu", listen: "Nghe", read: "Đọc" };

export default function BossView({ course, topic }) {
  const { C, store, base, title, Host, lines, char, hostName } = course;
  const boss = C.bossOf(topic);
  const { S, update } = useGame();
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(null);
  const total = queue?.length || 1;
  const arenaBoss = useMemo(() => boss && { ...boss, img: bossIconUrl(boss), lv: Math.min(90, 40 + topic * 5), sub: `Boss Topic ${topic} · ${title}` }, [boss, topic, title]);
  const B = useBattle(arenaBoss || { hp: 1 }, total, { exclude: [char?.en].filter(Boolean) });
  const { party, hp, setHp, fx, attacker, correct, answered, score, reset } = B;
  const start = useCallback(() => { setQueue(C.bossQueue(topic)); setIdx(0); reset(); setDone(null); }, [C, topic, reset]);
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
      s[store] = s[store] || {}; s[store].boss = s[store].boss || {};
      const b = s[store].boss[topic] || { best: 0, cleared: false, reward: "", pct: 0, total: 0 };
      if (win) {
        b.cleared = true;
        b.best = Math.max(b.best, stars);
        if (b.reward !== today) { reward = rewardFor(stars); s.primo += reward; b.reward = today; }
      }
      if (pct > (b.pct || 0) || (pct === b.pct && total > (b.total || 0))) { b.pct = pct; b.total = total; }
      s[store].boss[topic] = b;
    });
    if (win) { setHp(0); sfx.win(); }
    setDone({ pct, stars, win, reward });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [idx, queue, correct, total, topic, update, setHp, store]);

  if (!boss) return <p style={{ marginTop: 40 }}>Không tìm thấy boss. <Link href={base}>{title}</Link></p>;
  if (!S || !queue) return null;
  const cur = queue[idx];
  const stageKeys = [...new Set(queue.map((q) => q.stage))];

  return (
    <>
      <Link href={base} className="back">‹ {title}</Link>
      <Arena boss={arenaBoss} hp={hp} fx={fx} attacker={attacker} party={party} />
      {!done && (
        <>
          <div className="stagebar">
            {stageKeys.map((k) => <span key={k} className={k === cur.stage ? "on" : stageKeys.indexOf(k) < stageKeys.indexOf(cur.stage) ? "past" : ""}>{STAGES[k]}</span>)}
            <b>{answered}/{total} · đúng {correct}</b>
          </div>
          {cur.type === "read" ? (
            <MCQ key={idx} q={cur} onScore={score} onNext={next} top={<>
              <Host line={lines.read} />
              <article className="reading inexam">
                <div className="rgenre">{cur.passage.genre}</div>
                <h3 className="jpt">{cur.passage.title}</h3>
                <div className="rtext jpt">{cur.passage.text.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>
              </article>
            </>} />
          ) : (
            <CourseQuestion key={idx} course={course} q={cur} idx={idx} first={queue.findIndex((x) => x.type === "order") === idx} hostLine={lines[cur.stage] || lines.hub[0]} onScore={score} onNext={next} />
          )}
        </>
      )}
      {done && (
        <div className="panel result">
          <div className="rhero"><img src={done.win ? charSplash(pickRand(party)) : charSplash(char)} alt="" /><div className="say">{done.win ? <><b>Tổ đội:</b> Boss đã bị hạ gục! Kiến thức của Topic {topic} đã vững rồi!</> : <><b>{hostName}:</b> Boss vẫn còn đứng đó… ôn lại Topic này rồi quay lại nhé.</>}</div></div>
          <h2>{done.win ? "Đã Hạ Gục Boss!" : "Boss Rút Lui…"}</h2>
          <div className="bigstars">{[0, 1, 2].map((i) => <span key={i} className={i < done.stars ? "on" : ""} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>★</span>)}</div>
          <div className="score">{correct}<small> / {total}</small> <small>({done.pct}%)</small></div>
          {done.win && (done.reward > 0
            ? <div className="rew"><Ico id="pgm" /> +{done.reward} Nguyên Thạch (thưởng hôm nay)</div>
            : <div className="rew" style={{ fontSize: 14 }}>Hôm nay đã nhận thưởng boss này — quay lại vào ngày mai nhé</div>)}
          {!done.win && <p style={{ color: "#c9cbd6" }}>Cần đúng ít nhất 60% để hạ boss.</p>}
          <div className="btnrow" style={{ marginTop: 22 }}>
            <Link href={base} className="gbtn x dark"><span className="c" />Về {title}</Link>
            <button className="gbtn" onClick={start}><span className="c" />Đánh lại</button>
            {done.win && C.bossOf(topic + 1) && <Link href={`${base}/boss/${topic + 1}`} className="gbtn tri"><span className="c" />Boss tiếp theo</Link>}
          </div>
        </div>
      )}
    </>
  );
}
