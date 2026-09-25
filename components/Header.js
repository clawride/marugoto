"use client";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { Ico } from "@/components/Icons";
import { sfx } from "@/lib/sfx";
import { avatarUrl } from "@/components/Profile";

export default function Header() {
  const { S, toggleSound } = useGame();
  const n = (v) => (v ?? 0).toLocaleString("vi-VN");
  return (
    <header className="top">
      <div className="in">
        <Link href="/" className="brand" onClick={() => sfx.page()}>
          <svg><use href="#emb" /></svg>
          <div><b>Sổ Tay Từ Vựng Teyvat</b><small>MARUGOTO A1 · B1</small></div>
        </Link>
        <div className="curr" title="Nguyên Thạch"><Ico id="pgm" />{n(S?.primo)}</div>
        <div className="curr hide-sm" title="Mối Duyên Vương Vấn / Mối Duyên Tương Ngộ"><Ico id="fateI" />{n(S?.fates.i)} <Ico id="fateA" />{n(S?.fates.a)}</div>
        <nav className="navs" aria-label="Điều hướng" onWheel={(e) => { const el = e.currentTarget; if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY; }}>
        <Link href="/kana" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">あ</span><span className="lbl">Chữ cái</span></Link>
        <Link href="/kanji" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">漢</span><span className="lbl">Chữ Hán</span></Link>
        <Link href="/a21" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">⚡</span><span className="lbl">A2-1</span></Link>
        <Link href="/a1" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🍃</span><span className="lbl">A1</span></Link>
        <Link href="/ab1" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🌊</span><span className="lbl">A2/B1</span></Link>
        <Link href="/a22" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🌱</span><span className="lbl">A2-2</span></Link>
        <Link href="/b1" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🎓</span><span className="lbl">B1</span></Link>
        <Link href="/b12" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🔥</span><span className="lbl">B1-2</span></Link>
        <Link href="/boss" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">⚔️</span><span className="lbl">Boss</span></Link>
        <Link href="/nghe" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🎧</span><span className="lbl">Nghe</span></Link>
        <Link href="/wish" className="navbtn" onClick={() => sfx.page()}><Ico id="fateI" /><span className="lbl">Cầu Nguyện</span></Link>
        <Link href="/characters" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">👥</span><span className="lbl">Nhân Vật</span></Link>
        <Link href="/inventory" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🎒</span><span className="lbl">Túi Đồ</span></Link>
        </nav>
        <Link href="/rank" className="navbtn profchip" onClick={() => sfx.page()} title="Bảng xếp hạng & hồ sơ">{S?.profile ? <img src={avatarUrl(S.profile.avatar)} alt="" /> : <span aria-hidden="true">🏆</span>}<span className="lbl">{S?.profile?.name || "Xếp hạng"}</span></Link>
        <button className="navbtn" onClick={toggleSound} title={S?.sound ? "Tắt âm thanh" : "Bật âm thanh"}>{S?.sound === false ? "🔇" : "🔊"}</button>
      </div>
    </header>
  );
}
