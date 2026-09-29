"use client";
// 学習記録シート (まるごと 中級1 B1-1, tr.250–267): theo từng Topic — tự chấm 5 Can-do ★☆☆ / ★★☆ / ★★★ + コメント + ngày,
// わたしだけのフレーズ và 日本語・日本文化の体験記録 (3 mục) — tất cả lưu trên máy (S[store].kiroku)
// Dữ liệu: public/book/<khóa>/kiroku.json (scripts/build-book.mjs chép từ data/book/extra/<khóa>-kiroku.json)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { speakLines } from "@/lib/tts";

const say = (jp) => speakLines([{ t: jp }], { rate: 0.9 });
const LEVELS = [[1, "まだ難しかった", "まだ むずかしかった", "Vẫn còn khó"], [2, "だいたいできた", "だいたい できた", "Làm được đại khái"], [3, "十分にできた", "じゅうぶんに できた", "Làm được tốt"]];
const ICON = { listen: ["🎧", "聞く", "Nghe"], talk: ["💬", "会話", "Hội thoại"], speak: ["🗣️", "話す", "Nói"], read: ["📖", "読む", "Đọc"], write: ["⌨️", "書く", "Viết"] };
const TAIKEN = [
  ["教室の中でみんなで体験したこと", "きょうしつの なかで みんなで たいけんした こと", "Những điều cả lớp cùng trải nghiệm trong lớp học"],
  ["教室外で「教室の外へ」を参考にやってみたこと", "きょうしつがいで「きょうしつの そとへ」を さんこうに やって みた こと", "Những điều bạn đã thử làm ngoài lớp, dựa theo mục 「教室の外へ」"],
  ["それ以外に自分でやってみたこと", "それ いがいに じぶんで やって みた こと", "Những điều khác bạn tự mình thử làm"],
];
const J = ({ x, kana, cls = "" }) => (
  <span className={`stj ${cls}`}><span className="jpt">{x.jp}</span>{kana && x.kana && <small className="bkkana jpt">{x.kana}</small>}{x.vi && <small className="bkvi">{x.vi}</small>}</span>
);

export default function Kiroku({ course }) {
  const { S, update } = useGame();
  const book = course.books?.[0];
  const [K, setK] = useState(undefined);
  const [kana, setKana] = useState(true);
  useEffect(() => { fetch(`/book/${book.dir}/kiroku.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setK); }, [book.dir]);
  useEffect(() => { if (K && location.hash) document.querySelector(location.hash)?.scrollIntoView(); }, [K]);
  if (K === undefined || !S) return <p className="hint" style={{ marginTop: 40 }}>Đang tải…</p>;
  if (!K) return <p style={{ marginTop: 40 }}>Không có dữ liệu. <Link href={course.base}>{course.title}</Link></p>;
  const R = S[course.store]?.kiroku || {};
  const stars = R.cd || {}, notes = R.note || {}, texts = R.text || {};
  const put = (f) => update((s) => { const p = (s[course.store] = s[course.store] || {}); p.kiroku = f({ ...(p.kiroku || {}) }); });
  const setStar = (n, v) => put((k) => ({ ...k, cd: { ...(k.cd || {}), [n]: v } }));
  const setNote = (n, c) => put((k) => ({ ...k, note: { ...(k.note || {}), [n]: { c, d: new Date().toLocaleDateString("vi-VN") } } }));
  const setText = (id, t) => put((k) => ({ ...k, text: { ...(k.text || {}), [id]: t } }));
  const all = K.flatMap((T) => T.cando);
  const sum = all.reduce((a, c) => a + (stars[c.n] || 0), 0);
  const area = (id, ph, rows = 3) => <textarea className="rtwrite jpt" rows={rows} placeholder={ph} defaultValue={texts[id] || ""} onBlur={(e) => e.target.value !== (texts[id] || "") && setText(id, e.target.value)} />;
  return (
    <div className="bkwrap bktest">
      <Link href={course.base} className="back">‹ {course.title}</Link>
      <div className="panel bkhead">
        <div className="bkbook">{book.ico} {book.name}{book.kirokuPages ? ` · sách tr.${book.kirokuPages}` : ""}</div>
        <h2 className="jpt">学習記録シート</h2>
        <p>Phiếu ghi chép quá trình học · theo từng Topic</p>
        <p className="bktask">Sau mỗi PART, tự đánh giá Can-do bằng sao <b className="jpt">評価</b> (đọc các câu tự hỏi bên dưới để nhớ lại mình đã làm được gì), ghi <b className="jpt">コメント</b>. Cuối Topic, ghi <b className="jpt">わたしだけのフレーズ</b> (những câu bạn muốn nhớ, dùng cho chính mình) và <b className="jpt">日本語・日本文化の体験記録</b>. Tất cả lưu lại trên máy.</p>
        <p className="bkstarlegend">{LEVELS.map(([n, jp, , vi]) => <span key={n}><b>{"★".repeat(n)}{"☆".repeat(3 - n)}</b> <span className="jpt">{jp}</span> — {vi}</span>)}</p>
        <div className="bkopts">
          <label><input type="checkbox" checked={kana} onChange={(e) => setKana(e.target.checked)} /> Hiện cách đọc (kana)</label>
          <span className="bkbest">Đã tự chấm {all.filter((c) => stars[c.n]).length}/{all.length} Can-do · {sum}/{all.length * 3} ★</span>
        </div>
        <div className="kktoc">{K.map((T) => <a key={T.topic} href={`#t${T.topic}`} className="chip sm">Topic {T.topic} · {T.cando.reduce((a, c) => a + (stars[c.n] || 0), 0)}★</a>)}</div>
      </div>
      {K.map((T) => (
        <section key={T.topic} id={`t${T.topic}`} className="panel bksec">
          <h3><span className="bkno">{T.topic}</span> <J x={T.title} kana={kana} /> <Link className="chip sm" href={course.topicHref ? course.topicHref(T.topic) : `${course.base}/${T.topic}`}>Mở Topic</Link></h3>
          {T.cando.map((c, i) => {
            const [ico, jp, vi] = ICON[c.icon] || ICON.listen;
            return (
              <div key={c.n} className="rtgroup kkcd">
                <div className="stgh"><b className="jpt">{i + 1}. {c.part.jp}</b>{kana && c.part.kana !== c.part.jp && <small className="bkkana jpt">{c.part.kana}</small>}<small className="bkvi"> {c.part.vi}</small></div>
                <div className="kkcan">
                  <span className="kkico" title={`${jp} · ${vi}`}>{ico}<small className="jpt">{jp}</small></span>
                  <span className="bkcando">Can-do {String(c.n).padStart(2, "0")}</span>
                  <J x={c} kana={kana} />
                </div>
                <ul className="kkqs">{c.qs.map((q, j) => (
                  <li key={j}><button className="bkspk" onClick={() => say(q.kana || q.jp)} aria-label="Nghe">🔊</button><J x={{ ...q, jp: `・${q.jp}` }} kana={kana} /></li>
                ))}</ul>
                <div className="kkrate">
                  <span className="jpt">評価</span>
                  <div className="bkcdstars">{[1, 2, 3].map((s) => <button key={s} className={s <= (stars[c.n] || 0) ? "on" : ""} title={`${LEVELS[s - 1][1]} — ${LEVELS[s - 1][3]}`} onClick={() => setStar(c.n, stars[c.n] === s ? 0 : s)} aria-label={`${s} sao`}>★</button>)}</div>
                  {stars[c.n] > 0 && <small className="bkvi">{LEVELS[stars[c.n] - 1][3]}</small>}
                  <input className="bkcdnote" placeholder="コメント / nhận xét" defaultValue={notes[c.n]?.c || ""} onBlur={(e) => e.target.value !== (notes[c.n]?.c || "") && setNote(c.n, e.target.value)} />
                  <small className="bkcddate">{notes[c.n]?.d || ""}</small>
                </div>
              </div>
            );
          })}
          <div className="rtgroup">
            <b className="jpt">わたしだけのフレーズ</b><small className="bkvi">Những câu của riêng tôi — câu/cách nói trong Topic này bạn muốn nhớ và dùng cho chính mình</small>
            {area(`${T.topic}-p`, "例：〜ばと思っています。〜といいな。…", 4)}
            {texts[`${T.topic}-p`] && <button className="chip sm" onClick={() => say(texts[`${T.topic}-p`])}>🔊 Nghe</button>}
          </div>
          <div className="rtgroup">
            <b className="jpt">日本語・日本文化の体験記録</b>
            <small className="bkvi"><span className="jpt">トピックに関係したことでやったことをメモしましょう。</span> — Ghi lại những việc bạn đã làm liên quan đến Topic này (có ảnh, tài liệu thì lưu kèm để giới thiệu cho người khác).</small>
            {TAIKEN.map(([jp, kn, vi], j) => (
              <div key={j} className="kktaiken">
                <J x={{ jp: `${j + 1}. ${jp}`, kana: kn, vi }} kana={kana} />
                {area(`${T.topic}-${j + 1}`, "Ghi chú…", 2)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
