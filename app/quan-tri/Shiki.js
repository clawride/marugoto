"use client";
// Quản trị · Khu thử nghiệm: thiết lập chỉ số thẻ Shikihime (HP MP STR INT DEF AGI, class, nguyên tố) và chỉ số vũ khí trong túi đồ.
// Lưu vào site_settings["shiki"] qua /api/admin (setShiki). Ô để trống = dùng chỉ số mặc định.
import { useEffect, useMemo, useState } from "react";
import { SHIKI_CARDS, STATS, STAT_VI, CLASSES, ELEMENTS, RANKS, defaultStats, WEAPON_STATS, defaultWeapon, weaponClass } from "@/lib/shikihime";
import { buildDeck } from "@/lib/shikiCards";
import { WEAPONS, WTYPE_VI, weaponIcon } from "@/lib/genshin";
import { ELEM } from "@/lib/data";

const toNum = (v) => (v === "" || v == null ? undefined : Math.round(Number(v)));

export default function Shiki({ call, say }) {
  const [cfg, setCfg] = useState(null);
  const [view, setView] = useState("cards");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { call("getShiki").then((d) => setCfg(d.shiki)).catch((e) => say(e.message)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setCard = (id, k, v) => setCfg((c) => ({ ...c, cards: { ...c.cards, [id]: { ...(c.cards[id] || {}), [k]: v } } }));
  const setWeap = (id, k, v) => setCfg((c) => ({ ...c, weapons: { ...c.weapons, [id]: { ...(c.weapons[id] || {}), [k]: v } } }));
  const weapons = useMemo(() => WEAPONS.filter((w) => !q || `${w.vi} ${w.en}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.rank - a.rank || a.wt - b.wt), [q]);
  const autoRank = useMemo(() => Object.fromEntries(buildDeck({ cards: Object.fromEntries(Object.entries(cfg?.cards || {}).map(([id, x]) => [id, { ...x, rank: undefined }])) }).map((c) => [c.id, c.rank])), [cfg]);
  if (!cfg) return <p className="hint">Đang tải…</p>;

  const save = async () => {
    setBusy(true);
    // gửi số nguyên; ô trống → bỏ (dùng mặc định)
    const clean = (o, keys) => Object.fromEntries(Object.entries(o).map(([id, x]) => [id, Object.fromEntries(Object.entries(x).filter(([k, v]) => !keys.includes(k) || toNum(v) !== undefined).map(([k, v]) => [k, keys.includes(k) ? toNum(v) : v]))]));
    try { const d = await call("setShiki", { shiki: { cards: clean(cfg.cards, STATS), weapons: clean(cfg.weapons, WEAPON_STATS) } }); setCfg(d.shiki); say("Đã lưu chỉ số"); }
    catch (e) { say(e.message); } finally { setBusy(false); }
  };
  const resetCard = (id) => setCfg((c) => { const x = { ...c.cards }; delete x[id]; return { ...c, cards: x }; });
  const resetWeap = (id) => setCfg((c) => { const x = { ...c.weapons }; delete x[id]; return { ...c, weapons: x }; });

  return (
    <div className="panel admbox">
      <h3>🧪 Khu thử nghiệm · Đấu thẻ Shikihime</h3>
      <p className="hint">Thiết lập chỉ số cho bộ thẻ Shikihime và vũ khí trong túi đồ. Ô để trống dùng chỉ số mặc định (hiện mờ). Bấm “Lưu” để áp dụng. Game đấu thẻ quy chỉ số thẻ ra 4 cạnh (trên = STR/INT, phải = AGI, dưới = DEF, trái = HP). Bảng vũ khí hiện chưa dùng trong game nào.</p>
      <div className="admtabs">
        <button className={view === "cards" ? "on" : ""} onClick={() => setView("cards")}>🎴 Thẻ nhân vật ({SHIKI_CARDS.length})</button>
        <button className={view === "weapons" ? "on" : ""} onClick={() => setView("weapons")}>⚔️ Vũ khí ({WEAPONS.length})</button>
        <button className="on" disabled={busy} onClick={save} style={{ marginLeft: "auto" }}>{busy ? "Đang lưu…" : "💾 Lưu"}</button>
      </div>

      {view === "cards" && (
        <div className="admscroll">
          <table className="admtbl shikitbl">
            <thead><tr><th>Thẻ</th><th>Hạng</th><th>Class</th><th>Nguyên tố</th>{STATS.map((s) => <th key={s}>{STAT_VI[s]}</th>)}<th /></tr></thead>
            <tbody>
              {SHIKI_CARDS.map((c) => {
                const o = cfg.cards[c.id] || {}, d = defaultStats(c);
                return (
                  <tr key={c.id}>
                    <td className="shikiname"><img src={c.img} alt="" loading="lazy" referrerPolicy="no-referrer" /><div><b className="jpt">{c.name}</b><small>{c.ro} · {c.he} · bậc {c.tier}</small></div></td>
                    <td><select value={o.rank || ""} onChange={(e) => setCard(c.id, "rank", e.target.value || undefined)}><option value="">Tự động ({autoRank[c.id]})</option>{RANKS.map((r) => <option key={r} value={r}>{r}</option>)}</select></td>
                    <td><select value={o.cls || c.cls} onChange={(e) => setCard(c.id, "cls", e.target.value)}>{Object.entries(CLASSES).map(([k, x]) => <option key={k} value={k}>{x.ico} {x.vi}</option>)}</select></td>
                    <td><select value={o.el || c.el} onChange={(e) => setCard(c.id, "el", e.target.value)}>{ELEMENTS.map((el) => <option key={el} value={el}>{ELEM[el]?.vi || el}</option>)}</select></td>
                    {STATS.map((s) => <td key={s}><input type="number" min="0" className="shikinum" value={o[s] ?? ""} placeholder={d[s]} onChange={(e) => setCard(c.id, s, e.target.value)} /></td>)}
                    <td><button className="chip dk" title="Về mặc định" onClick={() => resetCard(c.id)}>↺</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === "weapons" && (
        <>
          <input className="nameinp" placeholder="Tìm vũ khí…" value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: "8px 0" }} />
          <div className="admscroll">
            <table className="admtbl shikitbl">
              <thead><tr><th>Vũ khí</th><th>Loại → class</th>{WEAPON_STATS.map((s) => <th key={s}>{STAT_VI[s]}</th>)}<th /></tr></thead>
              <tbody>
                {weapons.map((w) => {
                  const o = cfg.weapons[w.id] || {}, d = defaultWeapon(w);
                  return (
                    <tr key={w.id}>
                      <td className="shikiname"><img src={weaponIcon(w)} alt="" loading="lazy" /><div><b>{w.vi}</b><small>{"★".repeat(w.rank)}</small></div></td>
                      <td><small>{WTYPE_VI[w.wt]} → {CLASSES[weaponClass(w)].vi}</small></td>
                      {WEAPON_STATS.map((s) => <td key={s}><input type="number" min="0" className="shikinum" value={o[s] ?? ""} placeholder={d[s]} onChange={(e) => setWeap(w.id, s, e.target.value)} /></td>)}
                      <td><button className="chip dk" title="Về mặc định" onClick={() => resetWeap(w.id)}>↺</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
