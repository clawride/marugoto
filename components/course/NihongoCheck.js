"use client";
// にほんごチェック (まるごと入門 A1 りかい p194–197): theo từng bài — にほんごで いいましょう (câu hỏi để tự nói)
// + きほんぶん 1–57 với ぶんぽう・ぶんけい, tự chấm ひょうか ★☆☆ / ★★☆ / ★★★ và コメント + ngày (lưu trên máy)
// Dữ liệu: public/book/a1-rikai/check.json (scripts/build-book.mjs từ data/book/extra/a1-rikai-extra.json)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { speakLines } from "@/lib/tts";

const say = (jp) => speakLines([{ t: jp }], { rate: 0.85 });
const LEVELS = [[1, "すこし わかりました", "Hiểu một chút"], [2, "だいたい わかりました", "Hiểu đại khái"], [3, "よく わかりました", "Hiểu rõ"]];

export default function NihongoCheck({ course }) {
  const { S, update } = useGame();
  const book = course.books?.find((b) => b.key === "rikai");
  const [C, setC] = useState(undefined);
  const [ro, setRo] = useState(true);
  useEffect(() => { fetch("/book/a1-rikai/check.json").then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setC); }, []);
  useEffect(() => { if (C && location.hash) document.querySelector(location.hash)?.scrollIntoView(); }, [C]);
  if (C === undefined || !S) return <p className="hint" style={{ marginTop: 40 }}>Đang tải…</p>;
  if (!C) return <p style={{ marginTop: 40 }}>Không có dữ liệu. <Link href={course.base}>{course.title}</Link></p>;
  const key = `${course.store}book`;
  const st = S[key]?.check || {}, notes = S[key]?.checkNote || {};
  const setStar = (no, s) => update((x) => { x[key] = x[key] || {}; x[key].check = { ...(x[key].check || {}), [no]: s }; });
  const setNote = (l, c) => update((x) => { x[key] = x[key] || {}; x[key].checkNote = { ...(x[key].checkNote || {}), [l]: { c, d: new Date().toLocaleDateString("vi-VN") } }; });
  const all = C.flatMap((t) => t.lessons.flatMap((l) => l.kb));
  const sum = all.reduce((a, k) => a + (st[k.no] || 0), 0);
  return (
    <div className="bkwrap bktest">
      <Link href={course.base} className="back">‹ {course.title}</Link>
      <div className="panel bkhead">
        <div className="bkbook">{book?.ico || "📘"} {book?.name || "Sách Rikai"} · sách tr.194–197</div>
        <h2 className="jpt">にほんごチェック</h2>
        <p>Nihongo Check · Tự kiểm tra tiếng Nhật theo từng bài</p>
        <p className="bktask">Mỗi bài có: <b className="jpt">にほんごで いいましょう</b> (câu hỏi để bạn tự trả lời bằng tiếng Nhật), <b className="jpt">きほんぶん</b> (câu cơ bản) và <b className="jpt">ぶんぽう・ぶんけい</b> (mẫu ngữ pháp). Tự chấm <b className="jpt">ひょうか</b> bằng sao, ghi <b className="jpt">コメント</b> — tất cả lưu lại trên máy.</p>
        <p className="bkstarlegend">{LEVELS.map(([n, jp, vi]) => <span key={n}><b>{"★".repeat(n)}{"☆".repeat(3 - n)}</b> <span className="jpt">{jp}</span> — {vi}</span>)}</p>
        <div className="bkopts">
          <label><input type="checkbox" checked={ro} onChange={(e) => setRo(e.target.checked)} /> Hiện romaji</label>
          <span className="bkbest">Đã tự chấm {all.filter((k) => st[k.no]).length}/{all.length} câu · {sum}/{all.length * 3} ★</span>
        </div>
      </div>
      {C.map((T) => (
        <section key={T.topic} className="panel bksec nckt">
          <h3><span className="bkno">{T.topic}</span> <span className="jpt">{T.tt}</span><small className="bkvi">{T.tvi}</small></h3>
          {T.lessons.map((L) => (
            <div key={L.l} id={`l${L.l}`} className="nclesson">
              <h4 className="jpt">だい{L.l}か {L.t} <small className="bkvi">{L.vi}</small> <Link className="chip sm" href={`${course.base}/${L.l}`}>Mở bài</Link></h4>
              <div className="ncsay">
                <b className="jpt">にほんごで いいましょう</b> <small>Hãy nói bằng tiếng Nhật</small>
                {L.say.map((q, i) => <div key={i} className="bkline"><button className="bkspk" onClick={() => say(q.jp)}>🔊</button><div><span className="jpt bkjp">・{q.jp}</span><i className="nce">{q.en}</i><small className="bkvi">{q.vi}</small></div></div>)}
              </div>
              <div className="nctable">
                {L.kb.map((k) => (
                  <div key={k.no} className="ncrow">
                    <span className="ncno">{k.no}</span>
                    <div className="bkline"><button className="bkspk" onClick={() => say(k.jp)}>🔊</button><div><span className="jpt bkjp">{k.jp}</span>{ro && <small className="bkro">{k.ro}</small>}<small className="bkvi">{k.vi}</small></div></div>
                    <span className="ncpat jpt">{k.pat}{k.ref && <small> (L{k.ref})＊</small>}</span>
                    <div className="bkcdstars">{[1, 2, 3].map((s) => <button key={s} className={s <= (st[k.no] || 0) ? "on" : ""} title={LEVELS[s - 1][1]} onClick={() => setStar(k.no, st[k.no] === s ? 0 : s)} aria-label={`${s} sao`}>★</button>)}</div>
                  </div>
                ))}
              </div>
              <div className="ncnote">
                <input className="bkcdnote" placeholder="コメント / nhận xét cho bài này" defaultValue={notes[L.l]?.c || ""} onBlur={(e) => e.target.value !== (notes[L.l]?.c || "") && setNote(L.l, e.target.value)} />
                <small className="bkcddate">{notes[L.l]?.d || ""}</small>
              </div>
            </div>
          ))}
        </section>
      ))}
      <p className="hint">＊ (L…): bài khác cũng dùng cùng mẫu ngữ pháp này.</p>
    </div>
  );
}
