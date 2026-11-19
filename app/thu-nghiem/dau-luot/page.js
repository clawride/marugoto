"use client";
// 🧪 Đấu lượt 3×3 (thử nghiệm): chọn thẻ Shikihime + vũ khí trong túi đồ, đấu với một thẻ đối thủ trên bàn cờ 3×3.
// Mỗi lượt: Di chuyển 1 ô · Tấn công · Kỹ năng (tốn MP) · Phòng thủ. Ai AGI cao đi trước.
// Chỉ số thẻ / vũ khí: mặc định trong lib/shikihime.js, quản trị viên chỉnh ở /quan-tri (tab Thử nghiệm) → /api/shiki.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { elemIcon, weaponIcon, WTYPE_VI } from "@/lib/genshin";
import { allCards, allWeapons, CLASSES, STATS, STAT_VI, BEATS } from "@/lib/shikihime";
import { sfx } from "@/lib/sfx";
import "./battle.css";

const N = 3;
const SKILL_MP = 30;
const dist = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
const rnd = (a, b) => a + Math.random() * (b - a);
const isHealer = (u) => u.card.he === "Hồi phục";

function makeUnit(card, weapon, pos, side) {
  const w = weapon?.stats || {};
  const s = Object.fromEntries(STATS.map((k) => [k, card.stats[k] + (w[k] || 0)]));
  return { side, card, weapon, pos, max: { hp: s.hp, mp: s.mp }, hp: s.hp, mp: s.mp, str: s.str, int: s.int, def: s.def, agi: s.agi, atk: w.atk || 0, guard: false };
}
function canHit(a, b) {
  const C = CLASSES[a.card.cls], d = dist(a.pos, b.pos);
  if (d > C.range) return false;
  if (C.line && a.pos.r !== b.pos.r && a.pos.c !== b.pos.c) return false; // thương: chỉ đâm theo hàng/cột
  return true;
}
function damage(a, b, mult = 1) {
  const magic = CLASSES[a.card.cls].magic;
  let dmg = magic ? (a.int + a.atk) * 1.1 - b.def * 0.3 : (a.str + a.atk) - b.def * 0.6;
  dmg = Math.max(5, dmg) * mult * rnd(0.9, 1.1);
  const el = BEATS[a.card.el]?.includes(b.card.el);
  if (el) dmg *= 1.25;
  const crit = Math.random() < Math.min(0.35, a.agi / 400);
  if (crit) dmg *= 1.5;
  if (b.guard) dmg *= 0.5;
  return { dmg: Math.round(dmg), crit, el };
}

export default function DuelPage() {
  const { S } = useGame();
  const [cfg, setCfg] = useState(null);
  useEffect(() => { fetch("/api/shiki").then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then(setCfg); }, []);
  const cards = useMemo(() => allCards(cfg), [cfg]);
  const weapons = useMemo(() => allWeapons(cfg), [cfg]);
  const [me, setMe] = useState(null), [wp, setWp] = useState(null), [foe, setFoe] = useState(null);
  const [battle, setBattle] = useState(null);
  if (!S) return null;
  const owned = weapons.filter((w) => (S.inv?.[`w:${w.id}`] || 0) > 0);
  if (battle) return <Battle key={battle.id} init={battle} onExit={() => setBattle(null)} />;
  const myCard = cards.find((c) => c.id === me), foeCard = cards.find((c) => c.id === foe);
  const usable = myCard ? owned.filter((w) => w.cls === myCard.cls).sort((a, b) => b.rank - a.rank) : [];
  const start = () => {
    const f = foeCard || cards[Math.floor(Math.random() * cards.length)];
    sfx.open();
    setBattle({ id: Date.now(), me: myCard, weapon: usable.find((w) => w.id === wp) || null, foe: f });
  };
  return (
    <div className="duel">
      <Link href="/thu-nghiem" className="back">‹ Khu Thử Nghiệm</Link>
      <div className="pagehead"><h1>⚔️ Đấu lượt 3×3</h1><p>Chọn thẻ của bạn, vũ khí cùng loại trong túi đồ và đối thủ. Bản đồ thử nghiệm 3×3.</p></div>
      <h2 className="a22th"><span>1 · Thẻ của bạn</span> <small>{myCard ? myCard.ro : "chọn một thẻ"}</small></h2>
      <CardGrid cards={cards} pick={me} onPick={(id) => { setMe(id); setWp(null); }} />
      {myCard && (
        <>
          <h2 className="a22th"><span>2 · Vũ khí</span> <small>loại dùng được: {CLASSES[myCard.cls].vi} · lấy từ túi đồ</small></h2>
          <div className="dwlist">
            <button className={`dw ${!wp ? "on" : ""}`} onClick={() => setWp(null)}>✋ Không vũ khí</button>
            {usable.map((w) => <button key={w.id} className={`dw ${wp === w.id ? "on" : ""}`} onClick={() => setWp(w.id)}><img src={weaponIcon(w)} alt="" /> {w.vi} <small>{"★".repeat(w.rank)} · ATK {w.stats.atk}</small></button>)}
            {!usable.length && <p className="hint">Túi đồ chưa có vũ khí loại {CLASSES[myCard.cls].vi} ({WTYPE_VI.filter((_, i) => ["kiem", "kiem", "thuong", "cung", "phep"][i] === myCard.cls).join(", ")}). Cầu nguyện để nhận thêm vũ khí.</p>}
          </div>
          <h2 className="a22th"><span>3 · Đối thủ</span> <small>{foeCard ? foeCard.ro : "ngẫu nhiên nếu không chọn"}</small></h2>
          <CardGrid cards={cards.filter((c) => c.id !== me)} pick={foe} onPick={setFoe} small />
          <div className="btnrow" style={{ margin: "18px 0" }}><button className="gbtn tri" onClick={start}><span className="c" />Vào trận</button></div>
        </>
      )}
    </div>
  );
}

function CardGrid({ cards, pick, onPick, small }) {
  const [cls, setCls] = useState("");
  const list = cards.filter((c) => !cls || c.cls === cls);
  return (
    <>
      <div className="chips">{[["", "Tất cả"], ...Object.entries(CLASSES).map(([k, x]) => [k, `${x.ico} ${x.vi}`])].map(([k, l]) => <button key={k} className={`chip dk ${cls === k ? "on" : ""}`} onClick={() => setCls(k)}>{l}</button>)}</div>
      <div className={`dcards ${small ? "sm" : ""}`}>
        {list.map((c) => (
          <button key={c.id} className={`panel dcard ${pick === c.id ? "on" : ""}`} style={{ "--ec": ELEM[c.el]?.c }} onClick={() => { onPick(c.id); sfx.click(); }}>
            <img src={c.img} alt={c.ro} loading="lazy" referrerPolicy="no-referrer" />
            <b className="jpt">{c.name}</b>
            <small><img className="del" src={elemIcon(c.el)} alt="" /> {CLASSES[c.cls].ico} {CLASSES[c.cls].vi} · bậc {c.tier}</small>
            {!small && <small className="dst">{STATS.map((s) => `${STAT_VI[s]} ${c.stats[s]}`).join(" · ")}</small>}
          </button>
        ))}
      </div>
    </>
  );
}

function Battle({ init, onExit }) {
  const [P, setP] = useState(() => makeUnit(init.me, init.weapon, { r: 1, c: 0 }, "me"));
  const [E, setE] = useState(() => makeUnit(init.foe, null, { r: 1, c: 2 }, "foe"));
  const [turn, setTurn] = useState(() => (init.me.stats.agi >= init.foe.stats.agi ? "me" : "foe"));
  const [mode, setMode] = useState(null); // "move" khi đang chọn ô di chuyển
  const [log, setLog] = useState([`Trận đấu bắt đầu! ${init.me.stats.agi >= init.foe.stats.agi ? "Bạn" : "Đối thủ"} đi trước (AGI cao hơn).`]);
  const [fx, setFx] = useState(null);
  const [round, setRound] = useState(1);
  const over = P.hp <= 0 ? "lose" : E.hp <= 0 ? "win" : null;
  const add = (m) => setLog((l) => [m, ...l].slice(0, 40));
  const boom = (side, txt) => { setFx({ side, txt, id: Math.random() }); };
  const ref = useRef({ P, E }); ref.current = { P, E };

  // hành động chung: a đánh/di chuyển trên b → trả về [a mới, b mới]
  function act(kind, a, b, cell) {
    a = { ...a, guard: false }; b = { ...b };
    const who = a.side === "me" ? "Bạn" : a.card.ro;
    if (kind === "move") { a.pos = cell; add(`${who} di chuyển tới ô (${cell.r + 1},${cell.c + 1}).`); sfx.click(); }
    else if (kind === "guard") { a.guard = true; a.mp = Math.min(a.max.mp, a.mp + 10); add(`${who} phòng thủ (giảm nửa sát thương lượt tới, +10 MP).`); }
    else if (kind === "heal") { const h = Math.round(a.max.hp * 0.3); a.hp = Math.min(a.max.hp, a.hp + h); a.mp -= SKILL_MP; add(`${who} dùng kỹ năng hồi phục: +${h} HP.`); boom(a.side, `+${h}`); }
    else {
      const skill = kind === "skill";
      if (skill) a.mp -= SKILL_MP;
      const r = damage(a, b, skill ? 1.6 : 1);
      b.hp = Math.max(0, b.hp - r.dmg);
      add(`${who} ${skill ? "tung kỹ năng" : "tấn công"}: −${r.dmg} HP${r.crit ? " (chí mạng!)" : ""}${r.el ? " (khắc hệ +25%)" : ""}${b.guard ? " · bị chặn một nửa" : ""}.`);
      boom(b.side, `−${r.dmg}`); sfx.click();
      b.guard = false;
    }
    if (a.side === "me") { a.mp = Math.min(a.max.mp, a.mp + 5); } else { a.mp = Math.min(a.max.mp, a.mp + 5); }
    return [a, b];
  }
  const endTurn = (next) => { setMode(null); setTurn(next); if (next === "me") setRound((r) => r + 1); };

  const myAct = (kind, cell) => {
    if (turn !== "me" || over) return;
    const [a, b] = act(kind, P, E, cell);
    setP(a); setE(b); endTurn("foe");
  };

  // AI đối thủ
  useEffect(() => {
    if (turn !== "foe" || over) return;
    const t = setTimeout(() => {
      const { P: p, E: e } = ref.current;
      let kind, cell;
      if (isHealer(e) && e.hp < e.max.hp * 0.35 && e.mp >= SKILL_MP) kind = "heal";
      else if (canHit(e, p)) kind = e.mp >= SKILL_MP && Math.random() < 0.4 ? "skill" : "attack";
      else {
        const opts = neighbors(e.pos).filter((x) => !(x.r === p.pos.r && x.c === p.pos.c));
        opts.sort((x, y) => dist(x, p.pos) - dist(y, p.pos));
        cell = opts[0]; kind = cell ? "move" : "guard";
      }
      const [a, b] = act(kind, e, p, cell);
      setE(a); setP(b); endTurn("me");
    }, 900);
    return () => clearTimeout(t);
  }, [turn, over]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (over === "win") sfx.win?.(); }, [over]);

  const moves = mode === "move" ? neighbors(P.pos).filter((x) => !(x.r === E.pos.r && x.c === E.pos.c)) : [];
  const inRange = canHit(P, E);
  const unitAt = (r, c) => (P.pos.r === r && P.pos.c === c ? P : E.pos.r === r && E.pos.c === c ? E : null);
  return (
    <div className="duel">
      <button className="back" onClick={onExit}>‹ Chọn lại</button>
      <div className="dhead"><Bar u={P} label="Bạn" /><div className="dround">Lượt {round}<small>{over ? "" : turn === "me" ? "Đến lượt bạn" : "Đối thủ đang đi…"}</small></div><Bar u={E} label="Đối thủ" right /></div>
      <div className="board" role="grid" aria-label="Bàn cờ 3×3">
        {Array.from({ length: N * N }, (_, i) => {
          const r = Math.floor(i / N), c = i % N, u = unitAt(r, c), mv = moves.some((x) => x.r === r && x.c === c);
          return (
            <button key={i} role="gridcell" className={`cell ${mv ? "mv" : ""} ${u ? u.side : ""} ${u && u === E && inRange && turn === "me" ? "hit" : ""}`} disabled={!mv} onClick={() => mv && myAct("move", { r, c })}>
              {u && <div className="token" style={{ "--ec": ELEM[u.card.el]?.c }}><img src={u.card.img} alt={u.card.ro} referrerPolicy="no-referrer" /><span>{CLASSES[u.card.cls].ico}</span></div>}
              {u && fx && fx.side === u.side && <em key={fx.id} className="dmg">{fx.txt}</em>}
            </button>
          );
        })}
      </div>
      {over ? (
        <div className="panel result"><h2>{over === "win" ? "🏆 Chiến thắng!" : "💀 Thất bại…"}</h2><div className="btnrow"><button className="gbtn" onClick={onExit}><span className="c" />Chọn trận khác</button></div></div>
      ) : (
        <div className="dacts">
          <button className="gbtn" disabled={turn !== "me"} onClick={() => setMode(mode === "move" ? null : "move")}><span className="c" />{mode === "move" ? "Hủy di chuyển" : "🦶 Di chuyển"}</button>
          <button className="gbtn" disabled={turn !== "me" || !inRange} onClick={() => myAct("attack")}><span className="c" />⚔️ Tấn công</button>
          {isHealer(P)
            ? <button className="gbtn" disabled={turn !== "me" || P.mp < SKILL_MP} onClick={() => myAct("heal")}><span className="c" />💚 Hồi phục ({SKILL_MP} MP)</button>
            : <button className="gbtn" disabled={turn !== "me" || !inRange || P.mp < SKILL_MP} onClick={() => myAct("skill")}><span className="c" />✨ Kỹ năng ({SKILL_MP} MP)</button>}
          <button className="gbtn x dark" disabled={turn !== "me"} onClick={() => myAct("guard")}><span className="c" />🛡️ Phòng thủ</button>
        </div>
      )}
      <p className="hint">Tầm đánh: {CLASSES[P.card.cls].vi} {CLASSES[P.card.cls].range} ô{CLASSES[P.card.cls].line ? " (theo hàng/cột)" : ""} · {inRange ? "đối thủ đang trong tầm" : "đối thủ ngoài tầm — hãy di chuyển"}</p>
      <div className="panel dlog">{log.map((m, i) => <p key={i}>{m}</p>)}</div>
    </div>
  );
}

const neighbors = (p) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => ({ r: p.r + dr, c: p.c + dc })).filter((x) => x.r >= 0 && x.r < N && x.c >= 0 && x.c < N);

function Bar({ u, label, right }) {
  return (
    <div className={`dbar ${right ? "r" : ""}`}>
      <div className="dname"><img src={elemIcon(u.card.el)} alt="" /> <b className="jpt">{u.card.name}</b> <small>{label} · {CLASSES[u.card.cls].vi}{u.weapon ? ` · ${u.weapon.vi}` : ""}</small></div>
      <div className="hpb"><i style={{ width: `${(100 * u.hp) / u.max.hp}%` }} /><span>HP {u.hp}/{u.max.hp}</span></div>
      <div className="mpb"><i style={{ width: `${(100 * u.mp) / u.max.mp}%` }} /><span>MP {u.mp}/{u.max.mp}</span></div>
      <small className="dst">STR {u.str} · INT {u.int} · DEF {u.def} · AGI {u.agi}{u.atk ? ` · ATK +${u.atk}` : ""}{u.guard ? " · 🛡️" : ""}</small>
    </div>
  );
}
