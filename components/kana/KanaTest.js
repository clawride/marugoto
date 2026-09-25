"use client";
// Kiểm tra tổng bảng chữ cái (chữ mềm / chữ cứng / cả hai)
import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { MCQ } from "@/components/Battle";
import { KleeHost, KL } from "@/components/Klee";
import { Ico } from "@/components/Icons";
import { useKanaSave } from "@/components/kana/KanaLesson";
import { LESSONS, ROMAJI, KANA_INFO, toRomaji } from "@/lib/kana";
import { shuffle, pickRand } from "@/lib/data";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const say = (t) => speakLines([{ t }], { rate: 0.8 });
export const TESTS = { h: { name: "Kiểm tra chữ mềm", n: 20 }, k: { name: "Kiểm tra chữ cứng", n: 20 }, all: { name: "Kiểm tra cả hai bảng chữ", n: 30 } };

function build(s, n) {
  const Ls = LESSONS.filter((L) => s === "all" || L.script === s);
  const items = Ls.flatMap((L) => [...(L.chars || []).map((c) => ({ k: c, r: ROMAJI[c] })), ...(L.yoon || [])]).filter((x) => x.r);
  const words = Ls.flatMap((L) => (L.chars || []).flatMap((c) => KANA_INFO.chars?.[c]?.words || []));
  const qs = shuffle(items).slice(0, Math.round(n * 0.8)).map((x, i) => {
    const look = (KANA_INFO.chars?.[x.k]?.look || []).filter((c) => ROMAJI[c]).map((c) => ({ k: c, r: ROMAJI[c] }));
    const dis = [...look, ...shuffle(items.filter((y) => y.k !== x.k && y.r !== x.r))].filter((y, j, a) => a.findIndex((z) => z.k === y.k) === j).slice(0, 3);
    if (i % 3 === 0) return { sub: "Chữ này đọc là gì?", prompt: x.k, jpPrompt: true, opts: shuffle([x.r, ...dis.map((d) => d.r)]), answer: x.r, explain: `${x.k} = ${x.r}` };
    if (i % 3 === 1) return { sub: "Chọn chữ đúng với âm", prompt: x.r, opts: shuffle([x.k, ...dis.map((d) => d.k)]), jpOpts: true, answer: x.k, explain: `“${x.r}” = ${x.k}` };
    return { sub: "Nghe và chọn chữ đúng", prompt: "🔊", listen: x.k, opts: shuffle([x.k, ...dis.map((d) => d.k)]), jpOpts: true, answer: x.k, explain: `${x.k} (${x.r})` };
  });
  shuffle(words).slice(0, n - qs.length).forEach((w) => {
    const r = toRomaji(w.w), wrong = [...new Set(shuffle(words).map((x) => toRomaji(x.w)).filter((x) => x !== r))].slice(0, 3);
    if (wrong.length === 3) qs.push({ sub: `Đọc từ này · “${w.vi}”`, prompt: w.w, jpPrompt: true, opts: shuffle([r, ...wrong]), answer: r, explain: `${w.w} = ${r} — ${w.vi}` });
  });
  return shuffle(qs);
}

export default function KanaTest({ s }) {
  const T = TESTS[s];
  const { S } = useGame();
  const save = useKanaSave();
  const [qs, setQs] = useState(null);
  const [i, setI] = useState(0);
  const [c, setC] = useState(0);
  const [line, setLine] = useState(KL.read);
  const [res, setRes] = useState(null);
  if (!T) return <p style={{ marginTop: 40 }}>Không tìm thấy bài kiểm tra. <Link href="/kana">Bảng chữ cái</Link></p>;
  if (!S) return null;
  const start = () => { const q = build(s, T.n); setQs(q); setI(0); setC(0); setRes(null); setLine(KL.read); sfx.open(); if (q[0].listen) setTimeout(() => say(q[0].listen), 400); };
  const best = S.kana?.p?.[`test:${s}`];
  if (!qs) return (
    <div className="th-kana">
      <Link href="/kana" className="back">‹ Bảng chữ cái</Link>
      <div className="panel examintro">
        <div className="tag">KIỂM TRA TỔNG</div>
        <h1>{T.name}</h1>
        <KleeHost big line="Ôn hết một lượt nha! Đúng từ 60% là được 1 sao, 80% được 2 sao, 95% được 3 sao!" />
        {res && <p className="exrule">Kết quả vừa rồi: <b>{res.pct}%</b> · {"★".repeat(res.stars)}{"☆".repeat(3 - res.stars)}{res.reward > 0 && <> · <Ico id="pgm" /> +{res.reward}</>}</p>}
        {best && <p className="exrule">Tốt nhất: <b>{best.pct}%</b></p>}
        <div className="btnrow"><button className="gbtn tri" onClick={start}><span className="c" />{res ? "Làm lại" : "Bắt đầu"}</button></div>
      </div>
    </div>
  );
  const q = qs[i];
  return (
    <div className="th-kana">
      <div className="stagebar"><span className="on">{T.name}</span><b>Câu {i + 1}/{qs.length} · đúng {c}</b></div>
      <MCQ key={i} q={q} top={<><KleeHost line={line} />{q.listen && <div className="klisten"><button className="gbtn tri" onClick={() => say(q.listen)}><span className="c" />🔊 Nghe lại</button></div>}</>}
        onScore={(ok) => { if (ok) setC((x) => x + 1); setLine(pickRand(ok ? KL.ok : KL.bad)); ok ? sfx.correct() : sfx.wrong(); }}
        onNext={() => {
          if (i + 1 >= qs.length) { setRes(save(`test:${s}`, Math.round((c / qs.length) * 100), qs.length)); setQs(null); return; }
          setI(i + 1); setLine(KL.read); if (qs[i + 1].listen) setTimeout(() => say(qs[i + 1].listen), 250);
        }} />
    </div>
  );
}
