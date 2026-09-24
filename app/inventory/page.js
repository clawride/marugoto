"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import Portal from "@/components/Portal";
import { Ico } from "@/components/Icons";
import { ELEM } from "@/lib/data";
import { CHARS, WEAPONS, WTYPE_VI, itemOf, iconOf } from "@/lib/genshin";
import { constLabel } from "@/lib/gacha";
import { sfx } from "@/lib/sfx";

// Giá bán: vũ khí 3★ → 1 Tương Ngộ · vũ khí 4★ → 1 Vương Vấn · nhân vật 4★ → 5 Tương Ngộ
//          nhân vật 5★ → 50 Vương Vấn · vũ khí 5★ → 50 Vương Vấn
function sellValue(it) {
  if (it.kind === "w" && it.rank === 3) return { f: "a", n: 1 };
  if (it.kind === "w" && it.rank === 4) return { f: "i", n: 1 };
  if (it.kind === "c" && it.rank === 4) return { f: "a", n: 5 };
  if (it.rank === 5) return { f: "i", n: 50 };
  return null;
}
const FATE = { i: "Mối Duyên Vương Vấn", a: "Mối Duyên Tương Ngộ" };
const fateIco = (f) => <Ico id={f === "i" ? "fateI" : "fateA"} />;

export default function InventoryPage() {
  const { S, update, toast } = useGame();
  const [tab, setTab] = useState("c");
  const [sel, setSel] = useState(null);
  const [bulk, setBulk] = useState(null);
  const owned = useMemo(() => (S ? Object.entries(S.inv).filter(([, n]) => n > 0).map(([k, n]) => ({ it: itemOf(k), n })).filter((x) => x.it) : []), [S]);
  if (!S) return null;
  const list = owned.filter((x) => x.it.kind === tab).sort((a, b) => b.it.rank - a.it.rank || b.n - a.n);
  const nC = owned.filter((x) => x.it.kind === "c").length, nW = owned.length - nC;

  const sell = (key, qty) => {
    const it = itemOf(key), v = sellValue(it);
    if (!v) return;
    const have = S.inv[key] || 0;
    const q = Math.max(0, Math.min(qty, have));
    if (!q) return;
    update((s) => {
      s.inv[key] = (s.inv[key] || 0) - q;
      if (s.inv[key] <= 0) delete s.inv[key];
      s.fates[v.f] = (s.fates[v.f] || 0) + v.n * q;
      s.sold = (s.sold || 0) + q;
    });
    sfx.primo();
    toast(`Đã bán ${q} × ${it.vi} → +${v.n * q} ${FATE[v.f]}`);
  };

  // Bán nhanh: gom theo nhóm, keep = số bản giữ lại mỗi món
  const bulkPlan = (filter, keep) => {
    const rows = owned.filter((x) => filter(x.it) && sellValue(x.it)).map((x) => ({ ...x, q: Math.max(0, x.n - keep) })).filter((x) => x.q > 0);
    const gain = { i: 0, a: 0 };
    rows.forEach((x) => { const v = sellValue(x.it); gain[v.f] += v.n * x.q; });
    return { rows, gain, count: rows.reduce((a, x) => a + x.q, 0) };
  };
  const BULK = [
    { key: "w3", label: "Vũ khí 3★ (bán hết)", plan: () => bulkPlan((it) => it.kind === "w" && it.rank === 3, 0) },
    { key: "w4d", label: "Vũ khí 4★ trùng (giữ 1)", plan: () => bulkPlan((it) => it.kind === "w" && it.rank === 4, 1) },
    { key: "c4d", label: "Nhân vật 4★ vượt C6 (giữ 7)", plan: () => bulkPlan((it) => it.kind === "c" && it.rank === 4, 7) },
  ];
  const doBulk = (p) => {
    update((s) => {
      p.rows.forEach((x) => { s.inv[x.it.key] -= x.q; if (s.inv[x.it.key] <= 0) delete s.inv[x.it.key]; });
      s.fates.i = (s.fates.i || 0) + p.gain.i; s.fates.a = (s.fates.a || 0) + p.gain.a;
      s.sold = (s.sold || 0) + p.count;
    });
    sfx.primo(); setBulk(null);
    toast(`Đã bán ${p.count} vật phẩm`);
  };

  return (
    <>
      <Link href="/wish" className="back">‹ Về Cầu Nguyện</Link>
      <div className="pagehead" style={{ marginTop: 10 }}><h1>Túi Đồ</h1><p>Nhân vật {nC}/{CHARS.length} · Vũ khí {nW}/{WEAPONS.length}</p><div className="orn"><span /></div></div>

      <div className="panel sellinfo">
        <b>🪙 Bán vật phẩm đổi Mối Duyên</b>
        <div className="prices">
          <span>Vũ khí 3★ → 1 {fateIco("a")}</span>
          <span>Vũ khí 4★ → 1 {fateIco("i")}</span>
          <span>Nhân vật 4★ → 5 {fateIco("a")}</span>
          <span>Nhân vật 5★ → 50 {fateIco("i")}</span>
          <span>Vũ khí 5★ → 50 {fateIco("i")}</span>
        </div>
        <div className="bulk">
          <span>Bán nhanh:</span>
          {BULK.map((b) => { const p = b.plan(); return <button key={b.key} className="chip dk" disabled={!p.count} onClick={() => { setBulk({ ...p, label: b.label }); sfx.open(); }}>{b.label}{p.count ? ` · ${p.count}` : ""}</button>; })}
        </div>
        <small>Bấm vào một vật phẩm để bán lẻ. Bán nhân vật sẽ giảm cung mệnh; bán hết thì nhân vật rời túi đồ.</small>
      </div>

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
            const v = sellValue(it);
            return (
              <button key={it.key} className={`item r${it.rank} sellable`} style={{ animationDelay: `${Math.min(k, 30) * 0.02}s` }} title={v ? `Bán ${it.vi}` : it.vi} onClick={() => { setSel(it.key); sfx.click(); }}>
                <div className="art"><img src={iconOf(it)} alt="" loading="lazy" style={it.kind === "w" ? { objectFit: "contain" } : undefined} /></div>
                <div className="st">{"★".repeat(it.rank)}</div>
                <span className="ct">{constLabel(it.kind, n)}{n > 1 ? ` · ×${n}` : ""}</span>
                {el && <span className="eb" style={{ background: el.c }}>{el.vi}</span>}
                <div className="nm">{it.vi}</div>
                <div className="jn">{v ? <>{v.n} {fateIco(v.f)}</> : "Không bán được"}</div>
              </button>
            );
          })}
        </div>
      )}
      {sel && <SellDialog itemKey={sel} have={S.inv[sel] || 0} onSell={(q) => { sell(sel, q); setSel(null); }} onClose={() => setSel(null)} />}
      {bulk && (
        <Portal>
          <div className="modal" onClick={(e) => e.target === e.currentTarget && setBulk(null)}>
            <div className="parch dialog">
              <h2>Bán nhanh</h2>
              <div className="jp">{bulk.label}</div>
              <hr />
              <p>Bán <b>{bulk.count}</b> vật phẩm ({bulk.rows.length} loại), nhận:</p>
              <p className="gainline">{bulk.gain.i > 0 && <span>+{bulk.gain.i} {fateIco("i")}</span>}{bulk.gain.a > 0 && <span>+{bulk.gain.a} {fateIco("a")}</span>}</p>
              <div className="btnrow">
                <button className="gbtn x dark" onClick={() => setBulk(null)}><span className="c" />Hủy</button>
                <button className="gbtn" onClick={() => doBulk(bulk)}><span className="c" />Bán</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

function SellDialog({ itemKey, have, onSell, onClose }) {
  const it = itemOf(itemKey), v = sellValue(it);
  const [q, setQ] = useState(1);
  const qty = Math.max(1, Math.min(q, have));
  const isChar = it.kind === "c";
  return (
    <Portal>
      <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="parch dialog">
          <div className={`sellart r${it.rank}`}><img src={iconOf(it)} alt="" style={it.kind === "w" ? { objectFit: "contain" } : undefined} /></div>
          <h2>{it.vi}</h2>
          <div className="jp">{"★".repeat(it.rank)} · {isChar ? "Nhân vật" : WTYPE_VI[it.wt]} · đang có {have} bản ({constLabel(it.kind, have)})</div>
          <hr />
          {!v ? (
            <p>Vật phẩm này không bán được.</p>
          ) : (
            <>
              <p>Mỗi bản bán được <b>{v.n}</b> {fateIco(v.f)} {FATE[v.f]}</p>
              <div className="qty">
                <button className="chip" onClick={() => setQ(qty - 1)} disabled={qty <= 1}>−</button>
                <input type="range" min={1} max={have} value={qty} onChange={(e) => setQ(+e.target.value)} disabled={have <= 1} />
                <button className="chip" onClick={() => setQ(qty + 1)} disabled={qty >= have}>+</button>
              </div>
              <div className="qn">×{qty}</div>
              <p className="gainline"><span>+{v.n * qty} {fateIco(v.f)}</span></p>
              {isChar && <p className="warnline">{qty >= have ? `Bán hết: ${it.vi} sẽ rời túi đồ.` : `Sau khi bán: còn ${have - qty} bản (${constLabel("c", have - qty)}).`}</p>}
            </>
          )}
          <div className="btnrow">
            <button className="gbtn x dark" onClick={onClose}><span className="c" />{v ? "Hủy" : "Đóng"}</button>
            {v && <button className="gbtn" onClick={() => onSell(qty)}><span className="c" />Bán</button>}
          </div>
        </div>
      </div>
    </Portal>
  );
}
