"use client";
// 🧪 Đấu thẻ Shikihime (thử nghiệm): bàn 3×3, mỗi bên 5 thẻ, so cạnh để lật thẻ đối thủ — luật trong lib/shikiCards.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { elemIcon } from "@/lib/genshin";
import { CLASSES } from "@/lib/shikihime";
import { buildDeck, power, makeBoard, place, score, aiMove, sideVal, showNum, SIDES } from "@/lib/shikiCards";
import { sfx } from "@/lib/sfx";
import "./cards.css";

const RULES = [
  ["open", "Lật bài", "Thấy bài trên tay đối thủ"],
  ["same", "Bằng nhau", "Đặt thẻ có ≥2 cạnh BẰNG cạnh thẻ kề → lật các thẻ đối thủ đó"],
  ["plus", "Cộng", "≥2 cặp cạnh kề có TỔNG bằng nhau → lật các thẻ đối thủ đó"],
  ["combo", "Liên hoàn", "Thẻ vừa bị lật bởi Bằng nhau/Cộng tiếp tục lật thẻ bên cạnh"],
  ["elemental", "Nguyên tố", "Ô có biểu tượng nguyên tố: thẻ cùng hệ +1 mỗi cạnh, khác hệ −1"],
];
const LEVELS = [["easy", "Dễ"], ["normal", "Vừa"], ["hard", "Khó"]];
const LS = "shiki_tt";

export default function CardGamePage() {
  const { S } = useGame();
  const [cfg, setCfg] = useState(null);
  useEffect(() => { fetch("/api/shiki").then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then(setCfg); }, []);
  const deck = useMemo(() => buildDeck(cfg), [cfg]);
  const [pick, setPick] = useState([]);
  const [rules, setRules] = useState({ open: true, same: false, plus: false, combo: false, elemental: false });
  const [level, setLevel] = useState("normal");
  const [game, setGame] = useState(null);
  const [rec, setRec] = useState({ w: 0, l: 0, d: 0 });
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(LS) || "null"); if (s) { if (s.rules) setRules(s.rules); if (s.level) setLevel(s.level); if (s.pick) setPick(s.pick); if (s.rec) setRec(s.rec); } } catch {} }, []);
  const save = (patch) => { try { const s = JSON.parse(localStorage.getItem(LS) || "{}"); localStorage.setItem(LS, JSON.stringify({ ...s, ...patch })); } catch {} };
  if (!S) return null;

  const hand = pick.map((id) => deck.find((c) => c.id === id)).filter(Boolean);
  const toggle = (id) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 5 ? p : [...p, id]));
  const start = () => {
    // đối thủ: 5 thẻ khác, tổng sức mạnh gần với tay bài của bạn (± theo độ khó)
    const want = hand.reduce((a, c) => a + power(c), 0) * ({ easy: 0.85, normal: 1, hard: 1.1 }[level]);
    let best = null;
    const pool = deck.filter((c) => !pick.includes(c.id));
    for (let t = 0; t < 300; t++) {
      const h = pool.slice().sort(() => Math.random() - 0.5).slice(0, 5), d = Math.abs(h.reduce((a, c) => a + power(c), 0) - want);
      if (!best || d < best.d) best = { h, d };
    }
    save({ pick, rules, level });
    sfx.open();
    setGame({ id: Date.now(), me: hand, foe: best.h, rules, level, first: Math.random() < 0.5 ? "me" : "foe" });
  };
  const onEnd = (res) => { const r = { ...rec, [res]: rec[res] + 1 }; setRec(r); save({ rec: r }); };

  if (game) return <Match key={game.id} g={game} onExit={() => setGame(null)} onAgain={start} onEnd={onEnd} />;
  return (
    <div className="tt">
      <Link href="/thu-nghiem" className="back">‹ Khu Thử Nghiệm</Link>
      <div className="pagehead"><h1>🎴 Đấu thẻ Shikihime</h1><p>Bàn 3×3, mỗi bên 5 thẻ. Lần lượt đặt thẻ: cạnh của bạn lớn hơn cạnh kề của thẻ đối thủ thì lật thẻ đó về phe bạn. Đầy bàn, ai giữ nhiều thẻ hơn thì thắng.</p></div>
      <div className="ttrec">Thành tích: <b>{rec.w}</b> thắng · <b>{rec.d}</b> hòa · <b>{rec.l}</b> thua</div>

      <h2 className="a22th"><span>1 · Luật chơi</span> <small>bật / tắt</small></h2>
      <div className="ttrules">
        {RULES.map(([k, n, d]) => <label key={k} className={`panel ttrule ${rules[k] ? "on" : ""}`}><input type="checkbox" checked={rules[k]} onChange={(e) => setRules((r) => ({ ...r, [k]: e.target.checked }))} /><b>{n}</b><small>{d}</small></label>)}
      </div>
      <div className="chips">Máy: {LEVELS.map(([k, n]) => <button key={k} className={`chip dk ${level === k ? "on" : ""}`} onClick={() => setLevel(k)}>{n}</button>)}</div>

      <h2 className="a22th"><span>2 · Chọn 5 thẻ</span> <small>{hand.length}/5 · tổng sức mạnh {hand.reduce((a, c) => a + power(c), 0)}</small></h2>
      <div className="btnrow" style={{ justifyContent: "flex-start", margin: "0 0 10px" }}>
        <button className="gbtn x dark" onClick={() => setPick(deck.slice().sort(() => Math.random() - 0.5).slice(0, 5).map((c) => c.id))}><span className="c" />🎲 Ngẫu nhiên</button>
        <button className="gbtn tri" disabled={hand.length !== 5} onClick={start}><span className="c" />Vào trận</button>
      </div>
      <div className="ttpool">
        {deck.slice().sort((a, b) => power(b) - power(a)).map((c) => <Card key={c.id} c={c} owner={pick.includes(c.id) ? "me" : null} onClick={() => { toggle(c.id); sfx.click(); }} badge={pick.indexOf(c.id) + 1 || null} named />)}
      </div>
    </div>
  );
}

// Một lá thẻ: ảnh, 4 số ở góc trái trên (trên, trái, phải, dưới), biểu tượng nguyên tố
export function Card({ c, owner, onClick, back, sel, badge, el, flip, small, named }) {
  if (back) return <div className={`ttcard back ${small ? "sm" : ""}`}><span>式</span></div>;
  const v = (k) => (el !== undefined ? sideVal({ card: c }, el, k) : c.n[k]);
  const d = (k) => (el ? v(k) - c.n[k] : 0);
  return (
    <button type="button" className={`ttcard ${owner || ""} ${sel ? "sel" : ""} ${flip ? `flip f${flip}` : ""} ${small ? "sm" : ""}`} onClick={onClick} style={{ "--ec": ELEM[c.el]?.c }} title={`${c.name} · ${c.ro}`}>
      {/* vùng nhân vật của ảnh thẻ (27%–82% bề ngang ảnh gốc, đủ chiều cao) — hiện trọn, không cắt */}
      <div className="ttart" role="img" aria-label={c.ro} style={{ backgroundImage: `url(${c.img})` }} />
      {[["t", "nt"], ["r", "nr"], ["b", "nb"], ["l", "nl"]].map(([k, cls]) => <b key={k} className={`ttn ${cls} ${d(k) > 0 ? "up" : d(k) < 0 ? "down" : ""}`}>{showNum(v(k))}</b>)}
      <img className="ttel" src={elemIcon(c.el)} alt="" />
      <span className="ttcls">{CLASSES[c.cls].ico}</span>
      {badge && <span className="ttbadge">{badge}</span>}
      {named && <span className="ttname jpt">{c.name}</span>}
    </button>
  );
}

function Match({ g, onExit, onAgain, onEnd }) {
  const [board, setBoard] = useState(() => makeBoard(g.rules));
  const [hands, setHands] = useState({ me: g.me, foe: g.foe });
  const [turn, setTurn] = useState(g.first);
  const [sel, setSel] = useState(null);
  const [flipFx, setFlipFx] = useState({}); // ô → kiểu lật (để chạy hiệu ứng)
  const [msg, setMsg] = useState(g.first === "me" ? "Bạn đi trước." : "Máy đi trước.");
  const [lastPlaced, setLastPlaced] = useState(null);
  const full = board.cells.every(Boolean);
  const sc = score(board.cells, hands);
  const result = full ? (sc.me > sc.foe ? "w" : sc.me < sc.foe ? "l" : "d") : null;
  useEffect(() => { if (result) { onEnd(result); if (result === "w") sfx.win?.(); } }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const doPlace = (i, card, who) => {
    const r = place(board, i, card, who, g.rules);
    const fx = {}; for (const f of r.flips) fx[f.i] = f.by;
    setBoard({ ...board, cells: r.cells }); setFlipFx(fx); setLastPlaced(i);
    setHands((h) => ({ ...h, [who]: h[who].filter((c) => c.id !== card.id) }));
    const special = [...new Set(r.flips.map((f) => f.by).filter((b) => b !== "basic"))];
    const by = { same: "Bằng nhau!", plus: "Cộng!", combo: "Liên hoàn!" };
    setMsg(`${who === "me" ? "Bạn" : "Máy"} đặt ${card.ro}${r.flips.length ? ` — lật ${r.flips.length} thẻ` : ""}${special.length ? ` · ${special.map((b) => by[b]).join(" ")}` : ""}`);
    if (r.flips.length) sfx.click();
    setTurn(who === "me" ? "foe" : "me");
  };
  const clickCell = (i) => { if (turn !== "me" || board.cells[i] || !sel || result) return; doPlace(i, hands.me.find((c) => c.id === sel), "me"); setSel(null); };

  // lượt máy
  useEffect(() => {
    if (turn !== "foe" || result) return;
    const t = setTimeout(() => { const m = aiMove(board, hands, g.rules, g.level); if (m) doPlace(m.i, m.card, "foe"); }, 900);
    return () => clearTimeout(t);
  }, [turn, result]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tt">
      <button className="back" onClick={onExit}>‹ Đổi bài</button>
      <div className="ttscore"><span className="me">🟦 Bạn <b>{sc.me}</b></span><span className="ttmsg">{result ? "" : turn === "me" ? (sel ? "Chọn ô trống để đặt thẻ" : "Chọn một thẻ trên tay") : "Máy đang nghĩ…"}</span><span className="foe"><b>{sc.foe}</b> Máy 🟥</span></div>
      <div className="tttable">
        <div className="tthand foe">{hands.foe.map((c) => (g.rules.open ? <Card key={c.id} c={c} owner="foe" small /> : <Card key={c.id} back small />))}</div>
        <div className="ttboard">
          {board.cells.map((cell, i) => (
            <div key={i} className={`ttcell ${!cell && turn === "me" && sel ? "can" : ""}`} onClick={() => clickCell(i)}>
              {board.els[i] && <img className={`ttcellel ${cell ? "dim" : ""}`} src={elemIcon(board.els[i])} alt={ELEM[board.els[i]]?.vi} />}
              {cell && <Card key={`${i}-${cell.owner}`} c={cell.card} owner={cell.owner} el={board.els[i]} flip={flipFx[i] ? (cell.owner === "me" ? "L" : "R") : null} />}
              {lastPlaced === i && <span className="ttlast" />}
            </div>
          ))}
        </div>
        <div className="tthand me">{hands.me.map((c) => <Card key={c.id} c={c} owner="me" sel={sel === c.id} onClick={() => { if (turn === "me" && !result) { setSel(sel === c.id ? null : c.id); sfx.click(); } }} small />)}</div>
      </div>
      <p className="ttlog">{msg}</p>
      {result && (
        <div className="panel result">
          <h2>{result === "w" ? "🏆 Bạn thắng!" : result === "l" ? "💀 Bạn thua…" : "🤝 Hòa!"}</h2>
          <div className="score">{sc.me}<small> : {sc.foe}</small></div>
          <div className="btnrow"><button className="gbtn x dark" onClick={onExit}><span className="c" />Đổi bài</button><button className="gbtn tri" onClick={onAgain}><span className="c" />Chơi lại</button></div>
        </div>
      )}
    </div>
  );
}
