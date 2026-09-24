"use client";
// Rút thăm Đại Vận · Đại Hạn — cá cược Mối Duyên (chỉ dành cho Cầu Nguyện)
// Xúc xắc 10 mặt: 1–6 = Đại Vận (60%) → nhận số cược ×10; 7–10 = Đại Hạn (40%) → mất số cược
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/components/Game";
import Portal from "@/components/Portal";
import { Ico } from "@/components/Icons";
import { sfx } from "@/lib/sfx";

export const WIN_RATE = 0.6, MULT = 10, MIN_BET = 1, MAX_BET = 10;
const FATE = { i: "Mối Duyên Vương Vấn", a: "Mối Duyên Tương Ngộ" };

// Chốt kết quả đang chờ: cộng thưởng (nếu Đại Vận) và ghi lịch sử
export function settleGamble(s) {
  const p = s.gamblePending;
  if (!p) return;
  if (p.win) s.fates[p.f] = (s.fates[p.f] || 0) + p.b * MULT;
  const g = s.gamble || (s.gamble = { n: 0, win: 0, lose: 0, log: [] });
  g.n++; p.win ? g.win++ : g.lose++;
  g.log = [p, ...(g.log || [])].slice(0, 12);
  delete s.gamblePending;
}

// Mặt xúc xắc thắng/thua phân bố đều trong nhóm của nó
const rollFace = (win) => (win ? 1 + ((Math.random() * 6) | 0) : 7 + ((Math.random() * 4) | 0));

export default function Gamble({ onClose }) {
  const { S, update, toast } = useGame();
  const [fate, setFate] = useState("i");
  const [bet, setBet] = useState(1);
  const [phase, setPhase] = useState("idle"); // idle | rolling | win | lose
  const [face, setFace] = useState(1);
  const [last, setLast] = useState(null);
  const timer = useRef(null);
  // Đóng hộp giữa lúc gieo → vẫn chốt kết quả
  useEffect(() => () => { clearInterval(timer.current); update(settleGamble); }, [update]);

  const have = S.fates[fate] || 0;
  const maxBet = Math.min(MAX_BET, have);
  const st = S.gamble || { n: 0, win: 0, lose: 0, log: [] };

  const roll = () => {
    if (phase === "rolling") return;
    if (have < MIN_BET) return toast(`Không có ${FATE[fate]} để đặt cược`);
    const b = Math.max(MIN_BET, Math.min(bet, maxBet));
    // Quyết định kết quả và trừ cược ngay (tránh tải lại trang để né thua)
    const win = Math.random() < WIN_RATE;
    const final = rollFace(win);
    update((s) => {
      s.fates[fate] -= b;
      s.gamblePending = { t: Date.now(), f: fate, b, win, face: final };
    });
    setPhase("rolling"); setLast({ win, b, final });
    let k = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      k++;
      setFace(1 + ((Math.random() * 10) | 0));
      sfx.click();
      if (k >= 16) {
        clearInterval(timer.current);
        setFace(final);
        update(settleGamble);
        setPhase(win ? "win" : "lose");
        if (win) { sfx.reveal(5); setTimeout(() => sfx.win(), 250); } else sfx.wrong();
      }
    }, 90);
  };

  const again = () => { setPhase("idle"); setLast(null); };

  return (
    <Portal>
      <div className="modal" onClick={(e) => e.target === e.currentTarget && phase !== "rolling" && onClose()}>
        <div className={`gamble ${phase}`}>
          <button className="shop-x gx" onClick={onClose} disabled={phase === "rolling"} aria-label="Đóng">✕</button>
          <div className="g-title"><span>☯</span><h2>Đại Vận · Đại Hạn</h2><span>☯</span></div>
          <p className="g-rule">Đặt cược {MIN_BET}–{MAX_BET} Mối Duyên rồi gieo xúc xắc 10 mặt.<br />
            <b className="luck">1–6 · Đại Vận (60%)</b> → nhận <b>×{MULT}</b> số cược · <b className="doom">7–10 · Đại Hạn (40%)</b> → mất số cược</p>

          <div className="g-stage">
            <div className={`d10 ${phase === "rolling" ? "spin" : ""} ${phase === "win" ? "lucky" : phase === "lose" ? "doomed" : ""}`}>
              <svg viewBox="0 0 100 100"><polygon points="50,4 92,34 80,90 20,90 8,34" /><polygon className="inner" points="50,22 74,40 66,72 34,72 26,40" /></svg>
              <b>{face}</b>
            </div>
            {phase === "win" && <div className="g-result luck"><h3>ĐẠI VẬN!</h3><p>+{last.b * MULT} <Ico id={fate === "i" ? "fateI" : "fateA"} /> (cược {last.b} × {MULT})</p></div>}
            {phase === "lose" && <div className="g-result doom"><h3>ĐẠI HẠN…</h3><p>Mất {last.b} <Ico id={fate === "i" ? "fateI" : "fateA"} /></p></div>}
            {phase === "win" && <div className="g-burst">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--a": `${i * 20}deg`, animationDelay: `${(i % 6) * 0.03}s` }} />)}</div>}
          </div>

          {(phase === "idle" || phase === "rolling") && (
            <>
              <div className="g-fates">
                {["i", "a"].map((f) => (
                  <button key={f} className={fate === f ? "on" : ""} disabled={phase === "rolling"} onClick={() => { setFate(f); setBet(1); sfx.click(); }}>
                    <Ico id={f === "i" ? "fateI" : "fateA"} /> <span>{FATE[f]}</span> <b>{S.fates[f] || 0}</b>
                  </button>
                ))}
              </div>
              <div className="g-bet">
                <span>Số cược</span>
                <input type="range" min={MIN_BET} max={Math.max(MIN_BET, maxBet)} value={Math.min(bet, Math.max(MIN_BET, maxBet))} disabled={maxBet < MIN_BET || phase === "rolling"} onChange={(e) => setBet(+e.target.value)} />
                <b>{Math.min(bet, Math.max(MIN_BET, maxBet))}</b>
              </div>
              <div className="chips">{[1, 3, 5, 10].map((v) => <button key={v} className={`chip ${bet === v ? "on" : ""}`} disabled={v > maxBet || phase === "rolling"} onClick={() => setBet(v)}>{v}</button>)}</div>
              <div className="btnrow">
                <button className="gbtn tri" onClick={roll} disabled={maxBet < MIN_BET || phase === "rolling"}><span className="c" />{phase === "rolling" ? "Đang gieo…" : "🎲 Gieo xúc xắc"}</button>
              </div>
              {maxBet < MIN_BET && <p className="g-note">Bạn chưa có {FATE[fate]}. Đổi Nguyên Thạch ở Cửa Hàng hoặc chọn loại Mối Duyên khác.</p>}
            </>
          )}
          {(phase === "win" || phase === "lose") && (
            <div className="btnrow">
              <button className="gbtn x dark" onClick={onClose}><span className="c" />Đóng</button>
              <button className="gbtn tri" onClick={again}><span className="c" />Gieo tiếp</button>
            </div>
          )}

          <div className="g-stats">
            Đã gieo <b>{st.n}</b> lần · Đại Vận <b className="luck">{st.win}</b> · Đại Hạn <b className="doom">{st.lose}</b>
            {st.log?.length > 0 && <div className="g-log">{st.log.map((l, i) => <span key={i} className={l.win ? "luck" : "doom"} title={new Date(l.t).toLocaleString("vi-VN")}>{l.face} {l.win ? `+${l.b * MULT}` : `−${l.b}`}</span>)}</div>}
          </div>
        </div>
      </div>
    </Portal>
  );
}
