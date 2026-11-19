"use client";
// Lượt đấu được tính trên thiết bị. Máy chủ chia bài và xác nhận kết quả cuối ván.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { charIcon } from "@/lib/genshin";
import { RANKS, RANK_VI } from "@/lib/shikihime";
import { buildDeck, power, RANK_ODDS, OPPONENTS, oppDeck, rankIdx } from "@/lib/shikiCards";
import { DUEL_MODE } from "@/lib/shikiDuel";
import { opponentArt } from "@/lib/shikiDialogue";
import { sfx } from "@/lib/sfx";
import { Card } from "./Card";
import { api } from "./api";
import Arena from "./Arena";
import "./cards.css";
import "./arena.css";

const FONTS = "https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Yuji+Syuku&family=Zen+Maru+Gothic:wght@700&display=swap";

const RULES = [
  ["open", "Lật bài", "Thấy bài trên tay đối thủ"],
  ["same", "Bằng nhau", "Đặt thẻ có ≥2 cạnh BẰNG cạnh thẻ kề → lật các thẻ đối thủ đó"],
  ["plus", "Cộng", "≥2 cặp cạnh kề có TỔNG bằng nhau → lật các thẻ đối thủ đó"],
  ["combo", "Liên hoàn", "Thẻ vừa bị lật bởi Bằng nhau/Cộng tiếp tục lật thẻ bên cạnh"],
  ["elemental", "Nguyên tố", "Ô có biểu tượng nguyên tố: thẻ cùng hệ +1 mỗi cạnh, khác hệ −1"],
];
const LS = "shiki_tt_rules";
const LS_MODE = "shiki_tt_mode";
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
  const [rules, setRules] = useState({ open: true, same: false, plus: false, combo: false, elemental: false });
  const [reveal, setReveal] = useState(null);
  const [lostNote, setLostNote] = useState(null); // { id, why } lá vừa bị lấy
  const [traded, setTraded] = useState(null); // { got, pay } vừa đổi bài
  const showOpponents = Boolean(cfg && P?.starter && !P.match && !P.pending && !reveal && !traded && tab === "duel");
  const opponentDecks = useMemo(() => showOpponents ? OPPONENTS.map((op) => oppDeck(op, deck)) : [], [showOpponents, deck]);
  const [mode, setMode] = useState("open");
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(LS) || "null"); if (r) setRules(r);
      const md = localStorage.getItem(LS_MODE); if (MODES.some(([k]) => k === md)) setMode(md);
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
  if (P.match) return <Arena key={P.match.id} m0={P.match} byId={byId} profile={profile} leaving={busy}
    advisor={mode === "advisor" && !P.match.rules.open ? { cost: HINT_COST, primo: S.primo || 0, pay: () => update((s) => { if ((s.primo || 0) < HINT_COST) return false; s.primo -= HINT_COST; return true; }) } : null}
    onDone={(j) => { setP(j); if (j.lost) setLostNote({ id: j.lost, why: "Thua trận" }); }}
    onForfeit={() => run("forfeit", { matchId: P.match.id }, (j) => j.lost && setLostNote({ id: j.lost, why: "Bỏ trận" }))} />;

  const box = P.box, beat = P.beat, rec = P.rec;
  const owned = deck.filter((c) => box[c.id] > 0).sort((a, b) => rankIdx(b.rank) - rankIdx(a.rank) || power(b) - power(a));
  const myDeck = (selectedDeck?.uid === profile.id ? selectedDeck.ids : P.deck).filter((id) => box[id] > 0).slice(0, 5);
  const setDeck = (ids) => setSelectedDeck({ uid: profile.id, ids });
  const unlocked = (op) => op.i === 0 || (beat[op.i - 1] || 0) > 0;
  const pool = poolOrder ? [...owned].sort((a, b) => poolOrder.indexOf(a.id) - poolOrder.indexOf(b.id)) : owned;
  // Xáo cả Hộp bài rồi rút ngẫu nhiên 5 lá làm bộ bài
  const shuffleDeck = () => {
    if (busy || shuffling || owned.length < 5) return;
    setShuffling(true); sfx.shuffle();
    setTimeout(() => {
      const ids = owned.map((c) => c.id).sort(() => Math.random() - 0.5);
      setPoolOrder(ids); setDeck(ids.slice(0, 5)); setShuffling(false);
      for (let i = 0; i < 5; i++) sfx.deal(i);
    }, 1000);
  };
  const toggle = (c, i) => { if (busy || shuffling) return; setDeck(i >= 0 ? myDeck.filter((x) => x !== c.id) : myDeck.length < 5 ? [...myDeck, c.id] : myDeck); i >= 0 ? sfx.click() : sfx.deal(); };
  const start = (op) => {
    const r = { ...rules, open: mode === "open" };
    try { localStorage.setItem(LS, JSON.stringify(r)); localStorage.setItem(LS_MODE, mode); } catch {}
    run("start", { op: op.i, rules: r, deck: myDeck, mode: DUEL_MODE }, () => { setSelectedDeck(null); sfx.open(); }); };
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
          <div className="ttdecktray">
            {[0, 1, 2, 3, 4].map((k) => myDeck[k] && byId[myDeck[k]]
              ? <div key={myDeck[k]} className="ttslot full"><Card c={byId[myDeck[k]]} owner="me" badge={k + 1} onClick={() => toggle(byId[myDeck[k]], k)} /></div>
              : <div key={"e" + k} className="ttslot"><span>{k + 1}</span></div>)}
            <button className="gbtn tri ttshufbtn" disabled={busy || shuffling || owned.length < 5} onClick={shuffleDeck}><span className="c" />🔀 Xáo bài · rút 5 lá</button>
          </div>
          <p className="hint">Bấm thẻ để thêm vào bộ bài (bấm lần nữa để bỏ). Bộ bài được lưu khi bắt đầu trận.</p>
          <div className={`ttpool ${shuffling ? "shuffling" : ""}`}>{pool.map((c, n) => { const i = myDeck.indexOf(c.id); return <div key={c.id} className={`ttpick ${i >= 0 ? "in" : ""}`} style={{ "--sx": ((n * 53) % 100) - 50, "--sy": ((n * 31) % 60) - 30, "--sr": ((n * 47) % 50) - 25, "--n": n }}><Card c={c} owner={i >= 0 ? "me" : null} badge={i >= 0 ? i + 1 : null} named onClick={() => toggle(c, i)} /></div>; })}</div>
          {owned.length < 5 && <p className="hint">Hộp bài cần ít nhất 5 thẻ.</p>}
          <h2 className="a22th"><span>2 · Chế độ</span> <small>chọn 1</small></h2>
          <div className="ttmodes" role="radiogroup">{MODES.map(([k, ico, n, d]) => (
            <button key={k} type="button" role="radio" aria-checked={mode === k} className={`ttmode ${mode === k ? "on" : ""}`} onClick={() => { setMode(k); sfx.click(); }}>
              <span className="ico">{ico}</span><b>{n}</b><small>{d}</small>
            </button>
          ))}</div>
          <h2 className="a22th"><span>3 · Luật thêm</span> <small>bật / tắt</small></h2>
          <div className="ttrules">{RULES.filter(([k]) => k !== "open").map(([k, n, d]) => <label key={k} className={`panel ttrule ${rules[k] ? "on" : ""}`}><input type="checkbox" checked={rules[k]} onChange={(e) => setRules((r) => ({ ...r, [k]: e.target.checked }))} /><b>{n}</b><small>{d}</small></label>)}</div>
          <h2 className="a22th"><span>4 · Chọn đối thủ</span> <small>thắng người trước để mở người sau</small></h2>
          <div className="ttops">
            {OPPONENTS.map((op) => {
              const open = unlocked(op), od = opponentDecks[op.i];
              return (
                <div key={op.i} className={`panel ttop ${open ? "" : "locked"}`}>
                  <img className="ttav bust" src={opponentArt(op.char.en)} onError={(e) => { e.currentTarget.src = charIcon(op.char); }} alt={op.char.vi} loading="lazy" decoding="async" />
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
