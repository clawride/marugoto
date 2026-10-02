"use client";
// 📚 Một cuốn sách trong Thư viện: thông tin sách · danh sách bài · trang tra cứu thêm
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { bookById, lessonName, catById } from "@/lib/library";
import { sfx } from "@/lib/sfx";

export default function BookPage() {
  const { book } = useParams();
  const B = bookById(book);
  const { S } = useGame();
  if (!B) return <p style={{ marginTop: 40 }}>Không tìm thấy sách. <Link href="/thu-vien">Về Thư viện</Link></p>;
  const done = S?.lib?.[B.id] || {};
  return (
    <>
      <Link href={`/thu-vien/${B.cat || "it"}`} className="back" onClick={() => sfx.page()}>‹ {catById(B.cat || "it")?.name || "Thư viện sách"}</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 2, margin: "0 0 6px" }}>{B.level} · {B.sub}</p>
        <h1 className="jpt">{B.title}</h1>
        <p>{B.vi}</p>
        <p className="hint" style={{ marginTop: 4 }}>{B.authors} · {B.publisher}</p>
        <div className="orn"><span /></div>
      </div>

      <section className="homesec">
        <h2 className="a22th"><span>Tra cứu nhanh</span> <small>Dùng chung cho cả sách</small></h2>
        <div className="lbextras">
          {B.extras.map((x) => (
            <Link key={x.id} href={`/thu-vien/${B.id}/${x.id}`} className="panel lbextra" onClick={() => sfx.page()}>
              <span aria-hidden="true">{x.ico}</span><b>{x.vi}</b><small className="jpt">{x.jp}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="homesec">
        <h2 className="a22th"><span>{B.lessonsHead || `${B.lessons.length} bài`}</span> <small>{B.lessonsSub || ""}</small></h2>
        <div className="lblessons">
          {B.lessons.map((l) => (
            <Link key={l.n} href={`/thu-vien/${B.id}/${l.n}`} className={`panel lbles ${done[l.n] ? "done" : ""}`} onClick={() => sfx.page()}>
              <span className="lblesn">{lessonName(B, l.n)}</span>
              <div>
                <b className="jpt">{l.jp}</b>
                <small>{l.vi}</small>
              </div>
              <em>{done[l.n] ? "✓ Đã học" : `tr. ${l.page}`}</em>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
