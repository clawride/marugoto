"use client";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { Ico } from "@/components/Icons";
import { ELEM } from "@/lib/data";
import { BOSSES, bossIcon, lessonOf, todayKey, rewardFor } from "@/lib/bosses";
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
        <p>Marugoto 初級1 A2 かつどう — mỗi bài một boss · thưởng Nguyên Thạch mỗi ngày</p>
        <div className="orn"><span /></div>
      </div>
      <div className="stats">
        <div className="panel stat"><b>{done}/{BOSSES.length}</b><span>Boss đã hạ</span></div>
        <div className="panel stat"><b>{BOSSES.filter((b) => S.boss?.[b.lesson]?.reward === today).length}</b><span>Đã nhận thưởng hôm nay</span></div>
      </div>
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
