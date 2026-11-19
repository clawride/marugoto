"use client";
// 🧪 Đấu thẻ Shikihime (thử nghiệm) — luật kiểu thẻ bài 3×3 (lib/shikiCards.js)
// • Mỗi tài khoản rút khởi đầu 1 lần 5 thẻ (thẻ hạng cao hiếm hơn) → Hộp bài (S.shiki.box, đồng bộ theo tài khoản)
// • Đấu lần lượt với nhân vật Genshin (bộ 5 thẻ cố định, càng về sau càng mạnh); thắng → chọn lấy 1 thẻ của đối thủ
// • Chỉ dùng được thẻ có trong Hộp bài để đấu
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { elemIcon, charIcon } from "@/lib/genshin";
import { CLASSES, RANKS, RANK_VI } from "@/lib/shikihime";
import { buildDeck, power, makeBoard, place, score, aiMove, sideVal, showNum, drawCards, RANK_ODDS, OPPONENTS, oppDeck, rankIdx } from "@/lib/shikiCards";
import { sfx } from "@/lib/sfx";
import "./cards.css";

const RULES = [
  ["open", "Lật bài", "Thấy bài trên tay đối thủ"],
  ["same", "Bằng nhau", "Đặt thẻ có ≥2 cạnh BẰNG cạnh thẻ kề → lật các thẻ đối thủ đó"],
  ["plus", "Cộng", "≥2 cặp cạnh kề có TỔNG bằng nhau → lật các thẻ đối thủ đó"],
  ["combo", "Liên hoàn", "Thẻ vừa bị lật bởi Bằng nhau/Cộng tiếp tục lật thẻ bên cạnh"],
  ["elemental", "Nguyên tố", "Ô có biểu tượng nguyên tố: thẻ cùng hệ +1 mỗi cạnh, khác hệ −1"],
];
const LS = "shiki_tt_rules";

export default function CardGamePage() {
  const { S, update, toast } = useGame();
  const [cfg, setCfg] = useState(null);
  useEffect(() => { fetch("/api/shiki").then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then(setCfg); }, []);
  const deck = useMemo(() => buildDeck(cfg), [cfg]);
  const byId = useMemo(() => Object.fromEntries(deck.map((c) => [c.id, c])), [deck]);
  const [tab, setTab] = useState("duel");
  const [rules, setRules] = useState({ open: true, same: false, plus: false, combo: false, elemental: false });
  const [game, setGame] = useState(null);
  const [reward, setReward] = useState(null); // { op, cards }
  const [reveal, setReveal] = useState(null); // thẻ vừa rút
  useEffect(() => { try { const r = JSON.parse(localStorage.getItem(LS) || "null"); if (r) setRules(r); } catch {} }, []);
  if (!S) return null;
  const K = S.shiki || {};
  const box = K.box || {};
  const owned = deck.filter((c) => box[c.id] > 0).sort((a, b) => rankIdx(b.rank) - rankIdx(a.rank) || power(b) - power(a));
  const myDeck = (K.deck || []).filter((id) => box[id] > 0).slice(0, 5);
  const beat = K.beat || {};
  const rec = K.rec || { w: 0, l: 0, d: 0 };
  const setDeck = (ids) => update((s) => { s.shiki = s.shiki || {}; s.shiki.deck = ids; });

  // ——— rút khởi đầu ———
  const starter = () => {
    const got = drawCards(deck, 5);
    update((s) => { s.shiki = s.shiki || {}; s.shiki.box = {}; for (const c of got) s.shiki.box[c.id] = (s.shiki.box[c.id] || 0) + 1; s.shiki.starter = got.map((c) => c.id); s.shiki.deck = got.map((c) => c.id); s.shiki.rec = { w: 0, l: 0, d: 0 }; s.shiki.beat = {}; });
    sfx.open(); setReveal(got);
  };
  if (reveal) return (
    <div className="tt">
      <div className="pagehead"><h1>🎴 Bộ bài khởi đầu</h1><p>Các thẻ này đã vào Hộp bài của bạn.</p></div>
      <div className="ttreveal">{reveal.map((c, i) => <div key={c.id} className="ttrv" style={{ animationDelay: `${i * 0.35}s` }}><Card c={c} owner="me" named /></div>)}</div>
      <div className="btnrow"><button className="gbtn tri" onClick={() => setReveal(null)}><span className="c" />Bắt đầu đấu bài</button></div>
    </div>
  );
  if (!K.starter) return (
    <div className="tt">
      <Link href="/thu-nghiem" className="back">‹ Khu Thử Nghiệm</Link>
      <div className="pagehead"><h1>🎴 Đấu thẻ Shikihime</h1><p>Mỗi tài khoản được rút <b>1 lần</b> 5 thẻ khởi đầu (5 thẻ khác nhau). Thẻ càng tốt càng hiếm. Sau đó đấu với các nhân vật Genshin — thắng thì được chọn lấy 1 thẻ của họ.</p></div>
      <OddsTable deck={deck} />
      {!S.profile && <p className="hint" style={{ textAlign: "center" }}>💡 Đăng nhập để Hộp bài được lưu theo tài khoản (dùng được trên mọi máy).</p>}
      <div className="btnrow"><button className="gbtn tri" disabled={!cfg} onClick={starter}><span className="c" />🎴 Rút 5 thẻ khởi đầu</button></div>
    </div>
  );

  // ——— nhận thưởng sau khi thắng ———
  if (reward) return (
    <div className="tt">
      <div className="pagehead"><h1>🏆 Thắng {reward.op.char.vi}!</h1><p>Chọn 1 thẻ của {reward.op.char.vi} để bỏ vào Hộp bài.</p></div>
      <div className="ttreveal">{reward.cards.map((c) => (
        <div key={c.id} className="ttrv"><Card c={c} owner="foe" named onClick={() => {
          update((s) => { s.shiki.box = s.shiki.box || {}; s.shiki.box[c.id] = (s.shiki.box[c.id] || 0) + 1; });
          toast(`Đã nhận thẻ ${c.name} (hạng ${c.rank}) vào Hộp bài`); sfx.win?.(); setReward(null);
        }} /><small>{box[c.id] ? `Đang có ${box[c.id]} lá` : "Thẻ mới!"}</small></div>
      ))}</div>
    </div>
  );

  if (game) return <Match key={game.id} g={game} onExit={() => setGame(null)} onEnd={(res) => {
    update((s) => { const k = s.shiki; k.rec = k.rec || { w: 0, l: 0, d: 0 }; k.rec[res]++; if (res === "w") { k.beat = k.beat || {}; k.beat[game.op.i] = (k.beat[game.op.i] || 0) + 1; } });
  }} onReward={() => { setReward({ op: game.op, cards: game.foe }); setGame(null); }} />;

  const start = (op) => {
    try { localStorage.setItem(LS, JSON.stringify(rules)); } catch {}
    sfx.open();
    setGame({ id: Date.now(), op, me: myDeck.map((id) => byId[id]), foe: oppDeck(op, deck), rules, first: Math.random() < 0.5 ? "me" : "foe" });
  };
  const unlocked = (op) => op.i === 0 || (beat[op.i - 1] || 0) > 0;
  return (
    <div className="tt">
      <Link href="/thu-nghiem" className="back">‹ Khu Thử Nghiệm</Link>
      <div className="pagehead"><h1>🎴 Đấu thẻ Shikihime</h1><p>Đặt thẻ lên bàn 3×3: cạnh của bạn lớn hơn cạnh kề của thẻ đối thủ thì lật thẻ đó. Đầy bàn, ai giữ nhiều thẻ hơn thắng.</p></div>
      <div className="ttrec">Hộp bài: <b>{owned.length}</b>/{deck.length} loại · {rec.w} thắng · {rec.d} hòa · {rec.l} thua</div>
      <div className="chips" style={{ justifyContent: "center" }}>{[["duel", "⚔️ Đấu bài"], ["box", "🗃️ Hộp bài"], ["odds", "🎲 Hạng thẻ"]].map(([k, l]) => <button key={k} className={`chip dk ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === "odds" && <OddsTable deck={deck} />}

      {tab === "box" && <div className="ttpool">{owned.map((c) => <div key={c.id} className="ttboxc"><Card c={c} owner="me" named />{box[c.id] > 1 && <span className="ttcount">×{box[c.id]}</span>}</div>)}</div>}

      {tab === "duel" && (
        <>
          <h2 className="a22th"><span>1 · Bộ 5 thẻ của bạn</span> <small>{myDeck.length}/5 · bấm thẻ trong Hộp bài để thêm/bớt</small></h2>
          <div className="ttpool">
            {owned.map((c) => {
              const i = myDeck.indexOf(c.id);
              return <Card key={c.id} c={c} owner={i >= 0 ? "me" : null} badge={i >= 0 ? i + 1 : null} named onClick={() => { setDeck(i >= 0 ? myDeck.filter((x) => x !== c.id) : myDeck.length < 5 ? [...myDeck, c.id] : myDeck); sfx.click(); }} />;
            })}
          </div>
          {owned.length < 5 && <p className="hint">Hộp bài cần ít nhất 5 thẻ.</p>}
          <h2 className="a22th"><span>2 · Luật chơi</span> <small>bật / tắt</small></h2>
          <div className="ttrules">{RULES.map(([k, n, d]) => <label key={k} className={`panel ttrule ${rules[k] ? "on" : ""}`}><input type="checkbox" checked={rules[k]} onChange={(e) => setRules((r) => ({ ...r, [k]: e.target.checked }))} /><b>{n}</b><small>{d}</small></label>)}</div>
          <h2 className="a22th"><span>3 · Chọn đối thủ</span> <small>thắng người trước để mở người sau</small></h2>
          <div className="ttops">
            {OPPONENTS.map((op) => {
              const open = unlocked(op), od = oppDeck(op, deck);
              return (
                <div key={op.i} className={`panel ttop ${open ? "" : "locked"}`}>
                  <img className="ttav" src={charIcon(op.char)} alt={op.char.vi} />
                  <div className="ttopi">
                    <b>{op.char.vi}</b> <small>Thẻ hạng {op.band[0]}–{op.band[1]} · máy {({ easy: "dễ", normal: "vừa", hard: "khó" })[op.ai]}{beat[op.i] ? ` · đã thắng ${beat[op.i]} lần` : ""}</small>
                    <div className="ttminis">{od.map((c) => <span key={c.id} className={`ttrk r-${c.rank}`} title={`${c.name} · hạng ${c.rank}`}>{c.rank}</span>)}</div>
                  </div>
                  <button className="gbtn tri" disabled={!open || myDeck.length < 5} onClick={() => start(op)}><span className="c" />{open ? "Đấu" : "🔒"}</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function OddsTable({ deck }) {
  return (
    <div className="panel ttodds">
      <h3>8 hạng thẻ & tỉ lệ rút</h3>
      <div className="ttoddrow">{[...RANKS].reverse().map((r) => <div key={r} className="ttodd"><span className={`ttrk big r-${r}`}>{r}</span><b>{RANK_VI[r]}</b><small>{RANK_ODDS[r]}% · {deck.filter((c) => c.rank === r).length} thẻ</small></div>)}</div>
      <p className="hint">Hạng được xếp theo tổng 4 cạnh của thẻ (quản trị có thể gán tay). Rút một lá: chọn hạng theo tỉ lệ trên rồi chọn ngẫu nhiên một thẻ trong hạng đó.</p>
    </div>
  );
}

// Một lá thẻ: ảnh trọn nhân vật, 4 số to giữa 4 cạnh, nguyên tố, class, hạng
export function Card({ c, owner, onClick, back, sel, badge, el, flip, small, named }) {
  if (back) return <div className={`ttcard back ${small ? "sm" : ""}`}><span>式</span></div>;
  const v = (k) => (el !== undefined ? sideVal({ card: c }, el, k) : c.n[k]);
  const d = (k) => (el ? v(k) - c.n[k] : 0);
  return (
    <button type="button" className={`ttcard ${owner || ""} ${sel ? "sel" : ""} ${flip ? `flip f${flip}` : ""} ${small ? "sm" : ""}`} onClick={onClick} style={{ "--ec": ELEM[c.el]?.c }} title={`${c.name} · ${c.ro} · hạng ${c.rank}`}>
      {/* vùng nhân vật của ảnh thẻ (27%–82% bề ngang ảnh gốc, đủ chiều cao) — hiện trọn, không cắt */}
      <div className="ttart" role="img" aria-label={c.ro} style={{ backgroundImage: `url(${c.img})` }} />
      {[["t", "nt"], ["r", "nr"], ["b", "nb"], ["l", "nl"]].map(([k, cls]) => <b key={k} className={`ttn ${cls} ${d(k) > 0 ? "up" : d(k) < 0 ? "down" : ""}`}>{showNum(v(k))}</b>)}
      <img className="ttel" src={elemIcon(c.el)} alt="" />
      <span className={`ttrk corner r-${c.rank}`}>{c.rank}</span>
      {badge && <span className="ttbadge">{badge}</span>}
      {named && <span className="ttname jpt">{c.name}</span>}
    </button>
  );
}

function Match({ g, onExit, onEnd, onReward }) {
  const [board, setBoard] = useState(() => makeBoard(g.rules));
  const [hands, setHands] = useState({ me: g.me, foe: g.foe });
  const [turn, setTurn] = useState(g.first);
  const [sel, setSel] = useState(null);
  const [flipFx, setFlipFx] = useState({});
  const [msg, setMsg] = useState(g.first === "me" ? "Bạn đi trước." : `${g.op.char.vi} đi trước.`);
  const [lastPlaced, setLastPlaced] = useState(null);
  const full = board.cells.every(Boolean);
  const sc = score(board.cells, hands);
  const result = full ? (sc.me > sc.foe ? "w" : sc.me < sc.foe ? "l" : "d") : null;
  useEffect(() => { if (result) { onEnd(result); if (result === "w") sfx.win?.(); } }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const doPlace = (i, card, who) => {
    const r = place(board, i, card, who, g.rules);
    const fx = {}; for (const f of r.flips) fx[f.i] = f.by;
    setBoard({ ...board, cells: r.cells }); setFlipFx(fx); setLastPlaced(i);
    setHands((h) => ({ ...h, [who]: h[who].filter((c) => c !== card) }));
    const special = [...new Set(r.flips.map((f) => f.by).filter((b) => b !== "basic"))];
    const by = { same: "Bằng nhau!", plus: "Cộng!", combo: "Liên hoàn!" };
    setMsg(`${who === "me" ? "Bạn" : g.op.char.vi} đặt ${card.name}${r.flips.length ? ` — lật ${r.flips.length} thẻ` : ""}${special.length ? ` · ${special.map((b) => by[b]).join(" ")}` : ""}`);
    if (r.flips.length) sfx.click();
    setTurn(who === "me" ? "foe" : "me");
  };
  const clickCell = (i) => { if (turn !== "me" || board.cells[i] || sel == null || result) return; doPlace(i, hands.me[sel], "me"); setSel(null); };
  useEffect(() => {
    if (turn !== "foe" || result) return;
    const t = setTimeout(() => { const m = aiMove(board, hands, g.rules, g.op.ai); if (m) doPlace(m.i, m.card, "foe"); }, 900);
    return () => clearTimeout(t);
  }, [turn, result]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tt">
      <button className="back" onClick={onExit}>‹ Bỏ trận</button>
      <div className="ttvs"><img src={charIcon(g.op.char)} alt="" /><div><b>{g.op.char.vi}</b><small>“{g.op.line}”</small></div></div>
      <div className="ttscore"><span className="me">🟦 Bạn <b>{sc.me}</b></span><span className="ttmsg">{result ? "" : turn === "me" ? (sel != null ? "Chọn ô trống để đặt thẻ" : "Chọn một thẻ trên tay") : `${g.op.char.vi} đang nghĩ…`}</span><span className="foe"><b>{sc.foe}</b> {g.op.char.vi} 🟥</span></div>
      <div className="tttable">
        <div className="tthand foe">{hands.foe.map((c, k) => (g.rules.open ? <Card key={k} c={c} owner="foe" small /> : <Card key={k} back small />))}</div>
        <div className="ttboard">
          {board.cells.map((cell, i) => (
            <div key={i} className={`ttcell ${!cell && turn === "me" && sel != null ? "can" : ""}`} onClick={() => clickCell(i)}>
              {board.els[i] && <img className={`ttcellel ${cell ? "dim" : ""}`} src={elemIcon(board.els[i])} alt={ELEM[board.els[i]]?.vi} />}
              {cell && <Card key={`${i}-${cell.owner}`} c={cell.card} owner={cell.owner} el={board.els[i]} flip={flipFx[i] ? "x" : null} />}
              {lastPlaced === i && <span className="ttlast" />}
            </div>
          ))}
        </div>
        <div className="tthand me">{hands.me.map((c, k) => <Card key={k} c={c} owner="me" sel={sel === k} onClick={() => { if (turn === "me" && !result) { setSel(sel === k ? null : k); sfx.click(); } }} small />)}</div>
      </div>
      <p className="ttlog">{msg}</p>
      {result && (
        <div className="panel result">
          <h2>{result === "w" ? "🏆 Bạn thắng!" : result === "l" ? "💀 Bạn thua…" : "🤝 Hòa!"}</h2>
          <div className="score">{sc.me}<small> : {sc.foe}</small></div>
          <div className="btnrow">
            {result === "w" ? <button className="gbtn tri" onClick={onReward}><span className="c" />🎁 Chọn 1 thẻ của {g.op.char.vi}</button> : <button className="gbtn" onClick={onExit}><span className="c" />Về danh sách đối thủ</button>}
          </div>
        </div>
      )}
    </div>
  );
}
