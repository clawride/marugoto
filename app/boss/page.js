"use client";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { Ico } from "@/components/Icons";
import { ELEM } from "@/lib/data";
import { BOSSES, bossIcon, lessonOf, todayKey, rewardFor, MATOME, MATOME_BOOKS, matomePrev, matomeReward } from "@/lib/bosses";
import { elemIcon } from "@/lib/genshin";
import { sfx } from "@/lib/sfx";

export default function BossList() {
  const { S } = useGame();
  if (!S) return null;
  const today = todayKey();
  const cleared = (l) => !!S.boss?.[l]?.cleared;
  const unlocked = (l) => l === 1 || cleared(l - 1);
  const topics = [...new Set(BOSSES.map((b) => lessonOf(b.lesson)?.topic))].filter(Boolean);
  const done = BOSSES.filter((b) => cleared(b.lesson)).length;
  return (
    <>
      <div className="pagehead">
        <h1>Thử Thách Boss</h1>
        <p>Boss tổng hợp まとめ cho A2-1, A2-2, A2/B1 · 18 boss theo bài A2-1 · thưởng Nguyên Thạch mỗi ngày</p>
        <div className="orn"><span /></div>
      </div>
      <div className="stats">
        <div className="panel stat"><b>{MATOME.filter((m) => S.matome?.[m.id]?.cleared).length}/{MATOME.length}</b><span>Boss tổng hợp đã hạ</span></div>
        <div className="panel stat"><b>{done}/{BOSSES.length}</b><span>Boss theo bài đã hạ</span></div>
        <div className="panel stat"><b>{BOSSES.filter((b) => S.boss?.[b.lesson]?.reward === today).length + MATOME.filter((m) => S.matome?.[m.id]?.reward === today).length}</b><span>Đã nhận thưởng hôm nay</span></div>
      </div>
      <section className="btopic matome">
        <h2><span>まとめ</span> Boss tổng hợp <small>Ôn 3 Topic một lần · trợ từ, từ để hỏi, chia động từ, tính từ, hội thoại, xếp câu, đọc hiểu ◯×</small></h2>
        {MATOME_BOOKS.map((bk) => (
          <div key={bk.id} style={{ marginBottom: 18 }}>
            <h3 className="mtbook" style={{ "--c": bk.color }}>{bk.name}</h3>
            <div className="bgrid">
              {MATOME.filter((m) => m.book === bk.id).map((m) => {
                const st = S.matome?.[m.id], prev = matomePrev(m), open = !prev || !!S.matome?.[prev.id]?.cleared, el = ELEM[m.el];
                const card = (
                  <div className={`panel bcard ${open ? "" : "locked"}`} style={{ "--ec": el.c }}>
                    <div className="bimg"><img src={bossIcon(m)} alt={m.name} loading="lazy" /><img className="belic" src={elemIcon(m.el)} alt="" /></div>
                    <div className="binfo">
                      <div className="blesson">まとめ · Topic {m.topics.join("・")}</div>
                      <b>{m.name}</b>
                      <div className="bvi">{bk.name}</div>
                      <div className="bmeta">
                        <span className="starsrow">{[0, 1, 2].map((i) => <span key={i} className={i < (st?.best || 0) ? "" : "off"}>★</span>)}</span>
                        {open ? (st?.reward === today ? <span className="bclaim done">Đã nhận thưởng hôm nay</span> : <span className="bclaim"><Ico id="pgm" /> tối đa {matomeReward(3)}</span>) : <span className="bclaim">🔒 Hạ {prev.name} để mở</span>}
                      </div>
                    </div>
                  </div>
                );
                return open ? <Link key={m.id} href={`/boss/m/${m.id}`} onClick={() => sfx.open()}>{card}</Link> : <div key={m.id}>{card}</div>;
              })}
            </div>
          </div>
        ))}
      </section>
      <h2 className="a22th" style={{ marginTop: 10 }}><span>Boss theo bài</span> <small>Marugoto 初級1 A2-1 · 18 bài</small></h2>
      {topics.map((t) => {
        const list = BOSSES.filter((b) => lessonOf(b.lesson)?.topic === t);
        const L0 = lessonOf(list[0].lesson);
        return (
          <section key={t} className="btopic">
            <h2><span>トピック {t}</span> {L0.topicTitle} <small>{L0.topicVi}</small></h2>
            <div className="bgrid">
              {list.map((b) => {
                const L = lessonOf(b.lesson), st = S.boss?.[b.lesson], open = unlocked(b.lesson), el = ELEM[b.el];
                const claimed = st?.reward === today;
                const card = (
                  <div className={`panel bcard ${open ? "" : "locked"}`} style={{ "--ec": el.c }}>
                    <div className="bimg"><img src={bossIcon(b)} alt={b.name} loading="lazy" /><img className="belic" src={elemIcon(b.el)} alt="" /></div>
                    <div className="binfo">
                      <div className="blesson">だい {b.lesson} か · {L.title}</div>
                      <b>{b.name}</b>
                      <div className="bvi">{L.titleVi}</div>
                      <div className="bmeta">
                        <span className="starsrow">{[0, 1, 2].map((i) => <span key={i} className={i < (st?.best || 0) ? "" : "off"}>★</span>)}</span>
                        {open ? (claimed ? <span className="bclaim done">Đã nhận thưởng hôm nay</span> : <span className="bclaim"><Ico id="pgm" /> tối đa {rewardFor(3)}</span>) : <span className="bclaim">🔒 Hạ boss bài {b.lesson - 1} để mở</span>}
                      </div>
                    </div>
                  </div>
                );
                return open ? <Link key={b.lesson} href={`/boss/${b.lesson}`} onClick={() => sfx.open()}>{card}</Link> : <div key={b.lesson}>{card}</div>;
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
