"use client";
// Màn hiệu ứng khi rút được thẻ hạng S / SR: sao băng lao xuống → chớp sáng → tia sáng xoay + vòng sóng
// → thẻ xoay tít phóng ra giữa màn hình, chữ hạng khổng lồ. Mỗi lá ~3,4 giây, chạm để qua lá tiếp theo.
import { useEffect } from "react";
import { RANK_VI } from "@/lib/shikihime";
import { ELEM } from "@/lib/data";
import { sfx } from "@/lib/sfx";
import { Card } from "./Card";
import "./draw.css";

const SPARKS = Array.from({ length: 28 }, (_, i) => ({ a: (i * 360) / 28 + (i % 3) * 4, d: 0.9 + (i % 5) * 0.35, r: 26 + (i % 4) * 9 }));

export default function DrawCine({ card, index, total, onNext }) {
  const sr = card.rank === "SR";
  useEffect(() => {
    sfx.meteor(sr ? 5 : 4);
    const a = setTimeout(() => sfx.boom(), 1150);
    const b = setTimeout(() => { sfx.reveal(5); sfx.fanfare(); }, 1350);
    const t = setTimeout(onNext, sr ? 4200 : 3400);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(t); };
  }, [card, index]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div key={index} className={`ttcine ${sr ? "sr" : "s"}`} style={{ "--ec": ELEM[card.el]?.c || "#ffd36b" }} onClick={onNext} role="dialog" aria-label={`Rút được thẻ hạng ${card.rank}: ${card.name}`}>
      <div className="sky" /><div className="streak" /><div className="flash" />
      <div className="rays" /><div className="rays r2" />
      <div className="ring" /><div className="ring k2" /><div className="ring k3" />
      <div className="sparks">{SPARKS.map((p, i) => <i key={i} style={{ "--a": p.a + "deg", "--d": p.d + "s", "--r": p.r + "vmin" }} />)}</div>
      <div className="stage">
        <div className="cardwrap"><Card c={card} owner="me" named detail /></div>
        <div className="rank">{[...card.rank].map((ch, i) => <span key={i} style={{ "--i": i }}>{ch}</span>)}</div>
        <div className="title">{sr ? "✦ TỐI THƯỢNG ✦" : "★ SIÊU HIẾM ★"}<small>{RANK_VI[card.rank]} · {card.name} · {card.ro}</small></div>
      </div>
      <div className="hint">{total > 1 ? `${index + 1}/${total} · ` : ""}Chạm để tiếp tục</div>
    </div>
  );
}
