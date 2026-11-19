"use client";
// Lượt đấu được tính trên thiết bị. Máy chủ chia bài và xác nhận kết quả cuối ván.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { elemIcon, charIcon } from "@/lib/genshin";
import { RANKS, RANK_VI } from "@/lib/shikihime";
import { buildDeck, power, sideVal, showNum, RANK_ODDS, OPPONENTS, oppDeck, rankIdx } from "@/lib/shikiCards";
import { DUEL_MODE, duelMove, replayDuel, duelResult } from "@/lib/shikiDuel";
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

async function api(profile, action, body = {}) {
  const r = await fetch("/api/shiki/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: profile?.id, token: profile?.token, action, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Lỗi ${r.status}`);
  return j;
}

export default function CardGamePage() {
  const { S, toast } = useGame();
  return <CardGame key={S?.profile?.id || "guest"} S={S} toast={toast} />;
}

function CardGame({ S, toast }) {
  const profile = S?.profile;
  const [cfg, setCfg] = useState(null);
  useEffect(() => {
    if (profile?.id) fetch("/api/shiki").then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then(setCfg);
  }, [profile?.id]);
  const deck = useMemo(() => cfg ? buildDeck(cfg) : [], [cfg]);
  const byId = useMemo(() => Object.fromEntries(deck.map((c) => [c.id, c])), [deck]);
  const [P, setP] = useState(null); // dữ liệu người chơi từ máy chủ
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("duel");
  const [selectedDeck, setSelectedDeck] = useState(null);
  const actionLock = useRef(false);
  const [rules, setRules] = useState({ open: true, same: false, plus: false, combo: false, elemental: false });
  const [reveal, setReveal] = useState(null);
  const [lostNote, setLostNote] = useState(null); // { id, why } lá vừa bị lấy
  const [traded, setTraded] = useState(null); // { got, pay } vừa đổi bài
  const showOpponents = Boolean(cfg && P?.starter && !P.match && !P.pending && !reveal && !traded && tab === "duel");
  const opponentDecks = useMemo(() => showOpponents ? OPPONENTS.map((op) => oppDeck(op, deck)) : [], [showOpponents, deck]);
  useEffect(() => { try { const r = JSON.parse(localStorage.getItem(LS) || "null"); if (r) setRules(r); } catch {} }, []);
  useEffect(() => { if (profile?.id) api(profile, "state", { mode: DUEL_MODE }).then(setP).catch((e) => setErr(e.message)); }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!S) return null;
  const run = async (action, body, after) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true); setErr("");
    try { const j = await api(profile, action, body); setP(j); after?.(j); return j; }
    catch (e) { setErr(e.message); toast(e.message); } finally { actionLock.current = false; setBusy(false); }
  };

  const head = <><Link href="/thu-nghiem" className="back">‹ Khu Thử Nghiệm</Link><div className="pagehead"><h1>🎴 Đấu thẻ Shikihime</h1><p>Đặt thẻ lên bàn 3×3: cạnh của bạn lớn hơn cạnh kề của thẻ đối thủ thì lật thẻ đó. Đầy bàn, ai giữ nhiều thẻ hơn thắng.</p><p className="ttwarn">⚖️ Thắng: chọn lấy 1 thẻ của đối thủ · Thua: mất 1 lá <b>hạng cao nhất</b> trong Hộp bài · Bỏ trận: mất 1 lá <b>ngẫu nhiên</b> · Hòa: không mất gì. (Hộp bài luôn được giữ tối thiểu 5 loại thẻ.)</p></div></>;
  if (!profile?.id) return <div className="tt">{head}<p className="hint" style={{ textAlign: "center" }}>🔒 Cần đăng nhập để chơi — Hộp bài và kết quả các trận được lưu trên máy chủ theo tài khoản.</p></div>;
  if (!P || !cfg) return <div className="tt">{head}<p className="hint" style={{ textAlign: "center" }}>{err || "Đang tải…"}</p></div>;

  // ——— rút khởi đầu ———
  if (reveal) return (
    <div className="tt">
      <div className="pagehead"><h1>🎴 Bộ bài khởi đầu</h1><p>Các thẻ này đã vào Hộp bài của bạn.</p></div>
      <div className="ttreveal">{reveal.map((id, i) => <div key={id} className="ttrv" style={{ animationDelay: `${i * 0.35}s` }}><Card c={byId[id]} owner="me" named /></div>)}</div>
      <div className="btnrow"><button className="gbtn tri" onClick={() => setReveal(null)}><span className="c" />Bắt đầu đấu bài</button></div>
    </div>
  );
  if (!P.starter) return (
    <div className="tt">{head}
      <p style={{ textAlign: "center" }}>Mỗi tài khoản được rút <b>1 lần</b> 5 thẻ khởi đầu (5 thẻ khác nhau). Thẻ càng tốt càng hiếm. Sau đó đấu với các nhân vật Genshin — thắng thì được chọn lấy 1 thẻ của họ.</p>
      <OddsTable deck={deck} />
      <div className="btnrow"><button className="gbtn tri" disabled={busy} onClick={() => run("starter", {}, (j) => { sfx.open(); setReveal(j.drawn); })}><span className="c" />🎴 Rút 5 thẻ khởi đầu</button></div>
    </div>
  );

  // ——— vừa đổi bài ———
  if (traded) return (
    <div className="tt">
      <div className="pagehead"><h1>✨ Đổi bài thành công</h1><p>5 lá trùng hạng {byId[traded.pay[0]]?.rank} → 1 lá hạng {byId[traded.got]?.rank}</p></div>
      <div className="ttreveal one"><div className="ttrv"><Card c={byId[traded.got]} owner="me" named /><small>{P.box[traded.got] > 1 ? `Đang có ${P.box[traded.got]} lá` : "Thẻ mới!"}</small></div></div>
      <div className="ttpaid">{traded.pay.map((id, k) => <span key={k} className={`ttrk r-${byId[id]?.rank}`} title={byId[id]?.name}>−1 {byId[id]?.name}</span>)}</div>
      <div className="btnrow"><button className="gbtn tri" onClick={() => setTraded(null)}><span className="c" />Về Hộp bài</button></div>
    </div>
  );

  // ——— nhận thưởng ———
  if (P.pending) {
    const op = OPPONENTS[P.pending.op];
    return (
      <div className="tt">
        <div className="pagehead"><h1>🏆 Thắng {op.char.vi}!</h1><p>Chọn 1 thẻ của {op.char.vi} để bỏ vào Hộp bài.</p></div>
        <div className="ttreveal">{P.pending.cards.map((id) => (
          <div key={id} className="ttrv"><Card c={byId[id]} owner="foe" named onClick={() => !busy && run("claim", { card: id }, () => { toast(`Đã nhận thẻ ${byId[id].name} (hạng ${byId[id].rank}) vào Hộp bài`); sfx.win?.(); })} /><small>{P.box[id] ? `Đang có ${P.box[id]} lá` : "Thẻ mới!"}</small></div>
        ))}</div>
      </div>
    );
  }

  // ——— trận đang đấu ———
  if (P.match && P.match.mode !== DUEL_MODE) return <div className="tt">{head}<p className="hint">Phiên bản trận đấu đã thay đổi. Tải lại trang để tiếp tục.</p><button className="gbtn tri" onClick={() => location.reload()}>Tải lại</button></div>;
  if (P.match) return <Match key={P.match.id} m0={P.match} byId={byId} profile={profile} leaving={busy}
    onDone={(j) => { setP(j); if (j.lost) setLostNote({ id: j.lost, why: "Thua trận" }); }}
    onForfeit={() => run("forfeit", { matchId: P.match.id }, (j) => j.lost && setLostNote({ id: j.lost, why: "Bỏ trận" }))} />;

  const box = P.box, beat = P.beat, rec = P.rec;
  const owned = deck.filter((c) => box[c.id] > 0).sort((a, b) => rankIdx(b.rank) - rankIdx(a.rank) || power(b) - power(a));
  const myDeck = (selectedDeck?.uid === profile.id ? selectedDeck.ids : P.deck).filter((id) => box[id] > 0).slice(0, 5);
  const setDeck = (ids) => setSelectedDeck({ uid: profile.id, ids });
  const unlocked = (op) => op.i === 0 || (beat[op.i - 1] || 0) > 0;
  const start = (op) => { try { localStorage.setItem(LS, JSON.stringify(rules)); } catch {} run("start", { op: op.i, rules, deck: myDeck, mode: DUEL_MODE }, () => { setSelectedDeck(null); sfx.open(); }); };
  return (
    <div className="tt">{head}
      {lostNote && byId[lostNote.id] && <div className="panel ttlost"><Card c={byId[lostNote.id]} owner="foe" small /><div><b>{lostNote.why}: bạn bị lấy mất 1 lá</b><p>{byId[lostNote.id].name} · {byId[lostNote.id].ro} · hạng {byId[lostNote.id].rank}{P.box[lostNote.id] ? ` (còn ${P.box[lostNote.id]} lá)` : " (đã hết lá này)"}</p><button className="chip dk" onClick={() => setLostNote(null)}>Đã hiểu</button></div></div>}
      <div className="ttrec">Hộp bài: <b>{owned.length}</b>/{deck.length} loại · {rec.w} thắng · {rec.d} hòa · {rec.l} thua</div>
      <div className="chips" style={{ justifyContent: "center" }}>{[["duel", "⚔️ Đấu bài"], ["box", "🗃️ Hộp bài"], ["odds", "🎲 Hạng thẻ"]].map(([k, l]) => <button key={k} className={`chip dk ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "odds" && <OddsTable deck={deck} />}
      {tab === "box" && <TradePanel deck={deck} box={box} busy={busy} onTrade={(r) => run("trade", { rank: r }, (j) => { sfx.win?.(); setTraded({ got: j.got, pay: j.traded }); })} />}
      {tab === "box" && <div className="ttpool">{owned.map((c) => <div key={c.id} className="ttboxc"><Card c={c} owner="me" named />{box[c.id] > 1 && <span className="ttcount">×{box[c.id]}</span>}</div>)}</div>}
      {tab === "duel" && (
        <>
          <h2 className="a22th"><span>1 · Bộ 5 thẻ của bạn</span> <small>{myDeck.length}/5 · bấm thẻ trong Hộp bài để thêm/bớt</small></h2>
          <p className="hint">Bộ bài được lưu khi bắt đầu trận.</p>
          <div className="ttpool">{owned.map((c) => { const i = myDeck.indexOf(c.id); return <Card key={c.id} c={c} owner={i >= 0 ? "me" : null} badge={i >= 0 ? i + 1 : null} named onClick={() => { if (!busy) { setDeck(i >= 0 ? myDeck.filter((x) => x !== c.id) : myDeck.length < 5 ? [...myDeck, c.id] : myDeck); sfx.click(); } }} />; })}</div>
          {owned.length < 5 && <p className="hint">Hộp bài cần ít nhất 5 thẻ.</p>}
          <h2 className="a22th"><span>2 · Luật chơi</span> <small>bật / tắt</small></h2>
          <div className="ttrules">{RULES.map(([k, n, d]) => <label key={k} className={`panel ttrule ${rules[k] ? "on" : ""}`}><input type="checkbox" checked={rules[k]} onChange={(e) => setRules((r) => ({ ...r, [k]: e.target.checked }))} /><b>{n}</b><small>{d}</small></label>)}</div>
          <h2 className="a22th"><span>3 · Chọn đối thủ</span> <small>thắng người trước để mở người sau</small></h2>
          <div className="ttops">
            {OPPONENTS.map((op) => {
              const open = unlocked(op), od = opponentDecks[op.i];
              return (
                <div key={op.i} className={`panel ttop ${open ? "" : "locked"}`}>
                  <img className="ttav" src={charIcon(op.char)} alt={op.char.vi} loading="lazy" decoding="async" />
                  <div className="ttopi">
                    <b>{op.char.vi}</b> <small>Thẻ hạng {op.band[0]}–{op.band[1]} · máy chuyên gia{beat[op.i] ? ` · đã thắng ${beat[op.i]} lần` : ""}</small>
                    <div className="ttminis">{od.map((c) => <span key={c.id} className={`ttrk r-${c.rank}`} title={`${c.name} · hạng ${c.rank}`}>{c.rank}</span>)}</div>
                  </div>
                  <button className="gbtn tri" disabled={busy || !open || myDeck.length < 5} onClick={() => start(op)}><span className="c" />{open ? "Đấu" : "🔒"}</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Đổi 5 lá trùng (bản thừa) cùng hạng → 1 lá ngẫu nhiên hạng kế trên (máy chủ xử lý)
function TradePanel({ deck, box, busy, onTrade }) {
  const rows = RANKS.slice(0, -1).map((r, i) => ({ r, next: RANKS[i + 1], n: deck.filter((c) => c.rank === r).reduce((a, c) => a + Math.max(0, (box[c.id] || 0) - 1), 0) }));
  return (
    <div className="panel ttodds">
      <h3>✨ Đổi bài</h3>
      <p className="hint">5 lá trùng cùng hạng đổi lấy 1 lá ngẫu nhiên hạng kế trên. Lá trùng = bản thứ 2 trở đi của một thẻ (luôn giữ lại 1 bản mỗi thẻ). Thẻ yếu được dùng trước.</p>
      <div className="tttrade">{rows.map(({ r, next, n }) => (
        <div key={r} className={`tttr ${n >= 5 ? "ok" : ""}`}>
          <span className={`ttrk r-${r}`}>{r}</span><small>{n} lá trùng</small>
          <button className="chip dk" disabled={busy || n < 5} onClick={() => { if (confirm(`Đổi 5 lá trùng hạng ${r} lấy 1 lá ngẫu nhiên hạng ${next}?`)) onTrade(r); }}>Đổi 5 → 1 <span className={`ttrk r-${next}`}>{next}</span></button>
        </div>
      ))}</div>
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
      <div className="ttart"><img className="ttportrait" src={`/shiki-duel/${c.id}.webp`} alt={c.ro} loading={named ? "lazy" : "eager"} decoding="async" draggable={false} /></div>
      {[["t", "nt"], ["r", "nr"], ["b", "nb"], ["l", "nl"]].map(([k, cls]) => <b key={k} className={`ttn ${cls} ${d(k) > 0 ? "up" : d(k) < 0 ? "down" : ""}`}>{showNum(v(k))}</b>)}
      <img className="ttel" src={elemIcon(c.el)} alt="" />
      <span className={`ttrk corner r-${c.rank}`}>{c.rank}</span>
      {badge && <span className="ttbadge">{badge}</span>}
      {named && <span className="ttname jpt">{c.name}</span>}
    </button>
  );
}


// Only the player's choices are persisted. Replaying them also restores a pending AI reply.
function Match({ m0, byId, profile, leaving, onDone, onForfeit }) {
  const op = OPPONENTS[m0.op];
  const [match, setMatch] = useState(m0);
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState(null);
  const [step, setStep] = useState(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [savedLocally, setSavedLocally] = useState(true);
  const moves = useRef([]);
  const locked = useRef(true);
  const compute = useRef(null);
  const submitted = useRef(false);
  const storageKey = "shiki_duel_" + profile.id;
  const cards = useMemo(() => Object.fromEntries(Object.entries(m0.cards).map(([id, stats]) => [id, { ...byId[id], ...stats }])), [m0, byId]);

  useEffect(() => {
    let active = true, worker;
    try { worker = new Worker(new URL("./opponent.worker.js", import.meta.url), { type: "module" }); } catch {}
    function accept({ match, step, error }) {
      if (!active) return;
      if (error) { setError(error); return; }
      setMatch(match); setStep(step); setReady(true); locked.current = false;
      if (step?.flips.length) sfx.click();
    }
    compute.current = (position, history = []) => {
      const fallback = () => setTimeout(() => {
        if (!active) return;
        try { accept(replayDuel(position, history)); } catch (e) { accept({ error: e.message }); }
      }, 0);
      if (!worker) { fallback(); return; }
      worker.onmessage = ({ data }) => accept(data);
      worker.onerror = () => { worker.terminate(); worker = null; fallback(); };
      worker.postMessage({ match: position, moves: history });
    };
    let history = [];
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored?.id === m0.id && Array.isArray(stored.moves)) history = stored.moves;
    } catch { setSavedLocally(false); }
    moves.current = history;
    locked.current = true;
    if (!history.length && m0.turn === "me") accept({ match: m0, step: null });
    else compute.current(m0, history);
    return () => { active = false; worker?.terminate(); compute.current = null; };
  }, [m0, storageKey]);

  const finish = async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSyncing(true); setError("");
    try {
      const data = await api(profile, "finish", { matchId: m0.id, moves: moves.current });
      setReceipt(data);
      if (data.result === "w") sfx.win?.();
    } catch (e) { submitted.current = false; setError(e.message); }
    finally { setSyncing(false); }
  };
  useEffect(() => {
    if (match.turn === "done") finish();
  }, [match.turn]); // eslint-disable-line react-hooks/exhaustive-deps

  const clickCell = (i) => {
    if (locked.current || leaving || match.turn !== "me" || match.cells[i] || sel == null) return;
    const id = match.hands.me[sel];
    const next = duelMove(match, id, i);
    locked.current = true;
    moves.current = [...moves.current, { id, cell: i }];
    try { localStorage.setItem(storageKey, JSON.stringify({ id: m0.id, moves: moves.current })); }
    catch { setSavedLocally(false); }
    setMatch(next.match); setStep(next.step); setSel(null); setError("");
    if (next.match.turn === "foe") compute.current(next.match);
  };

  const { cells, turn } = match;
  const hands = { me: match.hands.me, foe: match.rules.open ? match.hands.foe : match.hands.foe.length };
  const fx = Object.fromEntries((step?.flips || []).map((f) => [f.i, f.by]));
  const last = step?.cell;
  const sc = duelResult(match).score;
  const end = turn === "done" ? receipt || duelResult(match) : null;
  const special = [...new Set((step?.flips || []).map((f) => ({ same: "Bằng nhau", plus: "Cộng", combo: "Liên hoàn" })[f.by]).filter(Boolean))];
  const msg = step ? `${step.who === "me" ? "Bạn" : op.char.vi} đặt ${cards[step.id].name}${step.flips.length ? " — lật " + step.flips.length + " thẻ" : ""}` : "";
  return (
    <div className="tt">
      <button className="back" disabled={leaving || (end && !receipt)} onClick={() => { if (end) onDone(receipt); else if (confirm("Bỏ trận? Trận này tính là thua và bạn sẽ bị lấy mất 1 lá NGẪU NHIÊN trong Hộp bài.")) onForfeit(); }}>‹ {end ? "Về danh sách" : "Bỏ trận"}</button>
      <div className="ttvs"><img src={charIcon(op.char)} alt="" /><div><b>{op.char.vi}</b><small>“{op.line}”</small></div></div>
      <div className="ttscore"><span className="me">🟦 Bạn <b>{sc.me}</b></span><span className="ttmsg">{end ? "" : !ready ? "Đang khôi phục bàn đấu…" : turn === "me" ? (sel != null ? "Chọn ô trống để đặt thẻ" : "Chọn một thẻ trên tay") : `${op.char.vi} đang đi…`}</span><span className="foe"><b>{sc.foe}</b> {op.char.vi} 🟥</span></div>
      <div className="tttable">
        <div className="tthand foe">{Array.isArray(hands.foe) ? hands.foe.map((id, k) => <Card key={k} c={cards[id]} owner="foe" small />) : Array.from({ length: hands.foe }, (_, k) => <Card key={k} back small />)}</div>
        <div className="ttboard">
          {cells.map((cell, i) => (
            <div key={i} className={`ttcell ${!cell && turn === "me" && sel != null ? "can" : ""}`} onClick={() => clickCell(i)}>
              {m0.els[i] && <img className={`ttcellel ${cell ? "dim" : ""}`} src={elemIcon(m0.els[i])} alt={ELEM[m0.els[i]]?.vi} />}
              {cell && <Card key={`${i}-${cell.owner}`} c={cards[cell.id]} owner={cell.owner} el={m0.els[i]} flip={fx[i] ? "x" : null} />}
              {last === i && <span className="ttlast" key={`l${i}-${msg}`} />}
            </div>
          ))}
        </div>
        <div className="tthand me">{hands.me.map((id, k) => <Card key={k} c={cards[id]} owner="me" sel={sel === k} onClick={() => { if (turn === "me" && ready && !locked.current && !leaving) { setSel(sel === k ? null : k); sfx.click(); } }} small />)}</div>
      </div>
      <p className="ttlog" role="status">{error || [msg, ...special].filter(Boolean).join(" · ")}</p>
      {error && <button className="chip dk" onClick={() => location.reload()}>Tải lại trạng thái ván</button>}
      {!savedLocally && <p className="hint">Trình duyệt chưa lưu được nước đi. Hãy giữ trang mở đến khi kết quả được xác nhận.</p>}
      {end && (
        <div className="panel result">
          <h2>{end.result === "w" ? "🏆 Bạn thắng!" : end.result === "l" ? "💀 Bạn thua…" : "🤝 Hòa!"}</h2>
          <div className="score">{end.score.me}<small> : {end.score.foe}</small></div>
          {receipt && end.result === "l" && (receipt.lost ? <div className="ttlost in"><Card c={byId[receipt.lost]} owner="foe" small /><p>Bạn bị lấy mất lá hạng cao nhất: <b>{byId[receipt.lost]?.name}</b> (hạng {byId[receipt.lost]?.rank})</p></div> : <p className="hint">Hộp bài đang ở mức tối thiểu 5 loại thẻ nên không bị lấy lá nào.</p>)}
          {!receipt && <p role="status">{syncing ? "Đang xác nhận kết quả…" : "Kết quả chưa được đồng bộ."}</p>}
          <div className="btnrow">{!receipt ? <button className="gbtn tri" disabled={syncing} onClick={finish}>Gửi lại kết quả</button> : <button className="gbtn tri" onClick={() => onDone(receipt)}><span className="c" />{end.result === "w" ? `🎁 Chọn 1 thẻ của ${op.char.vi}` : "Về danh sách đối thủ"}</button>}</div>
        </div>
      )}
    </div>
  );
}
