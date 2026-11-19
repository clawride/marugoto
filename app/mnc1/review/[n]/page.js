"use client";
// 復習 của sách bài tập 標準問題集 (Minna 中級I): /mnc1/review/1 (bài 1–3) … /4 (bài 10–12), /5 (総復習 cả 12 bài)
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BookPart from "@/components/course/BookPart";
import CourseRun from "@/components/course/CourseRun";
import { MNC1_COURSE } from "@/components/courses";

export default function Mnc1ReviewPage() {
  const { n } = useParams();
  const [run, setRun] = useState(null);
  const [done, setDone] = useState(null);
  const R = MNC1_COURSE.reviews.find((r) => r.n === +n);
  if (!R) return <p style={{ marginTop: 40 }}>Không tìm thấy bài ôn. <Link href="/mnc1">Minna - Genshin Trung cấp 1</Link></p>;
  const book = { key: "review", ico: "🔁", short: "復習", name: "Sách bài tập 標準問題集", url: () => `/book/mnc1/review${R.n}.json`, prefix: "#", dir: "mnc1", audioNote: " (lời thoại viết mới)" };
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  return (
    <div className="th-mnc1">
      <Link href="/mnc1" className="back">‹ Minna - Genshin Trung cấp 1</Link>
      {run ? (
        <CourseRun course={MNC1_COURSE} qs={run} title={`Kiểm tra dịch câu · ${R.jp}`} intro={MNC1_COURSE.lines.grammar} onFinish={(c, t) => { setRun(null); setDone({ c, t }); top(); }} />
      ) : (
        <>
          {done && <div className="panel a22start"><b>Kết quả kiểm tra dịch câu: {done.c}/{done.t} câu đúng</b></div>}
          <BookPart key={R.n} course={MNC1_COURSE} book={book} lesson={100 + R.n} stars={null} onQuiz={(qs) => { setDone(null); setRun(qs); top(); }} />
        </>
      )}
    </div>
  );
}
