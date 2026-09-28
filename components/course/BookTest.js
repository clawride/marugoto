"use client";
// テストとふりかえり (Marugoto 入門 A1 かつどう p71–72, p114–115 · 初級1 A2 かつどう p86–87, p140–141) — bản tự học trên web:
//   ① Can-do チェック (★☆☆ しました · ★★☆ できました · ★★★ よくできました + nhận xét, ngày) — lưu lại
//   ② (1) もじテスト: đọc to 5 thẻ rồi lật thẻ tự chấm (3/5 là đạt) · (2) かいわテスト: 5 câu hỏi, tự trả lời rồi xem câu mẫu
//   ③ ④ nói chuyện theo nhóm / với lớp: lời hướng dẫn của sách
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { speakLines } from "@/lib/tts";
import { shuffle } from "@/lib/data";
import { sfx } from "@/lib/sfx";

const say = (jp) => speakLines([{ t: jp }], { rate: 0.85 });
const Kana = ({ x }) => (x?.kana ? <small className="bkkana jpt">{x.kana}</small> : null);
const STARS = [[1, "しました", "Đã làm, nhưng có thể tốt hơn"], [2, "できました", "Làm được"], [3, "よくできました", "Làm rất tốt"]];
const FLOWERS = [
  ["すばらしい", "Tuyệt vời! Trả lời hết các câu hỏi và nói chuyện được.", "fl-a"],
  ["できました", "Làm được! Trả lời từ 3 câu trở lên và nói chuyện được.", "fl-b"],
  ["もうすこし", "Cố thêm chút nữa! Chưa hiểu hoặc chưa trả lời được tốt.", "fl-c"],
];

function Cando({ T, save, cd }) {
  return (
    <section className="panel bksec">
      <h3><span className="bktn">1</span> Can-do チェック <small className="bkvi">Tự đánh giá Can-do</small></h3>
      <p className="bktask">Xem lại các Can-do của Topic {T.topics[0]}–{T.topics[1]}{T.candoPages ? ` (Can-do チェック, sách tr.${T.candoPages})` : ""}. Chọn những Can-do muốn làm lại và luyện theo cặp; chọn những Can-do quan trọng với bạn. Bấm sao để tự chấm (lưu lại trên máy).</p>
      <p className="bkstarlegend">{STARS.map(([n, jp, vi]) => <span key={n}><b>{"★".repeat(n)}{"☆".repeat(3 - n)}</b> <span className="jpt">{jp}</span> — {vi}</span>)}</p>
      <div className="bkcdtable">
        {T.cando.map((c) => {
          const r = cd[c.n] || {};
          return (
            <div key={c.n} className="bkcdrow">
              <span className="bkcando">{c.n}</span>
              <div className="bkcdtxt"><span className="jpt">{c.jp}</span><Kana x={c} /><small>{c.vi}</small><small className="bkcdl">だい{c.lesson}か {c.title}</small></div>
              <div className="bkcdstars">{[1, 2, 3].map((s) => <button key={s} className={s <= (r.s || 0) ? "on" : ""} onClick={() => save(c.n, { s: r.s === s ? 0 : s, d: new Date().toLocaleDateString("vi-VN") })} aria-label={`${s} sao`}>★</button>)}</div>
              <input className="bkcdnote" placeholder="コメント / nhận xét" defaultValue={r.c || ""} onBlur={(e) => e.target.value !== (r.c || "") && save(c.n, { c: e.target.value })} />
              <small className="bkcddate">{r.d || ""}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MojiTest({ T, onDone }) {
  const pick = () => shuffle(T.mojiPool).slice(0, 5);
  const [cards, setCards] = useState(() => T.examples);
  const [open, setOpen] = useState({});
  const [ok, setOk] = useState({});
  const nOk = Object.values(ok).filter((v) => v === true).length, nDone = Object.keys(ok).length;
  const N = cards.length, need = Math.ceil((N * (T.pass || 3)) / 5); // A1: 3/5 · A2: đọc được 80%
  useEffect(() => { if (nDone === N) onDone(Math.round((nOk * 5) / N)); }, [nDone]); // eslint-disable-line react-hooks/exhaustive-deps
  const reset = (c) => { setCards(c); setOpen({}); setOk({}); sfx.click(); };
  return (
    <div className="bksub2">
      <h4>(1) もじテスト <small className="bkvi">Kiểm tra đọc chữ</small></h4>
      <p className="bktask">Đọc to {N} {T.moji === "word" ? "từ" : "câu"} dưới đây. Đọc được {need} là <b>đạt</b>{T.pass === 4 ? " (sách: đọc được 80% là đạt)" : ""}. Đọc xong, bấm thẻ để lật xem cách đọc (romaji), nghĩa và nghe lại, rồi tự chấm ✓ / ✗.</p>
      <div className="bkmoji">
        {cards.map((x, i) => (
          <div key={x.jp + i} className={`bkmcard ${ok[i] === true ? "ok" : ok[i] === false ? "bad" : ""}`}>
            <button className="bkmface jpt" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>{x.jp}</button>
            {open[i] && <div className="bkmback"><button className="bkspk" onClick={() => say(x.kana || x.jp)}>🔊</button><Kana x={x} /><i>{x.ro}</i><small>{x.vi}</small></div>}
            {open[i] && <div className="bkmmark"><button onClick={() => setOk((o) => ({ ...o, [i]: true }))}>✓ Đọc đúng</button><button onClick={() => setOk((o) => ({ ...o, [i]: false }))}>✗ Chưa đúng</button></div>}
          </div>
        ))}
      </div>
      <div className="bkres">
        {nDone === N ? <b className={nOk >= need ? "pass" : "fail"}>{nOk}/{N} · {nOk >= need ? "ごうかく — Đạt!" : "Chưa đạt, luyện thêm rồi thử lại nhé"}</b> : <span>Đã chấm {nDone}/{N}</span>}
        <button className="chip dk" onClick={() => reset(pick())}>🎲 {N === 5 ? "5 thẻ khác" : "5 thẻ ngẫu nhiên"}</button>
        <button className="chip dk" onClick={() => reset(T.examples)}>Thẻ ví dụ trong sách</button>
      </div>
    </div>
  );
}

function KaiwaTest({ T, onDone }) {
  const pick = () => shuffle(T.kaiwa).slice(0, 5);
  const [qs, setQs] = useState(pick);
  const [open, setOpen] = useState({});
  const [ok, setOk] = useState({});
  const nOk = Object.values(ok).filter((v) => v === true).length, nDone = Object.keys(ok).length;
  const FL = T.flowers || FLOWERS;
  const fl = nDone < 5 ? null : nOk === 5 ? FL[0] : nOk >= 3 ? FL[1] : FL[2];
  useEffect(() => { if (fl) onDone(nOk); }, [nDone]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="bksub2">
      <h4>(2) かいわテスト <small className="bkvi">Kiểm tra hội thoại</small></h4>
      {T.kaiwaEx && <p className="bktask">・<span className="jpt">せんせいの しつもんを 聞いて、かいわを して ください。</span> Nghe câu hỏi của giáo viên rồi hội thoại. Ví dụ: <span className="jpt">「{T.kaiwaEx.jp}」</span> — {T.kaiwaEx.vi}</p>}
      {T.card && (
        <div className="bkcard">
          <b>・<span className="jpt">カードを 読んで、せんせいと かいわを して ください。</span></b> <small>Đọc thẻ rồi hội thoại với giáo viên. Ví dụ:</small>
          <div className="bkline"><button className="bkspk" onClick={() => say(T.card.kana || T.card.jp)}>🔊</button><div><span className="jpt bkjp">{T.card.jp}</span><Kana x={T.card} /><small className="bkvi">{T.card.vi}</small></div></div>
        </div>
      )}
      <p className="bktask">{T.card ? "Luyện trên web: " : ""}Có 5 câu hỏi. Trả lời được 3 câu là <b>đạt</b>. Bấm 🔊 nghe câu hỏi, tự trả lời thành tiếng (nói về bản thân mình), rồi bấm "Xem câu trả lời mẫu" để so và tự chấm.</p>
      <ol className="bkkaiwa">
        {qs.map((x, i) => (
          <li key={x.q.jp + i} className={ok[i] === true ? "ok" : ok[i] === false ? "bad" : ""}>
            <div className="bkline"><button className="bkspk" onClick={() => say(x.q.kana || x.q.jp)}>🔊</button><div><span className="jpt bkjp">{x.q.jp}</span><Kana x={x.q} /><small className="bkvi">{x.q.vi}</small></div></div>
            {!open[i] ? <button className="chip sm" onClick={() => setOpen((o) => ({ ...o, [i]: true }))}>Xem câu trả lời mẫu</button> : (
              <>
                <div className="bkline bkans"><button className="bkspk" onClick={() => say(x.a.kana || x.a.jp)}>🔊</button><div><span className="jpt bkjp">{x.a.jp}</span><Kana x={x.a} />{x.a.ro && <small className="bkro">{x.a.ro}</small>}<small className="bkvi">{x.a.vi}</small></div></div>
                <div className="bkmmark"><button onClick={() => setOk((o) => ({ ...o, [i]: true }))}>✓ Trả lời được</button><button onClick={() => setOk((o) => ({ ...o, [i]: false }))}>✗ Chưa được</button></div>
              </>
            )}
          </li>
        ))}
      </ol>
      <div className="bkflowers">{FL.map(([jp, vi, c]) => <div key={jp} className={`bkflower ${c} ${fl?.[0] === jp ? "on" : ""}`}><b className="jpt">{jp}</b><small>{vi}</small></div>)}</div>
      <div className="bkres">
        {fl ? <b className={nOk >= 3 ? "pass" : "fail"}>{nOk}/5 · {fl[0]}</b> : <span>Đã chấm {nDone}/5</span>}
        <button className="chip dk" onClick={() => { setQs(pick()); setOpen({}); setOk({}); sfx.click(); }}>🎲 5 câu hỏi khác</button>
      </div>
    </div>
  );
}

export default function BookTest({ course, n }) {
  const { S, update } = useGame();
  const [T, setT] = useState(undefined);
  useEffect(() => { fetch(`/book/${course.store}/test${n}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setT); }, [course.store, n]);
  if (T === undefined || !S) return <p className="hint" style={{ marginTop: 40 }}>Đang tải…</p>;
  if (!T) return <p style={{ marginTop: 40 }}>Không có bài kiểm tra này. <Link href={course.base}>{course.title}</Link></p>;
  const key = `${course.store}book`;
  const B = S[key] || {};
  const cd = B.cando || {};
  const saveCd = (num, patch) => update((s) => { s[key] = s[key] || {}; s[key].cando = { ...(s[key].cando || {}), [num]: { ...(s[key].cando?.[num] || {}), ...patch } }; });
  const saveTest = (part) => (score) => update((s) => { s[key] = s[key] || {}; const t = { ...(s[key].tests?.[n] || {}) }; t[part] = Math.max(t[part] || 0, score); s[key].tests = { ...(s[key].tests || {}), [n]: t }; });
  const best = B.tests?.[n] || {};
  return (
    <div className="bkwrap bktest">
      <Link href={course.base} className="back">‹ {course.title}</Link>
      <div className="panel bkhead">
        <div className="bkbook">📖 {(course.books?.[0] || course.book).name} · sách tr.{T.page}–{T.page + 1}</div>
        <h2 className="jpt">テストとふりかえり {T.n}（トピック {T.topics[0]}-{T.topics[1]}）</h2>
        <p>Kiểm tra & nhìn lại {T.n} · Topic {T.topics[0]}–{T.topics[1]}</p>
        <p className="bktask">この じかん（120ぷん）では 4つの ことを します。 — Trong buổi này (120 phút) có 4 việc: ① Can-do チェック (15 phút) · ② từng người làm bài kiểm tra và ③ trong lúc chờ thì nói chuyện theo nhóm (80 phút) · ④ nói chuyện cả lớp (25 phút). Trên web bạn tự làm ① ② và dùng gợi ý ở ③ ④ để luyện nói.</p>
        {(best.moji != null || best.kaiwa != null) && <p className="bkbest">Kết quả tốt nhất: もじ {best.moji ?? "—"}/5 · かいわ {best.kaiwa ?? "—"}/5 <small>(quy về thang 5)</small></p>}
      </div>
      <Cando T={T} save={saveCd} cd={cd} />
      <section className="panel bksec">
        <h3><span className="bktn">2</span> テスト（もじ、かいわ） <small className="bkvi">Kiểm tra chữ và hội thoại</small></h3>
        <p className="bktask">Trong lớp: từng người làm bài, mỗi người 3–4 phút.</p>
        <MojiTest T={T} onDone={saveTest("moji")} />
        <KaiwaTest T={T} onDone={saveTest("kaiwa")} />
      </section>
      <section className="panel bksec">
        <h3><span className="bktn">3</span> <span className="jpt">グループで はなしましょう。</span> <small className="bkvi">Nói chuyện theo nhóm</small></h3>
        <p className="bktask">Trong lúc chờ đến lượt kiểm tra, lập nhóm khoảng 4 người, cho nhau xem (1) và (2) rồi nói chuyện về chúng:</p>
        <ul className="bklist">
          <li><span className="jpt">（1）にほんご・にほんぶんかの たいけんきろく</span> — ghi chép trải nghiệm tiếng Nhật và văn hóa Nhật của bạn</li>
          <li><span className="jpt">（2）じぶんで かいた もの（{T.write.join("、")}）</span> — những gì bạn đã tự viết trong các bài</li>
        </ul>
        <p className="hint">Tự học: hãy đọc lại to những gì bạn đã viết, rồi thử giới thiệu chúng bằng tiếng Nhật.</p>
      </section>
      <section className="panel bksec">
        <h3><span className="bktn">4</span> <span className="jpt">グループで はなしあった ことを ほかの ひとにも はなしましょう。</span> <small className="bkvi">Kể cho những người khác nghe điều nhóm đã nói</small></h3>
      </section>
    </div>
  );
}
