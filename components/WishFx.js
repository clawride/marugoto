"use client";
import { useEffect, useMemo, useState } from "react";
import { ELEM } from "@/lib/data";
import { WTYPE_VI, artOf, iconOf } from "@/lib/genshin";
import { constLabel } from "@/lib/gacha";
import { sfx } from "@/lib/sfx";
import { Ico } from "@/components/Icons";
import Portal from "@/components/Portal";
import MeteorCanvas from "@/components/MeteorCanvas";

const RC = { 3: "#5a8fd0", 4: "#a06bd6", 5: "#e0a93c" };

// Hoạt cảnh: sao băng → lật từng vật phẩm → tổng kết (×10)
export default function WishFx({ results, onClose }) {
  const [phase, setPhase] = useState("meteor");
  const [i, setI] = useState(0);
  const top = Math.max(...results.map((r) => r.rank));
  const multi = results.length > 1;
  const revealOrder = useMemo(() => results.slice().sort((a, b) => a.rank - b.rank || (a.kind === "c") - (b.kind === "c")), [results]);
  const summaryOrder = useMemo(() => results.slice().sort((a, b) => b.rank - a.rank || (b.kind === "c") - (a.kind === "c")), [results]);

  useEffect(() => {
    sfx.meteor(top);
    const t = setTimeout(() => setPhase("reveal"), 2900);
    return () => clearTimeout(t);
  }, [top]);

  const cur = revealOrder[i];
  useEffect(() => {
    if (phase !== "reveal" || !cur) return;
    sfx.reveal(cur.rank);
    const ts = Array.from({ length: cur.rank }, (_, k) => setTimeout(() => sfx.star(k), 900 + k * 180));
    return () => ts.forEach(clearTimeout);
  }, [phase, i, cur]);

  useEffect(() => { if (phase === "summary") sfx.summary(); }, [phase]);

  const advance = () => {
    if (phase === "meteor") { setPhase("reveal"); return; }
    if (phase === "reveal") {
      if (i < revealOrder.length - 1) setI(i + 1);
      else if (multi) setPhase("summary");
      else onClose();
    }
  };
  const skip = (e) => { e.stopPropagation(); if (multi && phase !== "summary") setPhase("summary"); else onClose(); };

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (phase === "summary") onClose(); else advance(); } };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  });

  const tot = results.reduce((a, r) => ({ g: a.g + r.reward.glitter, d: a.d + r.reward.dust }), { g: 0, d: 0 });

  return (
    <Portal><div className="wfx" onClick={phase === "summary" ? undefined : advance}>
      {phase !== "summary" && <button className="skip" onClick={skip}>Bỏ qua ›</button>}

      {phase === "meteor" && <MeteorCanvas rank={top} multi={multi} />}

      {phase === "reveal" && cur && <Reveal key={i} r={cur} />}

      {phase === "summary" && (
        <div className="sum">
          <div className="cards">
            {summaryOrder.map((r, k) => {
              const el = r.kind === "c" ? ELEM[r.x.el] : null;
              return (
                <div key={k} className={`scard r${r.rank} ${r.kind}`} style={{ animationDelay: `${k * 0.08}s` }} title={r.x.vi}>
                  <img src={artOf({ ...r.x, kind: r.kind })} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = iconOf({ ...r.x, kind: r.kind }); e.currentTarget.style.objectFit = "contain"; }} alt="" />
                  <div className="sh" />
                  {r.isNew && <span className="nw">MỚI</span>}
                  {el && <span className="eb" style={{ background: el.c }}>{el.vi}</span>}
                  <div className="info2">{r.x.vi}<div className="s">{"★".repeat(r.rank)}</div></div>
                </div>
              );
            })}
          </div>
          <div className="tot">
            {tot.g > 0 && <span><Ico id="glit" /> +{tot.g} Tinh Huy</span>}
            {tot.d > 0 && <span><Ico id="dust" /> +{tot.d} Tinh Trần</span>}
          </div>
          <div className="btnrow"><button className="gbtn x" onClick={onClose}><span className="c" />Đóng</button></div>
        </div>
      )}
      {phase === "reveal" && <div className="tapnote">Chạm để tiếp tục · {i + 1}/{revealOrder.length}</div>}
    </div></Portal>
  );
}

function Reveal({ r }) {
  const it = { ...r.x, kind: r.kind };
  const el = r.kind === "c" ? ELEM[it.el] : null;
  const color = el ? el.c : RC[r.rank];
  const [err, setErr] = useState(false);
  const count = r.count;
  return (
    <div className={`rv r${r.rank}`} style={{ "--rc": color }}>
      <div className="rays" />
      <div className="ink" />
      {r.flags?.radiance && <div className="radiance">✦ ÁNH SÁNG BẮT GIỮ ✦</div>}
      {r.kind === "c" ? (
        <img className="splash" src={err ? iconOf(it) : artOf(it)} onError={() => setErr(true)} alt="" />
      ) : (
        <>
          <img className="weapon" src={err ? iconOf(it) : artOf(it)} onError={() => setErr(true)} alt="" />
          <div className="shine" />
        </>
      )}
      <div className="nameblk">
        {el ? <span className="ebadge" style={{ background: el.c }}>◆ Hệ {el.vi}</span> : <span className="ebadge" style={{ background: "#e8e1d0" }}>⚔ {WTYPE_VI[it.wt]}</span>}
        <h2>{it.vi}</h2>
        <div className="sub">{it.en}</div>
        <div className="rstars">{Array.from({ length: r.rank }, (_, k) => <span key={k} style={{ animationDelay: `${0.9 + k * 0.18}s` }}>★</span>)}</div>
        <div className="gets">
          {r.isNew && <span className="new">MỚI</span>}
          {!r.isNew && r.kind === "c" && <span>Cung Mệnh {constLabel("c", count)}</span>}
          {r.kind === "w" && <span>Tinh Luyện {constLabel("w", count)}</span>}
          {r.reward.glitter > 0 && <span>✦ +{r.reward.glitter} Tinh Huy</span>}
          {r.reward.dust > 0 && <span>✧ +{r.reward.dust} Tinh Trần</span>}
          {r.flags?.path && <span>Định Quỹ Đạo hoàn tất</span>}
        </div>
      </div>
    </div>
  );
}
