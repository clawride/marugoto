"use client";
// Chạy một lượt kiểm tra A2-2: trắc nghiệm, điền từ, xếp câu, nghe — Nahida dẫn
import { useMemo, useState } from "react";
import { MCQ, FillQ } from "@/components/Battle";
import OrderQ from "@/components/OrderQ";
import { Player } from "@/components/Listen";
import { NahidaHost, ND, NAHIDA } from "@/components/Nahida";
import { A22_AUDIO } from "@/lib/audioLib";
import { trackFile } from "@/lib/a22";
import { charIcon } from "@/lib/genshin";
import { pickRand } from "@/lib/data";
import { stopSpeak } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

export const NAHIDA_ORDER_HOST = NAHIDA && {
  name: "Nahida", icon: charIcon(NAHIDA),
  lines: { intro: [ND.order], next: ["Câu tiếp theo nào~", "Mảnh ghép này hơi khó đấy.", "Thử sắp xếp câu này xem."], ok: ND.ok, bad: ND.bad },
};

// Một câu hỏi bất kỳ
export function A22Question({ q, idx, first, onScore, onNext, hostLine }) {
  const host = <NahidaHost line={hostLine} />;
  if (q.type === "fill") return <FillQ key={idx} q={q} onScore={onScore} onNext={onNext} top={host} />;
  if (q.type === "order") return <OrderQ key={idx} q={q} onScore={onScore} onNext={onNext} first={first} host={NAHIDA_ORDER_HOST} />;
  if (q.type === "listen") {
    const it = q.item;
    const script = it.tts?.length ? <div className="scriptbox"><div className="scriptlines">{it.tts.map((l, i) => <p key={i}><b>{l.sp}:</b> <span className="jpt">{l.t}</span></p>)}</div></div> : null;
    return (
      <MCQ key={idx} q={{ sub: "Nghe và trả lời", prompt: q.prompt, opts: q.opts, answer: q.answer, explain: q.explain, after: script }}
        onScore={onScore} onNext={() => { stopSpeak(); onNext(); }}
        top={<>{host}<p className="lsit a22sit">🎬 {it.title} — {it.situation} <small>· Track {it.src === "R" ? "Rikai" : "Katsudou"} {it.track}</small></p><Player key={`p${idx}`} file={trackFile(it)} tts={it.tts} lib={A22_AUDIO} /></>} />
    );
  }
  // mc (vocab / kanji / grammar / read)
  return <MCQ key={idx} q={q} onScore={onScore} onNext={onNext} top={host} />;
}

// qs: [{ type, … }] · onFinish(correct, total)
export default function A22Run({ qs, title, intro, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [last, setLast] = useState(null);
  const line = useMemo(() => (last === null ? intro : pickRand(last ? ND.ok : ND.bad)), [last, intro, idx]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = qs[idx];
  const firstOrder = qs.findIndex((x) => x.type === "order") === idx;
  return (
    <>
      <div className="stagebar"><span className="on">{title}</span><b>Câu {idx + 1}/{qs.length} · đúng {correct}</b></div>
      <div className="a22bar"><i style={{ width: `${(idx / qs.length) * 100}%` }} /></div>
      <A22Question key={idx} q={q} idx={idx} first={firstOrder} hostLine={line}
        onScore={(ok) => { setLast(ok); if (ok) setCorrect((c) => c + 1); ok ? sfx.correct() : sfx.wrong(); }}
        onNext={() => {
          sfx.click();
          if (idx + 1 >= qs.length) { onFinish(correct, qs.length); return; }
          setIdx(idx + 1); setLast(null);
        }} />
    </>
  );
}
