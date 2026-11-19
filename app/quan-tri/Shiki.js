"use client";
// Quản trị · Khu thử nghiệm: thiết lập chỉ số thẻ Shikihime (HP MP STR INT DEF AGI, class, nguyên tố) và chỉ số vũ khí trong túi đồ.
// Lưu vào site_settings["shiki"] qua /api/admin (setShiki). Ô để trống = dùng chỉ số mặc định.
import { useEffect, useMemo, useState } from "react";
import { SHIKI_CARDS, STATS, STAT_VI, CLASSES, ELEMENTS, RANKS, defaultStats, WEAPON_STATS, defaultWeapon, weaponClass } from "@/lib/shikihime";
import { buildDeck, OPPONENTS, oppDeck } from "@/lib/shikiCards";
import { LEVELS, autoLevel } from "@/lib/shikiDuel";
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
    try { const d = await call("setShiki", { shiki: { cards: clean(cfg.cards, STATS), weapons: clean(cfg.weapons, WEAPON_STATS), stages: cfg.stages || {} } }); setCfg(d.shiki); say("Đã lưu chỉ số"); }
    catch (e) { say(e.message); } finally { setBusy(false); }
  };
  const setStage = (i, patch) => setCfg((c) => {
    const st = { ...(c.stages || {}) }, x = { ...(st[i] || {}), ...patch };
    Object.keys(x).forEach((k) => x[k] === undefined && delete x[k]);
    if (Object.keys(x).length) st[i] = x; else delete st[i];
    return { ...c, stages: st };
  });
  const resetCard = (id) => setCfg((c) => { const x = { ...c.cards }; delete x[id]; return { ...c, cards: x }; });
  const resetWeap = (id) => setCfg((c) => { const x = { ...c.weapons }; delete x[id]; return { ...c, weapons: x }; });

  return (
    <div className="panel admbox">
      <h3>🧪 Khu thử nghiệm · Đấu thẻ Shikihime</h3>
      <p className="hint">Thiết lập chỉ số cho bộ thẻ Shikihime và vũ khí trong túi đồ. Ô để trống dùng chỉ số mặc định (hiện mờ). Bấm “Lưu” để áp dụng. Game đấu thẻ quy chỉ số thẻ ra 4 cạnh (trên = STR/INT, phải = AGI, dưới = DEF, trái = HP). Bảng vũ khí hiện chưa dùng trong game nào.</p>
      <div className="admtabs">
        <button className={view === "cards" ? "on" : ""} onClick={() => setView("cards")}>🎴 Thẻ nhân vật ({SHIKI_CARDS.length})</button>
        <button className={view === "weapons" ? "on" : ""} onClick={() => setView("weapons")}>⚔️ Vũ khí ({WEAPONS.length})</button>
        <button className={view === "stages" ? "on" : ""} onClick={() => setView("stages")}>🗺️ Ải & bài của boss</button>
        <button className={view === "draws" ? "on" : ""} onClick={() => setView("draws")}>🎟️ Lượt rút thẻ</button>
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

      {view === "stages" && <Stages cfg={cfg} setStage={setStage} />}
      {view === "draws" && <Draws call={call} say={say} />}

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

// Ải & bài của boss: độ khó từng ải (chế độ "Tăng dần" của người chơi dùng mức này) và 5 lá boss sẽ ra
function Stages({ cfg, setStage }) {
  const deck = useMemo(() => buildDeck(cfg), [cfg]);
  const options = useMemo(() => [...deck].sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank) || a.ro.localeCompare(b.ro)), [deck]);
  return (
    <div className="admscroll">
      <p className="hint">Độ khó: bỏ trống = tự tăng dần (4 ải Dễ, 4 Thường, 4 Khó, 3 Địa ngục). Bài của boss: chọn đủ 5 lá khác nhau rồi bấm “💾 Lưu”; chọn thiếu thì boss dùng bộ mặc định. Trận đang đấu dở không bị ảnh hưởng.</p>
      <table className="admtbl shikitbl">
        <thead><tr><th>Ải</th><th>Độ khó</th><th>5 lá của boss</th><th /></tr></thead>
        <tbody>
          {OPPONENTS.map((op) => {
            const st = cfg.stages?.[op.i] || {}, auto = oppDeck(op, deck);
            const ids = st.deck || st.draft || [];
            const pick = (k, id) => { const next = [0, 1, 2, 3, 4].map((j) => (j === k ? id : ids[j] || "")); const full = next.every(Boolean) && new Set(next).size === 5; setStage(op.i, full ? { deck: next, draft: undefined } : { deck: undefined, draft: next }); };
            return (
              <tr key={op.i}>
                <td><b>{op.i + 1}. {op.char.vi}</b><br /><small>Hạng thẻ mặc định {op.band[0]}–{op.band[1]}</small></td>
                <td><select value={st.level || ""} onChange={(e) => setStage(op.i, { level: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Tự động ({LEVELS[autoLevel(op.i)][0]})</option>
                  {Object.entries(LEVELS).map(([k, [vi]]) => <option key={k} value={k}>{vi}</option>)}
                </select></td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {[0, 1, 2, 3, 4].map((k) => (
                      <select key={k} value={ids[k] || ""} onChange={(e) => pick(k, e.target.value)} style={{ maxWidth: 150 }}>
                        <option value="">— {auto[k] ? auto[k].rank + " · " + auto[k].name : "mặc định"} —</option>
                        {options.map((c) => <option key={c.id} value={c.id}>{c.rank} · {c.name} ({c.ro})</option>)}
                      </select>
                    ))}
                  </div>
                  <small>{st.deck ? "✔ Bộ bài riêng" : st.draft ? "⚠ Chưa đủ 5 lá khác nhau — đang dùng bộ mặc định" : "Bộ mặc định: " + auto.map((c) => c.rank).join(" ")}</small>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="chip dk" title="Chép bộ mặc định để sửa" onClick={() => setStage(op.i, { deck: auto.map((c) => String(c.id)), draft: undefined })}>📋</button>{" "}
                  <button className="chip dk" title="Về mặc định" onClick={() => setStage(op.i, { deck: undefined, draft: undefined, level: undefined })}>↺</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Lượt rút thẻ: tìm người chơi theo tên đăng nhập (hoặc id) rồi cộng/trừ lượt
function Draws({ call, say }) {
  const [who, setWho] = useState("");
  const [n, setN] = useState(5);
  const [p, setP] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async (action, extra = {}) => {
    setBusy(true);
    try { const d = await call(action, { who, ...extra }); setP(d.player); if (action === "shikiGrant") say(`Đã cập nhật: còn ${d.player.draws} lượt rút`); }
    catch (e) { say(e.message); setP(null); } finally { setBusy(false); }
  };
  return (
    <div style={{ display: "grid", gap: 10, maxWidth: 520, marginTop: 8 }}>
      <p className="hint">Mỗi lượt rút cho người chơi 1 lá ngẫu nhiên theo tỉ lệ hạng. Người chơi thấy nút “🎴 Rút 1 thẻ” ở trang Đấu thẻ.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input className="nameinp" placeholder="Tên đăng nhập hoặc id" value={who} onChange={(e) => setWho(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go("shikiPlayer")} />
        <button className="chip dk" disabled={busy || !who.trim()} onClick={() => go("shikiPlayer")}>🔍 Xem</button>
      </div>
      {p && (
        <div className="panel" style={{ padding: 12 }}>
          <b>{p.name || p.id}</b> <small>({p.id})</small>
          <p style={{ margin: "6px 0" }}>🎟️ Lượt rút hiện có: <b>{p.draws}</b> · Hộp bài: {p.kinds} loại · {p.starter ? "đã rút bộ khởi đầu" : "chưa rút bộ khởi đầu"} · {p.rec?.w || 0} thắng / {p.rec?.l || 0} thua</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="number" className="shikinum" value={n} onChange={(e) => setN(e.target.value)} style={{ width: 80 }} />
            <button className="chip dk on" disabled={busy || !Number(n)} onClick={() => go("shikiGrant", { n: Number(n) })}>➕ Cộng {n} lượt</button>
            <button className="chip dk" disabled={busy || !Number(n)} onClick={() => go("shikiGrant", { n: -Math.abs(Number(n)) })}>➖ Trừ {Math.abs(Number(n))} lượt</button>
          </div>
        </div>
      )}
    </div>
  );
}
