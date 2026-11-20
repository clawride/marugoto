"use client";
// Lượt đấu được tính trên thiết bị. Máy chủ chia bài và xác nhận kết quả cuối ván.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { charIcon, elemIcon } from "@/lib/genshin";
import { ELEM } from "@/lib/data";
import { RANKS, RANK_VI } from "@/lib/shikihime";
import { boosted, rankRangesOf, isMaxed, BOOST_COST, buildDeck, power, RANK_ODDS, OPPONENTS, stageDeck, rankIdx } from "@/lib/shikiCards";
import { DUEL_MODE, LEVELS, stageLevel, autoDuel } from "@/lib/shikiDuel";
import { opponentArt } from "@/lib/shikiDialogue";
import { unlockVoice } from "@/lib/shikiVoice";
import { sfx } from "@/lib/sfx";
import { Card } from "./Card";
import { api } from "./api";
import Arena from "./Arena";
import StageMap from "./StageMap";
import DrawCine from "./DrawCine";
import DraftShow from "./DraftShow";
import BoostPanel from "./BoostPanel";
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
  const baseDeck = useMemo(() => cfg ? buildDeck(cfg) : [], [cfg]);
  const ranges = useMemo(() => rankRangesOf(baseDeck), [baseDeck]);
  const [P, setP] = useState(null); // dữ liệu người chơi từ máy chủ
  const deck = useMemo(() => baseDeck.map((c) => boosted(c, P?.boost?.[c.id], ranges) || c), [baseDeck, P?.boost, ranges]);
  const byId = useMemo(() => Object.fromEntries(deck.map((c) => [c.id, c])), [deck]);
  const [boostId, setBoostId] = useState(null); // lá đang mở bảng cường hóa
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("duel");
  const [selectedDeck, setSelectedDeck] = useState(null);
  const actionLock = useRef(false);
  const [shuffling, setShuffling] = useState(false);
  const [poolOrder, setPoolOrder] = useState(null);
  const [flt, setFlt] = useState({ set: "all", el: "all" }); // lọc Hộp bài: bộ thẻ + nguyên tố
  const [shufPick, setShufPick] = useState(null); // 5 lá vừa rút trong màn xáo bài
  const [rules, setRules] = useState({ open: true, same: false, plus: false, combo: false, elemental: false });
  const [reveal, setReveal] = useState(null);
  const [revealKind, setRevealKind] = useState("starter"); // "starter" | "draw"
  const [cine, setCine] = useState(null);
  const [draft, setDraft] = useState(null); // { op, ids, bossRanks } — ván đầu với boss: bài do máy xáo // { ids: thẻ S/SR vừa rút, i } — màn hiệu ứng hoành tráng
  const [lostNote, setLostNote] = useState(null); // { id, why } lá vừa bị lấy
  const [traded, setTraded] = useState(null); // { got, pay } vừa đổi bài
  const showOpponents = Boolean(cfg && P?.starter && !P.match && !P.pending && !reveal && !traded && tab === "duel");
  const opponentDecks = useMemo(() => showOpponents ? OPPONENTS.map((op) => stageDeck(op, baseDeck, cfg)) : [], [showOpponents, deck, cfg]);
  const [mode, setMode] = useState("hidden"); // mặc định: Úp bài
  const [level, setLevel] = useState("auto"); // "auto" = tăng dần theo đối thủ · 1–4 = cố định
  const [claiming, setClaiming] = useState(null); // id thẻ thưởng đang thu phục
  const [launching, setLaunching] = useState(null); // đối thủ vừa chọn — màn chào trước trận
  // ——— Tự đánh / farm thẻ (chỉ ải đã thắng) ———
  const [farmSetup, setFarmSetup] = useState(null); // đối thủ đang mở bảng cài đặt tự đánh
  const [farmOpt, setFarmOpt] = useState({ n: 10, slot: 1, fast: true }); // số trận · ô thẻ thưởng (1–5) · chạy nhanh
  const [farm, setFarm] = useState(null); // { op, n, slot, fast, i, w, l, d, got[], lost[], stop, done, err }
  const farmRef = useRef(null);
  const autoNext = useRef(false); // trận sắp vào là trận tự đánh
  const farmStep = useRef(null); // id trận đã xử lý (chống gọi trùng)
  const [again, setAgain] = useState(null); // { op, deck, auto } — Đánh lại sau khi nhận thưởng
  const setFarmBoth = (f) => { farmRef.current = typeof f === "function" ? f(farmRef.current) : f; setFarm(farmRef.current); };
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(LS) || "null"); if (r) setRules(r);
      const md = localStorage.getItem(LS_MODE); if (MODES.some(([k]) => k === md)) setMode(md);
      const lv = localStorage.getItem("shiki_tt_level"); if (lv === "auto" || LEVELS[lv]) setLevel(lv === "auto" ? "auto" : Number(lv));
      const fo = JSON.parse(localStorage.getItem("shiki_tt_farm") || "null"); if (fo) setFarmOpt((o) => ({ ...o, ...fo }));
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

  // ——— vào trận · đánh lại · tự đánh (khai báo trước các màn trả về sớm để gọi được từ màn nhận thưởng / bàn đấu) ———
  const start = (op, deckIds, auto = false) => {
    const r = { ...rules, open: mode === "open" };
    autoNext.current = auto;
    try { localStorage.setItem(LS, JSON.stringify(r)); localStorage.setItem(LS_MODE, mode); localStorage.setItem("shiki_tt_level", String(level)); } catch {}
    // Màn chào đối thủ che thời gian chờ máy chủ chia bài
    unlockVoice(); // chạm "Đấu" mở khóa âm thanh cho giọng nhân vật (iPhone/Android)
    setLaunching(op.i); sfx.whoosh(); setTimeout(() => sfx.boom(), 350);
    setTimeout(() => setLaunching(null), 2300); setTimeout(() => sfx.boom(), 900); setTimeout(() => sfx.cast(), 150);
    run("start", { op: op.i, rules: r, deck: deckIds, mode: DUEL_MODE, level: level === "auto" ? undefined : level, auto: auto || undefined }, () => { setSelectedDeck(null); sfx.open(); });
  };
  // Đánh lại: cùng bộ 5 lá vừa đấu; lá nào vừa bị lấy mất thì dùng bộ bài máy chủ đã bù
  function replay(op, played, j, auto) {
    const ok = (played || []).filter((id) => j.box[id] > 0);
    const deckIds = ok.length === 5 ? ok : (j.deck || []).filter((id) => j.box[id] > 0).slice(0, 5);
    if (deckIds.length < 5) { toast("Bộ bài không còn đủ 5 lá — hãy chọn lại."); return; }
    start(op, deckIds, Boolean(auto && j.beat?.[op.i] > 0));
  }
  // ——— chuỗi tự đánh ———
  const rewardOf = (pending, slot) => pending.cards[Math.min(slot, pending.cards.length) - 1];
  // Ghi kết quả 1 trận; thắng thì nhận thẻ ở ô đã chọn. Trả về dữ liệu người chơi mới nhất.
  const farmRecord = async (j) => {
    const f = farmRef.current, res = j.result;
    let latest = j, got = null;
    if (j.pending) { got = rewardOf(j.pending, f.slot); latest = await api(profile, "claim", { card: got }); }
    setFarmBoth((x) => ({ ...x, [res]: x[res] + 1, got: got ? [...x.got, got] : x.got, lost: j.lost ? [...x.lost, j.lost] : x.lost }));
    return latest;
  };
  const farmFinish = (latest, err) => {
    setFarmBoth((x) => ({ ...x, done: true, err: err || x.err }));
    if (latest) setP(latest);
    sfx.summary?.();
  };
  const farmDeck = (latest) => { const ids = (latest.deck || []).filter((id) => latest.box[id] > 0).slice(0, 5); return ids.length === 5 ? ids : null; };
  // Xem trận: Arena tự đánh, xong trận thì về đây
  async function farmDone(j) {
    if (farmStep.current === j.id) return;
    farmStep.current = j.id;
    let latest = j;
    try { latest = await farmRecord(j); } catch (e) { farmFinish(latest, e.message); return; }
    const f = farmRef.current, deckIds = farmDeck(latest);
    if (f.stop || f.i >= f.n || !deckIds) { farmFinish(latest, !deckIds ? "Bộ bài không còn đủ 5 lá." : null); return; }
    setFarmBoth((x) => ({ ...x, i: x.i + 1 }));
    setP(latest);
    start(f.op, deckIds, true);
  }
  // Chạy nhanh: không diễn hoạt cảnh — Quân sư tính trong Web Worker, máy chủ vẫn phát lại và chấm từng ván
  const solve = (match) => new Promise((resolve, reject) => {
    let w;
    try { w = new Worker(new URL("./auto.worker.js", import.meta.url), { type: "module" }); } catch {}
    const local = () => setTimeout(() => { try { resolve(autoDuel(match)); } catch (e) { reject(e); } }, 0);
    if (!w) return local();
    w.onmessage = ({ data }) => { w.terminate(); data.error ? reject(new Error(data.error)) : resolve(data); };
    w.onerror = () => { w.terminate(); local(); };
    w.postMessage({ match });
  });
  async function farmFast(op, firstDeck) {
    const r = { ...rules, open: mode === "open" };
    let deckIds = firstDeck, latest = null;
    actionLock.current = true; setBusy(true);
    try {
      for (;;) {
        const s = await api(profile, "start", { op: op.i, rules: r, deck: deckIds, mode: DUEL_MODE, level: level === "auto" ? undefined : level, auto: true });
        latest = s;
        const { moves } = await solve(s.match);
        const fin = await api(profile, "finish", { matchId: s.match.id, moves });
        latest = await farmRecord(fin);
        setP(latest);
        const f = farmRef.current;
        deckIds = farmDeck(latest);
        if (f.stop || f.i >= f.n || !deckIds) { farmFinish(latest, !deckIds ? "Bộ bài không còn đủ 5 lá." : null); break; }
        setFarmBoth((x) => ({ ...x, i: x.i + 1 }));
      }
    } catch (e) { farmFinish(latest, e.message); }
    finally { actionLock.current = false; setBusy(false); }
  }
  const head = <><Link href="/thu-nghiem" className="back">‹ Khu Thử Nghiệm</Link><div className="pagehead"><h1>🎴 Đấu thẻ Shikihime</h1><p>Đặt thẻ lên bàn 3×3: cạnh của bạn lớn hơn cạnh kề của thẻ đối thủ thì lật thẻ đó. Đầy bàn, ai giữ nhiều thẻ hơn thắng.</p><p className="ttwarn">⚖️ Thắng: chọn lấy 1 thẻ của đối thủ · Thua: mất <b>ngẫu nhiên 1 lá</b> trong 5 lá bạn mang vào trận · Bỏ trận: mất 1 lá <b>ngẫu nhiên</b> · Hòa: không mất gì. (Hộp bài luôn được giữ tối thiểu 5 loại thẻ.)</p></div></>;
  if (!profile?.id) return <div className="tt">{head}<p className="hint" style={{ textAlign: "center" }}>🔒 Cần đăng nhập để chơi — Hộp bài và kết quả các trận được lưu trên máy chủ theo tài khoản.</p></div>;
  if (!P || !cfg) return <div className="tt">{head}<p className="hint" style={{ textAlign: "center" }}>{err || "Đang tải…"}</p></div>;

  // ——— rút khởi đầu ———
  const showCine = (ids) => {
    const top = ids.filter((id) => byId[id]?.rank === "SR").concat(ids.filter((id) => byId[id]?.rank === "S"));
    if (top.length) setCine({ ids: top, i: 0 });
  };
  if (reveal && cine && byId[cine.ids[cine.i]]) return (
    <div className="tt">
      <DrawCine card={byId[cine.ids[cine.i]]} index={cine.i} total={cine.ids.length} onNext={() => setCine((c) => (c && c.i + 1 < c.ids.length ? { ...c, i: c.i + 1 } : null))} />
    </div>
  );
  if (reveal) return (
    <div className="tt">
      <div className="pagehead"><h1>{revealKind === "draw" ? (reveal.length === 1 ? "🎴 Thẻ mới!" : `🎴 ${reveal.length} thẻ mới!`) : "🎴 Bộ bài khởi đầu"}</h1><p>{revealKind === "draw" ? "Các thẻ vừa rút đã vào Hộp bài của bạn." : "Các thẻ này đã vào Hộp bài của bạn."}</p></div>
      <div className="ttreveal">{reveal.map((id, i) => <div key={i} className={`ttrv hot-${byId[id]?.rank}`} style={{ animationDelay: `${i * Math.min(0.35, 4 / reveal.length)}s` }}><Card c={byId[id]} owner="me" named /></div>)}</div>
      <div className="btnrow"><button className="gbtn tri" onClick={() => setReveal(null)}><span className="c" />Bắt đầu đấu bài</button></div>
    </div>
  );
  if (!P.starter) return (
    <div className="tt">{head}
      <p style={{ textAlign: "center" }}>Mỗi tài khoản được rút <b>1 lần</b> 5 thẻ khởi đầu (5 thẻ khác nhau). Thẻ càng tốt càng hiếm. Sau đó đấu với các nhân vật Genshin — thắng thì được chọn lấy 1 thẻ của họ.</p>
      <OddsTable deck={deck} />
      <div className="btnrow"><button className="gbtn tri" disabled={busy} onClick={() => run("starter", {}, (j) => { sfx.open(); setRevealKind("starter"); setReveal(j.drawn); })}><span className="c" />🎴 Rút 5 thẻ khởi đầu</button></div>
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
      if (again) { const a = again; setAgain(null); setTimeout(() => replay(a.op, a.deck, j, a.auto), 0); }
    } catch (e) { setErr(e.message); toast(e.message); }
    finally { actionLock.current = false; setClaiming(null); }
  };

  // ——— nhận thưởng ———
  if (P.pending) {
    const op = OPPONENTS[P.pending.op];
    return (
      <div className="tt">
        <div className="pagehead"><h1>🏆 Thắng {op.char.vi}!</h1><p>Chọn 1 thẻ của {op.char.vi} để bỏ vào Hộp bài.{again ? " Nhận xong sẽ vào đánh lại ngay." : ""}</p></div>
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
  const farmBar = farm && !farm.done && <FarmBar farm={farm} byId={byId} onStop={() => setFarmBoth((f) => f && { ...f, stop: true })} />;
  if (P.match) {
    const mop = OPPONENTS[P.match.op], cleared = P.beat?.[P.match.op] > 0, farming = Boolean(farm && !farm.done && !farm.fast);
    const played = P.match.meAll || P.match.hands.me;
    return <>{launchFx}<Arena key={P.match.id} m0={P.match} byId={byId} profile={profile} leaving={busy}
    auto={farming || autoNext.current} canAuto={cleared} farm={farming} overlay={farmBar}
    onAgain={farming ? null : (j, wasAuto) => { setP(j); if (j.lost) setLostNote({ id: j.lost, why: "Thua trận" }); if (j.pending) setAgain({ op: mop, deck: played, auto: wasAuto }); else replay(mop, played, j, wasAuto); }}
    advisor={mode === "advisor" && !P.match.rules.open ? { cost: HINT_COST, primo: S.primo || 0, pay: () => update((s) => { if ((s.primo || 0) < HINT_COST) return false; s.primo -= HINT_COST; return true; }) } : null}
    onDone={(j) => { if (farming) { farmDone(j); return; } setP(j); if (j.lost) setLostNote({ id: j.lost, why: "Thua trận" }); }}
    onForfeit={() => { if (farming) setFarmBoth((f) => ({ ...f, stop: true, done: true, err: "Đã bỏ trận — dừng tự đánh." })); run("forfeit", { matchId: P.match.id }, (j) => j.lost && setLostNote({ id: j.lost, why: "Bỏ trận" })); }} /></>;
  }

  const box = P.box, beat = P.beat, rec = P.rec;
  const owned = deck.filter((c) => box[c.id] > 0).sort((a, b) => rankIdx(b.rank) - rankIdx(a.rank) || power(b) - power(a));
  const myDeck = (selectedDeck?.uid === profile.id ? selectedDeck.ids : P.deck).filter((id) => box[id] > 0).slice(0, 5);
  const setDeck = (ids) => setSelectedDeck({ uid: profile.id, ids });
  const maxBeat = Math.max(-1, ...Object.keys(beat).map(Number));
  const unlocked = (op) => op.i <= maxBeat + 1; // eslint-disable-line no-unused-vars
  const pass = (c) => (flt.set === "all" || (flt.set === "gi") === !!c.gi) && (flt.el === "all" || c.el === flt.el);
  const view = owned.filter(pass);
  const giOwned = owned.filter((c) => c.gi).length;
  const filterBar = (
    <div className="ttfilter">
      {[["all", `Tất cả (${owned.length})`], ["gi", `⭐ Genshin (${giOwned})`], ["shiki", `式 Shikihime (${owned.length - giOwned})`]].map(([k, l]) => <button key={k} className={`chip dk ${flt.set === k ? "on" : ""}`} onClick={() => setFlt((x) => ({ ...x, set: k }))}>{l}</button>)}
      <span style={{ width: 8 }} />
      {["all", "pyro", "hydro", "anemo", "electro", "dendro", "cryo", "geo"].map((el) => <button key={el} className={`chip dk ${flt.el === el ? "on" : ""}`} onClick={() => setFlt((x) => ({ ...x, el }))} title={el === "all" ? "Mọi nguyên tố" : ELEM[el]?.vi}>{el === "all" ? "Mọi hệ" : <img src={elemIcon(el)} alt={ELEM[el]?.vi} style={{ width: 18, height: 18, verticalAlign: "middle" }} />}</button>)}
    </div>
  );
  const pool = poolOrder ? [...view].sort((a, b) => poolOrder.indexOf(a.id) - poolOrder.indexOf(b.id)) : view;
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
  // ván đầu với boss: hỏi máy chủ bộ bài đã xáo; đã đấu boss này rồi thì vào trận như bình thường
  const openFirst = async (op) => {
    if (busy) return;
    try {
      const j = await api(profile, "firstDeck", { op: op.i, mode: DUEL_MODE });
      setP(j);
      if (j.free) start(op, myDeck); else setDraft({ op, ids: j.draft, bossRanks: j.bossRanks });
    } catch (e) { toast(e.message); }
  };
  const levelOf = (op) => (level === "auto" ? stageLevel(op, cfg) : level);
  const beginFarm = (op) => {
    const o = { n: Math.max(1, Math.min(999, Math.floor(Number(farmOpt.n) || 1))), slot: Math.max(1, Math.min(5, Number(farmOpt.slot) || 1)), fast: !!farmOpt.fast };
    try { localStorage.setItem("shiki_tt_farm", JSON.stringify(o)); localStorage.setItem(LS, JSON.stringify({ ...rules, open: mode === "open" })); localStorage.setItem(LS_MODE, mode); } catch {}
    setFarmSetup(null); setLostNote(null); farmStep.current = null; unlockVoice();
    setFarmBoth({ op, ...o, i: 1, w: 0, l: 0, d: 0, got: [], lost: [], stop: false, done: false, err: null });
    if (o.fast) farmFast(op, myDeck); else start(op, myDeck, true);
  };
  return (
    <div className="tt">{head}{launchFx}{farmBar}
      {farm?.done && <FarmSummary farm={farm} byId={byId} busy={busy} onClose={() => setFarmBoth(null)} onAgain={() => { const op = farm.op; setFarmBoth(null); setFarmSetup(op); }} />}
      {farmSetup && <FarmSetup op={farmSetup} boss={stageDeck(farmSetup, baseDeck, cfg)} opt={farmOpt} setOpt={setFarmOpt} canStart={myDeck.length === 5} busy={busy} onCancel={() => setFarmSetup(null)} onGo={() => beginFarm(farmSetup)} />}
      {lostNote && byId[lostNote.id] && <div className="panel ttlost"><Card c={byId[lostNote.id]} owner="foe" small /><div><b>{lostNote.why}: bạn bị lấy mất 1 lá</b><p>{byId[lostNote.id].name} · {byId[lostNote.id].ro} · hạng {byId[lostNote.id].rank}{P.box[lostNote.id] ? ` (còn ${P.box[lostNote.id]} lá)` : " (đã hết lá này)"}</p><button className="chip dk" onClick={() => setLostNote(null)}>Đã hiểu</button></div></div>}
      {P.draws > 0 && <div className="panel ttdraws"><span>🎟️ Bạn có <b>{P.draws}</b> lượt rút thẻ</span><button className="gbtn tri" disabled={busy} onClick={() => run("draw", {}, (j) => { sfx.reveal(4); setRevealKind("draw"); setReveal(j.drawn); showCine(j.drawn); })}><span className="c" />🎴 Rút 1 thẻ</button>{P.draws > 1 && <button className="gbtn tri" disabled={busy} onClick={() => run("draw", { all: true }, (j) => { sfx.meteor(5); setRevealKind("draw"); setReveal(j.drawn); showCine(j.drawn); })}><span className="c" />✨ Rút tất cả ({P.draws})</button>}</div>}
      <div className="ttrec">Hộp bài: <b>{owned.length}</b>/{deck.length} loại · {rec.w} thắng · {rec.d} hòa · {rec.l} thua</div>
      <div className="chips" style={{ justifyContent: "center" }}>{[["duel", "⚔️ Đấu bài"], ["box", "🗃️ Hộp bài"], ["odds", "🎲 Hạng thẻ"]].map(([k, l]) => <button key={k} className={`chip dk ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "odds" && <OddsTable deck={deck} />}
      {tab === "box" && <TradePanel deck={deck} box={box} busy={busy} onTrade={(r) => run("trade", { rank: r }, (j) => { sfx.win?.(); setTraded({ got: j.got, pay: j.traded }); })}
        onTradeAll={() => run("tradeAll", {}, (j) => { sfx.reveal(4); toast(`Đã đổi ${j.paid} lá trùng lấy ${j.gots.length} lá mới`); setRevealKind("draw"); setReveal(j.gots); showCine(j.gots); })} />}
      {tab === "box" && filterBar}
      {tab === "box" && <p className="hint" style={{ textAlign: "center" }}>⬆️ Bấm vào một lá để <b>cường hóa</b>: hủy {BOOST_COST} lá trùng → +1 điểm vào một cạnh ngẫu nhiên. Đủ điểm là lá thăng hạng, lá F cũng có thể lên tới SR.</p>}
      {tab === "box" && <div className="ttpool">{view.map((c) => <div key={c.id} className={`ttboxc ${box[c.id] >= BOOST_COST + 1 && !isMaxed(c) ? "canboost" : ""}`}><Card c={c} owner="me" named onClick={() => { setBoostId(c.id); sfx.click(); }} />{box[c.id] > 1 && <span className="ttcount">×{box[c.id]}</span>}{c.boost && <span className="ttboostlv">⬆{Object.values(c.boost).reduce((a, v) => a + v, 0)}</span>}{box[c.id] >= BOOST_COST + 1 && !isMaxed(c) && <span className="ttcanup" aria-hidden="true">⬆️</span>}</div>)}</div>}
      {boostId && byId[boostId] && box[boostId] > 0 && <BoostPanel c={byId[boostId]} count={box[boostId]} ranges={ranges} busy={busy} onClose={() => setBoostId(null)}
        onBoost={async (id) => { const j = await run("boost", { card: id }); return j?.boosted || null; }} />}
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
          {filterBar}
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
          <StageMap ops={OPPONENTS} beat={beat} tried={P.tried || []} decks={opponentDecks} levelOf={levelOf} busy={busy} canStart={myDeck.length === 5 && !(farm && !farm.done)} onStart={(op) => start(op, myDeck)} onFirst={openFirst} onAuto={(op) => { setFarmSetup(op); sfx.open(); }} />
          {draft && <DraftShow op={draft.op} ids={draft.ids} bossRanks={draft.bossRanks} byId={byId} busy={busy} onCancel={() => { setDraft(null); sfx.click(); }} onPlay={() => { const op = draft.op; setDraft(null); start(op, myDeck); }} />}
        </>
      )}
    </div>
  );
}

// Bảng cài đặt tự đánh: số trận, lấy thẻ thưởng ở ô nào, xem trận hay chạy nhanh
function FarmSetup({ op, boss, opt, setOpt, canStart, busy, onCancel, onGo }) {
  const set = (k, v) => setOpt((o) => ({ ...o, [k]: v }));
  return (
    <div className="sm-pop" onClick={onCancel} role="dialog" aria-modal="true" aria-label={`Tự đánh ${op.char.vi}`}>
      <div className="sm-popcard ttfarmset" onClick={(e) => e.stopPropagation()}>
        <button className="sm-x" onClick={onCancel} aria-label="Đóng">✕</button>
        <small className="sm-stage">Ải {op.i + 1} · đã thắng</small>
        <h3>🤖 Tự đánh {op.char.vi}</h3>
        <p className="sm-note">Quân sư đánh thay bộ 5 lá đang chọn ở bước 1. Luật như đánh tay: thắng nhận 1 thẻ của boss, thua mất ngẫu nhiên 1 lá trong 5 lá mang vào trận, hòa không mất gì.</p>
        <h4>🎁 Thắng thì lấy thẻ ở ô số</h4>
        <div className="ttfarmslots" role="radiogroup" aria-label="Ô thẻ thưởng">{boss.map((c, k) => (
          <button key={c.id} type="button" role="radio" aria-checked={opt.slot === k + 1} className={`ttfarmslot ${opt.slot === k + 1 ? "on" : ""}`} onClick={() => { set("slot", k + 1); sfx.click(); }}>
            <b>{k + 1}</b><Card c={c} owner={opt.slot === k + 1 ? "me" : "foe"} small /><small>{c.name}</small>
          </button>
        ))}</div>
        <h4>🔁 Số trận</h4>
        <div className="ttfarmn">
          {[1, 5, 10, 20, 50].map((n) => <button key={n} type="button" className={`chip dk ${Number(opt.n) === n ? "on" : ""}`} onClick={() => set("n", n)}>{n === 1 ? "1 trận" : n}</button>)}
          <label>Tự nhập <input type="number" min="1" max="999" value={opt.n} onChange={(e) => set("n", e.target.value)} /></label>
        </div>
        <h4>🎬 Cách chạy</h4>
        <div className="ttfarmn">
          <button type="button" className={`chip dk ${opt.fast ? "on" : ""}`} onClick={() => set("fast", true)}>⚡ Chạy nhanh (bỏ hoạt cảnh)</button>
          <button type="button" className={`chip dk ${!opt.fast ? "on" : ""}`} onClick={() => set("fast", false)}>👀 Xem từng trận</button>
        </div>
        <button className="sm-play sm-auto" disabled={busy || !canStart} onClick={onGo}>🤖 BẮT ĐẦU {Number(opt.n) > 1 ? `${Math.floor(Number(opt.n))} TRẬN` : "TỰ ĐÁNH"}</button>
        {!canStart && <p className="sm-note">Cần chọn đủ 5 thẻ ở bước 1.</p>}
      </div>
    </div>
  );
}

const ranksOf = (ids, byId) => ids.map((id, k) => <span key={k} className={`ttrk r-${byId[id]?.rank}`} title={byId[id]?.name}>{byId[id]?.rank}</span>);
// Thanh tiến độ khi đang tự đánh lặp lại
function FarmBar({ farm, byId, onStop }) {
  return (
    <div className="tt ttfarmbar" role="status" aria-live="polite">
      <span>🤖 <b>{farm.op.char.vi}</b> · trận <b>{farm.i}/{farm.n}</b></span>
      <span className="bar"><i style={{ width: `${((farm.w + farm.l + farm.d) / farm.n) * 100}%` }} /></span>
      <span>✔ {farm.w} · ✖ {farm.l} · ＝ {farm.d}</span>
      {farm.got.length > 0 && <span className="got">🎁 {ranksOf(farm.got.slice(-12), byId)}{farm.got.length > 12 && <small>+{farm.got.length - 12}</small>}</span>}
      <button onClick={onStop} disabled={farm.stop}>{farm.stop ? "Dừng sau trận này…" : "⏹ Dừng"}</button>
    </div>
  );
}
// Tổng kết chuỗi tự đánh
function FarmSummary({ farm, byId, busy, onClose, onAgain }) {
  const played = farm.w + farm.l + farm.d;
  return (
    <div className="panel ttfarmsum" role="status">
      <h3>🤖 Tự đánh {farm.op.char.vi}: xong {played}/{farm.n} trận</h3>
      <p>✔ Thắng <b>{farm.w}</b> · ✖ Thua <b>{farm.l}</b> · ＝ Hòa <b>{farm.d}</b>{farm.err ? <> · <span className="ttwarn">⚠️ {farm.err}</span></> : farm.stop && played < farm.n ? " · đã dừng theo yêu cầu" : ""}</p>
      {farm.got.length > 0 && <><b>🎁 Nhận được {farm.got.length} thẻ</b><div className="ttfarmcards">{farm.got.map((id, k) => byId[id] && <Card key={k} c={byId[id]} owner="me" small />)}</div></>}
      {farm.lost.length > 0 && <><b>💔 Bị lấy mất {farm.lost.length} lá</b><div className="ttfarmcards">{farm.lost.map((id, k) => byId[id] && <Card key={k} c={byId[id]} owner="foe" small />)}</div></>}
      <div className="btnrow"><button className="gbtn tri" disabled={busy} onClick={onAgain}><span className="c" />🔁 Tự đánh tiếp</button><button className="chip dk" onClick={onClose}>Đóng</button></div>
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
function TradePanel({ deck, box, busy, onTrade, onTradeAll }) {
  const rows = RANKS.slice(0, -1).map((r, i) => ({ r, next: RANKS[i + 1], n: deck.filter((c) => c.rank === r).reduce((a, c) => a + Math.max(0, (box[c.id] || 0) - 1), 0) }));
  return (
    <div className="panel ttodds">
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>✨ Đổi bài</h3>
        <button className="gbtn tri" disabled={busy || !rows.some((x) => x.n >= 5)} onClick={onTradeAll} style={{ marginLeft: "auto" }}><span className="c" />⚡ Đổi nhanh tất cả</button>
      </div>
      <p className="hint">5 lá trùng cùng hạng đổi lấy 1 lá ngẫu nhiên hạng kế trên. Lá trùng = bản thứ 2 trở đi của một thẻ (luôn giữ lại 1 bản mỗi thẻ). Thẻ yếu được dùng trước.</p>
      <div className="tttrade">{rows.map(({ r, next, n }) => (
        <div key={r} className={`tttr ${n >= 5 ? "ok" : ""}`}>
          <span className={`ttrk r-${r}`}>{r}</span><small>{n} lá trùng</small>
          <button className="chip dk" disabled={busy || n < 5} onClick={() => onTrade(r)}>Đổi 5 → 1 <span className={`ttrk r-${next}`}>{next}</span></button>
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
