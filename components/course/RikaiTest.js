"use client";
// テストとふりかえり theo sách Rikai (まるごと入門 A1 りかい p99–100, p165–166) — bản tự học trên web:
//   ① テストの もんだいれい: câu hỏi mẫu y như sách, làm trực tiếp, nộp bài để chấm
//   ①+ テスト luyện thêm: cùng các dạng của sách, câu lấy ngẫu nhiên từ các bài Rikai (và phiếu Kanji A1)
//   ② せつめい: đáp án + giải thích hiện dưới từng câu · ③ ふりかえり: xem lại câu sai · ④ さくぶんの はっぴょう
// Dữ liệu: public/book/<khóa>-rikai/rtest<n>.json (scripts/build-book.mjs từ data/book/extra/a1-rikai-extra.json)
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { speakLines } from "@/lib/tts";
import { shuffle } from "@/lib/data";
import { toRomaji } from "@/lib/kana";
import { sfx } from "@/lib/sfx";

const say = (jp) => speakLines([{ t: jp }], { rate: 0.85 });
const sayLines = (ls) => speakLines(ls.map((l) => ({ t: l.kana || l.jp })), { rate: 0.85 });
const Kana = ({ x }) => (x?.kana ? <small className="bkkana jpt">{x.kana}</small> : null);
// câu sắp xếp theo khuôn: "駅は … ＿、＿ ＿ 右に ＿ ください。" — điền lần lượt các cụm đã chọn vào chỗ ＿
const fillTpl = (tpl, parts) => tpl.split("＿").map((p, i, a) => (i < a.length - 1 ? p + (parts[i] ?? "＿＿") : p)).join("");
const nrm = (s) => (s || "").replace(/[\s　。、．，.,！？!?]/g, "");
const rom = (s) => s.toLowerCase().replace(/[\s\-'’]/g, "").replace(/ō/g, "oo").replace(/ū/g, "uu").replace(/ou/g, "oo");
const OX = [["○", "○ ただしい"], ["×", "× ただしくない"]];
const CIRC = "①②③④⑤⑥⑦⑧⑨⑩";

// ——— chấm một câu ———
function isRight(it, v) {
  if (it.t === "input") {
    const x = nrm(v); if (!x) return false;
    return it.a.some((a) => nrm(a) === x || (it.ro && rom(toRomaji(nrm(a))) === rom(x)));
  }
  if (it.t === "multi") { const s = new Set(v || []); return s.size === it.a.length && it.a.every((k) => s.has(k)); }
  if (it.t === "order") return (v || []).join("-") === it.a.join("-");
  return v === it.a;
}
const labelOf = (it, k) => { const o = (it.opts || []).find((x) => x[0] === k); return o ? (o[0] === o[1] ? o[1] : `${o[0]} ${o[1]}`) : k; };
function answerText(it) {
  if (it.t === "input") return it.a[0] + (it.ro ? ` / ${toRomaji(nrm(it.a[0]))}` : "");
  if (it.t === "multi") return it.a.map((k) => labelOf(it, k)).join(", ");
  if (it.t === "order") { const ws = it.a.map((k) => it.chunks.find((c) => c[0] === k)[1]); return it.tpl ? fillTpl(it.tpl, ws) : [it.pre, ...ws, it.post].filter(Boolean).join(" "); }
  return labelOf(it, it.a);
}
function questionText(it) {
  if (it.k) return `${it.pre || ""}［${it.k}］${it.post || ""}`;
  if (it.t === "order") return it.tpl || `${it.pre || ""} ＿＿ ＿＿ ＿＿ ${it.post || ""}`;
  return [it.q, it.jp, it.label && `${it.label}（${it.labelVi || ""}）`, it.say && `🔊 ${it.say}`, it.lines && `🔊 ${it.lines.map((l) => l.jp).join(" ")}`].filter(Boolean)[0] || "";
}

// ——— câu hỏi mẫu của sách → nhóm câu hỏi ———
function sampleGroups(T) {
  return T.sample.map((g) => {
    const G = { no: g.no, ask: g.ask, note: g.note, texts: g.texts, pic: g.pic, picVi: g.picVi, cal: g.cal, lines: g.type === "fill" ? g.lines : null, box: null, items: [] };
    const id = (i) => `s${g.no}-${i}`;
    if (g.type === "listen") G.items = g.items.map((x, i) => ({ id: id(i), no: x.no, t: "input", say: x.say, a: x.a, vi: x.vi }));
    if (g.type === "kanji") G.items = g.items.map((x, i) => ({ id: id(i), no: x.no, t: "input", pre: x.pre, k: x.k, post: x.post, a: x.a, ro: true, vi: x.vi }));
    if (g.type === "fill") G.items = g.a.map((a, i) => ({ id: id(i), no: i + 1, t: "select", label: CIRC[i], opts: g.opts, a }));
    if (g.type === "order") G.items = g.items.map((x, i) => ({ id: id(i), no: x.no, t: "order", pre: x.pre, post: x.post, tpl: x.tpl, chunks: x.chunks, a: x.a.split("-"), vi: x.vi, em: x.pic }));
    if (g.type === "read") G.items = [{ id: id(0), no: 1, t: g.multi ? "multi" : "select", q: g.q.jp, qvi: g.q.vi, opts: g.opts, a: g.a, why: g.why }];
    if (g.type === "ox") G.items = g.items.map((x, i) => ({ id: id(i), no: x.no, t: "select", say: x.say, sayKana: x.kana, opts: OX, a: x.a, vi: x.vi }));
    if (g.type === "choose") { G.box = g.opts; G.items = g.items.map((x, i) => ({ id: id(i), no: x.no, t: "select", jp: x.jp, kana: x.kana, opts: g.opts, a: x.a, vi: x.vi })); }
    if (g.type === "write") G.items = g.items.map((x, i) => ({ id: id(i), no: x.no, t: "input", q: x.q, pre: x.pre, post: x.post, next: x.next, box: x.box, a: x.a, vi: x.vi }));
    if (g.type === "read-ox") G.items = g.items.map((x, i) => ({ id: id(i), no: x.no, t: "select", jp: x.jp, kana: x.kana, opts: x.opts || OX, a: x.a, vi: x.vi, why: x.why }));
    if (g.type === "listen-choose") G.items = g.items.map((x, i) => ({ id: id(i), no: x.no, t: "select", label: x.label, labelVi: x.vi, lines: x.lines, opts: x.opts || g.opts, a: x.a, why: x.why, vi: x.vi }));
    return G;
  });
}

// ——— bài luyện thêm: cùng các dạng của sách, câu lấy ngẫu nhiên ———
const ASK = {
  listen: { jp: "きいて ひらがなか カタカナで かいて ください。", vi: "Nghe rồi viết bằng hiragana hoặc katakana." },
  kanji: { jp: "かんじの よみかたを ひらがなか ローマじで かいて ください。", vi: "Viết cách đọc của chữ Hán trong ngoặc ［ ］ bằng hiragana hoặc romaji." },
  fill: { jp: "ただしい ものを えらんで ください。", vi: "Chọn từ đúng điền vào chỗ trống." },
  order: { jp: "ただしい ぶんを つくって ください。", vi: "Sắp xếp thành câu đúng." },
  read: { jp: "ぶんを よんで、しつもんに こたえて ください。", vi: "Đọc đoạn văn rồi trả lời câu hỏi." },
  ox: { jp: "きいて ください。いみは ただしいですか。ただしい（○） ただしくない（×）", vi: "Nghe câu tiếng Nhật. Nghĩa tiếng Việt ghi dưới đây đúng (○) hay sai (×)?" },
};
function practiceGroups(P) {
  const G = [];
  const id = (g, i) => `p${g}-${i}`;
  const take = (a, n) => shuffle(a).slice(0, n);
  if (P.listen.length) G.push({ no: 1, ask: ASK.listen, items: take(P.listen, 4).map((x, i) => ({ id: id(1, i), no: i + 1, t: "input", say: x.say, a: x.a, vi: x.vi })) });
  if (P.kanji.length) {
    const ks = take(P.kanji.filter((x) => x.pre || x.post), 3).concat(take(P.kanji.filter((x) => !x.pre && !x.post), 2));
    G.push({ no: 2, ask: ASK.kanji, items: ks.map((x, i) => ({ id: id(2, i), no: i + 1, t: "input", pre: x.pre, k: x.k, post: x.post, a: x.a, ro: true, vi: x.vi })) });
  }
  if (P.fill.length) G.push({ no: 3, ask: ASK.fill, items: take(P.fill, 5).map((x, i) => ({ id: id(3, i), no: i + 1, t: "select", jp: (x.sp ? `${x.sp}：` : "") + x.jp, opts: x.opts.map((o) => [o, o]), a: x.a, vi: x.vi })) });
  if (P.order.length) G.push({ no: 4, ask: ASK.order, items: take(P.order, 3).map((x, i) => {
    const ks = x.chunks.map((c, j) => [String.fromCharCode(97 + j), c]);
    return { id: id(4, i), no: i + 1, t: "order", pre: x.pre, post: x.post, chunks: shuffle(ks).map((c, j) => [c[0], c[1], j]), a: ks.map((c) => c[0]), vi: x.vi };
  }) });
  if (P.read.length) {
    const R = take(P.read, 1)[0];
    G.push({ no: 5, ask: ASK.read, title: R.title, texts: R.text, items: take(R.qs, 3).map((x, i) => ({ id: id(5, i), no: i + 1, t: "select", jp: x.q.jp, qvi: x.q.vi, opts: x.opts.map((o) => [o, o]), a: x.a })) });
  }
  if (P.ox.length >= 8) {
    const xs = take(P.ox, 8);
    G.push({ no: 6, ask: ASK.ox, items: xs.slice(0, 4).map((x, i) => {
      const right = Math.random() < 0.5;
      return { id: id(6, i), no: i + 1, t: "select", say: x.jp, shown: right ? x.vi : xs[i + 4].vi, opts: OX, a: right ? "○" : "×", vi: x.vi, why: right ? "" : `Nghĩa đúng: ${x.vi}` };
    }) });
  }
  return G;
}

// ——— từng câu ———
function OrderPick({ it, v, set, done }) {
  const picked = v || [];
  return (
    <div className="bkorder">
      <div className={`bkorderans jpt ${done ? (isRight(it, v) ? "ok" : "bad") : ""}`}>
        {it.tpl ? fillTpl(it.tpl, picked.map((k) => it.chunks.find((c) => c[0] === k)[1])) : <>
          {it.pre && <span className="bkfix">{it.pre} </span>}
          {picked.length ? picked.map((k) => it.chunks.find((c) => c[0] === k)[1]).join(" ") : "＿＿ ＿＿ ＿＿"}
          {it.post && <span className="bkfix"> {it.post}</span>}
        </>}
      </div>
      {!done && (
        <div className="bkorderpool">
          {it.chunks.map((c) => <button key={c[0]} className="chip sm jpt" disabled={picked.includes(c[0])} onClick={() => set([...picked, c[0]])}>{c.length === 2 ? `${c[0]} ` : ""}{c[1]}</button>)}
          <button className="chip sm" onClick={() => set([])}>↺</button>
        </div>
      )}
    </div>
  );
}
function Item({ it, v, set, done }) {
  const right = done && isRight(it, v);
  const opts = it.opts || [];
  return (
    <div className={`bkex rtq ${done ? (right ? "rt-ok" : "rt-bad") : ""}`}>
      <span className="bkexn">{it.label && [...it.label].length <= 2 ? it.label : it.no}</span>
      <div>
        {it.em && <span className="bkem">{it.em}</span>}
        {it.q && <div className="jpt">{it.q}</div>}
        {it.say && <button className="chip sm" onClick={() => say(it.sayKana || it.say)}>🔊 Nghe</button>}
        {it.lines && <button className="chip sm" onClick={() => sayLines(it.lines)}>🔊 Nghe hội thoại</button>}
        {it.label && it.labelVi && <b className="jpt"> {it.label} <small>（{it.labelVi}）</small></b>}
        {it.jp && <div className="jpt rtjp">{it.jp}</div>}
        {it.jp && it.t !== "input" && <Kana x={it} />}
        {it.qvi && <small className="bkvi">{it.qvi}</small>}
        {it.shown && <div className="bkvi">« {it.shown} »</div>}
        {it.box && <div className="rtbox jpt">{it.box.join("　")}</div>}
        {it.t === "input" && (
          <div className="jpt rtjp">
            {it.k ? <>{it.pre}<u className="rtk">{it.k}</u>{it.post} <span className="rtarrow">→</span> </> : it.pre}
            <input value={v || ""} disabled={done} onChange={(e) => set(e.target.value)} placeholder={it.ro ? "よみかた / romaji" : it.say ? "かいて ください" : "…"} className={done ? (right ? "ok" : "bad") : ""} />
            {!it.k && it.post}
            {it.next && <div>{typeof it.next === "string" ? it.next : it.next.jp}</div>}
          </div>
        )}
        {it.t === "select" && (
          <div className="bkopts2">{opts.map(([k, txt]) => <button key={k} disabled={done} className={`chip sm jpt ${v === k ? (done ? (right ? "ok" : "bad") : "on") : ""}`} onClick={() => set(k)}>{k === txt ? txt : `${k}  ${txt}`}</button>)}</div>
        )}
        {it.t === "multi" && (
          <div className="bkopts2">{opts.map(([k, txt]) => { const on = (v || []).includes(k); return <button key={k} disabled={done} className={`chip sm jpt ${on ? "on" : ""}`} onClick={() => set(on ? v.filter((x) => x !== k) : [...(v || []), k])}>{on ? "☑" : "☐"} {k} {txt}</button>; })}</div>
        )}
        {it.t === "order" && <OrderPick it={it} v={v} set={set} done={done} />}
        {done && (
          <div className="rtans">
            {right ? <b className="pass">✓ Đúng</b> : <b className="fail">✗ Đáp án: <span className="jpt">{answerText(it)}</span></b>}
            {it.say && <small className="jpt"> · スクリプト: {it.say}</small>}
            {it.lines && <small className="jpt"> · スクリプト: {it.lines.map((l) => `${l.sp}：${l.jp}`).join("　")}</small>}
            {it.vi && <small className="bkvi">{it.vi}</small>}
            {it.why && <small className="bkvi">💡 {it.why}</small>}
          </div>
        )}
      </div>
    </div>
  );
}

function Sheet({ groups, onResult, extra }) {
  const [v, setV] = useState({});
  const [done, setDone] = useState(false);
  const items = groups.flatMap((g) => g.items);
  const nOk = items.filter((it) => isRight(it, v[it.id])).length;
  const submit = () => {
    setDone(true);
    const wrong = items.filter((it) => !isRight(it, v[it.id]));
    onResult?.(nOk, items.length, wrong);
    if (!wrong.length) sfx.correct?.(); else sfx.click();
  };
  const redoWrong = () => { setV((o) => Object.fromEntries(Object.entries(o).filter(([id, x]) => isRight(items.find((i) => i.id === id), x)))); setDone(false); };
  return (
    <div className="rtsheet">
      {groups.map((g) => (
        <div key={g.no} className="rtgroup">
          <div className="bkask"><b className="jpt"><span className="rtno">{g.no}</span> {g.ask.jp}</b>{g.ask.en && <i>{g.ask.en}</i>}<small>{g.ask.vi}</small></div>
          {g.title?.jp && <b className="jpt">「{g.title.jp}」</b>}
          {g.texts && <div className="rttexts">{g.texts.map((t, i) => <div key={i} className="rttext jpt"><button className="bkspk" onClick={() => say(t.kana || t.jp)}>🔊</button>{t.jp.split("\n").map((l, j) => <div key={j}>{l}</div>)}{t.kana && <details className="rtkana"><summary>Cách đọc (kana)</summary>{t.kana.split("\n").map((l, j) => <div key={j}>{l}</div>)}</details>}{done && <small className="bkvi">{t.vi}</small>}</div>)}</div>}
          {g.lines && <div className="rttexts">{g.lines.map((l, i) => <div key={i} className="jpt rtjp">{l.sp && <b>{l.sp}：</b>}{l.jp}{done && <Kana x={l} />}{done && <small className="bkvi">{l.vi}</small>}</div>)}</div>}
          {g.box && <div className="rtbox jpt">{g.box.map(([k, t]) => `${k} ${t}`).join("　")}</div>}
          {g.note && <p className="bktask">{typeof g.note === "string" ? g.note : <><span className="jpt">{g.note.jp}</span>{g.note.vi && <> — {g.note.vi}</>}</>}</p>}
          {(g.pic || g.picVi) && <div className="rtpic">{g.pic && <span className="bkem">{g.pic}</span>}<small>🗺 {g.picVi}</small></div>}
          {g.cal && <div className="rtcal">{g.cal.map(([d, n, x], i) => <div key={i}><small>{d}</small><b>{n}</b><span className="jpt">{x}</span></div>)}</div>}
          {g.items.map((it) => <Item key={it.id} it={it} v={v[it.id]} set={(x) => setV((o) => ({ ...o, [it.id]: x }))} done={done} />)}
        </div>
      ))}
      <div className="bkexbar">
        {!done ? <button className="gbtn sm" onClick={submit}><span className="c" />📝 Nộp bài</button> : (
          <>
            <b className={nOk === items.length ? "pass" : nOk / items.length >= 0.6 ? "" : "fail"}>Đúng {nOk}/{items.length}</b>
            {nOk < items.length && <button className="chip sm" onClick={redoWrong}>Làm lại câu sai</button>}
          </>
        )}
        {extra}
      </div>
    </div>
  );
}

export default function RikaiTest({ course, n }) {
  const { S, update } = useGame();
  const book = course.books?.find((b) => b.key === "rikai") || course.books?.[0];
  const [T, setT] = useState(undefined);
  const [seed, setSeed] = useState(0);
  const [wrong, setWrong] = useState({ s: [], p: [] });
  useEffect(() => { fetch(`/book/${course.store}-rikai/rtest${n}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setT); }, [course.store, n]);
  const sample = useMemo(() => (T ? sampleGroups(T) : []), [T]);
  const prac = useMemo(() => (T ? practiceGroups(T.pools) : []), [T, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  if (T === undefined || !S) return <p className="hint" style={{ marginTop: 40 }}>Đang tải…</p>;
  if (!T) return <p style={{ marginTop: 40 }}>Không có bài kiểm tra này. <Link href={course.base}>{course.title}</Link></p>;
  const key = `${course.store}book`;
  const best = S[key]?.rtests?.[n] || {};
  const save = (part, w) => (ok, total, wr) => {
    setWrong((o) => ({ ...o, [w]: wr }));
    const pct = Math.round((ok / total) * 100);
    update((s) => { s[key] = s[key] || {}; const t = { ...(s[key].rtests?.[n] || {}) }; t[part] = Math.max(t[part] || 0, pct); s[key].rtests = { ...(s[key].rtests || {}), [n]: t }; });
  };
  const saku = S[key]?.sakubun || {};
  const saveSaku = (l, text) => update((s) => { s[key] = s[key] || {}; s[key].sakubun = { ...(s[key].sakubun || {}), [l]: text }; });
  const allWrong = [...wrong.s, ...wrong.p];
  return (
    <div className="bkwrap bktest">
      <Link href={course.base} className="back">‹ {course.title}</Link>
      <div className="panel bkhead">
        <div className="bkbook">{book?.ico || "📘"} {book?.name || "Sách Rikai"} · sách tr.{T.page}–{T.page + 1}</div>
        <h2 className="jpt">テストとふりかえり {T.n}（トピック {T.topics[0]}-{T.topics[1]}）</h2>
        <p>Test and Reflection {T.n} · Kiểm tra & nhìn lại Topic {T.topics[0]}–{T.topics[1]} (bài {T.lessons[0]}–{T.lessons[1]})</p>
        <div className="rtplan">{T.plan.map(([t, jp, vi], i) => <div key={i}><small>{t}</small><b className="jpt">{jp}</b><span>{vi}</span></div>)}</div>
        {(best.sample != null || best.prac != null) && <p className="bkbest">Kết quả tốt nhất: câu hỏi mẫu {best.sample ?? "—"}% · bài luyện thêm {best.prac ?? "—"}%</p>}
      </div>

      <section className="panel bksec">
        <h3><span className="bktn">1</span> <span className="jpt">テストの もんだいれい</span> <small className="bkvi">Câu hỏi mẫu của bài kiểm tra (y như sách)</small></h3>
        <p className="bktask">Làm hết rồi bấm <b>Nộp bài</b>. Câu nghe: bấm 🔊 để nghe (giọng đọc máy), lời thoại (スクリプト) hiện sau khi nộp bài.</p>
        <Sheet groups={sample} onResult={save("sample", "s")} />
      </section>

      <section className="panel bksec">
        <h3><span className="bktn">1+</span> <span className="jpt">テスト</span> <small className="bkvi">Bài luyện thêm cùng dạng — câu lấy từ các bài {T.lessons[0]}–{T.lessons[1]} sách Rikai</small></h3>
        <p className="bktask">Cùng các dạng câu hỏi như sách (nghe viết, đọc Kanji, chọn từ, sắp xếp câu, đọc hiểu, nghe ○/×). Mỗi lần bấm "Đề mới" là một đề khác.</p>
        <Sheet key={seed} groups={prac} onResult={save("prac", "p")} extra={<button className="chip sm" onClick={() => { setSeed((x) => x + 1); setWrong((o) => ({ ...o, p: [] })); sfx.click(); }}>🎲 Đề mới</button>} />
      </section>

      <section className="panel bksec">
        <h3><span className="bktn">2</span> <span className="jpt">テストの せつめい</span> <small className="bkvi">Chữa bài</small></h3>
        <p className="bktask"><span className="jpt">テストの こたえを チェックしましょう。しつもんが あったら、せんせいに ききましょう。</span><br />Kiểm tra đáp án của bài. Có gì thắc mắc thì hỏi giáo viên. — Trên web: sau khi nộp bài, đáp án, lời thoại, nghĩa tiếng Việt và giải thích hiện ngay dưới từng câu.</p>
      </section>

      <section className="panel bksec">
        <h3><span className="bktn">3</span> <span className="jpt">テストの ふりかえり</span> <small className="bkvi">Xem lại bài</small></h3>
        <p className="bktask"><span className="jpt">まちがえた もんだいを もう いちど みて みましょう。</span> — Xem lại một lần nữa những câu đã làm sai.</p>
        {allWrong.length ? (
          <ul className="rtwrong">{allWrong.map((it) => <li key={it.id}><span className="jpt">{questionText(it)}</span> → <b className="jpt">{answerText(it)}</b>{it.vi && <small className="bkvi">{it.vi}</small>}</li>)}</ul>
        ) : <p className="hint">Nộp bài ở phần 1 để xem danh sách câu sai ở đây.</p>}
      </section>

      {T.sakubun.length > 0 && <section className="panel bksec">
        <h3><span className="bktn">4</span> <span className="jpt">さくぶんの はっぴょう</span> <small className="bkvi">Trao đổi về bài viết (さくぶん)</small></h3>
        <p className="bktask">
          <span className="jpt">{T.sakubun.map((s) => `だい${s.l}か`).join("、")}の「さくぶん」について グループで はなしましょう。</span> — Nói chuyện theo nhóm về bài viết của các bài {T.sakubun.map((s) => s.l).join(", ")}.<br />
          <span className="jpt">ともだちの さくぶんを よんで、いろいろ しつもんして みましょう。</span> — Đọc bài viết của bạn và thử hỏi nhiều câu.<br />
          <span className="jpt">じぶんの さくぶんの にほんごに ついて せんせいに しつもんして みましょう。</span> — Hỏi giáo viên về tiếng Nhật trong bài viết của mình.
        </p>
        {T.sakubun.map((s) => (
          <div key={s.l} className="rtsaku">
            <h4 className="jpt">だい{s.l}か {s.title?.jp} <small className="bkvi">{s.title?.vi}</small> <Link className="chip sm" href={`${course.base}/${s.l}`}>Mở bài</Link></h4>
            {s.acts.map((A, i) => (
              <div key={i} className="rtsakuact">
                {A.title?.jp && <b className="jpt">「{A.title.jp}」</b>}
                {A.ask && <div className="bkask"><b className="jpt">{A.ask.jp}</b><small>{A.ask.vi}</small></div>}
                {A.task && <p className="bktask">📝 {A.task}</p>}
                {A.model.length > 0 && <details><summary>Bài mẫu trong sách</summary>{A.model.map((m, j) => <div key={j} className="rtjp jpt">{m.jp}<small className="bkvi">{m.vi}</small></div>)}</details>}
              </div>
            ))}
            <textarea className="rtwrite jpt" rows={4} placeholder="わたしの さくぶん — viết bài của bạn ở đây (tự lưu trên máy)" defaultValue={saku[s.l] || ""} onBlur={(e) => e.target.value !== (saku[s.l] || "") && saveSaku(s.l, e.target.value)} />
            {saku[s.l] && <button className="chip sm" onClick={() => say(saku[s.l])}>🔊 Nghe bài của tôi</button>}
          </div>
        ))}
      </section>}
    </div>
  );
}
