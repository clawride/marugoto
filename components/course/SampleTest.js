"use client";
// テストの問題例 của sách まるごと 中級1 (B1-1, tr.204–215): 3 đề mẫu (Topic 1–3, 4–6, 7–9) — bản tự học trên web:
//   聴解 (audio sách T_01… hoặc giọng máy) + 筆記 (đọc hiểu, kiến thức ngôn ngữ): nộp bài → chấm tự động;
//   câu trả lời tự do: so với đáp án của sách rồi tự chấm · 口頭 / 作文: đề + gợi ý + bài mẫu tham khảo, viết nháp (lưu trên máy)
// Dữ liệu: public/book/<khóa>/stest<n>.json (scripts/build-book.mjs chép từ data/book/extra/<khóa>-stest<n>.json)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { Player, AudioSetup } from "@/components/Listen";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const say = (t) => speakLines([{ t }], { rate: 0.9 });
const nrm = (s) => (s || "").replace(/[\s　。、．，.,！？!?「」]/g, "");
const OX = [["○", "○ đúng"], ["×", "× sai"]];

// chữ Nhật + cách đọc + nghĩa (theo công tắc hiển thị)
const J = ({ x, show, block }) => (x?.jp ? (
  <span className={block ? "stj blk" : "stj"}>
    <span className="jpt">{x.jp}</span>
    {show.kana && x.kana && <small className="bkkana jpt">{x.kana}</small>}
    {show.vi && x.vi && <small className="bkvi">{x.vi}</small>}
  </span>
) : null);

function isRight(it, v) {
  if (it.t === "free") return v?.self === true;
  if (it.t === "input") { const x = nrm(v); return !!x && it.a.some((a) => nrm(a) === x); }
  if (it.t === "multi") { const s = new Set(v || []); return s.size === it.a.length && it.a.every((k) => s.has(k)); }
  return v != null && v === it.a;
}
const optsOf = (it) => (it.t === "ox" ? OX : it.opts || []);
const answerText = (it) => {
  if (it.t === "input") return it.a.join(" / ");
  if (it.t === "multi") return it.a.map((k) => { const o = optsOf(it).find((x) => x[0] === k); return o ? `${o[0]} ${o[1]}` : k; }).join("、");
  const o = optsOf(it).find((x) => x[0] === it.a);
  return o ? (o[0] === o[1] || it.t === "ox" ? it.a : `${o[0]} ${o[1]}`) : it.a;
};

function Item({ it, v, set, done, show }) {
  const right = done && isRight(it, v);
  const cls = done && it.t !== "free" ? (right ? "rt-ok" : "rt-bad") : "";
  return (
    <div className={`bkex rtq ${cls}`}>
      <span className="bkexn">{it.no}</span>
      <div>
        {it.q && <div className="rtjp"><J x={it.q} show={{ kana: show.kana, vi: show.vi || done }} /></div>}
        {(it.t === "select" || it.t === "ox") && (
          <div className="bkopts2">{optsOf(it).map(([k, txt]) => <button key={k} disabled={done} className={`chip sm jpt ${v === k ? (done ? (right ? "ok" : "bad") : "on") : ""}`} onClick={() => set(k)}>{k === txt || it.t === "ox" ? txt : `${k}  ${txt}`}</button>)}</div>
        )}
        {it.t === "multi" && (
          <div className="bkopts2">{optsOf(it).map(([k, txt]) => { const on = (v || []).includes(k); return <button key={k} disabled={done} className={`chip sm jpt ${on ? (done ? (it.a.includes(k) ? "ok" : "bad") : "on") : ""}`} onClick={() => set(on ? v.filter((x) => x !== k) : [...(v || []), k])}>{on ? "☑" : "☐"} {k}  {txt}</button>; })}<small className="hint">Chọn tất cả đáp án đúng</small></div>
        )}
        {it.t === "input" && (
          <div className="jpt rtjp">{it.pre}<input value={v || ""} disabled={done} onChange={(e) => set(e.target.value)} placeholder="…" className={done ? (right ? "ok" : "bad") : ""} />{it.post}</div>
        )}
        {it.t === "free" && (
          <textarea className="rtwrite jpt" rows={2} disabled={done} value={v?.text || ""} placeholder="Viết câu trả lời (tiếng Nhật hoặc tiếng Việt)…" onChange={(e) => set({ ...(v || {}), text: e.target.value })} />
        )}
        {done && it.t !== "free" && (
          <div className="rtans">
            {right ? <b className="pass">✓ Đúng</b> : <b className="fail">✗ Đáp án: <span className="jpt">{answerText(it)}</span></b>}
            {it.vi && <small className="bkvi">{it.vi}</small>}
            {it.why && <small className="bkvi">💡 {it.why}</small>}
          </div>
        )}
        {done && it.t === "free" && (
          <div className="rtans">
            <b>📖 Đáp án của sách:</b>
            {it.a.map((a, i) => <div key={i} className="rtjp"><J x={a} show={{ kana: show.kana, vi: true }} /></div>)}
            {it.why && <small className="bkvi">💡 {it.why}</small>}
            <div className="stself">
              <span>Tự chấm:</span>
              <button className={`chip sm ${v?.self === true ? "ok" : ""}`} onClick={() => set({ ...(v || {}), self: true })}>✓ Đúng ý</button>
              <button className={`chip sm ${v?.self === false ? "bad" : ""}`} onClick={() => set({ ...(v || {}), self: false })}>✗ Chưa đúng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Group({ g, v, setV, done, show, same }) {
  const tts = (g.script || []).map((l) => ({ t: l.kana || l.jp }));
  return (
    <div className="rtgroup">
      <div className="stgh"><span className="stno">問題例 {g.no}</span>{g.tag && <span className="bksub jpt">{g.tag}</span>}{g.part && <b className="jpt"> {g.part}</b>}</div>
      <div className="bkask"><J x={g.ask} show={{ kana: show.kana, vi: true }} block /></div>
      {g.audio && !same && <Player file={`#${g.audio}.mp3`} lib={show.lib} autoPlay={false} tts={tts} />}
      {g.script?.length > 0 && done && !same && (
        <details className="stscript"><summary>📜 Lời thoại (スクリプト) · track {g.audio}</summary>
          {g.script.map((l, i) => <div key={i} className="rtjp">{l.sp && <b className="jpt">{l.sp}：</b>}<J x={l} show={{ kana: show.kana, vi: true }} /></div>)}
        </details>
      )}
      {g.texts?.length > 0 && <div className="rttexts">{g.texts.map((t, i) => (
        <div key={i} className="rttext jpt">
          <button className="bkspk" onClick={() => say(t.kana || t.jp)} aria-label="Nghe">🔊</button>
          {t.title && <b>{t.title}</b>}
          {t.jp.split("\n").map((l, j) => <div key={j}>{l}</div>)}
          {t.kana && show.kana && <details className="rtkana"><summary>Cách đọc (kana)</summary>{t.kana.split("\n").map((l, j) => <div key={j}>{l}</div>)}</details>}
          {t.vi && (done || show.vi) && <details className="rtkana"><summary>Nghĩa tiếng Việt</summary>{t.vi.split("\n").map((l, j) => <div key={j} className="bkvi">{l}</div>)}</details>}
        </div>
      ))}</div>}
      {g.pics?.length > 0 && <div className="stpics">{g.pics.map(([k, d, e]) => <div key={k}><b>{k}</b>{e && <span className="bkem">{e}</span>}<small>{d}</small></div>)}</div>}
      {g.box && <div className="rtbox jpt">{g.box.join("　")}</div>}
      {g.items.map((it, i) => { const id = `${g.no}${g.part || ""}-${i}`; return (
        <div key={id} className="stitem">
          {it.sub && <div className="bkask stsub">{typeof it.sub === "string" ? <span className="jpt">{it.sub}</span> : <J x={it.sub} show={{ kana: show.kana, vi: true }} block />}</div>}
          <Item it={it} v={v[id]} set={(x) => setV((o) => ({ ...o, [id]: x }))} done={done} show={show} />
        </div>
      ); })}
    </div>
  );
}

// phần có chấm điểm (聴解 / 筆記)
function Graded({ S: sec, show, onScore, best }) {
  const [v, setV] = useState({});
  const [done, setDone] = useState(false);
  const all = sec.groups.flatMap((g) => g.items.map((it, i) => [`${g.no}${g.part || ""}-${i}`, it]));
  const ok = all.filter(([id, it]) => isRight(it, v[id])).length;
  const pending = all.filter(([id, it]) => it.t === "free" && v[id]?.self == null).length;
  useEffect(() => { if (done) onScore(Math.round((ok / all.length) * 100)); }, [done, ok]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => { setDone(true); sfx.click(); };
  const redo = () => { setV((o) => Object.fromEntries(Object.entries(o).filter(([id, x]) => isRight(all.find((a) => a[0] === id)[1], x)))); setDone(false); };
  return (
    <div className="rtsheet">
      {done && <p className="bkbest">Kết quả: <b>{ok}/{all.length}</b> câu đúng{pending ? ` · còn ${pending} câu trả lời tự do chưa tự chấm` : ""}</p>}
      {sec.groups.map((g, i) => <Group key={`${g.no}${g.part || ""}`} g={g} v={v} setV={setV} done={done} show={show} same={!!g.audio && sec.groups[i - 1]?.audio === g.audio} />)}
      <div className="bkexbar">
        {!done ? <button className="gbtn sm" onClick={submit}><span className="c" />📝 Nộp bài</button> : (
          <>
            <b className={ok === all.length ? "pass" : ok / all.length >= 0.6 ? "" : "fail"}>Đúng {ok}/{all.length}{pending ? ` (còn ${pending} câu tự chấm)` : ""}</b>
            {ok < all.length && <button className="chip sm" onClick={redo}>Làm lại câu sai</button>}
          </>
        )}
        {best != null && <small className="hint">Tốt nhất: {best}%</small>}
      </div>
    </div>
  );
}

// phần nói / viết: đề + gợi ý + bài mẫu tham khảo + ô viết nháp
function Prompts({ S: sec, show, notes, saveNote, n }) {
  return sec.prompts.map((p) => {
    const k = `${n}-${p.no}`;
    return (
      <div key={p.no} className="rtgroup">
        <div className="stgh"><span className="stno">問題例 {p.no}</span>{p.kind && <span className="bksub jpt">{p.kind.jp}</span>}<small className="bkvi"> {p.kind?.vi}</small></div>
        <div className="bkask"><J x={p} show={{ kana: show.kana, vi: true }} block /></div>
        {p.card && <div className="stcard jpt">{p.card.map((c, i) => <div key={i}>{c}</div>)}</div>}
        {p.tips?.length > 0 && <ul className="sttips">{p.tips.map((t, i) => <li key={i}>💡 {t}</li>)}</ul>}
        {p.model?.length > 0 && (
          <details className="stscript"><summary>📝 Bài mẫu tham khảo <small>(không có trong sách — viết thêm để tự học)</small></summary>
            <button className="chip sm" onClick={() => speakLines(p.model.map((m) => ({ t: m.kana || m.jp })), { rate: 0.9 })}>🔊 Nghe bài mẫu</button>
            {p.model.map((m, i) => <div key={i} className="rtjp">{m.sp && <b className="jpt">{m.sp}：</b>}<J x={m} show={{ kana: show.kana, vi: true }} /></div>)}
          </details>
        )}
        {p.rubric?.length > 0 && (
          <details className="stscript"><summary>📊 評価表 · Tiêu chí chấm (sách)</summary>
            <div className="strubric">{p.rubric.map((r, i) => <div key={i}><b className="jpt">{r.level}</b>{r.levelVi && <small className="bkvi">{r.levelVi}</small>}<J x={r} show={{ kana: show.kana, vi: true }} /></div>)}</div>
          </details>
        )}
        <textarea className="rtwrite jpt" rows={sec.key === "sakubun" ? 7 : 4} placeholder={sec.key === "sakubun" ? "Viết bài của bạn ở đây (tự lưu trên máy)" : "Ghi dàn ý / câu định nói (tự lưu trên máy)"} defaultValue={notes[k] || ""} onBlur={(e) => e.target.value !== (notes[k] || "") && saveNote(k, e.target.value)} />
        {notes[k] && <button className="chip sm" onClick={() => say(notes[k])}>🔊 Nghe bài của tôi</button>}
      </div>
    );
  });
}

export default function SampleTest({ course, n }) {
  const { S, update } = useGame();
  const book = course.books?.[0];
  const [T, setT] = useState(undefined);
  const [kana, setKana] = useState(true);
  const [vi, setVi] = useState(false);
  useEffect(() => { fetch(`/book/${book.dir}/stest${n}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setT); }, [book.dir, n]);
  if (T === undefined || !S) return <p className="hint" style={{ marginTop: 40 }}>Đang tải…</p>;
  if (!T) return <p style={{ marginTop: 40 }}>Không có đề này. <Link href={course.base}>{course.title}</Link></p>;
  const P = S[course.store] || {};
  const best = P.stest?.[n] || {};
  const notes = P.stnote || {};
  const lib = course.audio, show = { kana, vi, lib };
  const saveScore = (key) => (pct) => update((s) => { const p = (s[course.store] = s[course.store] || {}); const t = { ...(p.stest?.[n] || {}) }; t[key] = Math.max(t[key] || 0, pct); p.stest = { ...(p.stest || {}), [n]: t }; });
  const saveNote = (k, text) => update((s) => { const p = (s[course.store] = s[course.store] || {}); p.stnote = { ...(p.stnote || {}), [k]: text }; });
  return (
    <div className="bkwrap bktest">
      <Link href={course.base} className="back">‹ {course.title}</Link>
      <div className="panel bkhead">
        <div className="bkbook">{book.ico} {book.name} · sách tr.{T.pages[0]}–{T.pages[1]}{T.ansPages ? ` · đáp án tr.${T.ansPages[0]}–${T.ansPages[1]}` : ""}</div>
        <h2 className="jpt">テストの問題例（トピック {T.topics[0]}-{T.topics[1]}）</h2>
        <p>Đề thi mẫu của sách cho Topic {T.topics[0]}–{T.topics[1]}: nghe hiểu, đọc hiểu & kiến thức ngôn ngữ (chấm điểm), nói và viết (đề + gợi ý + bài mẫu tham khảo).</p>
        {T.note && <p className="bktask"><J x={T.note} show={{ kana, vi: true }} /></p>}
        {(best.choukai != null || best.hikki != null) && <p className="bkbest">Kết quả tốt nhất: 聴解 {best.choukai ?? "—"}% · 筆記 {best.hikki ?? "—"}%</p>}
        <div className="bkopts">
          <label><input type="checkbox" checked={kana} onChange={(e) => setKana(e.target.checked)} /> Hiện cách đọc (kana)</label>
          <label><input type="checkbox" checked={vi} onChange={(e) => setVi(e.target.checked)} /> Hiện nghĩa tiếng Việt ngay (khi chưa nộp bài)</label>
        </div>
        {lib.pickFolder ? <AudioSetup lib={lib} folder={book.folder || course.folder} /> : <p className="hint">🔊 Khóa này chưa có audio sách: bài nghe dùng giọng đọc tiếng Nhật của trình duyệt với lời thoại chép từ sách.</p>}
      </div>
      {T.sections.map((sec, i) => (
        <section key={sec.key} className="panel bksec">
          <h3><span className="bktn">{i + 1}</span> <span className="jpt">{sec.jp}</span> <small className="bkvi">{sec.vi}</small></h3>
          {sec.groups ? <Graded S={sec} show={show} onScore={saveScore(sec.key)} best={best[sec.key]} />
            : <Prompts S={sec} show={show} notes={notes} saveNote={saveNote} n={n} />}
        </section>
      ))}
    </div>
  );
}
