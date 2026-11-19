"use client";
// Cường hóa thẻ: hủy 2 bản trùng của lá này → +1 điểm vào một cạnh ngẫu nhiên (tối đa 10 mỗi cạnh).
// Tổng 4 cạnh đủ ngưỡng hạng trên thì lá thăng hạng (F → E → … → SR).
import { useState } from "react";
import { BOOST_COST, isMaxed, power, rankForPower, rankIdx } from "@/lib/shikiCards";
import { RANKS } from "@/lib/shikihime";
import { sfx } from "@/lib/sfx";
import { Card } from "./Card";

const SIDE_VI = { t: "trên", r: "phải", b: "dưới", l: "trái" };

export default function BoostPanel({ c, count, ranges, busy, onBoost, onClose }) {
  const [fx, setFx] = useState(null); // { side, up: {from,to} } — hiệu ứng lần cường hóa vừa xong
  const maxed = isMaxed(c), p = power(c), canPay = count >= BOOST_COST + 1;
  const next = RANKS[rankIdx(rankForPower(p, ranges)) + 1];
  const need = next ? ranges[next][0] - p : 0;
  const go = async () => {
    const r = await onBoost(c.id);
    if (!r) return;
    const up = r.from !== r.to ? { from: r.from, to: r.to } : null;
    setFx({ side: r.side, up, k: Date.now() });
    if (up) { sfx.meteor(rankIdx(r.to) >= 6 ? 5 : 4); setTimeout(() => sfx.fanfare(), 600); } else { sfx.primo(); sfx.reveal(2); }
  };
  return (
    <div className="ttboost" onClick={onClose} role="dialog" aria-label={`Cường hóa ${c.name}`}>
      <div className="ttboostcard" onClick={(e) => e.stopPropagation()}>
        <button className="sm-x" onClick={onClose} aria-label="Đóng">✕</button>
        <h3>⬆️ Cường hóa thẻ</h3>
        <div className={`ttboostart ${fx?.up ? "rankup" : ""}`} key={fx?.k || 0}>
          <Card c={c} owner="me" named hit={fx ? { [fx.side]: "atk" } : null} />
          {fx && <span className={`ttplus s-${fx.side}`}>+1</span>}
          {fx?.up && <div className="ttrankup"><b>THĂNG HẠNG!</b><span><i className={`ttrk r-${fx.up.from}`}>{fx.up.from}</i> → <i className={`ttrk big r-${fx.up.to}`}>{fx.up.to}</i></span></div>}
        </div>
        <p className="ttboostinfo">
          Tổng 4 cạnh: <b>{p}</b>/40 · hạng <b>{c.rank}</b>
          {next && !maxed ? <> · còn <b>{need}</b> điểm để lên <span className={`ttrk r-${next}`}>{next}</span></> : maxed ? " · đã tối đa" : ""}
        </p>
        {c.boost && <p className="ttboostinfo">Đã cộng: {Object.entries(c.boost).filter(([, v]) => v).map(([k, v]) => `${SIDE_VI[k]} +${v}`).join(" · ")}</p>}
        <button className="sm-play" disabled={busy || maxed || !canPay} onClick={go}>
          {maxed ? "✔ Đã đạt điểm tối đa" : `⬆️ CƯỜNG HÓA (hủy ${BOOST_COST} lá)`}
        </button>
        <p className="sm-note">Đang có <b>{count}</b> lá {c.name}{!canPay && !maxed ? ` — cần ít nhất ${BOOST_COST + 1} lá (luôn giữ lại 1 lá)` : ""}. Mỗi lần: +1 điểm vào một cạnh ngẫu nhiên chưa đạt 10.</p>
      </div>
    </div>
  );
}
