"use client";
// Danh sách phiếu luyện viết kanji Marugoto A2/B1 (9 Topic × 2 phiếu)
import Link from "next/link";
import { useGame } from "@/components/Game";
import { Stars } from "@/components/kanji/KanjiLesson";
import { SHEETS, TOPICS, SHEET_CREDIT, sheetKey } from "@/lib/kanjiSheets";
import { sfx } from "@/lib/sfx";

export default function SheetList() {
  const { S } = useGame();
  if (!S) return null;
  const P = S.kanji?.p || {}, W = S.kanji?.w || {};
  const kanjiOf = (sh) => [...new Set(sh.words.flatMap((w) => [...w.w, ...(w.tr || []).join("")]).filter((c) => /[一-鿿]/.test(c)))];
  return (
    <div className="kwlist">
      <Link href="/kanji" className="back" onClick={() => sfx.page()}>‹ Chữ Hán</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>まるごと初中級A2/B1 · 漢字練習シート</p>
        <h1>📝 Phiếu luyện viết Kanji A2/B1</h1>
        <p>9 Topic × 2 phiếu. Mỗi phiếu có <b>trang 1</b> (bảng từ, cách đọc, Hán Việt, nghĩa, hàng chữ mờ để tô, ô kẻ tập viết) và <b>trang 2</b> (viết cách đọc và chữ Hán của phần gạch chân). Viết thẳng lên ô kẻ, luyện từng nét có chấm điểm, hoặc in ra giấy.</p>
        <div className="orn"><span /></div>
      </div>
      {TOPICS.map((t) => (
        <section key={t} className="b1group">
          <h2 className="a22th"><span>トピック{t}</span> <small>Topic {t}</small></h2>
          <div className="kwcards">
            {SHEETS.filter((s) => s.t === t).map((sh) => {
              const r = P[`${sheetKey(sh.id)}:ex`], ks = kanjiOf(sh), wr = ks.filter((k) => W[k] >= 60).length;
              return (
                <Link key={sh.id} href={`/kanji/phieu/${sh.id}`} className="panel kwcard" onClick={() => sfx.page()}>
                  <div className="kwcardh"><b>漢字練習シート({sh.p})</b><Stars n={r?.stars || 0} /></div>
                  <div className="kwwords jpt">{sh.words.map((w) => <span key={w.w}>{w.w}</span>)}</div>
                  <small>{sh.words.length} từ · {sh.ex.length} câu bài tập{r ? ` · bài tập ${r.pct}%` : ""} · đã viết đẹp {wr}/{ks.length} chữ</small>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <p className="hint" style={{ textAlign: "center" }}>{SHEET_CREDIT}. Đáp án phần bài tập do Sổ Tay Teyvat soạn thêm.</p>
    </div>
  );
}
