"use client";
import { ELEM } from "@/lib/data";
import { elemIcon } from "@/lib/genshin";
import { sideVal, showNum } from "@/lib/shikiCards";

export const cardArt = (c) => c?.img;
const SIDE_CLS = [["t", "nt"], ["r", "nr"], ["b", "nb"], ["l", "nl"]];

// Một lá thẻ: ảnh trọn nhân vật, 4 số ánh kim giữa 4 cạnh, nguyên tố, hạng.
// hit = { t: "atk" | "def", … } làm nổi số đang so khi lật thẻ.
export function Card({ c, owner, onClick, back, sel, badge, el, flip, small, named, hit, className = "", style }) {
  if (back) return <div className={`ttcard back ${small ? "sm" : ""} ${className}`} style={style}><span>式</span></div>;
  const v = (k) => (el !== undefined ? sideVal({ card: c }, el, k) : c.n[k]);
  const d = (k) => (el ? v(k) - c.n[k] : 0);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={`ttcard ${c.gi ? "gi" : ""} ${owner || ""} rk-${c.rank} ${sel ? "sel" : ""} ${flip ? `flip f${flip}` : ""} ${small ? "sm" : ""} ${className}`} onClick={onClick} style={{ "--ec": ELEM[c.el]?.c, ...style }} title={`${c.name} · ${c.ro} · hạng ${c.rank}`}>
      <div className="ttart"><img className="ttportrait" src={cardArt(c)} alt={c.ro} loading={named ? "lazy" : "eager"} decoding="async" draggable={false} /></div>
      {(c.rank === "A" || c.rank === "S" || c.rank === "SR") && <span className="ttaura" aria-hidden="true" />}
      <span className="ttfoil" aria-hidden="true" />
      {SIDE_CLS.map(([k, cls], j) => <b key={k} style={{ "--j": j }} className={`ttn ${cls} ${d(k) > 0 ? "up" : d(k) < 0 ? "down" : ""} ${hit?.[k] ? "hit-" + hit[k] : ""}`}>{showNum(v(k))}</b>)}
      <img className="ttel" src={elemIcon(c.el)} alt="" draggable={false} />
      <span className={`ttrk corner r-${c.rank}`}>{c.rank}</span>
      {badge && <span className="ttbadge">{badge}</span>}
      {c.gi && <span className="ttstars">{"★".repeat(c.stars)}</span>}
      {named && <span className="ttname jpt">{c.name}</span>}
    </Tag>
  );
}
