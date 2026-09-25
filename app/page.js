"use client";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM, starsFor } from "@/lib/data";
import { BOOKS, topicsOf, nbWords, NB_TOTAL, bookTotal } from "@/lib/notebook";
import { CHARS, charIcon } from "@/lib/genshin";
import { sfx } from "@/lib/sfx";
import { GROUPS, programsIn, TEYVAT, progressLabel } from "@/lib/programs";

export default function Home() {
  const { S, update } = useGame();
  const best = S?.best || {};
  const book = S?.nbBook || "a1";
  const B = BOOKS.find((b) => b.id === book) || BOOKS[0];
  return (
    <>
      <div className="pagehead">
        <h1>Sổ Tay Mạo Hiểm · Từ Vựng</h1>
        <p>Học tiếng Nhật Marugoto A1 → B1-2 · chọn chương trình theo cấp độ, hoặc luyện từ vựng trong Sổ Tay bên dưới</p>
        <div className="orn"><span /></div>
      </div>
      <div className="stats">
        <div className="panel stat"><b>{NB_TOTAL.toLocaleString("vi-VN")}</b><span>Từ vựng</span></div>
        <div className="panel stat"><b>{Object.keys(best).length}</b><span>Bài đã hoàn thành</span></div>
        <div className="panel stat"><b>{(S?.total || 0).toLocaleString("vi-VN")}</b><span>Câu trả lời đúng</span></div>
        <div className="panel stat"><b>{(S?.wishes || 0).toLocaleString("vi-VN")}</b><span>Lần cầu nguyện</span></div>
      </div>
      {/* ===== Lộ trình học: từ cấp thấp đến cấp cao ===== */}
      {GROUPS.map((g) => (
        <section key={g.id} className="homesec">
          <h2 className="a22th"><span>{g.name}</span> <small>{g.sub}</small></h2>
          <div className={`progrid ${g.id}`}>
            {programsIn(g.id).map((p, i) => (
              <Link key={p.id} href={p.href} className="panel procard" style={{ "--c": p.color }} onClick={() => sfx.page()}>
                {g.id === "path" && <span className="prostep" aria-hidden="true">{i + 1}</span>}
                <img src={p.avatar} alt="" />
                <div className="protxt">
                  <div className="prolv"><b>{p.ico} {p.lv}</b> <span className="jpt">{p.jp}</span></div>
                  <h3>{p.name}</h3>
                  <small className="prohost">Người dẫn: {p.host}</small>
                  <p>{p.desc}</p>
                  <em>{progressLabel(p, S) || "Chưa bắt đầu"}</em>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* ===== Sổ tay từ vựng ===== */}
      <section className="homesec" id="sotay">
        <h2 className="a22th"><span>Sổ Tay Từ Vựng</span> <small>Luyện từ vựng từng sách theo Topic</small></h2>
      <div className="chips nbbooks">
        {BOOKS.map((b) => <button key={b.id} className={`chip dk ${b.id === book ? "on" : ""}`} onClick={() => { update((s) => { s.nbBook = b.id; }); sfx.click(); }}>{b.ico} {b.name} <small>{bookTotal(b.id).toLocaleString("vi-VN")} từ</small></button>)}
      </div>
      <p className="hint" style={{ textAlign: "center", marginTop: 4 }}>{B.full} · {bookTotal(B.id).toLocaleString("vi-VN")} từ · 9 Topic</p>
      <div className="grid">
        {topicsOf(book).map((T) => {
          const keys = ["all", ...T.sections.map((s) => s.key)];
          const got = keys.reduce((a, k) => a + (best[`t${T.id}_${k}`] ? starsFor(best[`t${T.id}_${k}`].pct) : 0), 0);
          const max = keys.length * 3;
          const el = T.el;
          const pool = CHARS.filter((c) => c.el === el && c.rank === 5);
          const mascot = pool[(T.n * 5) % pool.length] || CHARS[0];
          return (
            <Link key={T.id} href={`/topic/${T.id}`} className="panel tcard" style={{ "--el": ELEM[el].c }} onClick={() => sfx.page()}>
              <div className="glow" />
              <img className="tchar" src={charIcon(mascot)} alt={mascot.vi} title={mascot.vi} />
              <div className="num">Topic {T.n} · <em>{ELEM[el].vi}</em></div>
              <h3>{T.title}</h3>
              <div className="vi">{T.vi}</div>
              <div className="meta"><span>{nbWords(T.id, "all").length} từ · {T.sections.length} phần</span><span className="starsrow">★ {got}/{max}</span></div>
              <div className="bar"><i style={{ width: `${Math.round((got / max) * 100)}%` }} /></div>
            </Link>
          );
        })}
      </div>
      </section>

      {/* ===== Teyvat ===== */}
      <section className="homesec">
        <h2 className="a22th"><span>Teyvat</span> <small>Dùng Nguyên Thạch kiếm được khi học</small></h2>
        <div className="progrid teyvat">
          {TEYVAT.map((t) => (
            <Link key={t.id} href={t.href} className="panel procard mini" onClick={() => sfx.page()}>
              <span className="proico" aria-hidden="true">{t.ico}</span>
              <div className="protxt"><h3>{t.name}</h3><p>{t.desc}</p></div>
            </Link>
          ))}
        </div>
      </section>
      <footer>
        Dữ liệu từ vựng: bảng từ mới Marugoto A1, A2-1, A2-2, A2/B1, B1-1, B1-2 (bản tiếng Việt).<br />
        Ảnh: Pexels, GIPHY, Wikimedia, Openverse, nekos.best · Ảnh nhân vật/vũ khí Genshin Impact © HoYoverse (qua gi.yatta.moe).<br />
        Trang học tập cá nhân, phi thương mại — không phải sản phẩm chính thức của HoYoverse.
      </footer>
    </>
  );
}
