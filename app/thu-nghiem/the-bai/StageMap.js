"use client";
// Bản đồ các ải: đi lần lượt từ ải 1, thắng ải trước mới mở ải sau. Ải chưa mở chỉ hiện bóng đen "???".
import { useEffect, useRef, useState } from "react";
import { charIcon } from "@/lib/genshin";
import { opponentArt } from "@/lib/shikiDialogue";
import { LEVELS } from "@/lib/shikiDuel";
import { sfx } from "@/lib/sfx";
import { regionOf } from "@/lib/giMeta";
import "./stagemap.css";

// Vùng của từng nhân vật (lib/giMeta.js) — dùng cho nhãn ải và ảnh nền bàn đấu
export const REGION = new Proxy({}, { get: (_, en) => regionOf(String(en)) });
const STEP = 124, PAD = 80;

export default function StageMap({ ops, beat, decks, levelOf, busy, canStart, onStart }) {
  const maxBeat = Math.max(-1, ...Object.keys(beat).map(Number));
  const unlocked = (op) => op.i <= maxBeat + 1;
  const cur = ops.find((op) => unlocked(op) && !(beat[op.i] > 0)) || ops[ops.length - 1];
  const [sel, setSel] = useState(cur.i);
  const [pop, setPop] = useState(null); // ải đang mở bảng to giữa màn hình
  const box = useRef(null);
  useEffect(() => {
    const el = box.current, node = el?.querySelector(".sm-node.cur");
    if (el && node) el.scrollTop = node.offsetTop - el.clientHeight / 2;
  }, [cur.i]);

  const pts = ops.map((_, i) => ({ x: 50 + 30 * Math.sin(i * 1.15), y: PAD + i * STEP }));
  const H = PAD * 2 + (ops.length - 1) * STEP;
  const curve = (list) => list.map((p, i) => (i ? `C ${list[i - 1].x} ${list[i - 1].y + STEP / 2}, ${p.x} ${p.y - STEP / 2}, ${p.x} ${p.y}` : `M ${p.x} ${p.y}`)).join(" ");
  const op = ops[sel] || cur, open = unlocked(op), lv = levelOf(op);

  return (
    <div className="sm-wrap">
      <div className="sm-map" ref={box}>
        <div className="sm-inner" style={{ height: H }}>
          <svg className="sm-path" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={curve(pts)} className="all" vectorEffect="non-scaling-stroke" />
            <path d={curve(pts.slice(0, cur.i + 1))} className="done" vectorEffect="non-scaling-stroke" />
          </svg>
          {ops.map((o, i) => {
            const isOpen = unlocked(o), won = beat[o.i] > 0, isCur = o.i === cur.i;
            return (
              <button key={o.i} type="button" style={{ left: pts[i].x + "%", top: pts[i].y }}
                className={`sm-node ${won ? "won" : ""} ${isCur ? "cur" : ""} ${isOpen ? "" : "locked"} ${sel === o.i ? "sel" : ""}`}
                onClick={() => { setSel(o.i); setPop(o.i); sfx.open(); }} aria-label={isOpen ? `Ải ${i + 1}: ${o.char.vi}` : `Ải ${i + 1}: chưa mở`}>
                <span className="ring"><img src={opponentArt(o.char.en)} alt="" loading="lazy" draggable={false} onError={(e) => { e.currentTarget.src = charIcon(o.char); }} /></span>
                <span className="num">{i + 1}</span>
                {won && <span className="star" aria-hidden="true">★</span>}
                {!isOpen && <span className="lock" aria-hidden="true">🔒</span>}
                <span className="lbl">{isOpen ? o.char.vi : "???"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {pop != null && ops[pop] && <StagePopup op={ops[pop]} open={unlocked(ops[pop])} lv={levelOf(ops[pop])} deck={decks[pop] || []} beat={beat[pop] || 0} busy={busy} canStart={canStart} onClose={() => setPop(null)} onStart={(o) => { setPop(null); onStart(o); }} />}
      <div className={`sm-panel ${open ? "" : "locked"}`} key={op.i}>
        <div className="sm-art"><img src={opponentArt(op.char.en)} alt={open ? op.char.vi : ""} onError={(e) => { e.currentTarget.src = charIcon(op.char); }} /></div>
        <small className="sm-stage">Ải {op.i + 1} · {open ? REGION[op.char.en] || "Teyvat" : "???"}</small>
        <h3>{open ? op.char.vi : "??? Bí ẩn"}</h3>
        {open ? <>
          <div className="sm-meta"><span className={`ttlvtag lv${lv}`}>{LEVELS[lv][0]} · {LEVELS[lv][1]}</span> <span>Thẻ hạng {op.band[0]}–{op.band[1]}</span></div>
          <div className="ttminis">{(decks[op.i] || []).map((c) => <span key={c.id} className={`ttrk r-${c.rank}`} title={`${c.name} · hạng ${c.rank}`}>{c.rank}</span>)}</div>
          <p className="sm-note">{beat[op.i] ? `✔ Đã thắng ${beat[op.i]} lần — đấu lại để lấy thêm thẻ.` : "Thắng ải này để mở ải tiếp theo."}</p>
          <button className="gbtn tri" disabled={busy || !canStart} onClick={() => onStart(op)}><span className="c" />⚔️ Vào ải</button>
          {!canStart && <p className="sm-note">Cần chọn đủ 5 thẻ ở bước 1.</p>}
        </> : <p className="sm-note">🔒 Thắng ải {op.i} để mở ải này.</p>}
      </div>
    </div>
  );
}

// Bảng to giữa màn hình khi bấm vào một ải: ảnh lớn + nút VÀO ẢI to, dễ bấm trên điện thoại
function StagePopup({ op, open, lv, deck, beat, busy, canStart, onClose, onStart }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="sm-pop" onClick={onClose} role="dialog" aria-modal="true" aria-label={open ? op.char.vi : "Ải chưa mở"}>
      <div className={`sm-popcard ${open ? "" : "locked"}`} onClick={(e) => e.stopPropagation()}>
        <button className="sm-x" onClick={onClose} aria-label="Đóng">✕</button>
        <div className="sm-popart"><img src={opponentArt(op.char.en)} alt="" onError={(e) => { e.currentTarget.src = charIcon(op.char); }} /></div>
        <small className="sm-stage">Ải {op.i + 1} · {open ? REGION[op.char.en] || "Teyvat" : "???"}</small>
        <h3>{open ? op.char.vi : "??? Bí ẩn"}</h3>
        {open ? <>
          <div className="sm-meta"><span className={`ttlvtag lv${lv}`}>{LEVELS[lv][0]} · {LEVELS[lv][1]}</span> <span>Thẻ hạng {op.band[0]}–{op.band[1]}</span>{beat ? <span>✔ Đã thắng {beat} lần</span> : null}</div>
          <div className="ttminis">{deck.map((c) => <span key={c.id} className={`ttrk r-${c.rank}`}>{c.rank}</span>)}</div>
          <button className="sm-play" disabled={busy || !canStart} onClick={() => onStart(op)}>⚔️ VÀO ẢI</button>
          {!canStart && <p className="sm-note">Cần chọn đủ 5 thẻ ở bước 1.</p>}
        </> : <p className="sm-note big">🔒 Thắng ải {op.i} để mở ải này.</p>}
      </div>
    </div>
  );
}
