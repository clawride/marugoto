"use client";
// 📝 Danh sách đề thi: tất cả (/de-thi) hoặc một loại (/de-thi/jlpt, /de-thi/kyu)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { EXAM_KINDS, EXAM_INDEX, kindById } from "@/lib/exams";
import { sfx } from "@/lib/sfx";
import { ReviewCards } from "@/components/exam/ReviewList";

const LEVELS = { jlpt: ["N5", "N4", "N3", "N2", "N1"], kyu: ["4級", "3級", "2級", "1級"] };

function ExamCard({ x, S }) {
  const me = S?.exam?.[x.id];
  const busy = (() => { try { const r = JSON.parse(localStorage.getItem(`exam_run_${x.id}`) || "null"); return r && r.phase !== "done"; } catch { return false; } })();
  return (
    <Link href={`/de-thi/bai/${x.id}`} className="panel excard" onClick={() => sfx.page()}>
      <span className="exlv">{x.level || "級"}</span>
      <div>
        <b>{x.title}</b>
        {x.jp && <small className="jpt">{x.jp}</small>}
        <p>{x.n} câu · {x.minutes ? `${x.minutes} phút` : "không giới hạn giờ"} · {x.sections.map((s) => s.jp).join(" / ")}</p>
        {x.source && <small>Nguồn: {x.source}</small>}
      </div>
      <em>{busy ? "▶ Đang làm dở" : me ? `${me.passed ? "🎉 " : ""}Cao nhất ${me.best} · ${me.tries} lần` : "Chưa làm"}</em>
    </Link>
  );
}

export default function ExamList({ kind }) {
  const { S } = useGame();
  const [list, setList] = useState(undefined);
  useEffect(() => { fetch(EXAM_INDEX).then((r) => (r.ok ? r.json() : [])).catch(() => null).then(setList); }, []);
  const kinds = kind ? [kindById(kind)] : EXAM_KINDS;
  const K = kind && kindById(kind);
  return (
    <>
      <Link href={kind ? "/de-thi" : "/"} className="back" onClick={() => sfx.page()}>‹ {kind ? "Luyện đề thi" : "Trang chủ"}</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }} className="jpt">{K ? K.jp : "模擬試験 · LUYỆN ĐỀ THI"}</p>
        <h1>{K ? `${K.ico} ${K.name}` : "📝 Luyện Đề Thi"}</h1>
        <p>{K ? K.desc : "Đề JLPT và đề thi 級: chọn là biết ngay đúng sai, lời giải có phiên âm Latinh, dịch nghĩa, tách từ; hết bài chấm điểm theo thang JLPT và CEFR."}</p>
        <div className="orn"><span /></div>
      </div>
      {!kind && (
        <nav className="lbcats">
          {EXAM_KINDS.map((k) => (
            <Link key={k.id} href={`/de-thi/${k.id}`} className="panel lbcat" style={{ "--c": k.color }} onClick={() => sfx.page()}>
              <span aria-hidden="true">{k.ico}</span><div><b>{k.name}</b> <small className="jpt">{k.jp}</small><p>{k.desc}</p></div>
            </Link>
          ))}
        </nav>
      )}
      {list === undefined && <p className="hint" style={{ textAlign: "center" }}>Đang tải danh sách đề…</p>}
      {list === null && <p className="panel lbsec" style={{ textAlign: "center" }}>Không tải được danh sách đề. Hãy kiểm tra mạng rồi tải lại trang.</p>}
      {Array.isArray(list) && kinds.map((k) => {
        const mine = list.filter((x) => x.kind === k.id);
        const lvs = LEVELS[k.id] || [];
        const groups = [...lvs.map((lv) => [lv, mine.filter((x) => x.level === lv)]), ["", mine.filter((x) => !lvs.includes(x.level))]];
        return (
          <section key={k.id} className="homesec" style={{ "--el": `rgb(${k.color})` }}>
            {!kind && <h2 className="a22th"><span>{k.ico} {k.name}</span> <small>{mine.length} đề</small> <Link href={`/de-thi/${k.id}`} className="lbmorelink">Xem riêng ›</Link></h2>}
            {!mine.length && <p className="panel lbsec exempty">Chưa có đề nào. Đề sẽ được thêm vào đây khi có tài liệu.</p>}
            {groups.filter(([, xs]) => xs.length).map(([lv, xs]) => (
              <div key={lv || "all"} className="exgroup">
                {lv && <h3 className="exlvh">{k.id === "jlpt" ? `JLPT ${lv}` : `日本語能力試験 ${lv}`}</h3>}
                <div className="exlist">{xs.map((x) => <ExamCard key={x.id} x={x} S={S} />)}</div>
              </div>
            ))}
          </section>
        );
      })}
      <section className="homesec" style={{ "--el": "rgb(120,200,150)" }}>
        <h2 className="a22th"><span>📘 Ôn thi – chuẩn bị trước thi</span> <small>Kiến thức tổng hợp từ sách luyện đề</small> <Link href="/de-thi/on-thi" className="lbmorelink" onClick={() => sfx.page()}>Xem tất cả ›</Link></h2>
        <ReviewCards />
      </section>
    </>
  );
}
