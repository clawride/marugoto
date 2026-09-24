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
          </section>
        );
      })}
    </>
  );
}
