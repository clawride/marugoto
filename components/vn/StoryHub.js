"use client";
// Mục lục truyện một nhân vật: 7 chương (C0 gặp gỡ, C1–C6 mở theo cung mệnh) · trò chuyện · cài đặt
import { useEffect, useState } from "react";
import Link from "next/link";
import { CHARS, charSplash, charIcon } from "@/lib/genshin";
import { ELEM } from "@/lib/data";
import { hasStory, ownedOf, consOfS, loadStory, vnOf, chapterOpen, TIERS } from "@/lib/vn";
import { useVN, VNSettings } from "@/components/vn/VNParts";
import { sfx } from "@/lib/sfx";

export function useStory(id) {
  const [D, setD] = useState(undefined);
  useEffect(() => { let on = true; loadStory(id).then((d) => on && setD(d)); return () => { on = false; }; }, [id]);
  return D;
}

export function LockedNote({ c, owned }) {
  if (!hasStory(c)) return <p className="panel vnlock">Truyện nhân vật hiện có cho các nhân vật 5★.</p>;
  if (!owned) return <p className="panel vnlock">🔒 Bạn chưa sở hữu {c.vi}. Hãy <Link href="/wish">Cầu Nguyện</Link> để gặp nhân vật này và mở khóa câu chuyện.</p>;
  return null;
}

export default function StoryHub({ id }) {
  const c = CHARS.find((x) => x.id === +id);
  const { S, tier } = useVN();
  const D = useStory(id);
  if (!c) return <p style={{ marginTop: 40 }}>Không tìm thấy nhân vật. <Link href="/characters">Danh sách nhân vật</Link></p>;
  if (!S) return null;
  const owned = ownedOf(S, c), cons = consOfS(S, c), P = vnOf(S, c.id);
  const el = ELEM[c.el];
  return (
    <div className="vnhub" style={{ "--ec": el?.c }}>
      <Link href={`/characters/${c.id}`} className="back">‹ {c.vi}</Link>
      <div className="vnhero">
        <img src={charSplash(c)} alt="" onError={(e) => { e.currentTarget.src = charIcon(c); }} />
        <div className="vnherotxt">
          <div className="tag">TRUYỆN NHÂN VẬT · 物語</div>
          <h1>{D?.name ? <span className="jpt">{D.name}</span> : null} {c.vi}</h1>
          <p>Mức ngôn ngữ đang dùng: <b>{TIERS[tier].name} ({TIERS[tier].short})</b> · Cung mệnh hiện tại: <b>C{owned ? cons : "–"}</b></p>
        </div>
      </div>
      <LockedNote c={c} owned={owned} />
      <VNSettings />
      {D === undefined && <p className="hint">Đang tải truyện…</p>}
      {D === null && <p className="panel vnlock">Truyện của {c.vi} đang được viết — sẽ sớm có mặt.</p>}
      {D && (
        <>
          <section className="b1group">
            <h2 className="a22th"><span>Các chương</span> <small>C0 mở khi sở hữu nhân vật · mỗi cung mệnh mở thêm một chương</small></h2>
            <div className="vnchs">
              {D.chapters.map((ch) => {
                const open = chapterOpen(S, c, ch.c), done = P.done?.[ch.c];
                const body = (
                  <>
                    <div className="vnchn">{ch.c === 0 ? "Mở đầu" : `Cung mệnh ${ch.c}`}{done ? " · ✓ đã đọc" : ""}</div>
                    <h3 className="jpt">{ch.title.jp}</h3>
                    <div className="vi">{ch.title.vi}</div>
                    {open ? <p>{ch.summary}</p> : <p className="lk">🔒 {owned ? `Cần kích hoạt Cung Mệnh ${ch.c}` : "Cần sở hữu nhân vật"}</p>}
                  </>
                );
                return open
                  ? <Link key={ch.c} href={`/characters/${c.id}/story/${ch.c}`} className={`panel vnch ${done ? "done" : ""}`} onClick={() => sfx.page()}>{body}</Link>
                  : <div key={ch.c} className="panel vnch off" aria-disabled="true">{body}</div>;
              })}
            </div>
          </section>
          <section className="b1group">
            <h2 className="a22th"><span>Trò chuyện</span> <small>luyện câu giao tiếp theo ngữ pháp Marugoto</small></h2>
            {owned ? (
              <Link href={`/characters/${c.id}/chat`} className="panel procard" onClick={() => sfx.page()}>
                <img src={charIcon(c)} alt="" />
                <div className="protxt"><h3>💬 Trò chuyện với {c.vi}</h3><p>{D.chat.length} chủ đề · {Object.keys(P.chat || {}).length} đã hoàn thành · nhân vật nói theo mức ngôn ngữ của bạn</p></div>
              </Link>
            ) : <p className="panel vnlock">🔒 Sở hữu {c.vi} để trò chuyện.</p>}
          </section>
        </>
      )}
    </div>
  );
}
