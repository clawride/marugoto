"use client";
import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { CHARS, WEAPONS, WTYPE_VI, itemOf, iconOf } from "@/lib/genshin";
import { constLabel } from "@/lib/gacha";

export default function InventoryPage() {
  const { S } = useGame();
  const [tab, setTab] = useState("c");
  if (!S) return null;
  const owned = Object.entries(S.inv).map(([k, n]) => ({ it: itemOf(k), n })).filter((x) => x.it);
  const list = owned.filter((x) => x.it.kind === tab).sort((a, b) => b.it.rank - a.it.rank || b.n - a.n);
  const nC = owned.filter((x) => x.it.kind === "c").length, nW = owned.length - nC;
  return (
    <>
      <Link href="/wish" className="back">‹ Về Cầu Nguyện</Link>
      <div className="pagehead" style={{ marginTop: 10 }}><h1>Túi Đồ</h1><p>Nhân vật {nC}/{CHARS.length} · Vũ khí {nW}/{WEAPONS.length}</p><div className="orn"><span /></div></div>
      <div className="chips" style={{ marginBottom: 16 }}>
        <button className={`chip dk ${tab === "c" ? "on" : ""}`} onClick={() => setTab("c")}>Nhân vật ({nC})</button>
        <button className={`chip dk ${tab === "w" ? "on" : ""}`} onClick={() => setTab("w")}>Vũ khí ({nW})</button>
      </div>
      {list.length === 0 ? (
        <div className="panel" style={{ padding: 18, color: "#c9cbd6", textAlign: "center" }}>Chưa có gì — hãy <Link href="/wish" style={{ color: "var(--gold2)" }}>cầu nguyện</Link> để sưu tầm!</div>
      ) : (
        <div className="invgrid">
          {list.map(({ it, n }, k) => {
            const el = it.kind === "c" ? ELEM[it.el] : null;
            return (
              <div key={it.key} className={`item r${it.rank}`} style={{ animationDelay: `${Math.min(k, 30) * 0.02}s` }} title={it.vi}>
                <div className="art"><img src={iconOf(it)} alt="" loading="lazy" style={it.kind === "w" ? { objectFit: "contain" } : undefined} /></div>
                <div className="st">{"★".repeat(it.rank)}</div>
                <span className="ct">{constLabel(it.kind, n)}</span>
                {el && <span className="eb" style={{ background: el.c }}>{el.vi}</span>}
                <div className="nm">{it.vi}</div>
                <div className="jn">{it.kind === "c" ? "Nhân vật" : WTYPE_VI[it.wt]}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
