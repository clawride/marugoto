"use client";
// 🧪 Đấu đội hình theo lượt kiểu TS Online (thử nghiệm): mỗi bên 1–5 thẻ Shikihime đứng trên đội hình 3×3, hai đội đứng chéo nhau.
// Mỗi lượt ra lệnh cho cả đội → mọi thẻ hành động theo AGI: lao tới chém/đâm, bắn tên, tung phép, hồi máu — rồi chạy về.
// Hình nhân vật: model chibi tách từ góc ảnh thẻ (public/shiki/<id>-f|b.png). Có sprite sheet thì dùng khung tư thế (SPRITE_SHEETS).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { elemIcon, weaponIcon } from "@/lib/genshin";
import { allCards, allWeapons, CLASSES, STATS, STAT_VI, SPRITE_SHEETS } from "@/lib/shikihime";
import { makeUnit, alive, canStrike, targetsFor, damage, autoFormation, aiOrder, isHealer, SKILL_MP } from "@/lib/shikiBattle";
import { sfx } from "@/lib/sfx";
import "./battle.css";

const MAXN = 5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sprite = (u) => `/shiki/${u.card.id}-${u.side === "me" ? "b" : "f"}.png`;
// Vị trí (% khung sân) của ô (r = hàng 0 trước…2 sau, c = cột 0…2) — đội mình góc dưới phải, địch góc trên trái
function spot(side, r, c) {
  return side === "me" ? { x: 64 + r * 9 + (c - 1) * 10, y: 62 + r * 8 - (c - 1) * 6 } : { x: 36 - r * 9 + (c - 1) * 10, y: 50 - r * 8 - (c - 1) * 6 };
}

export default function DuelPage() {
  const { S } = useGame();
  const [cfg, setCfg] = useState(null);
  useEffect(() => { fetch("/api/shiki").then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then(setCfg); }, []);
  const cards = useMemo(() => allCards(cfg), [cfg]);
  const weapons = useMemo(() => allWeapons(cfg), [cfg]);
  const [team, setTeam] = useState([]); // [{ id, wp }]
  const [n, setN] = useState(3);
  const [battle, setBattle] = useState(null);
  if (!S) return null;
  if (battle) return <Battle key={battle.id} init={battle} onExit={() => setBattle(null)} />;
  const owned = weapons.filter((w) => (S.inv?.[`w:${w.id}`] || 0) > 0);
  const used = (wid) => team.filter((t) => t.wp === wid).length;
  const toggle = (id) => setTeam((t) => (t.some((x) => x.id === id) ? t.filter((x) => x.id !== id) : t.length >= MAXN ? t : [...t, { id, wp: null }]));
  const picked = team.map((t) => ({ ...t, card: cards.find((c) => c.id === t.id) })).filter((t) => t.card);
  const start = () => {
    const pool = cards.filter((c) => !team.some((t) => t.id === c.id)).sort(() => Math.random() - 0.5).slice(0, picked.length || n);
    sfx.open();
    setBattle({ id: Date.now(), me: picked.map((t) => ({ card: t.card, weapon: weapons.find((w) => w.id === t.wp) || null })), foe: pool.map((card) => ({ card, weapon: null })) });
  };
  return (
    <div className="duel">
      <Link href="/thu-nghiem" className="back">‹ Khu Thử Nghiệm</Link>
      <div className="pagehead"><h1>⚔️ Đấu đội hình</h1><p>Chọn 1–5 thẻ cho đội (đối thủ có cùng số thẻ). Kiếm/Thương đứng hàng trước, Cung giữa, Phép sau. Mỗi lượt ra lệnh cho cả đội rồi xem hai bên giao chiến.</p></div>
      <h2 className="a22th"><span>1 · Đội của bạn</span> <small>{picked.length}/{MAXN} thẻ</small></h2>
      <CardGrid cards={cards} picked={team.map((t) => t.id)} onPick={toggle} />
      {picked.length > 0 && (
        <>
          <h2 className="a22th"><span>2 · Vũ khí</span> <small>mỗi thẻ dùng vũ khí cùng loại trong túi đồ</small></h2>
          <div className="dteam">
            {picked.map((t) => {
              const ok = owned.filter((w) => w.cls === t.card.cls && (t.wp === w.id || used(w.id) < (S.inv[`w:${w.id}`] || 0))).sort((a, b) => b.rank - a.rank);
              return (
                <div key={t.id} className="panel dslot">
                  <img src={`/shiki/${t.id}-f.png`} alt="" className="dmini" />
                  <div><b className="jpt">{t.card.name}</b> <small>{CLASSES[t.card.cls].ico} {CLASSES[t.card.cls].vi}</small>
                    <select value={t.wp || ""} onChange={(e) => setTeam((tt) => tt.map((x) => (x.id === t.id ? { ...x, wp: +e.target.value || null } : x)))}>
                      <option value="">✋ Không vũ khí</option>
                      {ok.map((w) => <option key={w.id} value={w.id}>{"★".repeat(w.rank)} {w.vi} · ATK {w.stats.atk}</option>)}
                    </select>
                    {!ok.length && <small className="hint"> Túi đồ chưa có vũ khí loại này.</small>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="btnrow" style={{ margin: "18px 0" }}><button className="gbtn tri" onClick={start}><span className="c" />Vào trận ({picked.length} đấu {picked.length})</button></div>
        </>
      )}
      {!picked.length && <p className="hint">Chưa chọn thẻ nào — hoặc chọn nhanh số thẻ: {[1, 2, 3, 4, 5].map((k) => <button key={k} className={`chip dk ${n === k ? "on" : ""}`} onClick={() => { setN(k); setTeam(cards.slice().sort(() => Math.random() - 0.5).slice(0, k).map((c) => ({ id: c.id, wp: null }))); }}>{k} thẻ ngẫu nhiên</button>)}</p>}
    </div>
  );
}

function CardGrid({ cards, picked, onPick }) {
  const [cls, setCls] = useState("");
  const list = cards.filter((c) => !cls || c.cls === cls);
  return (
    <>
      <div className="chips">{[["", "Tất cả"], ...Object.entries(CLASSES).map(([k, x]) => [k, `${x.ico} ${x.vi}`])].map(([k, l]) => <button key={k} className={`chip dk ${cls === k ? "on" : ""}`} onClick={() => setCls(k)}>{l}</button>)}</div>
      <div className="dcards">
        {list.map((c) => {
          const i = picked.indexOf(c.id);
          return (
            <button key={c.id} className={`panel dcard ${i >= 0 ? "on" : ""}`} style={{ "--ec": ELEM[c.el]?.c }} onClick={() => { onPick(c.id); sfx.click(); }}>
              {i >= 0 && <span className="dnum">{i + 1}</span>}
              <div className="dpic"><img src={c.img} alt="" loading="lazy" referrerPolicy="no-referrer" /><img className="dchibi" src={`/shiki/${c.id}-f.png`} alt={c.ro} /></div>
              <b className="jpt">{c.name}</b>
              <small><img className="del" src={elemIcon(c.el)} alt="" /> {CLASSES[c.cls].ico} {CLASSES[c.cls].vi} · bậc {c.tier}</small>
              <small className="dst">{STATS.map((s) => `${STAT_VI[s]} ${c.stats[s]}`).join(" · ")}</small>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ——— trận đấu ———
function Battle({ init, onExit }) {
  const build = (list, side) => autoFormation(list.map((x) => x.card)).map((p, i) => makeUnit(p.card, list.find((x) => x.card.id === p.card.id)?.weapon, side, p.r, p.c, `${side}${i}`));
  const [units, setUnits] = useState(() => [...build(init.me, "me"), ...build(init.foe, "foe")]);
  const ref = useRef(units); ref.current = units;
  const [orders, setOrders] = useState({}); // uid → { kind, target }
  const [sel, setSel] = useState(null); // uid đang ra lệnh
  const [pending, setPending] = useState(null); // kind chờ chọn mục tiêu
  const [phase, setPhase] = useState("plan"); // plan | fight | win | lose
  const [round, setRound] = useState(1);
  const [fx, setFx] = useState({}); // uid → { pos?, cls?, num?, flash? }
  const [shots, setShots] = useState([]); // đạn/hiệu ứng bay
  const [log, setLog] = useState(["Trận đấu bắt đầu! Ra lệnh cho từng thẻ của bạn rồi bấm “Giao chiến”."]);
  const add = (m) => setLog((l) => [m, ...l].slice(0, 60));
  const me = units.filter((u) => u.side === "me"), foe = units.filter((u) => u.side === "foe");
  const myAlive = alive(me);
  useEffect(() => { if (phase === "plan" && !sel) { const nx = myAlive.find((u) => !orders[u.uid]); if (nx) setSel(nx.uid); } }, [phase, sel, orders]); // eslint-disable-line react-hooks/exhaustive-deps

  const order = (uid, o) => { setOrders((x) => ({ ...x, [uid]: o })); setPending(null); setSel(myAlive.find((u) => u.uid !== uid && !orders[u.uid])?.uid || null); sfx.click(); };
  const cur = units.find((u) => u.uid === sel);
  const clickUnit = (u) => {
    if (phase !== "plan") return;
    if (pending && cur) { if (validT(u)) order(cur.uid, { kind: pending, target: u.uid }); return; }
    if (u.side === "me" && u.hp > 0) setSel(u.uid);
  };
  const allSet = myAlive.every((u) => orders[u.uid]);

  async function fight() {
    setPhase("fight"); setSel(null); setPending(null);
    let U = ref.current.map((u) => ({ ...u, guard: false }));
    const plan = {};
    for (const u of alive(U)) plan[u.uid] = u.side === "me" ? orders[u.uid] || { kind: "guard" } : aiOrder(u, U.filter((x) => x.side === "foe"), U.filter((x) => x.side === "me"));
    // phòng thủ có hiệu lực ngay từ đầu lượt
    U = U.map((u) => (plan[u.uid]?.kind === "guard" ? { ...u, guard: true } : u));
    ref.current = U; setUnits(U);
    const seq = alive(U).sort((a, b) => b.agi - a.agi || (a.side === "me" ? -1 : 1)).map((u) => u.uid);
    for (const uid of seq) {
      U = ref.current;
      const a = U.find((x) => x.uid === uid);
      if (!a || a.hp <= 0) continue;
      const mine = U.filter((x) => x.side === a.side), other = U.filter((x) => x.side !== a.side);
      if (!alive(other).length) break;
      let o = plan[uid];
      const who = `${a.side === "me" ? "🟦" : "🟥"} ${a.card.ro}`;
      if (o.kind === "guard") { add(`${who} phòng thủ.`); patch(uid, { mp: Math.min(a.max.mp, a.mp + 10) }); await sleep(250); continue; }
      if (o.kind === "heal") {
        const t = U.find((x) => x.uid === o.target && x.hp > 0) || alive(mine).sort((x, y) => x.hp / x.max.hp - y.hp / y.max.hp)[0];
        if (a.mp < SKILL_MP.heal || !t) { add(`${who} không đủ MP — chuyển sang phòng thủ.`); continue; }
        await animCast(a, t, "heal");
        const h = Math.round(t.max.hp * 0.3 + a.int * 0.5);
        patch(a.uid, { mp: a.mp - SKILL_MP.heal }); patch(t.uid, { hp: Math.min(t.max.hp, t.hp + h) }); pop(t.uid, `+${h}`, "heal");
        add(`${who} hồi ${h} HP cho ${t.card.ro}.`); await sleep(500); continue;
      }
      if (!canStrike(a, mine)) { add(`${who} đứng sau, chưa tới lượt xông lên — phòng thủ.`); continue; }
      const skill = o.kind === "skill" && a.mp >= SKILL_MP[a.card.cls];
      let targets;
      if (skill && a.card.cls === "cung") targets = alive(other).sort(() => Math.random() - 0.5).slice(0, 3);
      else if (skill && a.card.cls === "phep") targets = alive(other);
      else {
        const ok = targetsFor(a, other);
        targets = [ok.find((t) => t.uid === o.target) || ok.sort((x, y) => x.hp - y.hp)[0]].filter(Boolean);
      }
      if (!targets.length) continue;
      if (skill) patch(a.uid, { mp: a.mp - SKILL_MP[a.card.cls] });
      const mult = skill ? (a.card.cls === "cung" ? 0.75 : a.card.cls === "phep" ? 0.7 : 1.6) : 1;
      await animAttack(a, targets, skill);
      for (const t0 of targets) {
        const t = ref.current.find((x) => x.uid === t0.uid);
        const r = damage(a, t, mult);
        patch(t.uid, { hp: Math.max(0, t.hp - r.dmg), guard: false });
        pop(t.uid, `${r.crit ? "💥" : ""}−${r.dmg}`, r.el ? "el" : "", true);
        add(`${who} ${skill ? "tung kỹ năng" : "tấn công"} ${t.card.ro}: −${r.dmg}${r.crit ? " (chí mạng)" : ""}${r.el ? " (khắc hệ)" : ""}.`);
        if (t.hp - r.dmg <= 0) add(`✖ ${t.card.ro} gục ngã!`);
      }
      patch(a.uid, { mp: Math.min(a.max.mp, ref.current.find((x) => x.uid === a.uid).mp + 5) });
      await sleep(450);
    }
    const U2 = ref.current;
    if (!alive(U2.filter((x) => x.side === "foe")).length) { setPhase("win"); sfx.win?.(); return; }
    if (!alive(U2.filter((x) => x.side === "me")).length) { setPhase("lose"); return; }
    setOrders({}); setRound((r) => r + 1); setPhase("plan");
  }
  function patch(uid, p) { const U = ref.current.map((u) => (u.uid === uid ? { ...u, ...p } : u)); ref.current = U; setUnits(U); }
  function pop(uid, num, kind, hit) { setFx((f) => ({ ...f, [uid]: { ...(f[uid] || {}), num, kind, nid: Math.random(), cls: hit ? "hurt" : f[uid]?.cls } })); if (hit) setTimeout(() => setFx((f) => ({ ...f, [uid]: { ...(f[uid] || {}), cls: "" } })), 450); }
  const setPos = (uid, pos, cls) => setFx((f) => ({ ...f, [uid]: { ...(f[uid] || {}), pos, cls } }));

  // hoạt cảnh: cận chiến lao tới → chém/đâm → chạy về · cung bắn tên · phép bay cầu nguyên tố
  async function animAttack(a, ts, skill) {
    const C = a.card.cls, t = ts[0], tp = spot(t.side, t.r, t.c), ap = spot(a.side, a.r, a.c);
    if (C === "kiem" || C === "thuong") {
      const dir = a.side === "me" ? 1 : -1;
      const near = { x: tp.x + dir * 7, y: tp.y + dir * 6 };
      setPos(a.uid, near, "dash"); sfx.click(); await sleep(330);
      setPos(a.uid, near, C === "kiem" ? (skill ? "slash2" : "slash") : (skill ? "thrust2" : "thrust"));
      setShots((s) => [...s, { id: Math.random(), kind: C === "kiem" ? "arc" : "spark", at: tp, flip: a.side === "foe", big: skill }]);
      await sleep(380);
      setPos(a.uid, null, "back"); await sleep(320); setPos(a.uid, null, "");
    } else {
      setPos(a.uid, null, C === "cung" ? "draw" : "cast"); await sleep(280);
      const id = Math.random();
      for (const x of ts) {
        const xp = spot(x.side, x.r, x.c);
        setShots((s) => [...s, { id: id + x.uid, kind: C === "cung" ? "arrow" : "orb", from: ap, at: xp, el: a.card.el }]);
      }
      sfx.click(); await sleep(420);
      for (const x of ts) setShots((s) => [...s, { id: Math.random(), kind: C === "cung" ? "spark" : "burst", at: spot(x.side, x.r, x.c), el: a.card.el }]);
      setPos(a.uid, null, ""); await sleep(200);
    }
    setTimeout(() => setShots((s) => s.slice(-6)), 900);
  }
  async function animCast(a, t) {
    setPos(a.uid, null, "cast"); await sleep(260);
    setShots((s) => [...s, { id: Math.random(), kind: "heal", at: spot(t.side, t.r, t.c) }]);
    await sleep(380); setPos(a.uid, null, "");
  }

  const over = phase === "win" || phase === "lose";
  const ordersLabel = (o) => !o ? "—" : o.kind === "guard" ? "🛡️ Phòng thủ" : `${o.kind === "attack" ? "⚔️ Đánh" : o.kind === "heal" ? "💚 Hồi máu" : "✨ Kỹ năng"} → ${units.find((u) => u.uid === o.target)?.card.ro || "tự chọn"}`;
  const pickHint = pending === "heal" ? "Chọn đồng đội cần hồi máu" : pending ? "Chọn mục tiêu bên địch (ô sáng đỏ)" : "";
  const validT = (u) => pending && cur && (pending === "heal" ? u.side === "me" && u.hp > 0 : u.side === "foe" && u.hp > 0 && (pending === "skill" && ["cung", "phep"].includes(cur.card.cls) ? true : targetsFor(cur, foe).some((t) => t.uid === u.uid)));
  return (
    <div className="duel">
      <button className="back" onClick={onExit}>‹ Chọn đội khác</button>
      <div className="dround">Lượt {round} <small>{phase === "plan" ? "Ra lệnh cho đội của bạn" : phase === "fight" ? "Đang giao chiến…" : ""}</small></div>
      <div className="arena2">
        <div className="field" />
        {units.map((u) => {
          const p = fx[u.uid]?.pos || spot(u.side, u.r, u.c), f = fx[u.uid] || {};
          return (
            <button key={u.uid} className={`unit ${u.side} ${u.hp <= 0 ? "dead" : ""} ${sel === u.uid ? "sel" : ""} ${validT(u) ? "tgt" : ""} ${f.cls || ""}`} style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: Math.round(p.y * 10), "--ec": ELEM[u.card.el]?.c }} onClick={() => clickUnit(u)} title={u.card.ro}>
              <div className="ubar"><i style={{ width: `${(100 * u.hp) / u.max.hp}%` }} /><em style={{ width: `${(100 * u.mp) / u.max.mp}%` }} /></div>
              <Sprite u={u} act={f.cls} />
              {u.guard && u.hp > 0 && <span className="ushield">🛡️</span>}
              {f.num && <b key={f.nid} className={`unum ${f.kind || ""}`}>{f.num}</b>}
            </button>
          );
        })}
        {shots.map((s) => <Shot key={s.id} s={s} />)}
      </div>
      {over ? (
        <div className="panel result"><h2>{phase === "win" ? "🏆 Chiến thắng!" : "💀 Thất bại…"}</h2><div className="btnrow"><button className="gbtn" onClick={onExit}><span className="c" />Chọn đội khác</button></div></div>
      ) : phase === "plan" && (
        <div className="panel dplan">
          {cur && cur.side === "me" ? (
            <>
              <div className="dcur"><img src={`/shiki/${cur.card.id}-f.png`} alt="" /><div><b className="jpt">{cur.card.name}</b> <small>{CLASSES[cur.card.cls].ico} {CLASSES[cur.card.cls].vi} · hàng {["trước", "giữa", "sau"][cur.r]} · HP {cur.hp}/{cur.max.hp} · MP {cur.mp}/{cur.max.mp}</small>{!canStrike(cur, me) && <small className="hint"> · đứng sau đồng đội cận chiến, chưa đánh được</small>}</div></div>
              <div className="dacts">
                <button className={`gbtn ${pending === "attack" ? "tri" : ""}`} disabled={!canStrike(cur, me)} onClick={() => setPending("attack")}><span className="c" />⚔️ Đánh</button>
                {isHealer(cur)
                  ? <button className={`gbtn ${pending === "heal" ? "tri" : ""}`} disabled={cur.mp < SKILL_MP.heal} onClick={() => setPending("heal")}><span className="c" />💚 Hồi máu ({SKILL_MP.heal} MP)</button>
                  : <button className={`gbtn ${pending === "skill" ? "tri" : ""}`} disabled={!canStrike(cur, me) || cur.mp < SKILL_MP[cur.card.cls]} onClick={() => { if (["cung", "phep"].includes(cur.card.cls) && cur.card.cls === "phep") order(cur.uid, { kind: "skill" }); else setPending("skill"); }}><span className="c" />✨ {({ kiem: "Trảm kích", thuong: "Xuyên thương", cung: "Mưa tên (3 mục tiêu)", phep: "Bão nguyên tố (cả đội địch)" })[cur.card.cls]} ({SKILL_MP[cur.card.cls]} MP)</button>}
                <button className="gbtn x dark" onClick={() => order(cur.uid, { kind: "guard" })}><span className="c" />🛡️ Phòng thủ</button>
              </div>
              {pickHint && <p className="hint">👉 {pickHint}</p>}
            </>
          ) : <p className="hint">Bấm vào một thẻ của bạn để ra lệnh.</p>}
          <div className="dorders">{myAlive.map((u) => <button key={u.uid} className={`chip dk ${sel === u.uid ? "on" : ""}`} onClick={() => { setSel(u.uid); setPending(null); }}>{u.card.ro}: {ordersLabel(orders[u.uid])}</button>)}</div>
          <div className="btnrow"><button className="gbtn tri" disabled={!allSet} onClick={fight}><span className="c" />⚔️ Giao chiến</button><button className="gbtn x dark" onClick={() => { const o = {}; for (const u of myAlive) o[u.uid] = aiOrder(u, me, foe); setOrders(o); }}><span className="c" />🤖 Tự ra lệnh</button></div>
        </div>
      )}
      <div className="panel dlog">{log.map((m, i) => <p key={i}>{m}</p>)}</div>
    </div>
  );
}

// Hình nhân vật: có sprite sheet thì chạy khung tư thế theo động tác, không thì model chibi tĩnh
const ACT = { slash: "slash", slash2: "slash", thrust: "thrust", thrust2: "thrust", cast: "cast", draw: "cast", hurt: "hurt" };
function Sprite({ u, act }) {
  const sh = SPRITE_SHEETS[u.card.id];
  if (!sh) return <img src={sprite(u)} alt={u.card.ro} draggable={false} />;
  const a = sh.anims[ACT[act]] || sh.anims.idle;
  return (
    <div className="sheet" role="img" aria-label={u.card.ro} style={{ aspectRatio: `${sh.w}/${sh.h}`, transform: u.side === "foe" ? "scaleX(-1)" : undefined }}>
      <img key={act || "idle"} src={sh.src} alt="" draggable={false} style={{ width: `${sh.cols * 100}%`, "--y": `${(-100 * a.row) / sh.rows}%`, "--x": `${(-100 * a.frames) / sh.cols}%`, animationTimingFunction: `steps(${a.frames})` }} />
    </div>
  );
}

// hiệu ứng: vệt chém lưỡi liềm, tia lửa đâm, mũi tên, cầu phép, vụ nổ nguyên tố, hồi máu
function Shot({ s }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setGo(true)); return () => cancelAnimationFrame(t); }, []);
  const col = ELEM[s.el]?.c || "#fff";
  if (s.kind === "arrow" || s.kind === "orb") {
    const p = go ? s.at : s.from;
    const ang = Math.atan2((s.at.y - s.from.y) * 0.62, s.at.x - s.from.x) * 180 / Math.PI;
    return <div className={`shot ${s.kind} ${go ? "fly" : ""}`} style={{ left: `${p.x}%`, top: `${p.y - 6}%`, "--ang": `${ang}deg`, "--col": col }} />;
  }
  return (
    <div className={`fxat ${s.kind} ${s.flip ? "flip" : ""} ${s.big ? "big" : ""}`} style={{ left: `${s.at.x}%`, top: `${s.at.y - 7}%`, "--col": col }}>
      {s.kind === "arc" && <svg viewBox="0 0 100 100"><path d="M15 80 Q 30 10 90 20 Q 45 25 25 82 Z" fill="#fff" /></svg>}
      {s.kind === "spark" && <svg viewBox="0 0 100 100">{Array.from({ length: 10 }, (_, i) => <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos(i * 0.63)} y2={50 + 45 * Math.sin(i * 0.63)} stroke="#ffe7a0" strokeWidth="4" />)}</svg>}
      {s.kind === "burst" && <span className="ring" />}
      {s.kind === "heal" && <span className="leaf">✚</span>}
    </div>
  );
}
