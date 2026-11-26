"use client";
// 📚 Một cuốn sách trong Thư viện: thông tin sách · danh sách bài · trang tra cứu thêm
import KaigoText from "@/components/library/KaigoText";
import practiceReadings from "@/data/readings/kaigo-romaji-practice.json";
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
  const readings = book === "kaigo-jiko" ? practiceReadings : null;
  const done = S?.lib?.[B.id] || {};
  return (
    <>
      <Link href={`/thu-vien/${B.cat || "it"}`} className="back" onClick={() => sfx.page()}>‹ {catById(B.cat || "it")?.name || "Thư viện sách"}</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 2, margin: "0 0 6px" }}>{B.level} · <KaigoText text={B.sub} readings={readings} /></p>
        <h1 className="jpt">{B.title}</h1>
        {readings && <p className="lbromaji" lang="ja-Latn">{B.titleRo}</p>}
        <p>{B.vi}</p>
        <p className="hint" style={{ marginTop: 4 }}>{B.authors} · {B.publisher}</p>
        <div className="orn"><span /></div>
      </div>

      {B.source && (
        <section className="panel lbsec lbsourceintro">
          <a href={B.source.pdf} aria-label="Xem bìa trong PDF gốc"><img src={B.source.cover} alt={B.vi} width="120" height="170" /></a>
          <div>
            <h2>Đọc sách của {B.authors}</h2>
            <p>{B.source.pages} trang · {B.lessons.length} chương · {B.extras.length} phụ lục</p>
            <nav aria-label="Đọc sách" className="lbsourceactions">
              <Link className="chip" href={`/thu-vien/${B.id}/loi-mo-dau`}>Bìa, mục lục và lời mở đầu</Link>
              <a className="chip" href={B.source.pdf}>Mở PDF nguyên bản</a>
              <Link className="chip" href={`/thu-vien/${B.id}/loi-ket`}>Lời kết và thông tin tác giả</Link>
            </nav>
            <p className="hint">Khi dùng trong ca trực, hãy theo quy trình chuyên môn của cơ sở. Các trang có điểm cần đính chính kèm chú thích và nguồn đối chiếu.</p>
          </div>
        </section>
      )}
      <section className="homesec">
        <h2 className="a22th"><span>Tra cứu nhanh</span> <small>Dùng chung cho cả sách</small></h2>
        <div className="lbextras">
          {B.extras.map((x) => (
            <Link key={x.id} href={`/thu-vien/${B.id}/${x.id}`} className="panel lbextra" onClick={() => sfx.page()}>
              <span aria-hidden="true">{x.ico}</span><b>{x.vi}</b><small className="jpt"><KaigoText text={x.jp} readings={readings} /></small>
            </Link>
          ))}
        </div>
      </section>

      <section className="homesec">
        <h2 className="a22th"><span>{B.lessonsHead || `${B.lessons.length} bài`}</span> <small>{B.lessonsSub || ""}</small></h2>
        <div className="lblessons">
          {B.lessons.map((l) => (
            <Link key={l.n} href={`/thu-vien/${B.id}/${l.n}`} className={`panel lbles ${done[l.n] ? "done" : ""}`} onClick={() => sfx.page()}>
              <span className="lblesn"><KaigoText text={lessonName(B, l.n)} readings={readings} /></span>
              <div>
                <b className="jpt">{l.jp}</b>
                {readings && <span className="lbromaji" lang="ja-Latn">{l.ro}</span>}
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
