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

// Lượt rút thẻ: liệt kê mọi tài khoản (tìm theo tên / tên đăng nhập / id), cộng hoặc trừ lượt cho từng người hoặc nhiều người đã chọn
function Draws({ call, say }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [n, setN] = useState(5);
  const [picked, setPicked] = useState({});
  const [busy, setBusy] = useState(false);
  const load = async (offset = 0, query = q) => {
    setBusy(true);
    try { const d = await call("shikiPlayers", { q: query, offset }); setRows((r) => (offset ? [...r, ...d.rows] : d.rows)); setCount(d.count); if (!offset) setPicked({}); }
    catch (e) { say(e.message); } finally { setBusy(false); }
  };
  useEffect(() => { load(0, ""); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const grant = async (ids, delta) => {
    if (!ids.length || !delta) return;
    setBusy(true);
    let done = 0;
    try {
      for (const id of ids) {
        const d = await call("shikiGrant", { who: id, n: delta });
        setRows((r) => r.map((x) => (x.id === id ? { ...x, draws: d.player.draws } : x)));
        done++;
      }
      say(`Đã ${delta > 0 ? "cộng" : "trừ"} ${Math.abs(delta)} lượt cho ${done} tài khoản`);
    } catch (e) { say(`${e.message} (đã xong ${done}/${ids.length})`); } finally { setBusy(false); }
  };
  const num = Math.round(Number(n)) || 0;
  const sel = Object.keys(picked).filter((id) => picked[id]);
  const allOn = rows.length > 0 && rows.every((r) => picked[r.id]);
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
      <p className="hint">Mỗi lượt rút cho người chơi 1 lá ngẫu nhiên theo tỉ lệ hạng. Người chơi thấy nút “🎴 Rút 1 thẻ” ở trang Đấu thẻ. Tick nhiều tài khoản để cộng một lần.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input className="nameinp" placeholder="Tìm tên, tên đăng nhập hoặc id…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(0)} style={{ flex: "1 1 220px" }} />
        <button className="chip dk" disabled={busy} onClick={() => load(0)}>🔍 Tìm</button>
        <span style={{ marginLeft: "auto" }}>Số lượt:</span>
        <input type="number" className="shikinum" value={n} onChange={(e) => setN(e.target.value)} style={{ width: 70 }} />
        <button className="chip dk on" disabled={busy || !sel.length || !num} onClick={() => grant(sel, Math.abs(num))}>➕ Cộng cho {sel.length} người đã chọn</button>
      </div>
      <div className="admscroll">
        <table className="admtbl shikitbl">
          <thead><tr>
            <th><input type="checkbox" checked={allOn} onChange={(e) => setPicked(e.target.checked ? Object.fromEntries(rows.map((r) => [r.id, true])) : {})} aria-label="Chọn tất cả" /></th>
            <th>Tài khoản</th><th>ID</th><th>Lượt rút</th><th>Hộp bài</th><th>Cộng / trừ</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><input type="checkbox" checked={!!picked[r.id]} onChange={(e) => setPicked((p) => ({ ...p, [r.id]: e.target.checked }))} aria-label={"Chọn " + (r.name || r.id)} /></td>
                <td><b>{r.name || "—"}</b>{r.username && <><br /><small>@{r.username}</small></>}</td>
                <td><small style={{ fontFamily: "monospace", userSelect: "all" }}>{r.id}</small></td>
                <td><b style={{ color: r.draws ? "#ffd36b" : undefined }}>🎟️ {r.draws}</b></td>
                <td><small>{r.starter ? `${r.kinds} loại` : "chưa chơi"}</small></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="chip dk" disabled={busy || !num} onClick={() => grant([r.id], Math.abs(num))}>➕ {Math.abs(num)}</button>{" "}
                  <button className="chip dk" disabled={busy || !num || !r.draws} onClick={() => grant([r.id], -Math.abs(num))}>➖</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6}><small>{busy ? "Đang tải…" : "Không có tài khoản nào"}</small></td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <small>Đang hiện {rows.length}/{count} tài khoản</small>
        {rows.length < count && <button className="chip dk" disabled={busy} onClick={() => load(rows.length)}>Xem thêm</button>}
      </div>
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
            const st = cfg.stages?.[op.char.id] || {}, auto = oppDeck(op, deck);
            const ids = st.deck || st.draft || [];
            const pick = (k, id) => { const next = [0, 1, 2, 3, 4].map((j) => (j === k ? id : ids[j] || "")); const full = next.every(Boolean) && new Set(next).size === 5; setStage(op.char.id, full ? { deck: next, draft: undefined } : { deck: undefined, draft: next }); };
            return (
              <tr key={op.i}>
                <td><b>{op.i + 1}. {op.char.vi}</b><br /><small>Hạng thẻ mặc định {op.band[0]}–{op.band[1]}</small></td>
                <td><select value={st.level || ""} onChange={(e) => setStage(op.char.id, { level: e.target.value ? Number(e.target.value) : undefined })}>
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
                  <button className="chip dk" title="Chép bộ mặc định để sửa" onClick={() => setStage(op.char.id, { deck: auto.map((c) => String(c.id)), draft: undefined })}>📋</button>{" "}
                  <button className="chip dk" title="Về mặc định" onClick={() => setStage(op.char.id, { deck: undefined, draft: undefined, level: undefined })}>↺</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

