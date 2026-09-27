"use client";
// Danh sách phiếu luyện viết kanji: chọn cấp (A1 → B1-2) → các Topic → phiếu
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { Stars } from "@/components/kanji/KanjiLesson";
import { SHEET_LEVELS, sheetsOf, topicsOf, sheetKey } from "@/lib/kanjiSheets";
import { sfx } from "@/lib/sfx";

export default function SheetListPage() {
  return <Suspense fallback={null}><SheetList /></Suspense>;
}

function SheetList() {
  const { S, update } = useGame();
  const sp = useSearchParams();
  if (!S) return null;
  const lv = sp.get("lv") || S.kwLv || "ab1";
  const L = SHEET_LEVELS.find((x) => x.id === lv) || SHEET_LEVELS[0];
  const P = S.kanji?.p || {}, W = S.kanji?.w || {};
  const kanjiOf = (sh) => [...new Set(sh.words.flatMap((w) => [...w.w, ...(w.tr || []).join("")]).filter((c) => /[一-鿿]/.test(c)))];
  const pick = (id) => { update((s) => { s.kwLv = id; }); sfx.click(); history.replaceState(null, "", `/kanji/phieu?lv=${id}`); };
  const lvStars = (X) => sheetsOf(X.id).reduce((a, sh) => a + (P[`${sheetKey(sh.id)}:ex`]?.stars || 0), 0);
  const list = sheetsOf(L.id);
  return (
    <div className="kwlist">
      <Link href="/kanji" className="back" onClick={() => sfx.page()}>‹ Chữ Hán</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>まるごと · 漢字練習シート</p>
        <h1>📝 Phiếu luyện viết Kanji</h1>
        <p>Mỗi phiếu có <b>trang 1</b> (bảng từ: chữ, cách đọc, Hán Việt, nghĩa · hàng chữ mờ để tô · ô kẻ tập viết) và <b>trang 2</b> (viết cách đọc và chữ Hán của phần gạch chân). Viết thẳng lên ô kẻ, luyện từng nét có chấm điểm, hoặc in ra giấy.</p>
        <div className="orn"><span /></div>
      </div>
      <div className="chips nbbooks">
        {SHEET_LEVELS.map((X) => <button key={X.id} className={`chip dk ${X.id === L.id ? "on" : ""}`} onClick={() => pick(X.id)}>{X.ico} {X.name} <small>{sheetsOf(X.id).length} phiếu · ★{lvStars(X)}</small></button>)}
      </div>
      <p className="hint" style={{ textAlign: "center" }}>{L.full} · {list.length} phiếu · {list.reduce((a, s) => a + s.words.length, 0)} từ</p>
      {topicsOf(L.id).map((t) => {
        const shs = list.filter((s) => s.t === t);
        return (
          <section key={t} className="b1group">
            <h2 className="a22th"><span>トピック{t}</span> <b className="jpt">{shs[0].tt}</b> <small>{shs[0].tvi}</small></h2>
            <div className="kwcards">
              {shs.map((sh) => {
                const r = P[`${sheetKey(sh.id)}:ex`], ks = kanjiOf(sh), wr = ks.filter((k) => W[k] >= 60).length;
                return (
                  <Link key={sh.id} href={`/kanji/phieu/${sh.id}`} className="panel kwcard" onClick={() => sfx.page()}>
                    <div className="kwcardh"><b>漢字練習シート({sh.p})</b><Stars n={r?.stars || 0} /></div>
                    <div className="kwwords jpt">{sh.words.map((w) => <span key={w.w}>{w.w}</span>)}</div>
                    <small>{sh.lesson ? `Bài ${sh.lesson} · ` : ""}{sh.words.length} từ · {sh.ex.length} câu bài tập{r ? ` · bài tập ${r.pct}%` : ""} · đã viết đẹp {wr}/{ks.length} chữ</small>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="hint" style={{ textAlign: "center" }}>{L.credit}</p>
    </div>
  );
}
