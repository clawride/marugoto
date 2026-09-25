"use client";
// Trang tổng Bảng Chữ Cái: lộ trình bài học, bảng 50 âm (bấm để nghe & luyện viết), kiểm tra tổng
import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { KleeHero } from "@/components/Klee";
import StrokeBoard from "@/components/kana/StrokeBoard";
import { LESSONS, ROMAJI, toKata, KANA_STROKES, YT_PLAYLIST } from "@/lib/kana";
import { speakLines } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const GOJUON = [
  "あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの", "はひふへほ", "まみむめも", "や・ゆ・よ", "らりるれろ", "わ・・・を", "ん・・・・",
];
const DAKU = ["がぎぐげご", "ざじずぜぞ", "だぢづでど", "ばびぶべぼ", "ぱぴぷぺぽ"];
const partsOf = (L) => ["write", "read", ...(L.rule ? ["rule"] : [])];

export default function KanaHub() {
  const { S, update } = useGame();
  const [script, setScript] = useState("h");
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState("watch");
  if (!S) return null;
  const P = S.kana?.p || {}, W = S.kana?.w || {};
  const conv = (c) => (script === "k" ? toKata(c) : c);
  const starsOf = (L) => partsOf(L).reduce((a, k) => a + (P[`${L.id}:${k}`]?.stars || 0), 0);
  const cell = (c0, j) => {
    if (c0 === "・") return <span className="kcell empty" key={"e" + j} />;
    const c = conv(c0);
    return (
      <button key={c} className={`kcell ${sel === c ? "on" : ""} ${W[c] >= 80 ? "s3" : W[c] >= 60 ? "s2" : W[c] ? "s1" : ""}`} onClick={() => { setSel(c); setMode("watch"); speakLines([{ t: c }], { rate: 0.8 }); }}>
        <b className="jpt">{c}</b><small>{ROMAJI[c]?.split(" ")[0]}</small>
      </button>
    );
  };
  const group = (title, from, to) => (
    <section className="b1group">
      <h2 className="a22th"><span>{title}</span></h2>
      <div className="b1topics">
        {LESSONS.filter((L) => L.id >= from && L.id <= to).map((L) => {
          const st = starsOf(L), max = partsOf(L).length * 3;
          return (
            <Link key={L.id} href={`/kana/${L.id}`} className="panel b1card a22card" onClick={() => sfx.page()}>
              <div className="num">Bài {L.id}{L.videos?.length ? ` · video ${L.videos.join("–")}` : " · mở rộng"}</div>
              <h3>{L.title}</h3>
              <div className="vi">{L.sub}</div>
              <div className="kprev jpt">{(L.chars || L.yoon?.map((y) => y.k) || []).slice(0, 12).join(" ") || "ん・は・へ・を"}</div>
              <div className="a22meter"><i style={{ width: `${(st / max) * 100}%` }} /></div>
              <div className="b1gp">★ {st}/{max}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="th-kana">
      <KleeHero />
      <p className="hint" style={{ textAlign: "center" }}>Lộ trình theo đúng thứ tự của <a href={YT_PLAYLIST} target="_blank" rel="noreferrer" style={{ color: "var(--gold2)" }}>54 video “Dạy bảng chữ cái”</a>: mỗi hàng chữ học <b>viết</b> trước, rồi <b>đọc & học thuộc</b>.</p>

      <section className="b1group">
        <h2 className="a22th"><span>Bảng chữ</span> <b>Bảng 50 âm</b> <small>bấm vào chữ để nghe và luyện viết</small></h2>
        <div className="chips"><button className={`chip ${script === "h" ? "on" : ""}`} onClick={() => { setScript("h"); setSel(null); }}>Chữ mềm · ひらがな</button><button className={`chip ${script === "k" ? "on" : ""}`} onClick={() => { setScript("k"); setSel(null); }}>Chữ cứng · カタカナ</button></div>
        <div className="kchart-wrap">
          <div className="panel kchart">{GOJUON.map((row, i) => <div key={i} className="krow">{[...row].map((c, j) => cell(c, j))}</div>)}</div>
          <div className="panel kchart">{DAKU.map((row, i) => <div key={i} className="krow">{[...row].map((c, j) => cell(c, j))}</div>)}<p className="hint">Âm đục (゛) và âm tròn (゜)</p></div>
        </div>
        {sel && KANA_STROKES[sel] && (
          <div className="panel kquick">
            <div className="kmodes">
              <b className="jpt kbigsm">{sel}</b>
              {[["watch", "Xem thứ tự nét"], ["trace", "Tô theo nét"], ["free", "Tự viết & chấm"]].map(([k, t]) => <button key={k} className={`chip ${mode === k ? "on" : ""}`} onClick={() => setMode(k)}>{t}</button>)}
            </div>
            <StrokeBoard key={`${sel}-${mode}`} char={sel} mode={mode} size={260}
              onResult={({ mode: m, score }) => { if (m === "free") update((s) => { s.kana = s.kana || {}; s.kana.w = { ...(s.kana.w || {}), [sel]: Math.max(s.kana.w?.[sel] || 0, score) }; }); }} />
          </div>
        )}
      </section>

      {group("Chữ mềm · Hiragana", 1, 19)}
      <Link href="/kana/test/h" className="panel b1exam a22exam"><div className="seal">ひ</div><div><div className="tag">KIỂM TRA TỔNG</div><h3>Kiểm tra chữ mềm</h3><p>20 câu ngẫu nhiên: nhận mặt chữ, chọn chữ theo âm, nghe chọn chữ, đọc từ.</p></div></Link>
      {group("Chữ cứng · Katakana", 20, 30)}
      <Link href="/kana/test/k" className="panel b1exam a22exam"><div className="seal">カ</div><div><div className="tag">KIỂM TRA TỔNG</div><h3>Kiểm tra chữ cứng</h3><p>20 câu ngẫu nhiên về katakana.</p></div></Link>
      <Link href="/kana/test/all" className="panel b1exam a22exam"><div className="seal">全</div><div><div className="tag">KIỂM TRA TỔNG</div><h3>Kiểm tra cả hai bảng chữ</h3><p>30 câu trộn chữ mềm và chữ cứng.</p></div></Link>
      <p className="hint" style={{ textAlign: "center" }}>Dữ liệu nét chữ: KanjiVG (kanjivg.tagaini.net) © Ulrich Apel, giấy phép CC BY-SA 3.0.</p>
    </div>
  );
}
