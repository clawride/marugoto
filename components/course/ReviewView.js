"use client";
// 復習 của sách bài tập 標準問題集 (khóa Minna trung cấp): một trang BookPart + kiểm tra dịch câu
// Dữ liệu: public/book/<dir>/review<n>.json (scripts/build-book.mjs chép từ data/book/extra/<khóa>-review<n>.json)
import { useState } from "react";
import Link from "next/link";
import BookPart from "@/components/course/BookPart";
import CourseRun from "@/components/course/CourseRun";

export default function ReviewView({ course, n }) {
  const [run, setRun] = useState(null);
  const [done, setDone] = useState(null);
  const R = course.reviews?.find((r) => r.n === n);
  const dir = course.books?.[0]?.dir || course.store;
  if (!R) return <p style={{ marginTop: 40 }}>Không tìm thấy bài ôn. <Link href={course.base}>{course.title}</Link></p>;
  const book = { key: "review", ico: "🔁", short: "復習", name: "Sách bài tập 標準問題集", url: () => `/book/${dir}/review${R.n}.json`, prefix: "#", dir, audioNote: " (lời thoại viết mới)" };
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  return (
    <div className={`th-${course.store}`}>
      <Link href={course.base} className="back">‹ {course.title}</Link>
      {run ? (
        <CourseRun course={course} qs={run} title={`Kiểm tra dịch câu · ${R.jp}`} intro={course.lines.grammar} onFinish={(c, t) => { setRun(null); setDone({ c, t }); top(); }} />
      ) : (
        <>
          {done && <div className="panel a22start"><b>Kết quả kiểm tra dịch câu: {done.c}/{done.t} câu đúng</b></div>}
          <BookPart key={R.n} course={course} book={book} lesson={100 + R.n} stars={null} onQuiz={(qs) => { setDone(null); setRun(qs); top(); }} />
        </>
      )}
    </div>
  );
}
