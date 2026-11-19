"use client";
// 🧪 Đấu thẻ Shikihime (thử nghiệm) — luật kiểu thẻ bài 3×3 (lib/shikiCards.js)
// MÁY CHỦ quyết định mọi thứ (app/api/shiki/play): rút khởi đầu, Hộp bài, chia bài đối thủ, từng nước đi + nước của máy, kết quả, thẻ thưởng.
// Trang này chỉ gửi lệnh rồi hiển thị (kèm hiệu ứng từng bước). Cần đăng nhập (dữ liệu lưu theo tài khoản trên máy chủ).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { elemIcon, charIcon } from "@/lib/genshin";
import { RANKS, RANK_VI } from "@/lib/shikihime";
import { buildDeck, power, sideVal, showNum, RANK_ODDS, OPPONENTS, oppDeck, rankIdx } from "@/lib/shikiCards";
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(profile, action, body = {}) {
  const r = await fetch("/api/shiki/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: profile?.id, token: profile?.token, action, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Lỗi ${r.status}`);
  return j;
}

export default function CardGamePage() {
  const { S, toast } = useGame();
  const [cfg, setCfg] = useState(null);
  useEffect(() => { fetch("/api/shiki").then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then(setCfg); }, []);
  const deck = useMemo(() => buildDeck(cfg), [cfg]);
  const byId = useMemo(() => Object.fromEntries(deck.map((c) => [c.id, c])), [deck]);
  const [P, setP] = useState(null); // dữ liệu người chơi từ máy chủ
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("duel");
  const [rules, setRules] = useState({ open: true, same: false, plus: false, combo: false, elemental: false });
  const [reveal, setReveal] = useState(null);
  const [live, setLive] = useState(null); // { steps, first } của lệnh start
  const profile = S?.profile;
  useEffect(() => { try { const r = JSON.parse(localStorage.getItem(LS) || "null"); if (r) setRules(r); } catch {} }, []);
  useEffect(() => { if (profile?.id) api(profile, "state").then(setP).catch((e) => setErr(e.message)); }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!S) return null;
  const run = async (action, body, after) => {
    setBusy(true); setErr("");
    try { const j = await api(profile, action, body); setP(j); after?.(j); return j; }
    catch (e) { setErr(e.message); toast(e.message); } finally { setBusy(false); }
  };

  const head = <><Link href="/thu-nghiem" className="back">‹ Khu Thử Nghiệm</Link><div className="pagehead"><h1>🎴 Đấu thẻ Shikihime</h1><p>Đặt thẻ lên bàn 3×3: cạnh của bạn lớn hơn cạnh kề của thẻ đối thủ thì lật thẻ đó. Đầy bàn, ai giữ nhiều thẻ hơn thắng.</p></div></>;
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
  if (P.match) return <Match key={P.match.op + "-" + P.rec.w + P.rec.l + P.rec.d} m0={P.match} live={live} byId={byId} profile={profile} onDone={(j) => { setLive(null); setP(j); }} onForfeit={() => { setLive(null); run("forfeit"); }} />;

  const box = P.box, beat = P.beat, rec = P.rec;
  const owned = deck.filter((c) => box[c.id] > 0).sort((a, b) => rankIdx(b.rank) - rankIdx(a.rank) || power(b) - power(a));
  const myDeck = P.deck.filter((id) => box[id] > 0).slice(0, 5);
  const setDeck = (ids) => { setP({ ...P, deck: ids }); api(profile, "deck", { deck: ids }).then(setP).catch((e) => toast(e.message)); };
  const unlocked = (op) => op.i === 0 || (beat[op.i - 1] || 0) > 0;
  const start = (op) => { try { localStorage.setItem(LS, JSON.stringify(rules)); } catch {} run("start", { op: op.i, rules }, (j) => { sfx.open(); setLive({ steps: j.steps || [], first: j.first }); }); };
  return (
    <div className="tt">{head}
      <div className="ttrec">Hộp bài: <b>{owned.length}</b>/{deck.length} loại · {rec.w} thắng · {rec.d} hòa · {rec.l} thua</div>
      <div className="chips" style={{ justifyContent: "center" }}>{[["duel", "⚔️ Đấu bài"], ["box", "🗃️ Hộp bài"], ["odds", "🎲 Hạng thẻ"]].map(([k, l]) => <button key={k} className={`chip dk ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "odds" && <OddsTable deck={deck} />}
      {tab === "box" && <div className="ttpool">{owned.map((c) => <div key={c.id} className="ttboxc"><Card c={c} owner="me" named />{box[c.id] > 1 && <span className="ttcount">×{box[c.id]}</span>}</div>)}</div>}
      {tab === "duel" && (
        <>
          <h2 className="a22th"><span>1 · Bộ 5 thẻ của bạn</span> <small>{myDeck.length}/5 · bấm thẻ trong Hộp bài để thêm/bớt</small></h2>
          <div className="ttpool">{owned.map((c) => { const i = myDeck.indexOf(c.id); return <Card key={c.id} c={c} owner={i >= 0 ? "me" : null} badge={i >= 0 ? i + 1 : null} named onClick={() => { setDeck(i >= 0 ? myDeck.filter((x) => x !== c.id) : myDeck.length < 5 ? [...myDeck, c.id] : myDeck); sfx.click(); }} />; })}</div>
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


// Trận đấu: hiển thị theo trạng thái máy chủ; mỗi nước đi gửi lên, nhận về các bước (của bạn rồi của máy) để chạy hiệu ứng
function Match({ m0, live, byId, profile, onDone, onForfeit }) {
  const op = OPPONENTS[m0.op];
  const [cells, setCells] = useState(() => (live?.steps?.length ? undo(m0.cells, live.steps) : m0.cells));
  const [hands, setHands] = useState(() => (live?.steps?.length ? { me: m0.hands.me, foe: Array.isArray(m0.hands.foe) ? [...m0.hands.foe, ...live.steps.map((s) => s.id)] : m0.hands.foe + live.steps.length } : m0.hands));
  const [turn, setTurn] = useState(live?.steps?.length ? "foe" : m0.turn);
  const [sel, setSel] = useState(null);
  const [fx, setFx] = useState({});
  const [last, setLast] = useState(null);
  const [msg, setMsg] = useState(live?.first === "foe" ? `${op.char.vi} đi trước.` : "Bạn đi trước.");
  const [end, setEnd] = useState(null); // { result, score, data }
  const [busy, setBusy] = useState(false);
  const name = (who) => (who === "me" ? "Bạn" : op.char.vi);
  const sc = { me: 0, foe: 0 }; for (const c of cells) if (c) sc[c.owner]++; sc.me += hands.me.length; sc.foe += Array.isArray(hands.foe) ? hands.foe.length : hands.foe;

  // chạy lần lượt các bước nhận từ máy chủ
  async function play(steps) {
    for (const st of steps) {
      if (st.who === "foe") { setTurn("foe"); await sleep(700); }
      setCells((cs) => { const n = cs.slice(); n[st.cell] = { id: st.id, owner: st.who }; for (const f of st.flips) n[f.i] = { ...n[f.i], owner: st.who }; return n; });
      setHands((h) => ({ ...h, [st.who]: st.who === "me" ? h.me.filter((id, k) => k !== h.me.indexOf(st.id)) : Array.isArray(h.foe) ? h.foe.filter((id, k) => k !== h.foe.indexOf(st.id)) : h.foe - 1 }));
      setFx(Object.fromEntries(st.flips.map((f) => [f.i, f.by]))); setLast(st.cell);
      const special = [...new Set(st.flips.map((f) => f.by).filter((b) => b !== "basic"))];
      const by = { same: "Bằng nhau!", plus: "Cộng!", combo: "Liên hoàn!" };
      setMsg(`${name(st.who)} đặt ${byId[st.id]?.name}${st.flips.length ? ` — lật ${st.flips.length} thẻ` : ""}${special.length ? ` · ${special.map((b) => by[b]).join(" ")}` : ""}`);
      if (st.flips.length) sfx.click();
      await sleep(450);
    }
    setTurn("me");
  }
  useEffect(() => { if (live?.steps?.length) play(live.steps); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clickCell = async (i) => {
    if (turn !== "me" || cells[i] || sel == null || busy || end) return;
    setBusy(true); setSel(null);
    try {
      const j = await api(profile, "move", { hand: sel, cell: i });
      setTurn("anim");
      await play(j.steps);
      if (j.result) { setEnd({ result: j.result, score: j.score, data: j }); if (j.result === "w") sfx.win?.(); }
      else if (j.match) { setCells(j.match.cells); setHands(j.match.hands); }
    } catch (e) { setMsg(`⚠ ${e.message}`); }
    setBusy(false);
  };

  return (
    <div className="tt">
      <button className="back" onClick={() => { if (end) onDone(end.data); else if (confirm("Bỏ trận? Trận này sẽ tính là thua.")) onForfeit(); }}>‹ {end ? "Về danh sách" : "Bỏ trận"}</button>
      <div className="ttvs"><img src={charIcon(op.char)} alt="" /><div><b>{op.char.vi}</b><small>“{op.line}”</small></div></div>
      <div className="ttscore"><span className="me">🟦 Bạn <b>{sc.me}</b></span><span className="ttmsg">{end ? "" : turn === "me" ? (sel != null ? "Chọn ô trống để đặt thẻ" : "Chọn một thẻ trên tay") : `${op.char.vi} đang đi…`}</span><span className="foe"><b>{sc.foe}</b> {op.char.vi} 🟥</span></div>
      <div className="tttable">
        <div className="tthand foe">{Array.isArray(hands.foe) ? hands.foe.map((id, k) => <Card key={k} c={byId[id]} owner="foe" small />) : Array.from({ length: hands.foe }, (_, k) => <Card key={k} back small />)}</div>
        <div className="ttboard">
          {cells.map((cell, i) => (
            <div key={i} className={`ttcell ${!cell && turn === "me" && sel != null ? "can" : ""}`} onClick={() => clickCell(i)}>
              {m0.els[i] && <img className={`ttcellel ${cell ? "dim" : ""}`} src={elemIcon(m0.els[i])} alt={ELEM[m0.els[i]]?.vi} />}
              {cell && <Card key={`${i}-${cell.owner}`} c={byId[cell.id]} owner={cell.owner} el={m0.els[i]} flip={fx[i] ? "x" : null} />}
              {last === i && <span className="ttlast" key={`l${i}-${msg}`} />}
            </div>
          ))}
        </div>
        <div className="tthand me">{hands.me.map((id, k) => <Card key={k} c={byId[id]} owner="me" sel={sel === k} onClick={() => { if (turn === "me" && !end && !busy) { setSel(sel === k ? null : k); sfx.click(); } }} small />)}</div>
      </div>
      <p className="ttlog">{msg}</p>
      {end && (
        <div className="panel result">
          <h2>{end.result === "w" ? "🏆 Bạn thắng!" : end.result === "l" ? "💀 Bạn thua…" : "🤝 Hòa!"}</h2>
          <div className="score">{end.score.me}<small> : {end.score.foe}</small></div>
          <div className="btnrow"><button className="gbtn tri" onClick={() => onDone(end.data)}><span className="c" />{end.result === "w" ? `🎁 Chọn 1 thẻ của ${op.char.vi}` : "Về danh sách đối thủ"}</button></div>
        </div>
      )}
    </div>
  );
}
// trạng thái bàn trước các bước (để chạy lại hiệu ứng nước đi đầu tiên của máy)
function undo(cells, steps) {
  const n = cells.slice();
  for (const st of [...steps].reverse()) { n[st.cell] = null; for (const f of st.flips) if (n[f.i]) n[f.i] = { ...n[f.i], owner: st.who === "me" ? "foe" : "me" }; }
  return n;
}
