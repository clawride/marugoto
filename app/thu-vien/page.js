"use client";
// 📚 Thư viện sách: các khu sách (Tiếng Nhật IT, Tiếng Nhật Điều dưỡng…) + công cụ Đọc & Phân tích
import Link from "next/link";
import Shelf from "@/components/library/Shelf";
import { CATEGORIES } from "@/lib/library";
import { sfx } from "@/lib/sfx";

const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";

export default function LibraryHome() {
  return (
    <>
      <Link href="/" className="back" onClick={() => sfx.page()}>‹ Trang chủ</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>図書館 · THƯ VIỆN SÁCH</p>
        <h1>📚 Thư Viện Sách</h1>
        <p>Sổ tay đọc sách tiếng Nhật chuyên ngành: mẫu câu, ví dụ có furigana, phiên âm Latinh, dịch tiếng Việt, tách từ và giải thích ngữ pháp</p>
        <div className="orn"><span /></div>
      </div>

      <nav className="lbcats" aria-label="Các khu sách">
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/thu-vien/${c.id}`} className="panel lbcat" style={{ "--c": c.color }} onClick={() => sfx.page()}>
            <span aria-hidden="true">{c.ico}</span>
            <div><b>{c.name}</b> <small className="jpt">{c.jp}</small><p>{c.desc}</p></div>
          </Link>
        ))}
      </nav>

      {CATEGORIES.map((c) => (
        <section key={c.id} className="homesec lbcatsec" id={c.id} style={{ "--el": `rgb(${c.color})` }}>
          <h2 className="a22th"><span>{c.ico} {c.name}</span> <small>{c.sub}</small> <Link href={`/thu-vien/${c.id}`} className="lbmorelink" onClick={() => sfx.page()}>Xem riêng khu này ›</Link></h2>
          <Shelf cat={c.id} />
        </section>
      ))}

      {!OFFLINE && (
        <Link href="/thu-vien/phan-tich" className="panel lbtool" onClick={() => sfx.page()}>
          <span className="lbtoolico" aria-hidden="true">🔍</span>
          <div>
            <h3>Đọc &amp; Phân Tích <small className="jpt">文章分析</small></h3>
            <p>Dán một đoạn tiếng Nhật bất kỳ (trong sách bạn đang đọc, email, tài liệu, sổ ghi chép chăm sóc…) → tự thêm furigana, phiên âm Latinh, dịch tiếng Việt, tách từ và giải thích ngữ pháp từng câu.</p>
          </div>
        </Link>
      )}

      <p className="hint lbnote">
        Sổ tay do trang tự biên soạn để hỗ trợ người đang học bằng sách giấy: mẫu câu chính của từng bài kèm giải thích và ví dụ mới.
        Trang không đăng lại nội dung, bài tập hay bản dịch của sách — hãy dùng sách gốc để học đầy đủ.
      </p>
    </>
  );
}
