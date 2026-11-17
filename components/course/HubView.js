"use client";
// Trang tổng của khóa học: các Topic → bài, boss Topic, thẻ kỳ thi sau Topic cuối của mỗi kỳ
import Link from "next/link";
import { useState } from "react";
import { searchText } from "@/lib/learning-navigation";
import UiIcon from "@/components/ui/UiIcon";
import { useGame } from "@/components/Game";
import { PARTS, EXAM_SECTIONS, bossIconUrl } from "@/lib/course";
import { TOPIC_EL, ELEM } from "@/lib/data";
import { sfx } from "@/lib/sfx";
export default function HubView({ course }) {
  const { C, store, base, unit, Hero, exam } = course;
  const { S } = useGame();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  if (!S) return null;
  const P = S[store] || {};
  const starsOf = (l) => PARTS.reduce((a, p) => a + (P.p?.[`${l}:${p.key}`]?.stars || 0), 0);
  const MAXS = PARTS.length * 3;
  const examAfter = Object.fromEntries(C.exams.map((e) => [e.topics[e.topics.length - 1], e]));
  const mins = EXAM_SECTIONS.map((s) => `${s.vi} (${s.minutes} phút)`).join(" · ");
  const lessons = C.topics.flatMap((t) => t.lessons);
  const completed = lessons.filter((l) => PARTS.every((p) => (P.p?.[`${l.lesson}:${p.key}`]?.stars || 0) > 0)).length;
  const nextLesson = lessons.find((l) => PARTS.some((p) => !(P.p?.[`${l.lesson}:${p.key}`]?.stars > 0))) || lessons[0];
  const matches = (l) => !query.trim() || searchText(`${unit} ${l.lesson} ${l.title} ${l.titleVi}`).includes(searchText(query));
  const visibleTopics = C.topics.filter((t) => (topic === "all" || String(t.topic) === topic) && t.lessons.some(matches));
  const filtered = query.trim() || topic !== "all";

  return (
    <div className={`course-hub th-${store}`}>
      <Link href="/#khoahoc" className="back">‹ Tất cả khóa học</Link>
      <Hero />
      <section className="course-overview" aria-label="Tổng quan khóa học"><div><span className="eyebrow">TỪNG BÀI, TỪNG BƯỚC TIẾN</span><h2>Lộ trình học của bạn</h2><p>{lessons.length} {unit.toLowerCase()} · {C.topics.length} chủ đề · {C.exams.length} kỳ thi</p></div><div className="course-progress"><span><b>{completed}/{lessons.length}</b> bài đạt sao ở đủ {PARTS.length} phần</span><div className="ui-meter" role="progressbar" aria-label="Bài đạt sao ở đủ các phần" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={lessons.length}><i style={{ width: `${100 * completed / Math.max(1, lessons.length)}%` }} /></div></div><Link className="ui-primary" href={`${base}/${nextLesson.lesson}`}>{completed ? "Học bài tiếp theo" : "Vào học"}<UiIcon name="arrow" size={18} /></Link></section>
      {C.intro && <Link href={`${base}/0`} className="panel course-intro" onClick={() => sfx.page()}>
        <span aria-hidden="true">🌱</span><div><b>Bắt đầu từ đây · Bài mở đầu</b><p>{C.intro.titleVi}</p><small>{C.intro.vocab.length} từ và câu giao tiếp · có luyện tập, nghe và kiểm tra</small></div><span aria-hidden="true">›</span>
      </Link>}
      {course.extra?.length > 0 && (
        <div className="kjtools">
          {course.extra.map((x) => <Link key={x.href} href={x.href} className="panel kjtool" onClick={() => sfx.page()}><b>{x.title}</b><span>{x.sub}</span></Link>)}
        </div>
      )}
      <div className="hub-toolbar"><label className="ui-search"><UiIcon name="search" /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Tìm bài học" placeholder="Tìm số bài, tên bài…" /></label><label className="topic-select"><span>Chủ đề</span><select aria-label="Lọc chủ đề" value={topic} onChange={(e) => setTopic(e.target.value)}><option value="all">Tất cả chủ đề</option>{C.topics.map((t) => <option key={t.topic} value={t.topic}>Topic {t.topic} · {t.vi}</option>)}</select></label></div>
      {filtered && <p className="search-summary" role="status">Tìm thấy {visibleTopics.reduce((n, t) => n + t.lessons.filter(matches).length, 0)} bài học <button type="button" className="ui-text-link" onClick={() => { setQuery(""); setTopic("all"); }}>Xóa bộ lọc</button></p>}
      {!visibleTopics.length && <div className="ui-empty"><UiIcon name="search" size={30} /><h2>Chưa tìm thấy bài học</h2><p>Thử số bài hoặc một từ khác trong tên bài.</p></div>}
      {visibleTopics.map((T) => {
        const el = ELEM[TOPIC_EL[T.topic]];
        const boss = C.bossOf(T.topic), br = P.boss?.[T.topic];
        const ex = examAfter[T.topic], er = ex && P.ex?.[ex.n];
        return (
          <section key={T.topic} className="b1group a22topic" style={{ "--el": el.c }}>
            <h2 className="a22th"><span>Topic {T.topic}</span> <b className="jpt">{T.title}</b> <small>{T.vi}</small></h2>
            <div className="b1topics">
              {T.lessons.filter(matches).map((L) => {
                const st = starsOf(L.lesson);
                return (
                  <Link key={L.lesson} href={`${base}/${L.lesson}`} className="panel b1card a22card" onClick={() => sfx.page()}>
                    <div className="lesson-card-top"><div className="num">{unit} {L.lesson}</div><UiIcon name="arrow" size={18} /></div>
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
              {boss && !filtered && (
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
            {ex && !filtered && (
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
            {course.bookTests?.filter((b) => !filtered && b.after === T.topic).map((b) => {
              const bt = S[`${store}book`]?.tests?.[b.n];
              return (
                <Link key={b.n} href={`${base}/test/${b.n}`} className="panel b1exam a22exam bktestcard" onClick={() => sfx.open()}>
                  <div className="seal">📝</div>
                  <div>
                    <div className="tag">{b.tag || "THEO SÁCH KATSUDOU · テストとふりかえり"}</div>
                    <h3 className="jpt">テストとふりかえり {b.n} <small>Topic {b.topics}</small></h3>
                    <p>{b.desc || "Can-do チェック · もじテスト (đọc 5 thẻ) · かいわテスト (5 câu hỏi) · nói chuyện theo nhóm"} — như trang {b.page} của sách.</p>
                    <div className="b1res">{bt ? <>もじ {bt.moji ?? "—"}/5 · かいわ {bt.kaiwa ?? "—"}/5</> : "Chưa làm"}</div>
                  </div>
                </Link>
              );
            })}
            {course.rikaiTests?.filter((b) => !filtered && b.after === T.topic).map((b) => {
              const bt = S[`${store}book`]?.rtests?.[b.n];
              return (
                <Link key={`r${b.n}`} href={`${base}/rtest/${b.n}`} className="panel b1exam a22exam bktestcard" onClick={() => sfx.open()}>
                  <div className="seal">📘</div>
                  <div>
                    <div className="tag">{b.tag || "THEO SÁCH RIKAI · テストとふりかえり"}</div>
                    <h3 className="jpt">テストとふりかえり {b.n} <small>Topic {b.topics}</small></h3>
                    <p>{b.desc || "Câu hỏi mẫu y như sách (nghe viết, đọc Kanji, chọn từ, sắp xếp câu, đọc hiểu, nghe ○/×) · bài luyện thêm cùng dạng · ふりかえり · さくぶん"} — như trang {b.page} của sách.</p>
                    <div className="b1res">{bt ? <>mẫu {bt.sample ?? "—"}% · luyện thêm {bt.prac ?? "—"}%</> : "Chưa làm"}</div>
                  </div>
                </Link>
              );
            })}
            {course.sampleTests?.filter((b) => !filtered && b.after === T.topic).map((b) => {
              const bt = S[store]?.stest?.[b.n];
              return (
                <Link key={`s${b.n}`} href={`${base}/test/${b.n}`} className="panel b1exam b1stest" onClick={() => sfx.open()}>
                  <div className="seal">例</div>
                  <div>
                    <div className="tag">THEO SÁCH {course.books?.[0]?.short} · テストの問題例</div>
                    <h3>Đề mẫu trong sách <small>Topic {b.topics}</small></h3>
                    <p>聴解 · 筆記 (đọc hiểu, kiến thức ngôn ngữ) có chấm điểm · 口頭 / 作文: đề nói & viết kèm gợi ý, 評価表 và bài mẫu tham khảo — như trang {b.page} của sách.</p>
                    <div className="b1res">{bt ? <>Tốt nhất: 聴解 <b>{bt.choukai ?? "—"}%</b> · 筆記 <b>{bt.hikki ?? "—"}%</b></> : "Chưa làm"}</div>
                  </div>
                </Link>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
