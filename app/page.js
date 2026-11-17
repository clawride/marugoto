"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM, starsFor } from "@/lib/data";
import { BOOKS, topicsOf, topicCount, bookTotal } from "@/lib/notebook";
import { CHARS, charIcon } from "@/lib/genshin";
import { sfx } from "@/lib/sfx";
import { GROUPS, programsIn, TEYVAT, progressLabel } from "@/lib/programs";
import { useUITheme } from "@/lib/uiTheme";
import { readRecentLesson, searchText } from "@/lib/learning-navigation";
import UiIcon from "@/components/ui/UiIcon";

function ProgramCard({ p, state, plain }) {
  return <Link href={p.href} className={`academy-card ${p.id.startsWith("mn") ? "minna" : ""}`} onClick={() => sfx.page()}>
    <div className="academy-card-top"><span className="level-badge">{p.lv}</span><span className="academy-symbol" aria-hidden="true">{p.jp}</span></div>
    <div className="academy-card-title">{!plain && <img src={p.avatar} alt="" loading="lazy" width="48" height="48" />}<h3>{p.name}</h3></div>
    <p>{p.desc}</p>
    <div className="academy-card-bottom"><span>{progressLabel(p, state) || "Sẵn sàng khám phá"}</span><UiIcon name="arrow" /></div>
  </Link>;
}

export default function Home() {
  const { S, update } = useGame();
  const [family, setFamily] = useState("all");
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(null);
  useEffect(() => { setRecent(readRecentLesson()); }, []);
  const courses = programsIn("path").filter((p) => (family === "all" || (family === "minna" ? p.id.startsWith("mn") : !p.id.startsWith("mn"))) && searchText(`${p.name} ${p.lv} ${p.jp}`).includes(searchText(query)));
  const plain = useUITheme() === "plain"; // giao diện cơ bản: ẩn các mục game
  const best = S?.best || {};
  const books = plain ? BOOKS.filter((b) => b.id !== "gi") : BOOKS; // giao diện cơ bản: ẩn Sổ tay Genshin
  const book = books.some((b) => b.id === S?.nbBook) ? S.nbBook : "a1";
  const B = books.find((b) => b.id === book) || books[0];

  // ===== Sổ tay từ vựng (đặt ngay sau Lộ trình Marugoto) =====
  const notebook = (
    <section className="homesec notebook-section" id="sotay">
      <h2 className="a22th"><span>Sổ Tay Từ Vựng</span> <small>Luyện từ vựng từng sách theo Topic</small></h2>
      <div className="chips nbbooks">
        {books.map((b) => <button key={b.id} aria-pressed={b.id === book} className={`chip dk ${b.id === book ? "on" : ""}`} onClick={() => { update((s) => { s.nbBook = b.id; }); sfx.click(); }}>{b.ico} {b.name} <small>{bookTotal(b.id).toLocaleString("vi-VN")} từ</small></button>)}
      </div>
      <p className="hint" style={{ textAlign: "center", marginTop: 4 }}>{B.full} · {bookTotal(B.id).toLocaleString("vi-VN")} từ · {topicsOf(book).length} {B.id === "gi" ? "nhân vật" : "Topic"}</p>
      {B.id === "gi" && (
        <div className="panel ginote">
          <p>📜 <b>Từ vựng thêm có trong Genshin Impact</b> — những từ <b>không có trong giáo trình Marugoto</b> mà bạn gặp trong truyện và trò chuyện của từng nhân vật. Mỗi nhân vật là một Topic, mỗi chương là một phần; có cách đọc, phiên âm Latinh và nghĩa tiếng Việt.</p>
          <Link href="/genshin-vocab" className="gbtn sm" onClick={() => sfx.page()}><span className="c" />🔎 Bảng tra cứu tất cả {bookTotal("gi").toLocaleString("vi-VN")} từ</Link>
        </div>
      )}
      <div className="grid">
        {topicsOf(book).map((T) => {
          const keys = ["all", ...T.sections.map((s) => s.key)];
          const got = keys.reduce((a, k) => a + (best[`t${T.id}_${k}`] ? starsFor(best[`t${T.id}_${k}`].pct) : 0), 0);
          const max = keys.length * 3;
          const el = T.el;
          const pool = CHARS.filter((c) => c.el === el && c.rank === 5);
          const mascot = T.char || pool[(T.n * 5) % pool.length] || CHARS[0];
          return (
            <Link key={T.id} href={`/topic/${T.id}`} className="panel tcard" style={{ "--el": ELEM[el].c }} onClick={() => sfx.page()}>
              <div className="glow" />
              <img className="tchar" src={charIcon(mascot)} alt={mascot.vi} title={mascot.vi} />
              <div className="num">{T.char ? `${T.char.rank}★` : `Topic ${T.n}`} · <em>{ELEM[el].vi}</em></div>
              <h3 style={T.char ? { fontFamily: "var(--jp)" } : undefined}>{T.title}</h3>
              <div className="vi">{T.vi}</div>
              <div className="meta"><span>{topicCount(T)} từ · {T.sections.length} phần</span><span className="starsrow">★ {got}/{max}</span></div>
              <div className="bar"><i style={{ width: `${Math.round((got / max) * 100)}%` }} /></div>
            </Link>
          );
        })}
      </div>
    </section>
  );

  return <div className="learning-home">
    <div className="home-eyebrow"><span className="status-dot" /> KHÔNG GIAN HỌC TIẾNG NHẬT <span className="eyebrow-right">一歩ずつ · Từng bước một</span></div>
    <section className="home-hero" aria-labelledby="home-heading">
      <div className="home-hero-copy"><span className="eyebrow">HỌC MỘT CHÚT. TIẾN XA HƠN.</span><h1 id="home-heading">Tiếng Nhật,<br />mỗi ngày một <em>bước mới.</em></h1><p>Từ những chữ cái đầu tiên đến cuộc trò chuyện tự tin. Chọn lộ trình của bạn, học từng bài và thấy mình tiến bộ.</p>
        <div className="hero-actions"><a className="ui-primary" href="#khoahoc">Khám phá khóa học <UiIcon name="arrow" /></a><Link className="ui-text-link" href="/kana">Mình mới bắt đầu <UiIcon name="chevron" size={16} /></Link></div>
        <div className="hero-footnote"><span>Marugoto A1 → B1</span><i /><span>Minna sơ cấp 1 & 2</span></div>
      </div>
      <div className="hero-illustration" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="study-card-back"><span>日本語</span></div><div className="study-card-front"><small>ひとつずつ、まいにち。</small><b>学</b><span>まなぶ · manabu</span><div>Học hỏi mỗi ngày <span>↗</span></div></div><span className="floating-kana kana-a">あ</span><span className="floating-kana kana-ka">カ</span><span className="hero-spark">✦</span></div>
    </section>
    <section className="home-next" aria-label="Bắt đầu buổi học">
      <div className="next-icon"><UiIcon name="book" size={26} /></div><div><small>{recent ? "BÀI BẠN VỪA MỞ" : "GỢI Ý CHO NGƯỜI MỚI"}</small><h2>{recent ? recent.title : "Bắt đầu từ những điều cơ bản"}</h2><p>{recent ? recent.course : "Bảng chữ cái, cách đọc và những câu chào đầu tiên."}</p></div><Link className="ui-primary" href={recent?.href || "/mn1/0"}>{recent ? "Tiếp tục học" : "Mở bài đầu tiên"}<UiIcon name="arrow" size={18} /></Link>
    </section>
    <nav className="quick-practice" aria-label="Luyện tập nhanh">{[["/kana", "あ", "Bảng chữ cái", "Xây nền tảng"], ["/kanji", "漢", "Học Kanji", "Hiểu và nhớ chữ"], ["/#sotay", "語", "Sổ tay từ vựng", "Ôn theo chủ đề"], ["/de-thi", "試", "Luyện đề thi", "Thử sức của bạn"]].map(([href, icon, title, sub]) => <Link key={href} href={href}><span className="quick-symbol">{icon}</span><div><b>{title}</b><small>{sub}</small></div><UiIcon name="chevron" size={16} /></Link>)}</nav>
    <section className="course-catalog" id="khoahoc" aria-labelledby="catalog-heading">
      <div className="section-heading"><div><span className="eyebrow">LỘ TRÌNH CỦA BẠN</span><h2 id="catalog-heading">Hôm nay, bạn muốn học gì?</h2><p>Chọn bộ sách và cấp độ phù hợp để bắt đầu.</p></div><span className="section-count">{programsIn("path").length} khóa học</span></div>
      <div className="catalog-toolbar"><div className="segmented" role="group" aria-label="Bộ giáo trình">{[["all", "Tất cả"], ["minna", "Minna - Genshin"], ["marugoto", "Marugoto"]].map(([key, text]) => <button key={key} type="button" aria-pressed={family === key} onClick={() => setFamily(key)}>{text}</button>)}</div><label className="ui-search"><UiIcon name="search" /><input type="search" aria-label="Tìm khóa học" placeholder="Tìm khóa học, cấp độ…" value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
      <p className="sr-only" role="status">{courses.length} khóa học phù hợp</p>
      <div className="academy-grid">{courses.map((p) => <ProgramCard key={p.id} p={p} state={S} plain={plain} />)}</div>
      {!courses.length && <div className="ui-empty"><UiIcon name="search" size={30} /><h3>Chưa tìm thấy khóa học</h3><p>Thử tên sách hoặc cấp độ như “Minna”, “A1”.</p><button className="ui-secondary" onClick={() => { setQuery(""); setFamily("all"); }}>Xem tất cả khóa học</button></div>}
    </section>
    {notebook}
    <section className="beginner-banner"><span className="quick-symbol">あ</span><div><h2>Chưa quen Hiragana và Katakana?</h2><p>Bắt đầu với bảng chữ cái, luyện nghe và tập viết từng nét.</p></div><Link className="ui-secondary" href="/kana">Học bảng chữ cái <UiIcon name="arrow" size={18} /></Link></section>
    {GROUPS.filter((g) => !["path", "start"].includes(g.id)).map((g) => <section className="homesec" key={g.id}><div className="section-heading"><div><h2>{g.name}</h2><p>{(plain && g.plainSub) || g.sub}</p></div></div><div className="academy-grid">{programsIn(g.id).filter((p) => !(plain && p.game)).map((p) => <ProgramCard key={p.id} p={p} state={S} plain={plain} />)}</div></section>)}
    <section className="homesec"><div className="section-heading"><div><h2>{plain ? "Thành quả học tập" : "Khám phá Teyvat"}</h2><p>{plain ? "Theo dõi tiến độ, chứng chỉ và bảng xếp hạng." : "Đổi nỗ lực mỗi ngày thành những phần thưởng."}</p></div></div><div className="home-rewards">{TEYVAT.filter((t) => !(plain && t.game)).map((t) => <Link key={t.id} href={t.href}><span aria-hidden="true">{t.ico}</span><div><b>{t.name}</b><p>{t.desc}</p></div><UiIcon name="arrow" /></Link>)}</div></section>
    <footer className="academy-footer"><div><b>Sổ Tay Teyvat</b><span>Mỗi ngày một bước, mỗi bước một điều mới.</span></div><nav aria-label="Thông tin website"><Link href="/chinh-sach">Chính sách</Link><Link href="/dieu-khoan">Điều khoản</Link></nav><p>Dữ liệu từ vựng Marugoto A1–B1 · Ảnh: Pexels, GIPHY, Wikimedia, Openverse, nekos.best. Nhân vật Genshin Impact © HoYoverse (qua gi.yatta.moe). Trang học tập cá nhân, phi thương mại; không phải sản phẩm chính thức của HoYoverse.</p></footer>
  </div>;
}
