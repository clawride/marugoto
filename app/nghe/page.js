"use client";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { Ico } from "@/components/Icons";
import { AudioSetup, TsaritsaPortrait, RonovaEmblem } from "@/components/Listen";
import { LISTEN_BOSSES, TSARITSA, RONOVA } from "@/lib/listenBosses";
import { lessonOf, todayKey, rewardFor } from "@/lib/bosses";
import { elemIcon } from "@/lib/genshin";
import { sfx } from "@/lib/sfx";

export default function ListenList() {
  const { S } = useGame();
  if (!S) return null;
  const L = S.listen || {};
  const today = todayKey();
  const cleared = (k) => !!L[k]?.cleared;
  const open = (l) => l === 1 || cleared(l - 1);
  const nDone = LISTEN_BOSSES.filter((b) => cleared(b.lesson)).length;
  const finalOpen = nDone === LISTEN_BOSSES.length;
  return (
    <>
      <div className="tsa-hero">
        <TsaritsaPortrait className="hero" />
        <div className="tsa-copy">
          <div className="tag">THỬ THÁCH THÍNH GIÁC</div>
          <h1>Băng Thần</h1>
          <p className="t2">{TSARITSA.title}</p>
          <p>“{TSARITSA.intro[0]}”</p>
          <div className="tsa-stats"><b>{nDone}/{LISTEN_BOSSES.length}</b> boss nghe đã vượt qua · Boss cuối: <b>Ronova</b></div>
        </div>
      </div>
      <AudioSetup />

      <div className="bgrid" style={{ marginTop: 16 }}>
        {LISTEN_BOSSES.map((b) => {
          const Ls = lessonOf(b.lesson), st = L[b.lesson], ok = open(b.lesson);
          const card = (
            <div className={`panel bcard ice ${ok ? "" : "locked"}`} style={{ "--ec": "#9fe6ff" }}>
              <div className="bimg"><img src={b.img} alt={b.name} loading="lazy" /><img className="belic" src={elemIcon("cryo")} alt="" /></div>
              <div className="binfo">
                <div className="blesson">だい {b.lesson} か · {Ls?.title}</div>
                <b>{b.name}</b>
                <div className="bvi">🎧 {Ls?.titleVi}</div>
                <div className="bmeta">
                  <span className="starsrow">{[0, 1, 2].map((i) => <span key={i} className={i < (st?.best || 0) ? "" : "off"}>★</span>)}</span>
                  {ok ? (st?.reward === today ? <span className="bclaim done">Đã nhận thưởng hôm nay</span> : <span className="bclaim"><Ico id="pgm" /> tối đa {rewardFor(3)}</span>) : <span className="bclaim">🔒 Vượt qua bài {b.lesson - 1} để mở</span>}
                </div>
              </div>
            </div>
          );
          return ok ? <Link key={b.lesson} href={`/nghe/${b.lesson}`} onClick={() => sfx.open()}>{card}</Link> : <div key={b.lesson}>{card}</div>;
        })}
      </div>

      {(() => {
        const st = L.final;
        const card = (
          <div className={`panel ronova-card ${finalOpen ? "" : "locked"}`}>
            <RonovaEmblem />
            <div>
              <div className="tag">BOSS CUỐI · NGHE HIỂU TỔNG HỢP A2-1</div>
              <h2>{RONOVA.name}</h2>
              <p>{RONOVA.sub}. Ba giai đoạn: Ký Ức (hội thoại ôn tập), Phán Quyết (bài nghe cả 18 bài), Tử Vong (nghe câu đã học).</p>
              <div className="bmeta">
                <span className="starsrow">{[0, 1, 2].map((i) => <span key={i} className={i < (st?.best || 0) ? "" : "off"}>★</span>)}</span>
                {finalOpen ? <span className="bclaim"><Ico id="fateI" /> thưởng tối đa 640 Nguyên Thạch/ngày</span> : <span className="bclaim">🔒 Vượt qua cả 18 boss nghe để mở ({nDone}/18)</span>}
              </div>
            </div>
          </div>
        );
        return finalOpen ? <Link href="/nghe/final" onClick={() => sfx.open()}>{card}</Link> : card;
      })()}
    </>
  );
}
