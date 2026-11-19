"use client";
// Bàn đấu 2.5D: hai người ngồi đối diện trong đình hoa anh đào. Kéo thả thẻ từ tay lên bàn 3×3.
// Lượt đấu tính trên thiết bị; chỉ nước đi của người chơi được lưu và gửi cho máy chủ xác nhận.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ELEM } from "@/lib/data";
import { elemIcon } from "@/lib/genshin";
import { OPPONENTS } from "@/lib/shikiCards";
import { duelMove, replayDuel, duelResult, adviseMove } from "@/lib/shikiDuel";
import { opponentArt, opponentLine, reactionFor, EMOTE } from "@/lib/shikiDialogue";
import { sfx } from "@/lib/sfx";
import { Card } from "./Card";
import { api } from "./api";
import "./arena.css";

const OPP = { t: "b", r: "l", b: "t", l: "r" };
const NB = (i) => ({ t: i >= 3 ? i - 3 : -1, b: i <= 5 ? i + 3 : -1, l: i % 3 ? i - 1 : -1, r: i % 3 < 2 ? i + 1 : -1 });
const SPECIAL = { same: ["同数", "Bằng nhau"], plus: ["加算", "Cộng"], combo: ["連鎖", "Liên hoàn"] };
const RULE_VI = { open: "Lật bài", same: "Bằng nhau", plus: "Cộng", combo: "Liên hoàn", elemental: "Nguyên tố" };
const PETALS = Array.from({ length: 16 }, (_, i) => ({ x: (i * 37 + 11) % 100, d: -((i * 1.9) % 13), t: 10 + ((i * 5) % 8), s: 0.55 + ((i * 7) % 5) / 7, w: (i % 2 ? 1 : -1) * (4 + (i % 4) * 2) }));
const FOE_THINK_MS = 1100;
const CELL_VI = ["góc trên trái", "giữa hàng trên", "góc trên phải", "giữa cột trái", "chính giữa", "giữa cột phải", "góc dưới trái", "giữa hàng dưới", "góc dưới phải"];
const CELL_JA = ["左上", "上", "右上", "左", "中央", "右", "左下", "下", "右下"];

// Cạnh nào vừa so để lật: thẻ vừa đặt "atk", thẻ bị lật "def"
function hitsOf(step) {
  const out = {};
  if (!step) return out;
  const nb = NB(step.cell);
  for (const f of step.flips) {
    const k = Object.keys(nb).find((s) => nb[s] === f.i);
    if (!k) continue;
    (out[step.cell] ||= {})[k] = "atk";
    (out[f.i] ||= {})[OPP[k]] = "def";
  }
  return out;
}

function Bubble({ name, text, mood }) {
  const chars = useMemo(() => [...(text || "")], [text]);
  const [n, setN] = useState(0);
  useEffect(() => {
    let k = 0;
    const t = setInterval(() => { k++; setN(k); if (k >= chars.length) clearInterval(t); }, 42);
    return () => clearInterval(t);
  }, [chars]);
  if (!text) return null;
  return (
    <div className={`ar-bubble m-${mood}`} role="status">
      <small>{name}</small>
      <p lang="ja">{chars.slice(0, n).join("")}{n < chars.length && <span className="ar-caret" />}</p>
    </div>
  );
}

export default function Arena({ m0, byId, profile, leaving, onDone, onForfeit, advisor }) {
  const op = OPPONENTS[m0.op];
  const who = op.char.en;
  const [match, setMatch] = useState(m0);
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState(null);
  const [step, setStep] = useState(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [savedLocally, setSavedLocally] = useState(true);
  const [intro, setIntro] = useState("wait"); // wait → shuffle → deal → null
  const [talk, setTalk] = useState({ mood: "opening", text: "", n: 0 });
  const [pose, setPose] = useState("idle");
  const [drag, setDrag] = useState(null); // { k, over, w, x, y }
  const [hint, setHint] = useState(null); // { id, cell, k } — Quân sư gợi ý
  const [thinking, setThinking] = useState(false);
  const moves = useRef([]);
  const locked = useRef(true);
  const compute = useRef(null);
  const submitted = useRef(false);
  const lastMove = useRef(0);
  const matchRef = useRef(match);
  const ghost = useRef(null);
  const scene = useRef(null);
  matchRef.current = match;
  const storageKey = "shiki_duel_" + profile.id;
  const cards = useMemo(() => Object.fromEntries(Object.entries(m0.cards).map(([id, stats]) => [id, { ...byId[id], ...stats }])), [m0, byId]);

  const say = (mood) => {
    setTalk((t) => ({ mood, text: opponentLine(who, mood, t.text), n: t.n + 1 }));
  };

  useEffect(() => {
    let active = true, worker;
    const timers = [];
    try { worker = new Worker(new URL("./opponent.worker.js", import.meta.url), { type: "module" }); } catch {}
    function accept({ match, step, error }) {
      if (!active) return;
      if (error) { setError(error); return; }
      // Đối thủ "suy nghĩ" một chút để người chơi kịp xem nước vừa đi
      const wait = step?.who === "foe" && lastMove.current ? Math.max(0, FOE_THINK_MS - (Date.now() - lastMove.current)) : 0;
      timers.push(setTimeout(() => {
        if (!active) return;
        setMatch(match); setStep(step); setReady(true); locked.current = false;
        if (step?.who === "foe") sfx.slap();
      }, wait));
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
    const fresh = !history.length;
    setTalk({ mood: "opening", text: opponentLine(who, "opening"), n: 1 });
    if (fresh) {
      setIntro("shuffle"); sfx.shuffle();
      timers.push(setTimeout(() => { if (active) { setIntro("deal"); for (let i = 0; i < 5; i++) sfx.deal(i); } }, 1500));
      timers.push(setTimeout(() => active && setIntro(null), 2600));
    } else setIntro(null);
    if (fresh && m0.turn === "me") accept({ match: m0, step: null });
    else if (fresh) timers.push(setTimeout(() => compute.current?.(m0, history), 2600));
    else compute.current(m0, history);
    return () => { active = false; timers.forEach(clearTimeout); worker?.terminate(); compute.current = null; };
  }, [m0, storageKey, who]);

  const finish = async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSyncing(true); setError("");
    try { setReceipt(await api(profile, "finish", { matchId: m0.id, moves: moves.current })); }
    catch (e) { submitted.current = false; setError(e.message); }
    finally { setSyncing(false); }
  };

  const { cells, turn } = match;
  const end = turn === "done" ? receipt || duelResult(match) : null;
  const hands = { me: match.hands.me, foe: match.rules.open ? match.hands.foe : match.hands.foe.length };
  const fx = Object.fromEntries((step?.flips || []).map((f) => [f.i, f.by]));
  const hits = useMemo(() => hitsOf(step), [step]);
  const last = step?.cell;
  const sc = duelResult(match).score;
  const special = [...new Set((step?.flips || []).map((f) => f.by).filter((b) => SPECIAL[b]))];
  const stepKey = `${step?.who}-${step?.cell}-${cells.filter(Boolean).length}`;
  const canAct = turn === "me" && ready && !intro && !leaving && !end;

  // Phản ứng của đối thủ sau mỗi nước
  useEffect(() => {
    if (!step) return;
    if (step.flips.length) sfx.flip(Math.min(4, step.flips.length));
    if (special.length) sfx.special();
    if (match.turn === "done") return;
    if (step.who === "me" && !step.flips.length && Math.random() < 0.55) return;
    say(reactionFor(step));
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kết thúc ván
  useEffect(() => {
    if (turn !== "done") return;
    const r = duelResult(match).result;
    say(r === "w" ? "lose" : r === "l" ? "win" : "draw");
    if (r === "w") sfx.win?.(); else if (r === "l") sfx.lose();
    finish();
  }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tư thế nhân vật theo câu thoại, rồi trở về thở nhẹ
  useEffect(() => {
    if (!talk.n) return;
    setPose(talk.mood);
    if (["win", "lose", "draw"].includes(talk.mood)) return;
    const t = setTimeout(() => setPose("idle"), 2600);
    return () => clearTimeout(t);
  }, [talk.n]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chần chừ lâu → bị trêu
  useEffect(() => {
    if (!canAct || drag) return;
    const t = setTimeout(() => say("tease"), 11000);
    return () => clearTimeout(t);
  }, [canAct, drag, talk.n]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = (k, i) => {
    const m = matchRef.current;
    if (locked.current || leaving || m.turn !== "me" || m.cells[i] || k == null || k >= m.hands.me.length) return;
    const id = m.hands.me[k];
    const next = duelMove(m, id, i);
    locked.current = true;
    moves.current = [...moves.current, { id, cell: i }];
    try { localStorage.setItem(storageKey, JSON.stringify({ id: m0.id, moves: moves.current })); }
    catch { setSavedLocally(false); }
    lastMove.current = Date.now();
    sfx.slap();
    setMatch(next.match); setStep(next.step); setSel(null); setError(""); setHint(null);
    if (next.match.turn === "foe") compute.current(next.match);
  };

  // Kéo thả bằng Pointer Events (chuột + cảm ứng). Bấm không kéo = chọn thẻ rồi bấm ô.
  const onHandDown = (e, k) => {
    if (!canAct || locked.current || e.button > 0) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const st = { x0: e.clientX, y0: e.clientY, lx: e.clientX, w: r.width, moved: false, over: null, tilt: 0 };
    const place = (x, y) => { const g = ghost.current; if (g) g.style.transform = `translate(${x - st.w / 2}px,${y - st.w * 0.7}px) rotate(${st.tilt}deg) scale(1.08)`; };
    const move = (ev) => {
      if (!st.moved) {
        if (Math.hypot(ev.clientX - st.x0, ev.clientY - st.y0) < 7) return;
        st.moved = true; setDrag({ k, over: null, w: st.w, x: ev.clientX, y: ev.clientY }); setSel(null); sfx.deal();
      }
      st.tilt = Math.max(-20, Math.min(20, st.tilt * 0.75 + (ev.clientX - st.lx) * 0.8)); st.lx = ev.clientX;
      place(ev.clientX, ev.clientY);
      const cellEl = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.("[data-cell]");
      const over = cellEl && !matchRef.current.cells[Number(cellEl.dataset.cell)] ? Number(cellEl.dataset.cell) : null;
      if (over !== st.over) { st.over = over; setDrag((d) => d && { ...d, over }); if (over != null) sfx.hover(); }
    };
    const up = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      if (!st.moved) { setSel((s) => (s === k ? null : k)); sfx.click(); return; }
      setDrag(null);
      if (st.over != null) play(k, st.over);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };
  // Quân sư: trả Nguyên Thạch → tìm nước tốt nhất cho bạn (bài úp thì quân sư cũng không nhìn bài đối thủ)
  const askAdvisor = () => {
    if (!advisor || !canAct || thinking || hint) return;
    if (advisor.primo < advisor.cost) { setError(`Cần ${advisor.cost} Nguyên Thạch để hỏi Quân sư.`); return; }
    if (!advisor.pay()) return;
    setThinking(true); sfx.primo();
    setTimeout(() => {
      try {
        const m = matchRef.current, mv = adviseMove(m);
        setHint({ ...mv, k: m.hands.me.indexOf(mv.id) }); sfx.open();
      } catch (e) { setError(e.message); }
      setThinking(false);
    }, 450);
  };
  const tilt = (e) => {
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${px * 22}deg`); el.style.setProperty("--rx", `${-py * 18}deg`);
    el.style.setProperty("--mx", `${(px + 0.5) * 100}%`); el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
  };
  const untilt = (e) => { const s = e.currentTarget.style; s.setProperty("--ry", "0deg"); s.setProperty("--rx", "0deg"); };
  const parallax = (e) => {
    if (e.pointerType !== "mouse" || !scene.current) return;
    const r = scene.current.getBoundingClientRect();
    scene.current.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    scene.current.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const turnText = end ? "" : !ready || intro ? "シャッフル中…" : turn === "me" ? (drag ? "置く場所を選んで！" : "あなたの番") : `${op.char.vi} 思考中…`;
  const outcome = end && (end.result === "w" ? ["勝利", "Bạn thắng!"] : end.result === "l" ? ["敗北", "Bạn thua…"] : ["引分", "Hòa!"]);
  const dragCard = drag && cards[hands.me[drag.k]];

  return (
    <div className="tt ar-wrap">
      <div ref={scene} className={`arena ${intro ? "intro-" + intro : ""} ${drag ? "dragging" : ""} ${end ? "ended r-" + end.result : ""}`} onPointerMove={parallax}>
        <div className="ar-bg" />
        <div className="ar-moon" /><div className="ar-lantern a" /><div className="ar-lantern b" />
        <div className="ar-petals" aria-hidden="true">{PETALS.map((p, i) => <i key={i} style={{ "--x": p.x + "%", "--d": p.d + "s", "--t": p.t + "s", "--s": p.s, "--w": p.w + "cqw" }} />)}</div>

        {/* đối thủ ngồi bên kia bàn */}
        <div className={`ar-foe pose-${pose}`}>
          <img src={opponentArt(who)} alt={op.char.vi} draggable={false} />
          <span key={talk.n} className="ar-emote">{EMOTE[talk.mood]}</span>
        </div>
        <Bubble key={talk.n} name={op.char.vi} text={talk.text} mood={talk.mood} />

        {/* mặt bàn nghiêng */}
        <div className="ar-plane">
          <div className="ar-foehand">
            {Array.isArray(hands.foe)
              ? hands.foe.map((id, k) => <Card key={id} c={cards[id]} owner="foe" small style={{ "--i": k }} />)
              : Array.from({ length: hands.foe }, (_, k) => <Card key={k} back small style={{ "--i": k }} />)}
          </div>
          <div className="ar-board">
            {cells.map((cell, i) => (
              <div key={i} data-cell={i} className={`ar-cell ${!cell && canAct && (sel != null || drag) ? "can" : ""} ${drag?.over === i ? "over" : ""} ${hint?.cell === i && !cell ? "hint" : ""}`} onClick={() => sel != null && play(sel, i)}>
                {m0.els[i] && <img className={`ttcellel ${cell ? "dim" : ""}`} src={elemIcon(m0.els[i])} alt={ELEM[m0.els[i]]?.vi} draggable={false} />}
                {cell && <Card key={`${i}-${cell.owner}`} c={cards[cell.id]} owner={cell.owner} el={m0.els[i]} hit={hits[i]}
                  className={last === i ? `land-${step.who}` : fx[i] ? "flipin" : ""} />}
                {cell && fx[i] && <span key={`b${i}-${cell.owner}`} className={`ar-burst ${cell.owner}`}>{Array.from({ length: 10 }, (_, j) => <i key={j} style={{ "--a": j * 36 + "deg" }} />)}</span>}
                {last === i && <span key={`r${stepKey}`} className={`ar-ring ${step.who}`} />}
                {hint?.cell === i && !cell && <span className="ar-hintmark" lang="ja">軍</span>}
                {drag?.over === i && dragCard && <div className="ar-preview"><Card c={dragCard} owner="me" el={m0.els[i]} /></div>}
              </div>
            ))}
          </div>
        </div>

        {/* xáo bài lúc mở ván */}
        {(intro === "shuffle" || intro === "deal") && (
          <div className={`ar-shuffle ${intro}`} aria-hidden="true">
            {Array.from({ length: 10 }, (_, j) => <Card key={j} back small className={j % 2 ? "rr" : "rl"} style={{ "--i": j }} />)}
          </div>
        )}

        {/* tay bài của bạn — xòe quạt */}
        <div className={`ar-hand n${hands.me.length}`}>
          {hands.me.map((id, k) => (
            <div key={id} className={`ar-slot ${sel === k ? "sel" : ""} ${drag?.k === k ? "lifted" : ""} ${canAct ? "live" : ""} ${hint?.id === id ? "hint" : ""}`}
              style={{ "--o": k - (hands.me.length - 1) / 2, "--i": k }}
              onPointerDown={(e) => onHandDown(e, k)} onPointerMove={tilt} onPointerLeave={untilt}>
              <Card c={cards[id]} owner="me" />
            </div>
          ))}
        </div>

        {/* bảng điểm */}
        <div className="ar-hud">
          <div className="ar-score me"><b key={"m" + sc.me}>{sc.me}</b><span>あなた</span></div>
          <div className={`ar-turn ${turn}`}>{turnText}</div>
          <div className="ar-score foe"><span>{op.char.vi}</span><b key={"f" + sc.foe}>{sc.foe}</b></div>
        </div>
        <button className="ar-leave" disabled={leaving || (end && !receipt)} onClick={() => { if (end) onDone(receipt); else if (confirm("Bỏ trận? Trận này tính là thua và bạn sẽ bị lấy mất 1 lá NGẪU NHIÊN trong Hộp bài.")) onForfeit(); }}>{end ? "‹ Về" : "✕ Bỏ trận"}</button>

        {advisor && !end && (
          <button className={`ar-advisor ${thinking ? "busy" : ""}`} disabled={!canAct || thinking || !!hint || advisor.primo < advisor.cost} onClick={askAdvisor}
            title={`Hỏi Quân sư nước đi tốt nhất · ${advisor.cost} Nguyên Thạch (đang có ${advisor.primo.toLocaleString("vi-VN")})`}>
            <span className="fan" lang="ja">軍師</span><small>{thinking ? "Đang tính…" : <>💎 {advisor.cost}</>}</small>
          </button>
        )}
        {hint && hint.k >= 0 && !end && (
          <div className="ar-advice" role="status">
            <b lang="ja">軍師「{cards[hint.id]?.name}を{CELL_JA[hint.cell]}に置くべし」</b>
            <small>Quân sư: đặt <b>{cards[hint.id]?.name}</b> vào ô <b>{CELL_VI[hint.cell]}</b>.</small>
          </div>
        )}
        {special.length > 0 && <div key={stepKey} className="ar-banner">{special.map((b) => <span key={b}><b lang="ja">{SPECIAL[b][0]}！</b><small>{SPECIAL[b][1]}</small></span>)}</div>}

        {end && (
          <div className="ar-result">
            <div className="ar-kanji" lang="ja">{outcome[0]}</div>
            <h2>{outcome[1]}</h2>
            <div className="ar-final"><span className="me">{end.score.me}</span> : <span className="foe">{end.score.foe}</span></div>
            {receipt && end.result === "l" && (receipt.lost ? <div className="ttlost in"><Card c={byId[receipt.lost]} owner="foe" small /><p>Bạn bị lấy mất lá hạng cao nhất: <b>{byId[receipt.lost]?.name}</b> (hạng {byId[receipt.lost]?.rank})</p></div> : <p className="hint">Hộp bài đang ở mức tối thiểu 5 loại thẻ nên không bị lấy lá nào.</p>)}
            {!receipt && <p role="status">{syncing ? "Đang xác nhận kết quả…" : "Kết quả chưa được đồng bộ."}</p>}
            <div className="btnrow">{!receipt ? <button className="gbtn tri" disabled={syncing} onClick={finish}>Gửi lại kết quả</button> : <button className="gbtn tri" onClick={() => onDone(receipt)}><span className="c" />{end.result === "w" ? `🎁 Chọn 1 thẻ của ${op.char.vi}` : "Về danh sách đối thủ"}</button>}</div>
          </div>
        )}
      </div>

      <div className="ar-under">
        <div className="ar-rules">{Object.entries(match.rules).filter(([, v]) => v).map(([k]) => <span key={k}>{RULE_VI[k]}</span>)}</div>
        <p className="ttlog" role="status">{error || (step ? `${step.who === "me" ? "Bạn" : op.char.vi} đặt ${cards[step.id].name}${step.flips.length ? " — lật " + step.flips.length + " thẻ" : ""}` : "Kéo thẻ từ tay lên bàn (hoặc bấm thẻ rồi bấm ô).")}</p>
        {error && <button className="chip dk" onClick={() => location.reload()}>Tải lại trạng thái ván</button>}
        {!savedLocally && <p className="hint">Trình duyệt chưa lưu được nước đi. Hãy giữ trang mở đến khi kết quả được xác nhận.</p>}
      </div>

      {drag && dragCard && typeof document !== "undefined" && createPortal(
        <div className="tt ar-ghostlayer"><div ref={ghost} className={`ar-ghost ${drag.over != null ? "aim" : ""}`} style={{ width: drag.w, transform: `translate(${drag.x - drag.w / 2}px,${drag.y - drag.w * 0.7}px) scale(1.08)` }}><Card c={dragCard} owner="me" /></div></div>,
        document.body)}
    </div>
  );
}
