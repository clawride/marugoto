"use client";
// 📚 Một bài trong Thư viện sách: tình huống · 5 mẫu câu chính (giải thích + ví dụ) · hội thoại luyện đọc · cách nói tương tự · từ vựng · mẹo
// Dữ liệu: public/library/<sách>/<bài>.json (scripts/build-library.mjs)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import GenshinVocabTable from "@/components/GenshinVocab";
import Sentence, { ViewBar, say } from "@/components/library/Sentence";
import { speakLines, stopSpeak } from "@/lib/tts";
import { bookById, lessonUrl } from "@/lib/library";
import { sfx } from "@/lib/sfx";

const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";
const CIRCLED = "⓪①②③④⑤⑥⑦⑧⑨⑩";

export function useLibJson(url) {
  const [D, setD] = useState(undefined); // undefined = đang tải · null = lỗi
  useEffect(() => {
    let on = true; setD(undefined);
    fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((d) => on && setD(d));
    return () => { on = false; };
  }, [url]);
  return D;
}

// nghĩa + từ tiếng Anh (bỏ nếu nghĩa đã ghi sẵn từ đó trong ngoặc)
export const meaning = (v) => (v.en && !v.vi.toLowerCase().includes(v.en.toLowerCase().split(/[ /]/)[0]) ? `${v.vi} (${v.en})` : v.vi);
export const vocabRows = (list) => (list || []).map((v) => ({ w: v.w, r: v.r || v.w, ro: v.ro, m: meaning(v), tags: [] }));

function Dialog({ d }) {
  const [on, setOn] = useState(-1);
  const play = async () => {
    if (on >= 0) { stopSpeak(); setOn(-1); return; }
    const sps = [...new Set(d.lines.map((l) => l.sp))];
    setOn(0);
    await speakLines(d.lines.map((l) => ({ t: l.jp, sp: l.sp, g: sps.indexOf(l.sp) % 2 ? "m" : "f" })), { rate: 0.9, onLine: (i) => setOn(i) });
    setOn(-1);
  };
  useEffect(() => () => stopSpeak(), []);
  return (
    <div className="lbdialog">
      <div className="lbdhead">
        <div><b>{d.title}</b>{d.setting && <small>{d.setting}</small>}</div>
        <button className="chip sm" onClick={play}>{on >= 0 ? "⏹ Dừng" : "▶ Nghe cả đoạn"}</button>
      </div>
      {d.lines.map((l, i) => <div key={i} className={on === i ? "lbcur" : ""}><Sentence s={l} speaker={l.sp} /></div>)}
    </div>
  );
}

export default function LessonView({ bookId, n }) {
  const B = bookById(bookId);
  const meta = B?.lessons.find((l) => l.n === n);
  const L = useLibJson(lessonUrl(bookId, n));
  const { S, update } = useGame();
  if (!B || !meta) return <p style={{ marginTop: 40 }}>Không tìm thấy bài. <Link href="/thu-vien">Về Thư viện</Link></p>;
  const done = !!S?.lib?.[bookId]?.[n];
  const prev = B.lessons.find((l) => l.n === n - 1), next = B.lessons.find((l) => l.n === n + 1);
  const toggleDone = () => { update((s) => { s.lib ||= {}; s.lib[bookId] ||= {}; if (done) delete s.lib[bookId][n]; else s.lib[bookId][n] = Date.now(); }); sfx.click(); };

  return (
    <>
      <Link href={`/thu-vien/${bookId}`} className="back" onClick={() => sfx.page()}>‹ {B.title}</Link>
      <div className="pagehead lbhead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 2, margin: "0 0 6px" }}>第{n}課 · BÀI {n} · sách tr. {meta.page}–{meta.page + 9}</p>
        <h1 className="jpt">{meta.jp}</h1>
        <p className="lbro" style={{ margin: "6px 0 0" }}>{meta.ro}</p>
        <p>{meta.vi}</p>
        <div className="orn"><span /></div>
      </div>

      <div className="lbbar">
        <ViewBar />
        <nav className="lbjump" aria-label="Mục trong bài">
          {[["tinh-huong", "🎬 Tình huống"], ["mau-cau", "📐 Mẫu câu"], ["hoi-thoai", "💬 Hội thoại"], ["cach-noi", "🗣 Cách nói"], ["tu-vung", "📝 Từ vựng"], ["meo", "💡 Mẹo"]]
            .map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}
        </nav>
      </div>

      {L === undefined && <p className="hint" style={{ textAlign: "center" }}>Đang tải bài…</p>}
      {L === null && <p className="panel lbsec" style={{ textAlign: "center" }}>Không tải được bài này. Hãy kiểm tra mạng rồi tải lại trang.</p>}
      {L && <>
        <section className="panel lbsec" id="tinh-huong">
          <h2>🎬 Tình huống trong sách</h2>
          <p>{L.scene}</p>
          {!!L.people?.length && <div className="lbpeople">{L.people.map((p, i) => <span key={i} className="lbperson"><b className="jpt">{p.name}</b> {p.ro && <i>{p.ro}</i>} — {p.role}</span>)}</div>}
          {!!L.goals?.length && <><h3>🎯 Sau bài này bạn có thể</h3><ul>{L.goals.map((g, i) => <li key={i}>{g}</li>)}</ul></>}
        </section>

        <section className="lbsec2" id="mau-cau">
          <h2 className="a22th"><span>📐 5 mẫu câu chính</span> <small>Mẫu gạch chân trong hội thoại của sách</small></h2>
          {L.grammar.map((g) => (
            <article key={g.no} className="panel lbgram">
              <div className="lbgp">
                <span className="lbgno">{CIRCLED[g.no] || g.no}</span>
                <div>
                  <b className="jpt">{g.p}</b>
                  <div className="lbro">{g.ro}</div>
                  <div className="lbvi">{g.vi}</div>
                </div>
                <button className="lbspk" onClick={() => say(g.p.replace(/〇〇|○○/g, "まるまる"))} aria-label="Nghe mẫu câu">🔊</button>
              </div>
              <dl className="lbgdl">
                <dt>Cấu tạo</dt><dd className="jpt">{g.form}</dd>
                <dt>Cách dùng</dt><dd>{g.use}</dd>
                {!!g.notes?.length && <><dt>Lưu ý</dt><dd><ul>{g.notes.map((x, i) => <li key={i}>{x}</li>)}</ul></dd></>}
              </dl>
              <div className="lbexs">
                <h4>Ví dụ</h4>
                {g.ex.map((s, i) => <Sentence key={i} s={s} no={i + 1} />)}
              </div>
            </article>
          ))}
        </section>

        {L.dialog?.lines?.length > 0 && (
          <section className="panel lbsec" id="hoi-thoai">
            <h2>💬 Hội thoại luyện đọc <small>dùng lại cả 5 mẫu câu</small></h2>
            <Dialog d={L.dialog} />
          </section>
        )}

        {!!L.phrases?.length && (
          <section className="panel lbsec" id="cach-noi">
            <h2>🗣 Cách nói tương tự</h2>
            {L.phrases.map((p, i) => (
              <div key={i} className="lbphr">
                <h3>{p.h}</h3>
                {p.items.map((s, j) => <Sentence key={j} s={s} />)}
              </div>
            ))}
          </section>
        )}

        <section className="lbsec2" id="tu-vung">
          <h2 className="a22th"><span>📝 Từ vựng</span> <small>{L.vocab.length} từ · bấm 🔊 để nghe</small></h2>
          <GenshinVocabTable rows={vocabRows(L.vocab)} tagHead={null} />
        </section>

        {!!L.tips?.length && (
          <section className="panel lbsec" id="meo">
            <h2>💡 Mẹo công sở Nhật</h2>
            <ul>{L.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </section>
        )}

        {!OFFLINE && (
          <p className="panel lbsec lbtip">🔍 Đang đọc hội thoại trong sách giấy mà gặp câu khó? Dán câu đó vào <Link href="/thu-vien/phan-tich">Đọc &amp; Phân tích</Link> để xem furigana, phiên âm, nghĩa từng từ và ngữ pháp.</p>
        )}

        <div className="lbfoot">
          {prev ? <Link href={`/thu-vien/${bookId}/${prev.n}`} className="chip dk" onClick={() => sfx.page()}>‹ Bài {prev.n}</Link> : <span />}
          <button className={`gbtn sm ${done ? "" : "tri"}`} onClick={toggleDone}><span className="c" />{done ? "✓ Đã học xong bài này" : "Đánh dấu đã học"}</button>
          {next ? <Link href={`/thu-vien/${bookId}/${next.n}`} className="chip dk" onClick={() => sfx.page()}>Bài {next.n} ›</Link> : <span />}
        </div>
      </>}
    </>
  );
}
