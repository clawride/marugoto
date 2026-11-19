"use client";
// Lượt đấu được tính trên thiết bị. Máy chủ chia bài và xác nhận kết quả cuối ván.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { charIcon } from "@/lib/genshin";
import { ELEM } from "@/lib/data";
import { RANKS, RANK_VI } from "@/lib/shikihime";
import { buildDeck, power, RANK_ODDS, OPPONENTS, oppDeck, rankIdx } from "@/lib/shikiCards";
import { DUEL_MODE, LEVELS, autoLevel } from "@/lib/shikiDuel";
import { opponentArt } from "@/lib/shikiDialogue";
import { unlockVoice } from "@/lib/shikiVoice";
import { sfx } from "@/lib/sfx";
import { Card } from "./Card";
import { api } from "./api";
import Arena from "./Arena";
import StageMap from "./StageMap";
import "./cards.css";
import "./arena.css";
import "./arena-fp.css";
import "./arena-polish.css";

const FONTS = "https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Yuji+Syuku&family=Zen+Maru+Gothic:wght@700&display=swap";

const RULES = [
  ["open", "Lật bài", "Thấy bài trên tay đối thủ"],
  ["same", "Bằng nhau", "Đặt thẻ có ≥2 cạnh BẰNG cạnh thẻ kề → lật các thẻ đối thủ đó"],
  ["plus", "Cộng", "≥2 cặp cạnh kề có TỔNG bằng nhau → lật các thẻ đối thủ đó"],
  ["combo", "Liên hoàn", "Thẻ vừa bị lật bởi Bằng nhau/Cộng tiếp tục lật thẻ bên cạnh"],
  ["elemental", "Nguyên tố", "Ô có biểu tượng nguyên tố: thẻ cùng hệ +1 mỗi cạnh, khác hệ −1"],
];
const LS = "shiki_tt_rules";
const LS_MODE = "shiki_tt_mode2"; // khóa mới: mọi người bắt đầu lại với mặc định Úp bài
const HINT_COST = 100; // Nguyên Thạch mỗi lần hỏi Quân sư
const MODES = [
  ["open", "🃏", "Ngửa bài", "Hai bên đều thấy bài trên tay nhau. Máy tính toán với bài thật của bạn."],
  ["hidden", "🂠", "Úp bài", "Hai bên che bài. Máy KHÔNG được nhìn bài của bạn — chỉ đoán theo bài của chính nó."],
  ["advisor", "🧠", "Quân sư", `Úp bài + Quân sư bày nước đi tốt nhất cho bạn. Mỗi lần hỏi tốn ${HINT_COST} Nguyên Thạch.`],
];

export default function CardGamePage() {
  const { S, toast, update } = useGame();
  return <><link rel="stylesheet" href={FONTS} precedence="default" /><CardGame key={S?.profile?.id || "guest"} S={S} toast={toast} update={update} /></>;
}

function CardGame({ S, toast, update }) {
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
  const [shuffling, setShuffling] = useState(false);
  const [poolOrder, setPoolOrder] = useState(null);
  const [shufPick, setShufPick] = useState(null); // 5 lá vừa rút trong màn xáo bài
  const [rules, setRules] = useState({ open: true, same: false, plus: false, combo: false, elemental: false });
  const [reveal, setReveal] = useState(null);
  const [lostNote, setLostNote] = useState(null); // { id, why } lá vừa bị lấy
  const [traded, setTraded] = useState(null); // { got, pay } vừa đổi bài
  const showOpponents = Boolean(cfg && P?.starter && !P.match && !P.pending && !reveal && !traded && tab === "duel");
  const opponentDecks = useMemo(() => showOpponents ? OPPONENTS.map((op) => oppDeck(op, deck)) : [], [showOpponents, deck]);
  const [mode, setMode] = useState("hidden"); // mặc định: Úp bài
  const [level, setLevel] = useState("auto"); // "auto" = tăng dần theo đối thủ · 1–4 = cố định
  const [claiming, setClaiming] = useState(null); // id thẻ thưởng đang thu phục
  const [launching, setLaunching] = useState(null); // đối thủ vừa chọn — màn chào trước trận
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(LS) || "null"); if (r) setRules(r);
      const md = localStorage.getItem(LS_MODE); if (MODES.some(([k]) => k === md)) setMode(md);
      const lv = localStorage.getItem("shiki_tt_level"); if (lv === "auto" || LEVELS[lv]) setLevel(lv === "auto" ? "auto" : Number(lv));
    } catch {}
  }, []);
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

  // Nhận thẻ thưởng: hoạt cảnh thẻ bay lên chạy song song với yêu cầu lên máy chủ (tối thiểu 1,7 giây)
  const claim = async (id) => {
    if (claiming || busy || actionLock.current) return;
    actionLock.current = true;
    setClaiming(id); setErr(""); sfx.cast(); sfx.reveal(4);
    const minWait = new Promise((r) => setTimeout(r, 1700));
    try {
      const j = await api(profile, "claim", { card: id });
      await minWait;
      setP(j); sfx.fanfare();
      toast(`Đã nhận thẻ ${byId[id].name} (hạng ${byId[id].rank}) vào Hộp bài`);
    } catch (e) { setErr(e.message); toast(e.message); }
    finally { actionLock.current = false; setClaiming(null); }
  };

  // ——— nhận thưởng ———
  if (P.pending) {
    const op = OPPONENTS[P.pending.op];
    return (
      <div className="tt">
        <div className="pagehead"><h1>🏆 Thắng {op.char.vi}!</h1><p>Chọn 1 thẻ của {op.char.vi} để bỏ vào Hộp bài.</p></div>
        <div className={`ttreveal ${claiming ? "claiming" : ""}`}>{P.pending.cards.map((id) => (
          <div key={id} className={`ttrv ${claiming === id ? "claimed" : claiming ? "dismissed" : ""}`} style={{ "--ec": ELEM[byId[id]?.el]?.c }}>
            {claiming === id && <span className="ttclaimfx" aria-hidden="true" />}
            <Card c={byId[id]} owner={claiming === id ? "me" : "foe"} named onClick={() => claim(id)} />
            <small>{claiming === id ? "✨ Đang thu phục…" : P.box[id] ? `Đang có ${P.box[id]} lá` : "Thẻ mới!"}</small>
          </div>
        ))}</div>
      </div>
    );
  }

  // ——— trận đang đấu ———
  if (P.match && P.match.mode !== DUEL_MODE) return <div className="tt">{head}<p className="hint">Phiên bản trận đấu đã thay đổi. Tải lại trang để tiếp tục.</p><button className="gbtn tri" onClick={() => location.reload()}>Tải lại</button></div>;
  const launchFx = launching != null && OPPONENTS[launching] && <LaunchFx op={OPPONENTS[launching]} me={profile?.name} stage={launching + 1} />;
  if (P.match) return <>{launchFx}<Arena key={P.match.id} m0={P.match} byId={byId} profile={profile} leaving={busy}
    advisor={mode === "advisor" && !P.match.rules.open ? { cost: HINT_COST, primo: S.primo || 0, pay: () => update((s) => { if ((s.primo || 0) < HINT_COST) return false; s.primo -= HINT_COST; return true; }) } : null}
    onDone={(j) => { setP(j); if (j.lost) setLostNote({ id: j.lost, why: "Thua trận" }); }}
    onForfeit={() => run("forfeit", { matchId: P.match.id }, (j) => j.lost && setLostNote({ id: j.lost, why: "Bỏ trận" }))} /></>;

  const box = P.box, beat = P.beat, rec = P.rec;
  const owned = deck.filter((c) => box[c.id] > 0).sort((a, b) => rankIdx(b.rank) - rankIdx(a.rank) || power(b) - power(a));
  const myDeck = (selectedDeck?.uid === profile.id ? selectedDeck.ids : P.deck).filter((id) => box[id] > 0).slice(0, 5);
  const setDeck = (ids) => setSelectedDeck({ uid: profile.id, ids });
  const unlocked = (op) => op.i === 0 || (beat[op.i - 1] || 0) > 0;
  const pool = poolOrder ? [...owned].sort((a, b) => poolOrder.indexOf(a.id) - poolOrder.indexOf(b.id)) : owned;
  // Xáo cả Hộp bài rồi rút ngẫu nhiên 5 lá làm bộ bài
  const shuffleDeck = () => {
    if (busy || shuffling || owned.length < 5) return;
    // Màn xáo bài: bài bay về giữa → xáo đan → xòe vòng tròn xoay → thu lại lóe sáng → 5 lá bung ra lật mặt
    const ids = owned.map((c) => c.id).sort(() => Math.random() - 0.5);
    setShuffling(true); setShufPick(null); sfx.whoosh(); sfx.shuffle();
    setTimeout(() => sfx.shuffle(), 700);
    setTimeout(() => { sfx.cast(); }, 1150);
    setTimeout(() => { sfx.boom(); setShufPick(ids.slice(0, 5)); for (let i = 0; i < 5; i++) sfx.deal(i); }, 2050);
    setTimeout(() => { sfx.reveal(4); }, 2500);
    setTimeout(() => { setPoolOrder(ids); setDeck(ids.slice(0, 5)); setShuffling(false); setShufPick(null); }, 3700);
  };
  const toggle = (c, i) => { if (busy || shuffling) return; setDeck(i >= 0 ? myDeck.filter((x) => x !== c.id) : myDeck.length < 5 ? [...myDeck, c.id] : myDeck); i >= 0 ? sfx.click() : sfx.deal(); };
  const levelOf = (op) => (level === "auto" ? autoLevel(op.i) : level);
  const start = (op) => {
    const r = { ...rules, open: mode === "open" };
    try { localStorage.setItem(LS, JSON.stringify(r)); localStorage.setItem(LS_MODE, mode); localStorage.setItem("shiki_tt_level", String(level)); } catch {}
    // Màn chào đối thủ che thời gian chờ máy chủ chia bài
    unlockVoice(); // chạm "Đấu" mở khóa âm thanh cho giọng nhân vật (iPhone/Android)
    setLaunching(op.i); sfx.whoosh(); setTimeout(() => sfx.boom(), 350);
    setTimeout(() => setLaunching(null), 2300); setTimeout(() => sfx.boom(), 900); setTimeout(() => sfx.cast(), 150);
    run("start", { op: op.i, rules: r, deck: myDeck, mode: DUEL_MODE, level: levelOf(op) }, () => { setSelectedDeck(null); sfx.open(); });
  };
  return (
    <div className="tt">{head}{launchFx}
      {lostNote && byId[lostNote.id] && <div className="panel ttlost"><Card c={byId[lostNote.id]} owner="foe" small /><div><b>{lostNote.why}: bạn bị lấy mất 1 lá</b><p>{byId[lostNote.id].name} · {byId[lostNote.id].ro} · hạng {byId[lostNote.id].rank}{P.box[lostNote.id] ? ` (còn ${P.box[lostNote.id]} lá)` : " (đã hết lá này)"}</p><button className="chip dk" onClick={() => setLostNote(null)}>Đã hiểu</button></div></div>}
      <div className="ttrec">Hộp bài: <b>{owned.length}</b>/{deck.length} loại · {rec.w} thắng · {rec.d} hòa · {rec.l} thua</div>
      <div className="chips" style={{ justifyContent: "center" }}>{[["duel", "⚔️ Đấu bài"], ["box", "🗃️ Hộp bài"], ["odds", "🎲 Hạng thẻ"]].map(([k, l]) => <button key={k} className={`chip dk ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "odds" && <OddsTable deck={deck} />}
      {tab === "box" && <TradePanel deck={deck} box={box} busy={busy} onTrade={(r) => run("trade", { rank: r }, (j) => { sfx.win?.(); setTraded({ got: j.got, pay: j.traded }); })} />}
      {tab === "box" && <div className="ttpool">{owned.map((c) => <div key={c.id} className="ttboxc"><Card c={c} owner="me" named />{box[c.id] > 1 && <span className="ttcount">×{box[c.id]}</span>}</div>)}</div>}
      {tab === "duel" && (
        <>
          <h2 className="a22th"><span>1 · Bộ 5 thẻ của bạn</span> <small>{myDeck.length}/5 · bấm thẻ trong Hộp bài để thêm/bớt</small></h2>
          <div className="ttdecktray">
            {[0, 1, 2, 3, 4].map((k) => myDeck[k] && byId[myDeck[k]]
              ? <div key={myDeck[k]} className="ttslot full"><Card c={byId[myDeck[k]]} owner="me" badge={k + 1} onClick={() => toggle(byId[myDeck[k]], k)} /></div>
              : <div key={"e" + k} className="ttslot"><span>{k + 1}</span></div>)}
            <button className="gbtn tri ttshufbtn" disabled={busy || shuffling || owned.length < 5} onClick={shuffleDeck}><span className="c" />🔀 Xáo bài · rút 5 lá</button>
          </div>
          {shuffling && (
            <div className={`ttshow ${shufPick ? "pick" : ""}`} aria-hidden="true" onClick={(e) => e.stopPropagation()}>
              <div className="circle" /><div className="flash" />
              <div className="deck">{Array.from({ length: 18 }, (_, j) => <Card key={j} back className={j % 2 ? "r" : "l"} style={{ "--i": j, "--a": j * 20 + "deg", "--sx": ((j * 73) % 200) - 100, "--sy": ((j * 41) % 120) - 60 }} />)}</div>
              {shufPick && <div className="picked">{shufPick.map((id, k) => <div key={id} className="pk" style={{ "--k": k, "--o": k - 2, "--ec": ELEM[byId[id]?.el]?.c }}><Card c={byId[id]} owner="me" named /></div>)}</div>}
              <b className="title" lang="ja">{shufPick ? "運命の五枚" : "シャッフル"}</b>
            </div>
          )}
          <p className="hint">Bấm thẻ để thêm vào bộ bài (bấm lần nữa để bỏ). Bộ bài được lưu khi bắt đầu trận.</p>
          <div className={`ttpool ${shuffling ? "shuffling" : ""}`}>{pool.map((c, n) => { const i = myDeck.indexOf(c.id); return <div key={c.id} className={`ttpick ${i >= 0 ? "in" : ""}`} style={{ "--sx": ((n * 53) % 100) - 50, "--sy": ((n * 31) % 60) - 30, "--sr": ((n * 47) % 50) - 25, "--n": n }}><Card c={c} owner={i >= 0 ? "me" : null} badge={i >= 0 ? i + 1 : null} named onClick={() => toggle(c, i)} /></div>; })}</div>
          {owned.length < 5 && <p className="hint">Hộp bài cần ít nhất 5 thẻ.</p>}
          <details className="ttadv">
            <summary>⚙️ Nâng cao <small>{(MODES.find(([k]) => k === mode) || MODES[1])[2]} · độ khó {level === "auto" ? "tăng dần" : LEVELS[level][0]}{Object.entries(rules).some(([k, v]) => v && k !== "open") ? " · có luật thêm" : ""}</small></summary>
          <h3 className="ttadvh">Chế độ</h3>
          <div className="ttmodes" role="radiogroup">{MODES.map(([k, ico, n, d]) => (
            <button key={k} type="button" role="radio" aria-checked={mode === k} className={`ttmode ${mode === k ? "on" : ""}`} onClick={() => { setMode(k); sfx.click(); }}>
              <span className="ico">{ico}</span><b>{n}</b><small>{d}</small>
            </button>
          ))}</div>
          <div className="ttlevels" role="radiogroup" aria-label="Độ khó của máy">
            <b>Độ khó máy:</b>
            {[["auto", "📈 Tăng dần", "Đối thủ sau khó hơn đối thủ trước"], ...Object.entries(LEVELS).map(([k, [vi, ja]]) => [Number(k), vi, ja])].map(([k, n, d]) => (
              <button key={k} type="button" role="radio" aria-checked={level === k} className={`ttlv lv${k} ${level === k ? "on" : ""}`} title={d} onClick={() => { setLevel(k); sfx.click(); }}>{n}</button>
            ))}
          </div>
          <h3 className="ttadvh">Luật thêm <small>bật / tắt</small></h3>
          <div className="ttrules">{RULES.filter(([k]) => k !== "open").map(([k, n, d]) => <label key={k} className={`panel ttrule ${rules[k] ? "on" : ""}`}><input type="checkbox" checked={rules[k]} onChange={(e) => setRules((r) => ({ ...r, [k]: e.target.checked }))} /><b>{n}</b><small>{d}</small></label>)}</div>
          </details>
          <h2 className="a22th"><span>2 · Bản đồ các ải</span> <small>qua ải này mới mở ải tiếp theo</small></h2>
          <StageMap ops={OPPONENTS} beat={beat} decks={opponentDecks} levelOf={levelOf} busy={busy} canStart={myDeck.length === 5} onStart={start} />
        </>
      )}
    </div>
  );
}

// Màn chào trước trận: đối thủ lướt vào, chữ 対戦 đóng dấu
function LaunchFx({ op, me, stage }) {
  return (
    <div className="ttlaunch" aria-hidden="true">
      <div className="speed" /><div className="bolt b1" /><div className="bolt b2" />
      <div className="band" /><div className="band2" />
      <img src={opponentArt(op.char.en)} alt="" />
      <div className="me"><small>Người thách đấu</small><b>{me || "Bạn"}</b></div>
      <div className="vs">VS</div><div className="shock" /><div className="shock s2" />
      <div className="txt"><small>Ải {stage}</small><b lang="ja">対戦</b><small>{op.char.vi}</small></div>
      <div className="flash" />
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
