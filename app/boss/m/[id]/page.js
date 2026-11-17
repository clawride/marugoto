"use client";
// Boss tổng hợp (まとめ問題): ôn 3 Topic của một cuốn qua 7 phần — trợ từ, từ để hỏi, chia động từ, tính từ,
// cuối câu trong hội thoại, xếp câu, đọc hiểu ◯×. Nội dung: public/boss-matome/<id>.json
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBattle, Arena, FillQ, starsOf } from "@/components/Battle";
import OrderQ from "@/components/OrderQ";
import MatomeQ from "@/components/MatomeQ";
import { useGame } from "@/components/Game";
import { Ico } from "@/components/Icons";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { matomeOf, matomeBook, matomePrev, bossIcon, todayKey, matomeReward } from "@/lib/bosses";
import { shuffle, pickRand } from "@/lib/data";
import { sfx } from "@/lib/sfx";

const LINES = {
  intro: ["Phần xếp câu đây. Nhớ: động từ đứng cuối, trợ từ đi sau danh từ.", "Xếp lại cho thành một câu tự nhiên nhé.", "Đến lượt xếp câu rồi — bình tĩnh mà làm."],
  ok: ["Chính xác!", "Tốt lắm, câu rất tự nhiên.", "Đúng rồi, tiếp tục nào."],
  bad: ["Chưa đúng — xem lại câu đúng bên dưới nhé.", "Thứ tự chưa ổn. Chú ý vị trí trợ từ.", "Sai mất rồi, câu sau cẩn thận hơn nhé."],
  next: ["Câu tiếp theo.", "Thử câu này xem.", "Còn một chút nữa thôi."],
};
const count = (it) => (it.type === "passage" ? it.blanks.length : it.type === "read" ? it.statements.length : 1);

function buildQueue(D) {
  const q = [];
  D.sections.forEach((s, si) => s.items.forEach((it) => q.push({ ...it, sec: si, sub: s.sub, opts: it.opts && shuffle(it.opts), answer: it.opts?.[it.a] })));
  return q;
}

export default function MatomeBattle() {
  const { id } = useParams();
  const M = matomeOf(id), BK = M && matomeBook(M.book);
  const { S, update } = useGame();
  const [D, setD] = useState(null);
  const [err, setErr] = useState(false);
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(null);
  useEffect(() => { if (!M) return; fetch(`/boss-matome/${M.id}.json`).then((r) => r.json()).then(setD).catch(() => setErr(true)); }, [M]);
  const total = queue ? queue.reduce((a, x) => a + count(x), 0) : 1;
  const host = useMemo(() => { const c = CHARS.find((x) => x.icon === BK?.host) || CHARS[0]; return { name: c.vi, icon: charIcon(c), lines: LINES, c }; }, [BK]);
  const arenaBoss = useMemo(() => M && { ...M, img: bossIcon(M), lv: 90, sub: `まとめ · ${BK.name} · Topic ${M.topics.join("・")}` }, [M, BK]);
  const B = useBattle(arenaBoss || { hp: 1 }, total);
  const { party, hp, setHp, fx, attacker, correct, answered, score, reset } = B;
  const start = useCallback(() => { if (!D) return; setQueue(buildQueue(D)); setIdx(0); reset(); setDone(null); }, [D, reset]);
  useEffect(() => { start(); }, [start]);

  const next = useCallback(() => {
    sfx.click();
    if (idx < queue.length - 1) { setIdx(idx + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const pct = Math.round((correct / total) * 100), stars = starsOf(pct), win = stars > 0, today = todayKey();
    let reward = 0;
    update((s) => {
      s.matome = s.matome || {};
      const b = s.matome[M.id] || { best: 0, cleared: false, reward: "" };
      if (win) { b.cleared = true; b.best = Math.max(b.best, stars); if (b.reward !== today) { reward = matomeReward(stars); s.primo += reward; b.reward = today; } }
      b.pct = Math.max(b.pct || 0, pct);
      s.matome[M.id] = b;
    });
    if (win) { setHp(0); sfx.win(); }
    setDone({ pct, stars, win, reward });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [idx, queue, correct, total, M, update, setHp]);

  if (!M) return <p style={{ marginTop: 40 }}>Không tìm thấy boss. <Link href="/boss">Quay lại</Link></p>;
  if (err) return <p style={{ marginTop: 40 }}>Chưa tải được đề của boss này. <Link href="/boss">Quay lại</Link></p>;
  if (!S || !queue) return null;
  const prev = matomePrev(M);
  if (prev && !S.matome?.[prev.id]?.cleared) return <p style={{ marginTop: 40 }}>Boss này chưa mở. Hãy hạ boss <b>{prev.name}</b> trước. <Link href="/boss" style={{ color: "var(--gold2)" }}>Danh sách boss</Link></p>;

  const cur = queue[idx];
  const nextM = D && matomeOf(`${M.book}-${+M.id.split("-")[1] + 1}`);
  return (
    <>
      <Link href="/boss" className="back">‹ Danh sách boss</Link>
      <Arena boss={arenaBoss} hp={hp} fx={fx} attacker={attacker} party={party} />
      {!done && (
        <>
          <div className="stagebar">
            {D.sections.map((s, i) => <span key={i} className={i === cur.sec ? "on" : i < cur.sec ? "past" : ""} title={s.title}>Q{i + 1}</span>)}
            <b>{answered}/{total} · đúng {correct}</b>
          </div>
          <div className="mtsec"><b>Q{cur.sec + 1}. {D.sections[cur.sec].title}</b></div>
          {(cur.type === "passage" || cur.type === "read") && <MatomeQ key={idx} q={cur} sub={cur.sub} onScore={score} onNext={next} />}
          {cur.type === "fill" && <FillQ key={idx} q={{ ...cur, vi: null, after: cur.vi && <div className="bvi" style={{ marginTop: 6 }}>{cur.vi}</div> }} onScore={score} onNext={next} />}
          {cur.type === "order" && <OrderQ key={idx} q={cur} onScore={score} onNext={next} first={queue.findIndex((x) => x.type === "order") === idx} host={host} />}
        </>
      )}
      {done && (
        <div className="panel result">
          <div className="rhero"><img src={charSplash(done.win ? pickRand(party) : host.c)} alt="" /><div className="say">{done.win ? <><b>Tổ đội:</b> Đã ôn xong Topic {M.topics.join("・")}! Tuyệt vời!</> : <><b>{host.name}:</b> Ôn lại các mẫu câu của Topic {M.topics.join("・")} rồi quay lại nhé.</>}</div></div>
          <h2>{done.win ? "Đã Hạ Gục Boss!" : "Boss Rút Lui…"}</h2>
          <div className="bigstars">{[0, 1, 2].map((i) => <span key={i} className={i < done.stars ? "on" : ""} style={{ animationDelay: `${0.2 + i * 0.25}s` }}>★</span>)}</div>
          <div className="score">{correct}<small> / {total}</small> <small>({done.pct}%)</small></div>
          {done.win && (done.reward > 0
            ? <div className="rew"><Ico id="pgm" /> +{done.reward} Nguyên Thạch (thưởng hôm nay)</div>
            : <div className="rew" style={{ fontSize: 14 }}>Hôm nay đã nhận thưởng boss này — quay lại vào ngày mai nhé</div>)}
          {!done.win && <p style={{ color: "#c9cbd6" }}>Cần đúng ít nhất 60% để hạ boss và mở boss tiếp theo.</p>}
          <div className="btnrow" style={{ marginTop: 22 }}>
            <Link href="/boss" className="gbtn x dark"><span className="c" />Danh sách boss</Link>
            <button className="gbtn" onClick={start}><span className="c" />Đánh lại</button>
            {done.win && nextM && <Link href={`/boss/m/${nextM.id}`} className="gbtn tri"><span className="c" />Boss tiếp theo</Link>}
          </div>
        </div>
      )}
    </>
  );
}
