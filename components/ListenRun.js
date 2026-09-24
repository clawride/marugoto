"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { Ico } from "@/components/Icons";
import { useBattle, Arena, starsOf } from "@/components/Battle";
import { ListenQ, DictationQ, TsaritsaPortrait } from "@/components/Listen";
import { shuffle, pickRand } from "@/lib/data";
import { todayKey } from "@/lib/bosses";
import { sfx } from "@/lib/sfx";

export const prepListen = (it) => ({ ...it, optsShuffled: shuffle(it.opts) });

// Câu chép chính tả từ dữ liệu boss sách (những gì đã học)
export function dictationsFrom(lessons, n) {
  const pool = lessons.flatMap((L) => L.fill.map((f) => ({ lesson: L.lesson, q: f.q, answer: f.opts[f.a], opts: shuffle(f.opts), vi: f.vi, explain: f.hint })));
  return shuffle(pool).slice(0, n).map((d) => ({ ...d, kind: "dict" }));
}

/**
 * boss: cấu hình Arena; queue: [{kind:"listen"|"dict", ...}]
 * saveKey: khóa lưu trong S.listen; reward(stars) → số Nguyên Thạch
 * host(i, lastOk) → khối lời dẫn của người quản lý; phaseOf(i) → nhãn giai đoạn
 */
export default function ListenRun({ boss, makeQueue, saveKey, reward, host, phaseOf, backHref, backLabel, nextHref, winLine, loseLine, heroWin, heroLose }) {
  const { S, update } = useGame();
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [last, setLast] = useState(null);
  const [done, setDone] = useState(null);
  const total = queue?.length || 1;
  const B = useBattle(boss, total);
  const { party, hp, setHp, fx, attacker, correct, answered, score, reset } = B;

  const start = useCallback(() => { setQueue(makeQueue()); setIdx(0); setLast(null); reset(); setDone(null); }, [makeQueue, reset]);
  useEffect(() => { start(); }, [start]);

  const onScore = useCallback((ok) => { setLast(ok); score(ok); }, [score]);

  const next = useCallback(() => {
    sfx.click();
    if (idx < queue.length - 1) { setIdx(idx + 1); setLast(null); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const pct = Math.round((correct / total) * 100);
    const stars = starsOf(pct), win = stars > 0, today = todayKey();
    let got = 0;
    update((s) => {
      s.listen = s.listen || {};
      const b = s.listen[saveKey] || { best: 0, cleared: false, reward: "" };
      if (win) {
        b.cleared = true; b.best = Math.max(b.best, stars);
        if (b.reward !== today) { got = reward(stars); s.primo += got; b.reward = today; }
      }
      s.listen[saveKey] = b;
      s.listenPct = s.listenPct || {};
      const lp = s.listenPct[saveKey];
      if (!lp || pct > lp.pct || (pct === lp.pct && total > lp.total)) s.listenPct[saveKey] = { pct, total };
    });
    if (win) { setHp(0); sfx.win(); }
    setDone({ pct, stars, win, reward: got });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [idx, queue, correct, total, update, saveKey, reward, setHp]);

  if (!S || !queue) return null;
  const cur = queue[idx];
  const phase = phaseOf?.(idx);
  const hostNode = host(idx, last, cur);

  return (
    <>
      <Link href={backHref} className="back">‹ {backLabel}</Link>
      <Arena boss={boss} hp={hp} fx={fx} attacker={attacker} party={party} phase={phase} />
      {!done && (
        <>
          <div className="stagebar">
            {phase && <span className="on">{phase}</span>}
            <span className={cur.kind === "listen" ? "on" : ""}>🎧 Nghe hiểu</span>
            <span className={cur.kind === "dict" ? "on" : ""}>✍️ Nghe câu đã học</span>
            <b>Câu {idx + 1}/{total} · đúng {correct}</b>
          </div>
          {cur.kind === "listen"
            ? <ListenQ key={idx} item={cur} onScore={onScore} onNext={next} host={hostNode} />
            : <DictationQ key={idx} item={cur} onScore={onScore} onNext={next} host={hostNode} />}
        </>
      )}
      {done && (
        <div className="panel result">
          <div className="rhero">{done.win ? heroWin : heroLose}<div className="say">{done.win ? winLine : loseLine}</div></div>
          <h2>{done.win ? "Đã Vượt Qua Thử Thách!" : "Chưa Vượt Qua…"}</h2>
          <div className="bigstars">{[0, 1, 2].map((i) => <span key={i} className={i < done.stars ? "on" : ""} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>★</span>)}</div>
          <div className="score">{correct}<small> / {total}</small> <small>({done.pct}%)</small></div>
          {done.win && (done.reward > 0
            ? <div className="rew"><Ico id="pgm" /> +{done.reward} Nguyên Thạch (thưởng hôm nay)</div>
            : <div className="rew" style={{ fontSize: 14 }}>Hôm nay đã nhận thưởng — quay lại vào ngày mai nhé</div>)}
          {!done.win && <p style={{ color: "#c9cbd6" }}>Cần đúng ít nhất 60% để vượt qua.</p>}
          <div className="btnrow" style={{ marginTop: 22 }}>
            <Link href={backHref} className="gbtn x dark"><span className="c" />{backLabel}</Link>
            <button className="gbtn" onClick={start}><span className="c" />Thử lại</button>
            {done.win && nextHref && <Link href={nextHref} className="gbtn tri"><span className="c" />Tiếp theo</Link>}
          </div>
        </div>
      )}
    </>
  );
}

// Khối lời dẫn của Băng Thần
export function TsaritsaHost({ line }) {
  return (
    <div className="hosthead tsa">
      <TsaritsaPortrait className="sm" />
      <div className="bubble"><b>Băng Thần</b>{line}</div>
    </div>
  );
}
export { pickRand };
