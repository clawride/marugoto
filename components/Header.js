"use client";
// Thanh trên cùng gọn: logo · tiền tệ · nút Menu (mở bảng điều hướng đầy đủ, chia nhóm, xếp theo cấp độ) · hồ sơ · âm thanh
import { useEffect, useRef, useState } from "react";
import { setUITheme, useUITheme } from "@/lib/uiTheme";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGame } from "@/components/Game";
import { Ico } from "@/components/Icons";
import { sfx } from "@/lib/sfx";
import Avatar from "@/components/Avatar";
import { ProfileDialog } from "@/components/Profile";
import { BackupItems } from "@/components/Backup";
import { GROUPS, programsIn, TEYVAT, progressLabel } from "@/lib/programs";
import { useAdmin } from "@/lib/useSite";

const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1"; // bản offline: không có tài khoản / phòng chat

export default function Header() {
  const { S, toggleSound } = useGame();
  const isAdmin = useAdmin(S); // chỉ tài khoản quản trị (máy chủ xác nhận) mới thấy nút ⚙️
  const [profOpen, setProfOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const panel = useRef(null), btn = useRef(null);
  const n = (v) => (v ?? 0).toLocaleString("vi-VN");
  const isOn = (href) => (href === "/" ? path === "/" : path === href || path?.startsWith(href + "/"));

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const key = (e) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const click = (e) => { if (!panel.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", click);
    panel.current?.querySelector("a")?.focus({ preventScroll: true });
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", click); };
  }, [open]);

  const ui = useUITheme();
  const item = (p) => (
    <Link key={p.id} href={p.href} className={`mnitem ${isOn(p.href) ? "on" : ""}`} style={{ "--c": p.color || "211,188,142" }} onClick={() => { sfx.page(); setOpen(false); }}>
      <span className="mnico" aria-hidden="true">{p.ico}</span>
      <span className="mntxt"><b>{p.name}</b><small>{p.lv ? `${p.lv} · ` : ""}{p.host || p.desc}</small></span>
      {p.progress && <em>{progressLabel(p, S)}</em>}
    </Link>
  );

  return (
    <header className="top">
      <div className="in">
        <Link href="/" className="brand" onClick={() => sfx.page()}>
          <svg><use href="#emb" /></svg>
          <div><b>Sổ Tay Từ Vựng Teyvat</b><small>MARUGOTO A1 · B1</small></div>
        </Link>
        {ui !== "plain" && <>
          <div className="curr" title="Nguyên Thạch"><Ico id="pgm" />{n(S?.primo)}</div>
          <div className="curr hide-sm" title="Mối Duyên Vương Vấn / Mối Duyên Tương Ngộ"><Ico id="fateI" />{n(S?.fates.i)} <Ico id="fateA" />{n(S?.fates.a)}</div>
        </>}
        <span className="topgap" />
        <button ref={btn} className={`navbtn menubtn ${open ? "on" : ""}`} aria-expanded={open} aria-controls="mainmenu" onClick={() => { setOpen((v) => !v); sfx.click(); }}>
          <span aria-hidden="true">{open ? "✕" : "☰"}</span><span className="lbl">Menu</span>
        </button>
        {isAdmin === true && <Link href="/quan-tri" className={`navbtn ${path.startsWith("/quan-tri") ? "on" : ""}`} onClick={() => sfx.page()} title="Trang quản trị" aria-label="Trang quản trị"><span aria-hidden="true">⚙️</span><span className="lbl">Quản trị</span></Link>}
        <Link href="/rank" className={`navbtn rankbtn ${path === "/rank" ? "on" : ""}`} onClick={() => sfx.page()} title="Bảng xếp hạng"><span aria-hidden="true">🏆</span><span className="lbl">Xếp hạng</span></Link>
        {!OFFLINE && <button type="button" className="navbtn profchip" onClick={() => { setProfOpen(true); sfx.open?.(); }} title="Hồ sơ của bạn" aria-label="Hồ sơ của bạn">{S?.profile ? <Avatar avatar={S.profile.avatar} name={S.profile.name} size={24} /> : <span aria-hidden="true">👤</span>}<span className="lbl">{S?.profile?.name || "Hồ sơ"}</span></button>}
        <button className="navbtn uibtn" onClick={() => { setUITheme(ui === "plain" ? "game" : "plain"); sfx.click(); }}
          title={ui === "plain" ? "Chuyển sang giao diện Teyvat (game)" : "Chuyển sang giao diện học tập cơ bản (không ảnh anime)"} aria-label="Đổi giao diện">
          <span aria-hidden="true">{ui === "plain" ? "🎮" : "📘"}</span><span className="lbl">{ui === "plain" ? "Giao diện game" : "Giao diện cơ bản"}</span>
        </button>
        <button className="navbtn" onClick={toggleSound} title={S?.sound === false ? "Bật âm thanh" : "Tắt âm thanh"} aria-label={S?.sound === false ? "Bật âm thanh" : "Tắt âm thanh"}>{S?.sound === false ? "🔇" : "🔊"}</button>
      </div>
      {open && (
        <nav id="mainmenu" ref={panel} className="mainmenu" aria-label="Điều hướng">
          <div className="mnwrap">
            <Link href="/#sotay" className={`mnitem wide ${path === "/" ? "on" : ""}`} onClick={() => { sfx.page(); setOpen(false); }}>
              <span className="mnico" aria-hidden="true">📒</span>
              <span className="mntxt"><b>Sổ Tay Từ Vựng</b><small>Trang chủ · từ vựng mọi sách theo Topic</small></span>
            </Link>
            {GROUPS.map((g) => (
              <section key={g.id} className="mngroup">
                <h3>{g.name} <small>{(ui === "plain" && g.plainSub) || g.sub}</small></h3>
                <div className="mnlist">{programsIn(g.id).filter((p) => !(ui === "plain" && p.game)).map(item)}</div>
              </section>
            ))}
            <section className="mngroup teyvat">
              {ui === "plain" ? <h3>Hồ sơ <small>Tiến độ & sao lưu</small></h3> : <h3>Teyvat <small>Phần thưởng & hồ sơ</small></h3>}
              <div className="mnlist">{TEYVAT.filter((t) => !(ui === "plain" && t.game)).map(item)}<BackupItems /></div>
            </section>
          </div>
        </nav>
      )}
          {profOpen && (S?.profile?.username
            ? <ProfileDialog mode="edit" onClose={() => setProfOpen(false)} />
            : <ProfileDialog mode="gate" onClose={() => setProfOpen(false)} onSkip={() => setProfOpen(false)} />)}
    </header>
  );
}
