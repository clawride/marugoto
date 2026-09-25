"use client";
// Một bài bảng chữ cái: ✍️ Viết (xem nét → tô → tự viết) · 📖 Đọc & học thuộc · 📏 Quy tắc
import { useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { MCQ } from "@/components/Battle";
import { KleeHost, KL } from "@/components/Klee";
import StrokeBoard from "@/components/kana/StrokeBoard";
import { Ico } from "@/components/Icons";
import { LESSONS, lessonOf, itemsOf, charsUpTo, KANA_INFO, KANA_STROKES, ROMAJI, toRomaji, videoUrl } from "@/lib/kana";
import { starsFor, shuffle, pickRand } from "@/lib/data";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const STAR_REWARD = 20;
const Stars = ({ n = 0 }) => <span className="a22stars">{[0, 1, 2].map((i) => <i key={i} className={i < n ? "on" : ""}>★</i>)}</span>;
const say = (t) => speakLines([{ t }], { rate: 0.8 });
const infoOf = (c) => KANA_INFO.chars?.[c] || {};

// Lưu sao của một phần; thưởng Nguyên Thạch cho sao mới
export function useKanaSave() {
  const { update } = useGame();
  return (key, pct, total) => {
    const stars = starsFor(pct);
    let reward = 0;
    update((s) => {
      s.kana = s.kana || {}; s.kana.p = s.kana.p || {};
      const r = s.kana.p[key] || { pct: 0, stars: 0, total: 0 };
      if (stars > r.stars) { reward = (stars - r.stars) * STAR_REWARD; s.primo += reward; r.stars = stars; }
      if (pct > r.pct || (pct === r.pct && total > r.total)) { r.pct = pct; r.total = total; }
      s.kana.p[key] = r;
    });
    return { pct, stars, reward };
  };
}

// ===== ✍️ Viết =====
function WriteTab({ L }) {
  const { S, update } = useGame();
  const save = useKanaSave();
  // chữ để luyện viết: chữ đơn của bài; bài âm ghép → chữ nhỏ ゃゅょ + chữ gốc; bài tổng kết → toàn bộ chữ mềm
  const chars = useMemo(() => {
    if (L.review) return charsUpTo(L.id, L.script);
    if (L.chars) return [...L.chars, ...(L.extra || [])].filter((c) => KANA_STROKES[c]);
    const small = L.script === "k" ? ["ャ", "ュ", "ョ"] : ["ゃ", "ゅ", "ょ"];
    const bases = [...new Set(L.yoon.map((y) => [...y.k][0]))];
    return [...small, ...(L.extra || []), ...bases].filter((c) => KANA_STROKES[c]);
  }, [L]);
  const [ch, setCh] = useState(chars[0]);
  const [mode, setMode] = useState("watch");
  const best = S.kana?.w || {};
  const I = infoOf(ch);
  const onResult = ({ mode: m, score }) => {
    if (m !== "free") { if (m === "trace") setTimeout(() => setMode("free"), 900); return; }
    const nb = { ...best, [ch]: Math.max(best[ch] || 0, score) };
    update((s) => { s.kana = s.kana || {}; s.kana.w = { ...(s.kana.w || {}), [ch]: nb[ch] }; });
    // sao phần viết = trung bình điểm viết tự do tốt nhất của các chữ trong bài
    const avg = Math.round(chars.reduce((a, c) => a + (nb[c] || 0), 0) / chars.length);
    save(`${L.id}:write`, avg, chars.length);
  };
  return (
    <>
      <KleeHost line={KL.write} />
      <div className="kpick">
        {chars.map((c) => <button key={c} className={`kchip ${c === ch ? "on" : ""} ${best[c] >= 80 ? "s3" : best[c] >= 60 ? "s2" : best[c] ? "s1" : ""}`} onClick={() => { setCh(c); setMode("watch"); sfx.click(); }}>{c}</button>)}
      </div>
      <div className="kwrite">
        <div className="panel kinfo">
          <div className="kbig jpt" onClick={() => say(ch)}>{ch}</div>
          <div className="krom">{ROMAJI[ch]} <button className="spk" onClick={() => say(ch)}>🔊</button></div>
          <div className="kmeta">{KANA_STROKES[ch].length} nét{best[ch] ? <> · điểm viết tốt nhất <b>{best[ch]}</b></> : null}</div>
          {I.mn && <p><b>🧠 Mẹo nhớ:</b> {I.mn}</p>}
          {I.tip && <p><b>✒️ Viết đẹp:</b> {I.tip}</p>}
          {I.err?.length > 0 && <p><b>⚠️ Lỗi hay gặp:</b> {I.err.join(" · ")}</p>}
          {I.look?.length > 0 && <p><b>👀 Dễ nhầm với:</b> <span className="jpt">{I.look.join("  ")}</span></p>}
        </div>
        <div className="panel kpadwrap">
          <div className="kmodes">
            {[["watch", "1 · Xem thứ tự nét"], ["trace", "2 · Tô theo nét"], ["free", "3 · Tự viết & chấm"]].map(([k, t]) => (
              <button key={k} className={`chip ${mode === k ? "on" : ""}`} onClick={() => { setMode(k); sfx.click(); }}>{t}</button>
            ))}
          </div>
          <StrokeBoard key={`${ch}-${mode}`} char={ch} mode={mode} onResult={onResult} />
        </div>
      </div>
    </>
  );
}

// ===== 📖 Đọc & học thuộc =====
function makeReadQs(L) {
  const items = itemsOf(L).filter((x) => x.r && x.k !== "ー");
  const pool = L.review ? charsUpTo(L.id, L.script).map((c) => ({ k: c, r: ROMAJI[c] })) : items;
  const learned = charsUpTo(L.id, L.script).map((c) => ({ k: c, r: ROMAJI[c] })).concat(items);
  const others = (x) => shuffle(learned.filter((y) => y.k !== x.k && y.r !== x.r));
  const look = (x) => (infoOf(x.k).look || []).filter((c) => ROMAJI[c]).map((c) => ({ k: c, r: ROMAJI[c] }));
  const qs = [];
  const pick = shuffle(pool).slice(0, 12);
  pick.forEach((x, i) => {
    const kind = i % 3;
    const dis = [...look(x), ...others(x)].filter((y, j, a) => a.findIndex((z) => z.k === y.k) === j).slice(0, 3);
    if (kind === 0) qs.push({ sub: "Chữ này đọc là gì?", prompt: x.k, jpPrompt: true, opts: shuffle([x.r, ...dis.map((d) => d.r)]), answer: x.r, explain: `${x.k} đọc là “${x.r}”. ${infoOf(x.k).mn || ""}` });
    else if (kind === 1) qs.push({ sub: "Chọn chữ đúng với âm", prompt: x.r, opts: shuffle([x.k, ...dis.map((d) => d.k)]), jpOpts: true, answer: x.k, explain: `“${x.r}” viết là ${x.k}.` });
    else qs.push({ sub: "Nghe và chọn chữ đúng", prompt: "🔊", listen: x.k, opts: shuffle([x.k, ...dis.map((d) => d.k)]), jpOpts: true, answer: x.k, explain: `Âm vừa nghe là ${x.k} (${x.r}).` });
  });
  // đọc từ ví dụ
  const words = shuffle((L.chars || L.yoon.map((y) => y.k)).flatMap((c) => infoOf(c).words || [])).slice(0, 4);
  const allW = (L.chars || L.yoon.map((y) => y.k)).flatMap((c) => infoOf(c).words || []);
  words.forEach((w) => {
    const r = toRomaji(w.w);
    const wrong = shuffle(allW.filter((x) => x.w !== w.w).map((x) => toRomaji(x.w)).filter((x) => x !== r));
    if (wrong.length >= 3) qs.push({ sub: `Đọc từ này · “${w.vi}”`, prompt: w.w, jpPrompt: true, opts: shuffle([r, ...[...new Set(wrong)].slice(0, 3)]), answer: r, explain: `${w.w} = ${r} — ${w.vi}` });
  });
  return shuffle(qs);
}

function Quiz({ qs, onFinish, intro }) {
  const [i, setI] = useState(0);
  const [c, setC] = useState(0);
  const [line, setLine] = useState(intro);
  const q = qs[i];
  return (
    <>
      <div className="stagebar"><span className="on">Đọc & học thuộc</span><b>Câu {i + 1}/{qs.length} · đúng {c}</b></div>
      <MCQ key={i} q={q} top={<><KleeHost line={line} />{q.listen && <div className="klisten"><button className="gbtn tri" onClick={() => say(q.listen)}><span className="c" />🔊 Nghe lại</button></div>}</>}
        onScore={(ok) => { if (ok) setC((x) => x + 1); setLine(pickRand(ok ? KL.ok : KL.bad)); ok ? sfx.correct() : sfx.wrong(); if (!ok && q.listen) say(q.listen); }}
        onNext={() => { if (i + 1 >= qs.length) onFinish(c, qs.length); else { setI(i + 1); setLine(intro); if (qs[i + 1].listen) setTimeout(() => say(qs[i + 1].listen), 250); } }} />
    </>
  );
}

function ReadTab({ L }) {
  const save = useKanaSave();
  const [flip, setFlip] = useState(null);
  const [qs, setQs] = useState(null);
  const [res, setRes] = useState(null);
  const items = L.review ? charsUpTo(L.id, L.script).map((c) => ({ k: c, r: ROMAJI[c] })) : itemsOf(L);
  if (qs) return <Quiz qs={qs} intro={KL.read} onFinish={(c, n) => { setRes(save(`${L.id}:read`, Math.round((c / n) * 100), n)); setQs(null); }} />;
  return (
    <>
      <KleeHost line={KL.read} />
      {res && <div className="panel kdone"><Stars n={res.stars} /> Đúng {res.pct}%{res.reward > 0 && <> · <Ico id="pgm" /> +{res.reward}</>}</div>}
      <div className="kcards">
        {items.map((x) => {
          const I = infoOf(x.k);
          const on = flip === x.k;
          return (
            <button key={x.k} className={`panel kcard2 ${on ? "on" : ""}`} onClick={() => { setFlip(on ? null : x.k); if (x.k !== "ー") say(x.k); }}>
              <b className="jpt">{x.k}</b><span>{x.r}</span>
              {on && <div className="kback">{I.mn && <p>🧠 {I.mn}</p>}{I.words?.length > 0 && <p className="jpt">{I.words.map((w) => `${w.w} (${w.vi})`).join(" · ")}</p>}</div>}
            </button>
          );
        })}
      </div>
      <div className="panel a22start">
        <div><b>📖 Kiểm tra đọc & học thuộc</b><span>Nhận mặt chữ, chọn chữ theo âm, nghe chọn chữ, đọc từ · mỗi sao mới +{STAR_REWARD} <Ico id="pgm" /></span></div>
        <button className="gbtn tri" onClick={() => { const q = makeReadQs(L); setQs(q); sfx.open(); if (q[0]?.listen) setTimeout(() => say(q[0].listen), 400); }}><span className="c" />Bắt đầu</button>
      </div>
    </>
  );
}

// ===== 📏 Quy tắc =====
function RuleTab({ L }) {
  const R = KANA_INFO.rules?.[L.rule];
  const save = useKanaSave();
  const [drill, setDrill] = useState(null);
  const [res, setRes] = useState(null);
  if (!R) return <p>Chưa có nội dung quy tắc.</p>;
  const start = () => {
    const qs = shuffle(R.pairs || []).slice(0, 10).map((p) => {
      const pickA = Math.random() < 0.5, w = pickA ? p.a : p.b;
      return { sub: "Nghe và chọn từ đúng", prompt: "🔊", listen: w, opts: shuffle([p.a, p.b]), jpOpts: true, answer: w, explain: `${p.a} = ${p.va} · ${p.b} = ${p.vb}` };
    });
    setDrill(qs); sfx.open(); setTimeout(() => say(qs[0].listen), 400);
  };
  if (drill) return <Quiz qs={drill} intro={KL.rule} onFinish={(c, n) => { setRes(save(`${L.id}:rule`, Math.round((c / n) * 100), n)); setDrill(null); }} />;
  return (
    <>
      <KleeHost line={KL.rule} />
      <div className="panel krule">
        <h3>{R.title}</h3>
        <p>{R.explain}</p>
        {R.points?.length > 0 && <ul>{R.points.map((p, i) => <li key={i}>{p}</li>)}</ul>}
        {R.examples?.length > 0 && <div className="kex">{R.examples.map((e, i) => <button key={i} className="chip" onClick={() => say(e.w)}><span className="jpt">{e.w}</span> · {e.vi} 🔊</button>)}</div>}
      </div>
      {res && <div className="panel kdone"><Stars n={res.stars} /> Đúng {res.pct}%{res.reward > 0 && <> · <Ico id="pgm" /> +{res.reward}</>}</div>}
      {R.pairs?.length > 0 && (
        <div className="panel a22start">
          <div><b>👂 Luyện nghe phân biệt</b><span>{R.pairs.length} cặp từ chỉ khác nhau ở {R.title.toLowerCase()}</span></div>
          <button className="gbtn tri" onClick={start}><span className="c" />Bắt đầu</button>
        </div>
      )}
    </>
  );
}

export default function KanaLesson({ id }) {
  const L = lessonOf(id);
  const { S } = useGame();
  const [tab, setTab] = useState("write");
  if (!L) return <p style={{ marginTop: 40 }}>Không tìm thấy bài. <Link href="/kana">Bảng chữ cái</Link></p>;
  if (!S) return null;
  const P = S.kana?.p || {};
  const tabs = [["write", "✍️ Viết"], ["read", "📖 Đọc & học thuộc"], ...(L.rule ? [["rule", "📏 Quy tắc"]] : [])];
  const prev = lessonOf(id - 1), next = lessonOf(id + 1);
  return (
    <div className="th-kana">
      <Link href="/kana" className="back">‹ Bảng chữ cái</Link>
      <div className="pagehead a22head">
        <div className="tag">{L.script === "h" ? "CHỮ MỀM · HIRAGANA" : "CHỮ CỨNG · KATAKANA"} · BÀI {L.id}</div>
        <h1>{L.title}</h1>
        <p>{L.sub}</p>
        {L.videos?.length > 0 && <div className="kvids">{L.videos.map((v) => <a key={v} href={videoUrl(v)} target="_blank" rel="noreferrer" className="chip">▶ Video bài {v}</a>)}</div>}
      </div>
      <div className="chips a22tabs">
        {tabs.map(([k, t]) => <button key={k} className={`chip dk ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); sfx.click(); }}>{t}<Stars n={P[`${id}:${k}`]?.stars} /></button>)}
      </div>
      {tab === "write" && <WriteTab key={`w${id}`} L={L} />}
      {tab === "read" && <ReadTab key={`r${id}`} L={L} />}
      {tab === "rule" && <RuleTab key={`u${id}`} L={L} />}
      <div className="btnrow a22nav">
        {prev ? <Link href={`/kana/${prev.id}`} className="gbtn x dark"><span className="c" />‹ Bài {prev.id}</Link> : <span />}
        {next && <Link href={`/kana/${next.id}`} className="gbtn"><span className="c" />Bài {next.id} ›</Link>}
      </div>
    </div>
  );
}

export { LESSONS };
