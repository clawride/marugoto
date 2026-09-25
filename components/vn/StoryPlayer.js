"use client";
// Trình phát galgame: cảnh nền · nhân vật · khung thoại (Nhật / romaji / dịch) · lựa chọn · nhật ký & cây hội thoại (xem lại, nhảy tới) · script + ngữ pháp
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CHARS, charSplash, charIcon } from "@/lib/genshin";
import { ELEM } from "@/lib/data";
import { sceneOf, speakerName, chapterOpen, vnOf, STORY_REWARD, TIERS } from "@/lib/vn";
import { useVN, useGrammar, Line, GrammarCard, GrammarList, VNSettings, pick, say } from "@/components/vn/VNParts";
import { useStory, LockedNote } from "@/components/vn/StoryHub";
import { stopSpeak } from "@/lib/tts";
import { sfx } from "@/lib/sfx";
import { Ico } from "@/components/Icons";

// đường đi ngắn nhất từ node đầu tới một node (để nhảy tới node đã xem)
function pathTo(nodes, target) {
  const by = new Map(nodes.map((n) => [n.id, n]));
  const prev = new Map([[nodes[0].id, null]]), q = [nodes[0].id];
  while (q.length) {
    const id = q.shift();
    if (id === target) break;
    const n = by.get(id);
    for (const [k, nx] of [[-1, n?.next], ...(n?.choices || []).map((c, i) => [i, c.next])]) if (nx && !prev.has(nx)) { prev.set(nx, { id, k }); q.push(nx); }
  }
  if (!prev.has(target)) return null;
  // dựng lại đường đi; pick của mỗi node = lựa chọn đã dùng để sang node kế tiếp (-1 nếu đi thẳng)
  const ids = [];
  for (let cur = target; cur; cur = prev.get(cur)?.id || null) ids.unshift(cur);
  return ids.map((nid, i) => ({ id: nid, pick: i < ids.length - 1 ? prev.get(ids[i + 1]).k : -1 }));
}

export default function StoryPlayer({ id, c: chN }) {
  const c = CHARS.find((x) => x.id === +id);
  const { S, update, set, tier } = useVN();
  const D = useStory(id);
  const G = useGrammar();
  const C = D?.chapters?.find((x) => x.c === +chN);
  const nodes = C?.nodes || [];
  const by = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [hist, setHist] = useState([]); // [{id, pick}] — pick = lựa chọn đã chọn tại node đó (-1 nếu không)
  const [panel, setPanel] = useState(null); // "log" | "tree" | "script" | "set"
  const [gram, setGram] = useState(null);
  const [fin, setFin] = useState(null);
  useEffect(() => { if (nodes.length) { setHist([{ id: nodes[0].id, pick: -1 }]); setFin(null); } }, [C]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = hist.length ? by.get(hist[hist.length - 1].id) : null;
  const seen = new Set([...(vnOf(S, +id).seen?.[chN] || []), ...hist.map((h) => h.id)]);

  // đọc tiếng Nhật tự động
  useEffect(() => { if (cur && set.tts) { const x = pick(cur.t, tier); x && say(x.jp); } }, [cur?.id, tier]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeak(), []);

  const persistSeen = (ids) => update((s) => { s.vn = s.vn || {}; const v = (s.vn[id] ||= { done: {}, chat: {}, seen: {} }); v.seen = v.seen || {}; v.seen[chN] = [...new Set([...(v.seen[chN] || []), ...ids])]; });
  const finish = () => {
    let reward = 0;
    update((s) => {
      s.vn = s.vn || {}; const v = (s.vn[id] ||= { done: {}, chat: {}, seen: {} });
      v.seen = v.seen || {}; v.seen[chN] = [...new Set([...(v.seen[chN] || []), ...hist.map((h) => h.id)])];
      if (!v.done?.[chN]) { v.done = { ...(v.done || {}), [chN]: true }; reward = STORY_REWARD; s.primo += reward; }
    });
    setFin({ reward }); sfx.correct?.();
  };
  const advance = () => {
    if (!cur || panel || gram) return;
    if (cur.choices) return;
    if (cur.end) return finish();
    if (cur.next) { setHist((h) => [...h, { id: cur.next, pick: -1 }]); sfx.click(); }
  };
  const choose = (i) => {
    const ch = cur.choices[i];
    setHist((h) => [...h.slice(0, -1), { id: cur.id, pick: i }, { id: ch.next, pick: -1 }]);
    persistSeen([cur.id, ch.next]); sfx.click();
  };
  const back = () => { if (hist.length > 1) { setHist((h) => { const x = h.slice(0, -1); x[x.length - 1] = { ...x[x.length - 1], pick: -1 }; return x; }); setFin(null); } };
  const jumpIdx = (i) => { setHist((h) => { const x = h.slice(0, i + 1); x[i] = { ...x[i], pick: -1 }; return x; }); setFin(null); setPanel(null); };
  const jumpNode = (nid) => { const p = pathTo(nodes, nid); if (p) { p[p.length - 1].pick = -1; setHist(p); setFin(null); setPanel(null); } };

  useEffect(() => {
    const k = (e) => {
      if (e.target.closest?.("input,button,a,select")) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); }
      else if (e.key === "Backspace") back();
      else if (e.key === "Escape") { setPanel(null); setGram(null); }
      else if (/^[12]$/.test(e.key) && cur?.choices) choose(+e.key - 1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!c) return <p style={{ marginTop: 40 }}>Không tìm thấy nhân vật.</p>;
  if (!S || D === undefined) return <p className="hint" style={{ marginTop: 40 }}>Đang tải truyện…</p>;
  if (!D || !C) return <p style={{ marginTop: 40 }}>Chương này chưa có. <Link href={`/characters/${c.id}/story`}>Về mục lục truyện</Link></p>;
  if (!chapterOpen(S, c, +chN)) return <div className="vnhub"><Link href={`/characters/${c.id}/story`} className="back">‹ Mục lục truyện</Link><LockedNote c={c} owned={false} /><p className="panel vnlock">🔒 Chương này cần Cung Mệnh {chN}.</p></div>;
  if (!cur) return null;

  // cảnh nền hiện tại = bg gần nhất trên đường đi
  let bg = C.bg;
  for (const h of hist) { const n = by.get(h.id); if (n?.bg) bg = n.bg; }
  const [sceneName, c1, c2] = sceneOf(bg);
  const sp = speakerName(cur.sp, D);
  const showChar = cur.sp === "char" || hist.some((h) => by.get(h.id)?.sp === "char");
  const next = D.chapters.find((x) => x.c === +chN + 1);
  const el = ELEM[c.el];
  const lineOf = (n, pickIdx) => (
    <>
      <div className="lg"><b>{speakerName(n.sp, D) || "—"}</b><Line t={n.t} g={n.g} tier={tier} set={set} onGrammar={setGram} /></div>
      {pickIdx >= 0 && n.choices?.[pickIdx] && <div className="lg me"><b>旅人 (bạn chọn)</b><Line t={n.choices[pickIdx].t} g={n.choices[pickIdx].g} tier={tier} set={set} onGrammar={setGram} /></div>}
    </>
  );

  return (
    <div className="vnplay" style={{ "--ec": el?.c }}>
      <div className="vntop">
        <Link href={`/characters/${c.id}/story`} className="back">‹ {c.vi} · {C.c === 0 ? "Mở đầu" : `C${C.c}`}</Link>
        <div className="vntools">
          <button className="chip sm" onClick={back} disabled={hist.length < 2}>↶ Lùi</button>
          <button className={`chip sm ${panel === "log" ? "on" : ""}`} onClick={() => setPanel(panel === "log" ? null : "log")}>🕘 Nhật ký</button>
          <button className={`chip sm ${panel === "tree" ? "on" : ""}`} onClick={() => setPanel(panel === "tree" ? null : "tree")}>🌳 Cây hội thoại</button>
          <button className={`chip sm ${panel === "script" ? "on" : ""}`} onClick={() => setPanel(panel === "script" ? null : "script")}>📜 Script</button>
          <button className={`chip sm ${panel === "set" ? "on" : ""}`} onClick={() => setPanel(panel === "set" ? null : "set")}>⚙️</button>
        </div>
      </div>

      <div className="vnstage" style={{ background: `radial-gradient(ellipse at 50% 30%, ${c1}55, transparent 70%), linear-gradient(180deg, ${c1}, ${c2})` }} onClick={advance}>
        <div className="vnscene">{sceneName}</div>
        <div className="vnchapter"><span className="jpt">{C.title.jp}</span> · {C.title.vi}</div>
        {showChar && <img className={`vnsprite ${cur.sp === "char" ? "talk" : "idle"} mood-${cur.mood || "calm"}`} src={charSplash(c)} alt={c.vi} onError={(e) => { e.currentTarget.src = charIcon(c); }} />}
        <div className={`vnbox ${cur.sp}`} onClick={(e) => { e.stopPropagation(); advance(); }}>
          {sp && <div className="vnname jpt">{sp}{cur.sp === "char" && cur.mood && cur.mood !== "calm" ? <small> · {({ happy: "vui", sad: "buồn", angry: "giận", surprised: "ngạc nhiên", shy: "ngượng", serious: "nghiêm túc" })[cur.mood]}</small> : null}</div>}
          <Line t={cur.t} g={cur.g} tier={tier} set={set} onGrammar={setGram} big />
          <button className="vnspk" onClick={(e) => { e.stopPropagation(); const x = pick(cur.t, tier); x && say(x.jp); }} aria-label="Nghe câu này">🔊</button>
          {!cur.choices && !fin && <div className="vnnext">{cur.end ? "Kết thúc chương ▸" : "Bấm để tiếp ▸"}</div>}
          {cur.choices && !fin && (
            <div className="vnchoices">
              {cur.choices.map((ch, i) => { const x = pick(ch.t, tier); return (
                <button key={i} className="vnchoice" onClick={(e) => { e.stopPropagation(); choose(i); }}>
                  <span className="k">{i + 1}</span><span><span className="jpt">{x?.jp}</span>{set.ro && <small className="ro">{x?.ro}</small>}{set.vi && <small>{x?.vi}</small>}</span>
                </button>
              ); })}
            </div>
          )}
          {fin && (
            <div className="vnfin" onClick={(e) => e.stopPropagation()}>
              <b>✦ Hết chương {C.c === 0 ? "Mở đầu" : `C${C.c}`}</b>{fin.reward > 0 && <span> · <Ico id="pgm" /> +{fin.reward}</span>}
              <div className="btnrow">
                <button className="gbtn x dark" onClick={() => setPanel("script")}><span className="c" />📜 Xem script & ngữ pháp</button>
                {next && (chapterOpen(S, c, next.c) ? <Link href={`/characters/${c.id}/story/${next.c}`} className="gbtn"><span className="c" />Chương tiếp ›</Link>
                  : <span className="hint">Chương tiếp cần Cung Mệnh {next.c}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="hint vnkeys">Enter / Space: tiếp · Backspace: lùi · 1–2: chọn · Mức ngôn ngữ: {TIERS[tier].name} ({TIERS[tier].short})</p>

      {panel && (
        <div className="vnpanel panel" onClick={(e) => e.stopPropagation()}>
          <button className="vnx" onClick={() => setPanel(null)} aria-label="Đóng">✕</button>
          {panel === "set" && <VNSettings compact />}
          {panel === "log" && (
            <>
              <h3>🕘 Nhật ký hội thoại <small>bấm vào một câu để quay lại đó</small></h3>
              <div className="vnlog">{hist.map((h, i) => { const n = by.get(h.id); return n ? <button key={i} className={`vnlogi ${i === hist.length - 1 ? "on" : ""}`} onClick={() => jumpIdx(i)}>{lineOf(n, h.pick)}</button> : null; })}</div>
            </>
          )}
          {panel === "tree" && (
            <>
              <h3>🌳 Cây hội thoại <small>các nhánh của chương · bấm câu đã xem để dịch chuyển tới đó</small></h3>
              <ol className="vntree">
                {nodes.map((n) => {
                  const vis = seen.has(n.id) || vnOf(S, +id).done?.[chN];
                  const x = pick(n.t, tier);
                  return (
                    <li key={n.id} className={`${vis ? "vis" : ""} ${n.id === cur.id ? "on" : ""} ${n.choices ? "fork" : ""} ${n.end ? "end" : ""}`}>
                      <button disabled={!vis} onClick={() => jumpNode(n.id)}>
                        <b>{speakerName(n.sp, D) || "Dẫn truyện"}</b> <span className="jpt">{vis ? x?.jp : "？？？（chưa xem）"}</span>
                      </button>
                      {n.choices && <div className="vnfork">{n.choices.map((ch, i) => <span key={i}>↳ {i + 1}. {vis ? pick(ch.t, tier)?.vi : "???"} → {ch.next}</span>)}</div>}
                    </li>
                  );
                })}
              </ol>
            </>
          )}
          {panel === "script" && (
            <>
              <h3>📜 Script chương <small>{TIERS[tier].name} ({TIERS[tier].short}) · bấm 📘 để xem giải thích ngữ pháp</small></h3>
              <div className="vnscript">{nodes.map((n) => <div key={n.id} className="vnsl">{lineOf(n, -1)}{n.choices && n.choices.map((ch, i) => <div key={i} className="lg me"><b>Lựa chọn {i + 1}</b><Line t={ch.t} g={ch.g} tier={tier} set={set} onGrammar={setGram} /></div>)}</div>)}</div>
              <h4>Ngữ pháp trong chương (mức {TIERS[tier].short})</h4>
              <GrammarList ids={[...new Set(nodes.flatMap((n) => [...(n.g?.[tier] || []), ...(n.choices || []).flatMap((ch) => ch.g?.[tier] || [])]))]} G={G} />
            </>
          )}
        </div>
      )}
      {gram && <div className="vnoverlay" onClick={() => setGram(null)}><GrammarCard id={gram} G={G} onClose={() => setGram(null)} /></div>}
    </div>
  );
}
