"use client";
// 📚 Thư viện sách: danh sách sách + công cụ Đọc & Phân tích
import Link from "next/link";
import { useGame } from "@/components/Game";
import { LIBRARY } from "@/lib/library";
import { sfx } from "@/lib/sfx";

const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";

export default function LibraryHome() {
  const { S } = useGame();
  return (
    <>
      <Link href="/" className="back" onClick={() => sfx.page()}>‹ Trang chủ</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>図書館 · THƯ VIỆN SÁCH</p>
        <h1>📚 Thư Viện Sách</h1>
        <p>Sổ tay đọc sách tiếng Nhật: mẫu câu, ví dụ có furigana, phiên âm Latinh, dịch tiếng Việt, tách từ và giải thích ngữ pháp</p>
        <div className="orn"><span /></div>
      </div>

      <div className="lbshelf">
        {LIBRARY.map((b) => {
          const read = Object.keys(S?.lib?.[b.id] || {}).length;
          return (
            <Link key={b.id} href={`/thu-vien/${b.id}`} className="panel lbbook" style={{ "--c": b.color }} onClick={() => sfx.page()}>
              <div className="lbcover" aria-hidden="true">
                <b>IT</b><span className="jpt">の日本語</span><em>{b.level.split(" ")[0]}</em><small className="jpt">会話編</small>
              </div>
              <div className="lbbtxt">
                <div className="lbblv">{b.level} · {b.lessons.length} bài</div>
                <h3 className="jpt">{b.title}</h3>
                <p className="lbbvi">{b.vi}</p>
                <p>{b.desc}</p>
                <small>{b.authors}</small>
                <div className="bar"><i style={{ width: `${Math.round((read / b.lessons.length) * 100)}%` }} /></div>
                <em className="lbbprog">{read ? `Đã học ${read}/${b.lessons.length} bài` : "Chưa bắt đầu"}</em>
              </div>
            </Link>
          );
        })}
      </div>

      {!OFFLINE && (
        <Link href="/thu-vien/phan-tich" className="panel lbtool" onClick={() => sfx.page()}>
          <span className="lbtoolico" aria-hidden="true">🔍</span>
          <div>
            <h3>Đọc &amp; Phân Tích <small className="jpt">文章分析</small></h3>
            <p>Dán một đoạn tiếng Nhật bất kỳ (trong sách bạn đang đọc, email, tài liệu dự án…) → tự thêm furigana, phiên âm Latinh, dịch tiếng Việt, tách từ và giải thích ngữ pháp từng câu.</p>
          </div>
        </Link>
      )}

      <p className="hint lbnote">
        Sổ tay do trang tự biên soạn để hỗ trợ người đang học bằng sách giấy: mẫu câu chính của từng bài kèm giải thích và ví dụ mới.
        Trang không đăng lại hội thoại, bài tập hay bản dịch của sách — hãy dùng sách gốc (kèm audio qua mã QR) để học đầy đủ.
      </p>
    </>
  );
}
