"use client";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { TOPICS, TOPIC_VI, TOPIC_EL, ELEM, TOTAL_WORDS, wordsOf, starsFor } from "@/lib/data";
import { CHARS, charIcon } from "@/lib/genshin";
import { sfx } from "@/lib/sfx";

export default function Home() {
  const { S } = useGame();
  const best = S?.best || {};
  return (
    <>
      <div className="pagehead">
        <h1>Sổ Tay Mạo Hiểm · Từ Vựng</h1>
        <p>Marugoto 中級1 (B1-1) — chọn một Topic để bắt đầu thử thách</p>
        <div className="orn"><span /></div>
      </div>
      <div className="stats">
        <div className="panel stat"><b>{TOTAL_WORDS.toLocaleString("vi-VN")}</b><span>Từ vựng</span></div>
        <div className="panel stat"><b>{Object.keys(best).length}</b><span>Bài đã hoàn thành</span></div>
        <div className="panel stat"><b>{(S?.total || 0).toLocaleString("vi-VN")}</b><span>Câu trả lời đúng</span></div>
        <div className="panel stat"><b>{(S?.wishes || 0).toLocaleString("vi-VN")}</b><span>Lần cầu nguyện</span></div>
      </div>
      <div className="grid">
        {TOPICS.map((T) => {
          const keys = ["all", ...T.sections.map((s) => s.key)];
          const got = keys.reduce((a, k) => a + (best[`t${T.n}_${k}`] ? starsFor(best[`t${T.n}_${k}`].pct) : 0), 0);
          const max = keys.length * 3;
          const el = TOPIC_EL[T.n];
          const pool = CHARS.filter((c) => c.el === el && c.rank === 5);
          const mascot = pool[(T.n * 5) % pool.length] || CHARS[0];
          return (
            <Link key={T.n} href={`/topic/${T.n}`} className="panel tcard" style={{ "--el": ELEM[el].c }} onClick={() => sfx.page()}>
              <div className="glow" />
              <img className="tchar" src={charIcon(mascot)} alt={mascot.vi} title={mascot.vi} />
              <div className="num">Topic {T.n} · <em>{ELEM[el].vi}</em></div>
              <h3>{T.title}</h3>
              <div className="vi">{TOPIC_VI[T.n]}</div>
              <div className="meta"><span>{wordsOf(T.n, "all").length} từ · {T.sections.length} phần</span><span className="starsrow">★ {got}/{max}</span></div>
              <div className="bar"><i style={{ width: `${Math.round((got / max) * 100)}%` }} /></div>
            </Link>
          );
        })}
      </div>
      <footer>
        Dữ liệu từ vựng: bảng 語彙表 Marugoto 中級1 (bản tiếng Việt).<br />
        Ảnh: Pexels, GIPHY, Wikimedia, Openverse, nekos.best · Ảnh nhân vật/vũ khí Genshin Impact © HoYoverse (qua gi.yatta.moe).<br />
        Trang học tập cá nhân, phi thương mại — không phải sản phẩm chính thức của HoYoverse.
      </footer>
    </>
  );
}
