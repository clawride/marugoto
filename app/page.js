"use client";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { TOPICS, TOPIC_VI, TOPIC_EL, ELEM, TOTAL_WORDS, wordsOf, starsFor } from "@/lib/data";
import { CHARS, charIcon } from "@/lib/genshin";
import { sfx } from "@/lib/sfx";
import { BOSSES, bossIcon } from "@/lib/bosses";

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
      <Link href="/kana" className="panel homeboss" onClick={() => sfx.page()} style={{ borderColor: "rgba(255,150,110,.6)" }}>
        <img src="https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Klee.png" alt="" style={{ borderRadius: "50%" }} />
        <div>
          <b>あ Bảng Chữ Cái · Klee</b>
          <span>Chữ mềm & chữ cứng theo lộ trình 54 video: luyện viết có sửa nét, rèn chữ đẹp, âm đục, âm tròn, âm ghép, trường âm, âm ngắt</span>
        </div>
      </Link>
      <Link href="/a1" className="panel homeboss" onClick={() => sfx.page()} style={{ borderColor: "rgba(110,220,190,.6)" }}>
        <img src="https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Venti.png" alt="" style={{ borderRadius: "50%" }} />
        <div>
          <b>🍃 Marugoto A1 · Venti</b>
          <span>18 bài nhập môn theo かつどう &amp; りかい: từ vựng, nghe, chữ kana/kanji, bài đọc, ngữ pháp, điền từ, sắp xếp câu · boss mỗi Topic · 2 kỳ thi chứng chỉ</span>
        </div>
      </Link>
      <Link href="/a21" className="panel homeboss" onClick={() => sfx.page()} style={{ borderColor: "rgba(170,130,240,.6)" }}>
        <img src="https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Shougun.png" alt="" style={{ borderRadius: "50%" }} />
        <div>
          <b>⚡ Marugoto A2-1 · Raiden Shogun</b>
          <span>18 bài đầy đủ theo かつどう &amp; りかい: từ vựng, nghe hội thoại, kanji, bài đọc, ngữ pháp, điền từ, sắp xếp câu · boss mỗi Topic · 2 kỳ thi chứng chỉ</span>
        </div>
      </Link>
      <Link href="/ab1" className="panel homeboss" onClick={() => sfx.page()} style={{ borderColor: "rgba(110,170,240,.6)" }}>
        <img src="https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Furina.png" alt="" style={{ borderRadius: "50%" }} />
        <div>
          <b>🌊 Marugoto A2/B1 · Furina</b>
          <span>9 Topic sách 初中級: từ vựng, nghe hội thoại, kanji, bài đọc, ngữ pháp, điền từ, sắp xếp câu · boss mỗi Topic · 2 kỳ thi chứng chỉ</span>
        </div>
      </Link>
      <Link href="/a22" className="panel homeboss" onClick={() => sfx.page()} style={{ borderColor: "rgba(126,200,90,.6)" }}>
        <img src="https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Nahida.png" alt="" style={{ borderRadius: "50%" }} />
        <div>
          <b>🌱 Marugoto A2-2 · Nahida</b>
          <span>18 bài theo かつどう &amp; りかい: từ vựng, nghe hội thoại, kanji, bài đọc, ngữ pháp, điền từ, sắp xếp câu · boss mỗi Topic · 2 kỳ thi chứng chỉ</span>
        </div>
      </Link>
      <Link href="/b1" className="panel homeboss" onClick={() => sfx.page()} style={{ borderColor: "rgba(240,185,60,.6)" }}>
        <img src="https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Zhongli.png" alt="" style={{ borderRadius: "50%" }} />
        <div>
          <b>🎓 Học Viện B1-1 · Zhongli</b>
          <span>Ngữ pháp, bài đọc dài, bài nghe theo 9 Topic · thi chứng chỉ kiểu JLPT sau mỗi 3 Topic</span>
        </div>
      </Link>
      <Link href="/boss" className="panel homeboss" onClick={() => sfx.page()}>
        <img src={bossIcon(BOSSES[13])} alt="" />
        <div>
          <b>⚔️ Thử Thách Boss · Marugoto A2-1</b>
          <span>18 boss theo 18 bài: từ vựng, ngữ pháp, Yae Miko thách xếp câu, hội thoại với nhân vật Genshin — đã hạ {BOSSES.filter((b) => S?.boss?.[b.lesson]?.cleared).length}/{BOSSES.length}</span>
        </div>
      </Link>
      <Link href="/nghe" className="panel homeboss" onClick={() => sfx.page()} style={{ borderColor: "rgba(160,215,255,.6)" }}>
        <img src="https://gi.yatta.moe/assets/UI/monster/UI_MonsterIcon_HerraFrost.png" alt="" />
        <div>
          <b style={{ color: "#bfe6ff" }}>🎧 Thử Thách Nghe · Băng Thần</b>
          <span>18 boss nghe theo audio sách A2-1 và boss cuối Chấp Chính Cái Chết Ronova</span>
        </div>
      </Link>
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
