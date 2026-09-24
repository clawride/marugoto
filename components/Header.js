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
          <div><b>Sổ Tay Từ Vựng Teyvat</b><small>MARUGOTO 中級1 · B1-1</small></div>
        </Link>
        <div className="curr" title="Nguyên Thạch"><Ico id="pgm" />{n(S?.primo)}</div>
        <div className="curr hide-sm" title="Mối Duyên Vương Vấn / Mối Duyên Tương Ngộ"><Ico id="fateI" />{n(S?.fates.i)} <Ico id="fateA" />{n(S?.fates.a)}</div>
        <Link href="/boss" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">⚔️</span><span className="lbl">Boss</span></Link>
        <Link href="/nghe" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🎧</span><span className="lbl">Nghe</span></Link>
        <Link href="/wish" className="navbtn" onClick={() => sfx.page()}><Ico id="fateI" /><span className="lbl">Cầu Nguyện</span></Link>
        <Link href="/characters" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">👥</span><span className="lbl">Nhân Vật</span></Link>
        <Link href="/inventory" className="navbtn" onClick={() => sfx.page()}><span aria-hidden="true">🎒</span><span className="lbl">Túi Đồ</span></Link>
        <Link href="/rank" className="navbtn profchip" onClick={() => sfx.page()} title="Bảng xếp hạng & hồ sơ">{S?.profile ? <img src={avatarUrl(S.profile.avatar)} alt="" /> : <span aria-hidden="true">🏆</span>}<span className="lbl">{S?.profile?.name || "Xếp hạng"}</span></Link>
        <button className="navbtn" onClick={toggleSound} title={S?.sound ? "Tắt âm thanh" : "Bật âm thanh"}>{S?.sound === false ? "🔇" : "🔊"}</button>
      </div>
    </header>
  );
}
