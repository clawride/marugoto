"use client";
// Trang tổng của khóa học: các Topic → bài, boss Topic, thẻ kỳ thi sau Topic cuối của mỗi kỳ
import Link from "next/link";
import { useGame } from "@/components/Game";
import { PARTS, EXAM_SECTIONS, bossIconUrl } from "@/lib/course";
import { TOPIC_EL, ELEM } from "@/lib/data";
import { sfx } from "@/lib/sfx";

export default function HubView({ course }) {
  const { C, store, base, unit, Hero, exam } = course;
  const { S } = useGame();
  if (!S) return null;
  const P = S[store] || {};
  const starsOf = (l) => PARTS.reduce((a, p) => a + (P.p?.[`${l}:${p.key}`]?.stars || 0), 0);
  const MAXS = PARTS.length * 3;
  const examAfter = Object.fromEntries(C.exams.map((e) => [e.topics[e.topics.length - 1], e]));
  const mins = EXAM_SECTIONS.map((s) => `${s.vi} (${s.minutes} phút)`).join(" · ");

  return (
    <div className={`th-${store}`}>
      <Hero />
      {C.topics.map((T) => {
        const el = ELEM[TOPIC_EL[T.topic]];
        const boss = C.bossOf(T.topic), br = P.boss?.[T.topic];
        const ex = examAfter[T.topic], er = ex && P.ex?.[ex.n];
        return (
          <section key={T.topic} className="b1group a22topic" style={{ "--el": el.c }}>
            <h2 className="a22th"><span>Topic {T.topic}</span> <b className="jpt">{T.title}</b> <small>{T.vi}</small></h2>
            <div className="b1topics">
              {T.lessons.map((L) => {
                const st = starsOf(L.lesson);
                return (
                  <Link key={L.lesson} href={`${base}/${L.lesson}`} className="panel b1card a22card" onClick={() => sfx.page()}>
                    <div className="num">{unit} {L.lesson}</div>
                    <h3>{L.title}</h3>
                    <div className="vi">{L.titleVi}</div>
                    <div className="a22parts">
                      {PARTS.map((p) => { const s = P.p?.[`${L.lesson}:${p.key}`]?.stars || 0; return <span key={p.key} className={`s${s}`} title={`${course.partLabels?.[p.key] || p.label}: ${s}/3 sao`}>{p.ico}</span>; })}
                    </div>
                    <div className="a22meter"><i style={{ width: `${(st / MAXS) * 100}%` }} /></div>
                    <div className="b1gp">★ {st}/{MAXS} · {L.vocab.length} từ · {L.kanji.length} kanji · {L.listening.length} bài nghe</div>
                  </Link>
                );
              })}
              {boss && (
                <Link href={`${base}/boss/${T.topic}`} className={`panel b1card a22boss ${br?.cleared ? "cleared" : ""}`} onClick={() => sfx.open()}>
                  <img src={bossIconUrl(boss)} alt="" loading="lazy" />
                  <div>
                    <div className="num">Boss Topic {T.topic}</div>
                    <h3>{boss.name}</h3>
                    <div className="vi">Tổng hợp 7 phần của Topic</div>
                    <div className="b1gp">{br?.cleared ? <>Đã hạ · {"★".repeat(br.best)}{"☆".repeat(3 - br.best)}</> : "Chưa khiêu chiến"}</div>
                  </div>
                </Link>
              )}
            </div>
            {ex && (
              <Link href={exam.examHref(ex.n)} className={`panel b1exam a22exam ${er?.passed ? "passed" : ""}`} onClick={() => sfx.open()}>
                <div className="seal">{er?.excellent ? "優" : er?.passed ? "合" : "試"}</div>
                <div>
                  <div className="tag">KỲ THI CHỨNG CHỈ · KIỂU JLPT</div>
                  <h3>{ex.name} <small>{ex.sub}</small></h3>
                  <p>3 phần: {mins}. Đỗ khi đạt ≥{exam.pass.total}/{exam.pass.max} và mỗi phần ≥{exam.pass.section}/60.</p>
                  <div className="b1res">
                    {er ? <>Điểm cao nhất: <b>{er.best}/{exam.pass.max}</b> · {er.excellent ? "🏅 Xuất sắc" : er.passed ? "✅ Đã đỗ" : "Chưa đỗ"}</> : "Chưa thi"}
                    {er?.passed && <span className="certlink">📜 Xem chứng chỉ</span>}
                  </div>
                </div>
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
}
