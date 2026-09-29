"use client";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ZhongliHero } from "@/components/Zhongli";
import { B1_TOPICS, EXAMS, MAX } from "@/lib/b1";
import { TOPIC_EL, ELEM } from "@/lib/data";
import { sfx } from "@/lib/sfx";

export default function B1Hub() {
  const { S } = useGame();
  if (!S) return null;
  const P = S.b1 || {};
  return (
    <>
      <ZhongliHero />
      <div className="kjtools">
        <Link href="/kanji/phieu?lv=b1" className="panel kjtool" onClick={() => sfx.page()}>
          <b>📝 Phiếu luyện viết Kanji B1-1</b>
          <span>Phiếu theo Topic như phiếu giấy của lớp: tô chữ mờ, viết vào ô kẻ, viết cách đọc & chữ Hán phần gạch chân — có chấm điểm, in được</span>
        </Link>
        <Link href="/b1/kiroku" className="panel kjtool" onClick={() => sfx.page()}>
          <b>📒 <span className="jpt">学習記録シート</span> · sách 中級1</b>
          <span>Tự đánh giá 45 Can-do theo từng Topic (★ まだ難しかった → ★★★ 十分にできた), ghi わたしだけのフレーズ và nhật ký trải nghiệm tiếng Nhật — như phiếu tr.250–267 của sách</span>
        </Link>
      </div>
      {EXAMS.map((ex) => {
        const r = P.ex?.[ex.n];
        return (
          <section key={ex.n} className="b1group">
            <div className="b1topics">
              {ex.topics.map((t) => {
                const T = B1_TOPICS.find((x) => x.topic === t);
                if (!T) return null;
                const g = P.g?.[t];
                const rd = T.reading.filter((_, i) => P.r?.[`${t}-${i}`] != null).length;
                const ls = T.listening.filter((_, i) => P.l?.[`${t}-${i}`] != null).length;
                const el = ELEM[TOPIC_EL[t]];
                return (
                  <Link key={t} href={`/b1/${t}`} className="panel b1card" style={{ "--el": el.c }} onClick={() => sfx.page()}>
                    <div className="num">Topic {t}</div>
                    <h3>{T.title}</h3>
                    <div className="vi">{T.titleVi}</div>
                    <div className="b1prog">
                      <span>📚 Sách {P.book?.[t] != null ? `${P.book[t]}%` : "—"}</span>
                      <span>📐 Ngữ pháp {g != null ? `${g}%` : "—"}</span>
                      <span>📖 Đọc {rd}/{T.reading.length}</span>
                      <span>🎧 Nghe {ls}/{T.listening.length}</span>
                    </div>
                    <div className="b1gp">{T.grammar.length} điểm ngữ pháp</div>
                  </Link>
                );
              })}
            </div>
            <Link href={`/b1/exam/${ex.n}`} className={`panel b1exam ${r?.passed ? "passed" : ""}`} onClick={() => sfx.open()}>
              <div className="seal">{r?.excellent ? "優" : r?.passed ? "合" : "試"}</div>
              <div>
                <div className="tag">KỲ THI CHỨNG CHỈ · KIỂU JLPT</div>
                <h3>{ex.name} <small>{ex.sub}</small></h3>
                <p>3 phần: Kiến thức ngôn ngữ (30 phút) · Đọc hiểu (35 phút) · Nghe hiểu (30 phút). Đỗ khi đạt ≥95/{MAX} và mỗi phần ≥19/60.</p>
                <div className="b1res">
                  {r ? <>Điểm cao nhất: <b>{r.best}/{MAX}</b> · {r.excellent ? "🏅 Xuất sắc" : r.passed ? "✅ Đã đỗ" : "Chưa đỗ"}</> : "Chưa thi"}
                  {r?.passed && <span className="certlink">📜 Xem chứng chỉ</span>}
                </div>
              </div>
            </Link>
            <Link href={`/b1/test/${ex.n}`} className="panel b1exam b1stest" onClick={() => sfx.open()}>
              <div className="seal">例</div>
              <div>
                <div className="tag">THEO SÁCH 中級1 · テストの問題例</div>
                <h3>Đề mẫu trong sách <small>Topic {ex.topics[0]}–{ex.topics[ex.topics.length - 1]}</small></h3>
                <p>聴解 (nghe audio sách) · 筆記 (đọc hiểu, kính ngữ, chia động từ, Kanji) có chấm điểm · 口頭 / 作文: đề nói & viết kèm gợi ý và bài mẫu tham khảo.</p>
                <div className="b1res">{P.stest?.[ex.n] ? <>Tốt nhất: 聴解 <b>{P.stest[ex.n].choukai ?? "—"}%</b> · 筆記 <b>{P.stest[ex.n].hikki ?? "—"}%</b></> : "Chưa làm"}</div>
              </div>
            </Link>
          </section>
        );
      })}
    </>
  );
}
