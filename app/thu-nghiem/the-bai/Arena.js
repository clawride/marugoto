"use client";
// Bàn đấu 2.5D: hai người ngồi đối diện trong đình hoa anh đào. Kéo thả thẻ từ tay lên bàn 3×3.
// Lượt đấu tính trên thiết bị; chỉ nước đi của người chơi được lưu và gửi cho máy chủ xác nhận.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ELEM } from "@/lib/data";
import { elemIcon } from "@/lib/genshin";
import { OPPONENTS, sideVal, showNum } from "@/lib/shikiCards";
import { duelMove, replayDuel, duelResult, adviseMove } from "@/lib/shikiDuel";
import { opponentArt, opponentLine, reactionFor, EMOTE } from "@/lib/shikiDialogue";
import { sfx } from "@/lib/sfx";
import { speakAs, speakVi, stopVoice, unlockVoice, voiceOn, setVoiceOn, talkLang, setTalkLang } from "@/lib/shikiVoice";
import { opponentLineVi } from "@/lib/shikiTauntVi";
import { Card, cardArt } from "./Card";
import { bgOf } from "@/lib/giMeta";
import { api } from "./api";
import "./arena.css";
import "./arena-fx.css";
import "./arena-fp.css";
import "./arena-polish.css";

const OPP = { t: "b", r: "l", b: "t", l: "r" };
const NB = (i) => ({ t: i >= 3 ? i - 3 : -1, b: i <= 5 ? i + 3 : -1, l: i % 3 ? i - 1 : -1, r: i % 3 < 2 ? i + 1 : -1 });
const SPECIAL = { same: ["同数", "Bằng nhau"], plus: ["加算", "Cộng"], combo: ["連鎖", "Liên hoàn"] };
const RULE_VI = { open: "Lật bài", same: "Bằng nhau", plus: "Cộng", combo: "Liên hoàn", elemental: "Nguyên tố" };
const PETALS = Array.from({ length: 16 }, (_, i) => ({ x: (i * 37 + 11) % 100, d: -((i * 1.9) % 13), t: 10 + ((i * 5) % 8), s: 0.55 + ((i * 7) % 5) / 7, w: (i % 2 ? 1 : -1) * (4 + (i % 4) * 2) }));
const FOE_THINK_MS = 1100;
const TURN_MS = 30000; // mỗi lượt 30 giây
const RING = 2 * Math.PI * 20;
const CELL_VI = ["góc trên trái", "giữa hàng trên", "góc trên phải", "giữa cột trái", "chính giữa", "giữa cột phải", "góc dưới trái", "giữa hàng dưới", "góc dưới phải"];
// Chiêu thức theo nguyên tố của thẻ (hiện khi thẻ vừa đặt lật được thẻ đối thủ)
const SKILL = {
  pyro: ["紅蓮・烈火斬", "Hồng Liên · Liệt Hỏa Trảm"], hydro: ["水天・渦潮穿", "Thủy Thiên · Xoáy Triều"],
  anemo: ["疾風・神楽舞", "Tật Phong · Thần Nhạc Vũ"], electro: ["雷光・一閃", "Lôi Quang · Nhất Thiểm"],
  dendro: ["森羅・百花繚乱", "Sâm La · Bách Hoa Liêu Loạn"], cryo: ["氷華・霜天葬", "Băng Hoa · Sương Thiên Táng"],
  geo: ["岩崩・天星落", "Nham Băng · Thiên Tinh Lạc"],
};
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Pháo hoa (thắng) · tro tàn rơi (thua) · bụi sáng (hòa) vẽ bằng canvas
function FxCanvas({ kind }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || reduceMotion()) return;
    const ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = cv.getBoundingClientRect(), w = (cv.width = r.width * dpr), h = (cv.height = r.height * dpr);
    const colors = kind === "w" ? ["#ffe27a", "#ff9ad5", "#8ab8ff", "#ffffff", "#8af5c8", "#ffb347"] : kind === "l" ? ["#5a5470", "#3a3550", "#8a7aa8", "#aa3333"] : ["#c9f1e6", "#ffffff", "#9fe6ff"];
    const pick = () => colors[Math.floor(Math.random() * colors.length)];
    const P = [];
    const burst = (x, y, n) => {
      const c = pick();
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (1.5 + Math.random() * 6) * dpr;
        P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: 0.008 + Math.random() * 0.012, c: Math.random() < 0.7 ? c : pick(), size: (1.5 + Math.random() * 2.5) * dpr, tw: Math.random() < 0.35 });
      }
    };
    const t0 = performance.now();
    let last = 0, raf;
    const loop = (t) => {
      const el = t - t0;
      if (kind === "w" && el < 7000 && t - last > (el < 1800 ? 200 : 650)) { last = t; burst(w * (0.12 + Math.random() * 0.76), h * (0.1 + Math.random() * 0.45), el < 1800 ? 80 : 50); }
      if (kind === "d" && el < 5000 && t - last > 500) { last = t; burst(w * (0.2 + Math.random() * 0.6), h * 0.3, 30); }
      if (kind === "w" && el < 8000) for (let i = 0; i < 4; i++) P.push({ x: Math.random() * w, y: -20, vx: (Math.random() - 0.5) * 1.6 * dpr, vy: (1.5 + Math.random() * 2.5) * dpr, life: 1, decay: 0.0025, c: pick(), size: (3 + Math.random() * 4) * dpr, rib: true, a: Math.random() * 6.3, va: (Math.random() - 0.5) * 0.3 });
      if (kind === "l" && el < 9000) for (let i = 0; i < 6; i++) P.push({ x: Math.random() * w, y: -10, vx: (Math.random() - 0.3) * 0.8 * dpr, vy: (1 + Math.random() * 2.5) * dpr, life: 1, decay: 0.003, c: pick(), size: (1 + Math.random() * 2) * dpr, rain: true });
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = kind === "l" ? "source-over" : "lighter";
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.x += p.vx; p.y += p.vy;
        if (!p.rain && !p.rib) { p.vy += 0.06 * dpr; p.vx *= 0.985; p.vy *= 0.985; }
        p.life -= p.decay;
        if (p.life <= 0 || p.y > h + 20) { P.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * (p.tw ? 0.5 + 0.5 * Math.sin(t / 50 + i) : 1);
        ctx.fillStyle = p.c;
        if (p.rib) { p.a += p.va; p.vx += Math.sin(t / 300 + i) * 0.02; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.size, -p.size * 0.35, p.size * 2, p.size * 0.7 * Math.abs(Math.cos(p.a * 2))); ctx.restore(); }
        else if (p.rain) ctx.fillRect(p.x, p.y, p.size * 0.7, p.size * 6);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); }
      }
      if (el < 9500 || P.length) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [kind]);
  return <canvas ref={ref} className="ar-fx" aria-hidden="true" />;
}

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

function Bubble({ name, text, mood, lang }) {
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
      <p lang={lang}>{chars.slice(0, n).join("")}{n < chars.length && <span className="ar-caret" />}</p>
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
  const [showEnd, setShowEnd] = useState(false);
  const [zoom, setZoom] = useState(null); // ô đang phóng to để xem thẻ
  const lastFlips = useRef(false);
  const wrap = useRef(null);
  const [voice, setVoice] = useState(true);
  const [deadline, setDeadline] = useState(null);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);
  const warned = useRef(false);
  useEffect(() => { setVoice(voiceOn()); return () => stopVoice(); }, []);
  // Nhân vật nói câu thoại thành tiếng
  const [lang, setLang] = useState("vi"); // ngôn ngữ lời thoại + giọng: "vi" (mặc định) hoặc "ja"
  useEffect(() => { setLang(talkLang()); }, []);
  const speakLine = (t = talk, l = lang) => { const text = t[l]; if (text) (l === "vi" ? speakVi(who, text, t.mood) : speakAs(who, text)); };
  useEffect(() => { if (talk.n && talk.speak) speakLine(); }, [talk.n]); // eslint-disable-line react-hooks/exhaustive-deps
  const [full, setFull] = useState(false); // toàn màn hình (thật hoặc giả lập trên iPhone)
  const [fakeFull, setFakeFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggleFull = async () => {
    sfx.click();
    if (fakeFull) { setFakeFull(false); return; }
    if (document.fullscreenElement) { await document.exitFullscreen?.().catch(() => {}); return; }
    const el = wrap.current;
    if (el?.requestFullscreen) {
      try { await el.requestFullscreen({ navigationUI: "hide" }); screen.orientation?.lock?.("landscape").catch(() => {}); return; } catch {}
    }
    setFakeFull(true); // trình duyệt không hỗ trợ (iPhone) → phủ kín cửa sổ bằng CSS
  };
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
  const playerName = (profile.name || profile.username || "").trim().slice(0, 20); // đối thủ gọi đích danh người chơi
  const cards = useMemo(() => Object.fromEntries(Object.entries(m0.cards).map(([id, stats]) => [id, { ...byId[id], ...stats }])), [m0, byId]);

  // speak = đọc thành tiếng; chỉ đọc khi người chơi sắp thua, sắp hết giờ hoặc hết ván — còn lại chỉ hiện bóng thoại
  const say = (mood, speak = false) => {
    setTalk((t) => ({ mood, speak, ja: opponentLine(who, mood, t.ja), vi: opponentLineVi(who, mood, t.vi, playerName), n: t.n + 1 }));
  };

  useEffect(() => {
    let active = true, worker;
    const timers = [];
    try { worker = new Worker(new URL("./opponent.worker.js", import.meta.url), { type: "module" }); } catch {}
    function accept({ match, step, error }) {
      if (!active) return;
      if (error) { setError(error); return; }
      // Đối thủ "suy nghĩ" một chút để người chơi kịp xem nước vừa đi
      const wait = step?.who === "foe" && lastMove.current ? Math.max(0, FOE_THINK_MS + (lastFlips.current ? 2600 : 0) - (Date.now() - lastMove.current)) : 0;
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
    setTalk({ mood: "opening", speak: true, ja: opponentLine(who, "opening"), vi: opponentLineVi(who, "opening", "", playerName), n: 1 }); // câu chào được đọc thành tiếng
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

  // Đồng hồ 30 giây cho lượt của bạn; hết giờ → máy tự đánh một nước ngẫu nhiên thay bạn
  useEffect(() => {
    if (!canAct) { setDeadline(null); return; }
    const d = Date.now() + TURN_MS;
    warned.current = false;
    setDeadline(d); setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [canAct, match.hands.me.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
  useEffect(() => {
    if (left == null || !canAct) return;
    if (left <= 10 && left > 0) sfx.tick(left <= 5);
    if (left === 10 && !warned.current) { warned.current = true; say("tease", true); }
    if (left === 0 && !drag?.throwing && !locked.current) {
      const m = matchRef.current;
      const empty = m.cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
      const k = hint?.k >= 0 ? hint.k : Math.floor(Math.random() * m.hands.me.length);
      const cell = hint && !m.cells[hint.cell] ? hint.cell : empty[Math.floor(Math.random() * empty.length)];
      setDrag(null); setSel(null);
      if (cell != null) play(k, cell);
      setNotice("⏰ Hết giờ — máy đánh thay bạn một nước.");
    }
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phản ứng của đối thủ sau mỗi nước
  useEffect(() => {
    if (!step) return;
    const el = scene.current;
    if (el && !reduceMotion()) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
    if (step.flips.length) { sfx.cast(); sfx.flip(Math.min(4, step.flips.length), 2.35); }
    if (special.length) sfx.special();
    if (match.turn === "done") return;
    // Chỉ khiêu khích thành tiếng khi bạn đang thua (máy dẫn ≥2, hoặc dẫn khi ván sắp hết); bị lật thì chỉ cay trong bóng thoại
    const sc = duelResult(match).score, lead = sc.foe - sc.me, filled = match.cells.filter(Boolean).length;
    if (step.who === "foe" && step.flips.length) {
      const losing = lead >= 2 || (filled >= 6 && lead > 0);
      if (losing) say("capture", true); else if (Math.random() < 0.5) say("capture");
    } else if (step.who === "me" && step.flips.length && Math.random() < 0.6) say("setback");
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kết thúc ván
  useEffect(() => {
    if (turn !== "done") return;
    const r = duelResult(match).result;
    say(r === "w" ? "lose" : r === "l" ? "win" : "draw", true);
    finish();
    setZoom(null);
    // Màn kết thúc hoành tráng sau khi chiêu thức/lật thẻ cuối cùng diễn xong
    const t = setTimeout(() => {
      setShowEnd(true); sfx.boom();
      if (r === "w") sfx.fanfare(); else if (r === "l") sfx.doom(); else sfx.summary();
    }, step?.flips.length ? 3500 : 900);
    return () => clearTimeout(t);
  }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tư thế nhân vật theo câu thoại, rồi trở về thở nhẹ
  useEffect(() => {
    if (!talk.n) return;
    setPose(talk.mood);
    if (["win", "lose", "draw"].includes(talk.mood)) return;
    const t = setTimeout(() => setPose("idle"), 2600);
    return () => clearTimeout(t);
  }, [talk.n]); // eslint-disable-line react-hooks/exhaustive-deps


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
    lastFlips.current = next.step.flips.length > 0;
    sfx.slap();
    setMatch(next.match); setStep(next.step); setSel(null); setError(""); setNotice(""); setHint(null);
    if (next.match.turn === "foe") compute.current(next.match);
  };

  // Kéo thả bằng Pointer Events (chuột + cảm ứng). Bấm không kéo = chọn thẻ rồi bấm ô.
  const onHandDown = (e, k) => {
    if (!canAct || locked.current || drag || e.button > 0) return;
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
      const at = cellAt(ev.clientX, ev.clientY);
      const over = at != null && !matchRef.current.cells[at] ? at : null;
      if (over !== st.over) { st.over = over; setDrag((d) => d && { ...d, over }); if (over != null) sfx.hover(); }
    };
    const up = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      if (!st.moved) { setSel((s) => (s === k ? null : k)); sfx.click(); return; }
      if (st.over == null) { setDrag(null); return; }
      throwTo(k, st.over, st.tilt);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };
  // Ném thẻ: thẻ xoay tròn bay vào ô rồi đập xuống bàn
  const throwTo = (k, i, tilt = 0) => {
    const g = ghost.current, cellEl = scene.current?.querySelector(`[data-cell="${i}"]`);
    if (!g || !cellEl || reduceMotion()) { setDrag(null); play(k, i); return; }
    setDrag((d) => d && { ...d, over: i, throwing: true });
    const r = cellEl.getBoundingClientRect(), w = g.offsetWidth, sc = r.width / w, dir = tilt >= 0 ? 1 : -1;
    const tx = r.left + r.width / 2 - w / 2, ty = r.top + r.height / 2 - w * 0.4 - w * 0.267 * sc;
    sfx.whoosh();
    const a = g.animate([
      { transform: getComputedStyle(g).transform },
      { transform: `translate(${tx}px,${ty - w * 0.5}px) rotate(${dir * 400}deg) scale(${sc * 1.25})`, offset: 0.7 },
      { transform: `translate(${tx}px,${ty}px) rotate(${dir * 720}deg) scale(${sc})` },
    ], { duration: 400, easing: "cubic-bezier(.35,.1,.6,1)", fill: "forwards" });
    // Tab bị ẩn thì trình duyệt dừng animation → hẹn giờ dự phòng để thẻ vẫn được đặt
    let done = false;
    const land = () => { if (done) return; done = true; setDrag(null); play(k, i); };
    a.onfinish = land;
    setTimeout(land, 700);
  };
  const throwFromHand = (k, i) => {
    const slot = scene.current?.querySelectorAll(".ar-slot")[k];
    if (!slot || drag || locked.current || !canAct) return;
    const r = slot.getBoundingClientRect();
    setDrag({ k, over: i, w: r.width, x: r.left + r.width / 2, y: r.top + r.width * 0.7, throwing: true });
    setTimeout(() => throwTo(k, i, 0), 40);
  };
  // Ô dưới con trỏ, tính theo hình học: trên bàn nghiêng 3D, trình duyệt có lúc trả về chính mặt bàn thay vì ô
  const cellAt = (x, y) => {
    let best = null, bestD = Infinity;
    scene.current?.querySelectorAll("[data-cell]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const pad = r.width * 0.12;
      if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) return;
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      if (d < bestD) { bestD = d; best = Number(el.dataset.cell); }
    });
    return best;
  };
  // Bấm ô: có thẻ chọn sẵn + ô trống → ném thẻ; ô có thẻ → phóng to để xem
  const clickCell = (i) => {
    if (cells[i]) { setZoom(i); sfx.page(); return; }
    if (sel != null) throwFromHand(sel, i);
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
  const unlocked = useRef(false);
  const unlockOnce = () => { if (!unlocked.current) { unlocked.current = true; unlockVoice(); if (voice && talk.speak) speakLine(); } };
  const parallax = (e) => {
    if (e.pointerType !== "mouse" || !scene.current) return;
    const r = scene.current.getBoundingClientRect();
    scene.current.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    scene.current.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const turnText = end ? "" : !ready || intro ? "シャッフル中…" : turn === "me" ? (drag ? "置く場所を選んで！" : "あなたの番") : `${op.char.vi} 思考中…`;
  const outcome = end && (end.result === "w" ? ["勝利", "Bạn thắng!"] : end.result === "l" ? ["敗北", "Bạn thua…"] : ["引分", "Hòa!"]);
  const dragCard = drag && cards[hands.me[drag.k]];
  const cutCard = step?.flips.length ? cards[step.id] : null;
  const skill = cutCard && (SKILL[cutCard.el] || SKILL.geo);
  const zoomCell = zoom != null ? cells[zoom] : null;

  return (
    <div ref={wrap} className={`tt ar-wrap ${fakeFull ? "fakefull" : ""} ${full || fakeFull ? "isfull" : ""}`}>
      <div ref={scene} style={{ "--stage": Math.round((m0.op / Math.max(1, OPPONENTS.length - 1)) * 25) }} className={`arena reg-${bgOf(op.char.en)} ${intro ? "intro-" + intro : ""} ${drag ? "dragging" : ""} ${end ? "ended r-" + end.result : ""} ${end && showEnd ? "finale" : ""} ${cutCard ? "has-cut" : ""}`} onPointerMove={parallax} onPointerDownCapture={unlockOnce}>
        <div className="ar-bg" /><div className="ar-table" aria-hidden="true" />
        <div className="ar-moon" /><div className="ar-lantern a" /><div className="ar-lantern b" />
        <div className="ar-petals" aria-hidden="true">{PETALS.map((p, i) => <i key={i} style={{ "--x": p.x + "%", "--d": p.d + "s", "--t": p.t + "s", "--s": p.s, "--w": p.w + "cqw" }} />)}</div>

        {/* đối thủ ngồi bên kia bàn */}
        <div className={`ar-foe pose-${pose}`}>
          <img src={opponentArt(who)} alt={op.char.vi} draggable={false} />
          <span key={talk.n} className="ar-emote">{EMOTE[talk.mood]}</span>
        </div>
        <Bubble key={talk.n + lang} name={op.char.vi} text={talk[lang]} mood={talk.mood} lang={lang} />

        {/* mặt bàn nghiêng */}
        <div className="ar-plane">
          <div className="ar-foehand">
            {Array.isArray(hands.foe)
              ? hands.foe.map((id, k) => <Card key={id} c={cards[id]} owner="foe" small style={{ "--i": k }} />)
              : Array.from({ length: hands.foe }, (_, k) => <Card key={k} back small style={{ "--i": k }} />)}
          </div>
          <div className="ar-board" onClick={(e) => { const i = cellAt(e.clientX, e.clientY); if (i != null) clickCell(i); }}>
            {cells.map((cell, i) => (
              <div key={i} data-cell={i} className={`ar-cell ${!cell && canAct && (sel != null || drag) ? "can" : ""} ${drag?.over === i ? "over" : ""} ${hint?.cell === i && !cell ? "hint" : ""}`} style={{ "--ci": i, "--ec": cell ? ELEM[cards[cell.id]?.el]?.c : undefined }}>
                {m0.els[i] && <img className={`ttcellel ${cell ? "dim" : ""}`} src={elemIcon(m0.els[i])} alt={ELEM[m0.els[i]]?.vi} draggable={false} />}
                {cell && <Card key={`${i}-${cell.owner}`} c={cards[cell.id]} owner={cell.owner} el={m0.els[i]} hit={hits[i]}
                  className={last === i ? `land-${step.who}` : fx[i] ? "flipin" : ""} />}
                {cell && fx[i] && <span key={`b${i}-${cell.owner}`} className={`ar-burst ${cell.owner}`}>{Array.from({ length: 10 }, (_, j) => <i key={j} style={{ "--a": j * 36 + "deg" }} />)}</span>}
                {last === i && <span key={`r${stepKey}`} className={`ar-ring ${step.who}`} />}
                {last === i && <span key={`d${stepKey}`} className="ar-dust">{Array.from({ length: 12 }, (_, j) => <i key={j} style={{ "--a": j * 30 + "deg", "--r": 3 + (j % 3) + "cqw" }} />)}</span>}
                {hint?.cell === i && !cell && <span className="ar-hintmark" lang="ja">軍</span>}
                {drag?.over === i && dragCard && !drag.throwing && <div className="ar-preview"><Card c={dragCard} owner="me" el={m0.els[i]} /></div>}
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
        {/* bàn cờ mini 2D để theo dõi nhanh: màu phe, 4 số đã tính nguyên tố, ô vừa đánh nhấp nháy */}
        <div className="ar-mini" aria-label="Bàn cờ thu nhỏ">
          {cells.map((cell, i) => {
            const c = cell && cards[cell.id];
            return (
              <button key={i + "-" + (cell?.owner || "x")} type="button" className={`mc ${cell ? cell.owner : ""} ${last === i ? "last" : ""} ${fx[i] ? "fl" : ""}`}
                onClick={() => { if (cell) { setZoom(i); sfx.page(); } }} aria-label={c ? `${c.name} · ${cell.owner === "me" ? "của bạn" : "của đối thủ"}` : "Ô trống"}>
                {c ? <>
                  <img className="pt" src={cardArt(c)} alt="" draggable={false} />
                  {["t", "r", "b", "l"].map((k) => <i key={k} className={k}>{showNum(sideVal({ card: c }, m0.els[i], k))}</i>)}
                </> : m0.els[i] ? <img className="el" src={elemIcon(m0.els[i])} alt="" draggable={false} /> : null}
              </button>
            );
          })}
        </div>
        <div className="ar-hud">
          {/* điểm hai bên là hai đĩa cân: bên nhiều thẻ hơn nặng hơn, cán cân nghiêng về bên đó */}
          <div className="ar-scale" style={{ "--tilt": `${Math.max(-16, Math.min(16, (sc.foe - sc.me) * 3.2))}deg` }} role="img" aria-label={`Bạn ${sc.me} : ${sc.foe} ${op.char.vi}`}>
            <div className="post" /><div className="pivot" />
            <div className="beam">
              <div className="pan me"><i className="cord" /><div className="dish"><b key={"m" + sc.me}>{sc.me}</b></div><small>Bạn</small></div>
              <div className="pan foe"><i className="cord" /><div className="dish"><b key={"f" + sc.foe}>{sc.foe}</b></div><small>{op.char.vi}</small></div>
            </div>
          </div>
          <div className="ar-mid">
            <div className={`ar-turn ${turn}`}>{turnText}</div>
            {left != null && (
              <div className={`ar-clock ${left <= 10 ? "warn" : ""} ${left <= 5 ? "crit" : ""}`} key={left <= 5 ? "c" + left : "n"} role="timer" aria-label={`Còn ${left} giây`}>
                <svg viewBox="0 0 48 48"><circle className="bg" cx="24" cy="24" r="20" /><circle className="fg" cx="24" cy="24" r="20" style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - Math.max(0, deadline - now) / TURN_MS) }} /></svg>
                <b>{left}</b>
              </div>
            )}
          </div>
          <div className="ar-hudsp" />
        </div>
        <button className="ar-leave" disabled={leaving || (end && !receipt)} onClick={() => { if (end) onDone(receipt); else if (confirm("Bỏ trận? Trận này tính là thua và bạn sẽ bị lấy mất 1 lá NGẪU NHIÊN trong Hộp bài.")) onForfeit(); }}>{end ? "‹ Về" : "✕ Bỏ trận"}</button>
        <button className="ar-voice" onClick={() => { const v = !voice; setVoice(v); setVoiceOn(v); if (v) { unlockVoice(); speakLine(); } sfx.click(); }} title={voice ? "Tắt giọng nhân vật" : "Bật giọng nhân vật"} aria-label={voice ? "Tắt giọng nhân vật" : "Bật giọng nhân vật"}>{voice ? "🔊" : "🔇"}</button>
        <button className="ar-lang" onClick={() => { const l = lang === "vi" ? "ja" : "vi"; setLang(l); setTalkLang(l); unlockVoice(); speakLine(talk, l); sfx.click(); }} title={lang === "vi" ? "Đổi lời thoại sang tiếng Nhật" : "Đổi lời thoại sang tiếng Việt"} aria-label="Đổi ngôn ngữ lời thoại">{lang === "vi" ? "VI" : "JA"}</button>
        <button className="ar-full" onClick={toggleFull} title={full || fakeFull ? "Thoát toàn màn hình" : "Toàn màn hình"} aria-label={full || fakeFull ? "Thoát toàn màn hình" : "Toàn màn hình"}>{full || fakeFull ? "🗗" : "⛶"}</button>

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
        {cutCard && (
          <div key={"cut" + stepKey} className={`ar-cut ${step.who}`} style={{ "--ec": ELEM[cutCard.el]?.c || "#ffd36b" }} aria-hidden="true">
            <div className="band" /><div className="lines" />
            <img src={cardArt(cutCard)} alt="" draggable={false} />
            <div className="skill"><b lang="ja">{skill[0]}</b><small>{cutCard.name} · {skill[1]}</small></div>
          </div>
        )}
        {zoomCell && (
          <div className="ar-zoom" onClick={() => setZoom(null)} role="dialog" aria-label="Xem thẻ">
            <div className="ar-zoomcard" onClick={(e) => e.stopPropagation()}>
              <Card c={cards[zoomCell.id]} owner={zoomCell.owner} el={m0.els[zoom]} />
              <div className="ar-zoominfo">
                <b lang="ja">{cards[zoomCell.id].name}</b>
                <small>{cards[zoomCell.id].ro} · hạng {cards[zoomCell.id].rank} · {ELEM[cards[zoomCell.id].el]?.vi} · {zoomCell.owner === "me" ? "của bạn" : "của " + op.char.vi}</small>
                <button className="chip dk" onClick={() => setZoom(null)}>Đóng</button>
              </div>
            </div>
          </div>
        )}
        {special.length > 0 && <div key={stepKey} className="ar-banner">{special.map((b) => <span key={b}><b lang="ja">{SPECIAL[b][0]}！</b><small>{SPECIAL[b][1]}</small></span>)}</div>}

        {end && showEnd && (
          <div className="ar-result">
            <div className="ar-flash" />
            <div className="ar-rays" />
            {end.result === "w" && <div className="ar-beams" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map((j) => <i key={j} style={{ "--j": j }} />)}</div>}
            {end.result === "w" && <div className="ar-crown" aria-hidden="true">👑</div>}
            {end.result === "l" && (
              <svg className="ar-cracks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M52 44 L40 30 L36 12 L30 0 M40 30 L22 26 L0 30 M52 44 L70 34 L84 18 L92 0 M70 34 L100 38 M52 44 L58 62 L54 80 L60 100 M58 62 L80 70 L100 74 M52 44 L34 58 L18 64 L0 62 M34 58 L28 80 L20 100" />
              </svg>
            )}
            <FxCanvas kind={end.result} />
            <div className="ar-kanji" lang="ja">{[...outcome[0]].map((ch, j) => <span key={j} style={{ "--j": j }}>{ch}</span>)}</div>
            <div className="ar-rest">
            <h2>{outcome[1]}</h2>
            <div className="ar-final"><span className="me">{end.score.me}</span> : <span className="foe">{end.score.foe}</span></div>
            {receipt && end.result === "l" && (receipt.lost ? <div className="ttlost in"><Card c={byId[receipt.lost]} owner="foe" small /><p>Bạn bị mất 1 lá trong bộ bài vừa đấu: <b>{byId[receipt.lost]?.name}</b> (hạng {byId[receipt.lost]?.rank})</p></div> : <p className="hint">Hộp bài đang ở mức tối thiểu 5 loại thẻ nên không bị lấy lá nào.</p>)}
            {!receipt && <p role="status">{syncing ? "Đang xác nhận kết quả…" : "Kết quả chưa được đồng bộ."}</p>}
            <div className="btnrow">{!receipt ? <button className="gbtn tri" disabled={syncing} onClick={finish}>Gửi lại kết quả</button> : <button className="gbtn tri" onClick={() => onDone(receipt)}><span className="c" />{end.result === "w" ? `🎁 Chọn 1 thẻ của ${op.char.vi}` : "Về danh sách đối thủ"}</button>}</div>
            </div>
          </div>
        )}
      </div>

      <div className="ar-under">
        <div className="ar-rules">{Object.entries(match.rules).filter(([, v]) => v).map(([k]) => <span key={k}>{RULE_VI[k]}</span>)}</div>
        <p className="ttlog" role="status">{error || notice || (step ? `${step.who === "me" ? "Bạn" : op.char.vi} đặt ${cards[step.id].name}${step.flips.length ? " — lật " + step.flips.length + " thẻ" : ""}` : "Kéo thẻ từ tay lên bàn (hoặc bấm thẻ rồi bấm ô).")}</p>
        {error && <button className="chip dk" onClick={() => location.reload()}>Tải lại trạng thái ván</button>}
        {!savedLocally && <p className="hint">Trình duyệt chưa lưu được nước đi. Hãy giữ trang mở đến khi kết quả được xác nhận.</p>}
      </div>

      {drag && dragCard && typeof document !== "undefined" && createPortal(
        <div className="tt ar-ghostlayer"><div ref={ghost} className={`ar-ghost ${drag.over != null ? "aim" : ""}`} style={{ width: drag.w, transform: `translate(${drag.x - drag.w / 2}px,${drag.y - drag.w * 0.7}px) scale(1.08)` }}><Card c={dragCard} owner="me" /></div></div>,
        wrap.current || document.body)}
    </div>
  );
}
