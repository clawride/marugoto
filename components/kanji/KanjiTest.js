"use client";
// Kiểm tra chữ Hán cả cấp (30 câu trộn mọi dạng) · trang tra một chữ (thẻ + luyện viết)
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import StrokeBoard from "@/components/kana/StrokeBoard";
import KanjiCard from "@/components/kanji/KanjiCard";
import { KazuhaHost, KZ } from "@/components/Kazuha";
import { Ico } from "@/components/Icons";
import { KQuiz, Stars, useKanjiSave, useLevelData, learnedUpTo } from "@/components/kanji/KanjiLesson";
import { KIDX, levelOf, loadStrokes, testQs } from "@/lib/kanjiProg";
import { sfx } from "@/lib/sfx";

export function KanjiTest({ lv }) {
  const { S } = useGame();
  const L = levelOf(lv);
  const D = useLevelData(lv);
  const save = useKanjiSave();
  const [qs, setQs] = useState(null);
  const [res, setRes] = useState(null);
  const learned = useMemo(() => (L ? learnedUpTo(lv, L.lessons.at(-1).n) : new Set()), [lv, L]);
  if (!L) return <p style={{ marginTop: 40 }}>Không tìm thấy cấp độ. <Link href="/kanji">Chữ Hán</Link></p>;
  if (!S) return null;
  const rec = S.kanji?.p?.[`${lv}:test`];
  if (qs) return <div className="th-kanji"><KQuiz qs={qs} intro={KZ.test} title={`Kiểm tra ${L.name}`} onFinish={(c, n) => { setRes(save(`${lv}:test`, Math.round((c / n) * 100), n)); setQs(null); sfx.open(); }} /></div>;
  return (
    <div className="th-kanji">
      <Link href={`/kanji?lv=${lv}`} className="back">‹ Chữ Hán · {L.name}</Link>
      <div className="pagehead a22head">
        <div className="tag">{L.ico} KIỂM TRA CẤP ĐỘ</div>
        <h1>Chữ Hán {L.name}</h1>
        <p>{L.count} chữ · {L.lessons.length} bài</p>
      </div>
      <KazuhaHost line={KZ.test} />
      {res && <div className="panel kdone"><Stars n={res.stars} /> Đúng {res.pct}%{res.reward > 0 && <> · <Ico id="pgm" /> +{res.reward}</>}</div>}
      <div className="panel a22start">
        <div><b>試 Bài kiểm tra khoảng 30 câu</b><span>Nghĩa, âm Hán Việt, đọc từ, đọc chữ trong từ, nghe, điền từ, chọn đúng chữ, đoán âm và nghĩa{rec ? ` · tốt nhất ${rec.pct}%` : ""} · mỗi sao mới +20 <Ico id="pgm" /></span></div>
        <button className="gbtn tri" disabled={!D} onClick={() => { setQs(testQs(Object.values(D), learned)); sfx.open(); }}><span className="c" />{D ? "Bắt đầu" : "Đang tải…"}</button>
      </div>
    </div>
  );
}

export function KanjiChar({ k }) {
  const I = KIDX[k];
  const lv = I?.[2];
  const D = useLevelData(lv || "a1");
  const [strokes, setStrokes] = useState(null);
  const [mode, setMode] = useState("watch");
  useEffect(() => { if (lv) loadStrokes(lv).then(setStrokes); }, [lv]);
  if (!I) return <p style={{ marginTop: 40 }}>Chữ này chưa có trong chương trình. <Link href="/kanji">Chữ Hán</Link></p>;
  const L = levelOf(lv);
  const E = D?.[k];
  return (
    <div className="th-kanji">
      <Link href={`/kanji/${lv}/${I[3]}`} className="back">‹ {L.name} · Bài {I[3]}</Link>
      {!E ? <p className="hint">Đang tải…</p> : (
        <div className="kjlearn" style={{ marginTop: 14 }}>
          <KanjiCard E={E} />
          <div className="panel kpadwrap">
            <div className="kmodes">{[["watch", "Xem thứ tự nét"], ["trace", "Tô theo nét"], ["free", "Tự viết & chấm"]].map(([m, t]) => <button key={m} className={`chip ${mode === m ? "on" : ""}`} onClick={() => setMode(m)}>{t}</button>)}</div>
            {strokes?.[k] ? <StrokeBoard key={`${k}-${mode}`} char={k} paths={strokes[k]} mode={mode} size={260} /> : <p className="hint">Đang tải nét chữ…</p>}
          </div>
        </div>
      )}
    </div>
  );
}
