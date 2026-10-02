"use client";
// 📚 Một khu sách riêng trong Thư viện: /thu-vien/it, /thu-vien/dieu-duong
import Link from "next/link";
import Shelf from "@/components/library/Shelf";
import { catById } from "@/lib/library";
import { sfx } from "@/lib/sfx";

export default function CategoryPage({ cat }) {
  const C = catById(cat);
  return (
    <>
      <Link href="/thu-vien" className="back" onClick={() => sfx.page()}>‹ Thư viện sách</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }} className="jpt">図書館 · {C.jp}</p>
        <h1>{C.ico} {C.name}</h1>
        <p>{C.desc}</p>
        <div className="orn"><span /></div>
      </div>
      <Shelf cat={cat} />
      <p className="hint lbnote">
        Muốn đọc một đoạn bất kỳ trong sách giấy? Dán vào <Link href="/thu-vien/phan-tich" style={{ textDecoration: "underline" }}>Đọc &amp; Phân tích</Link> để xem furigana, phiên âm, nghĩa từng từ và ngữ pháp.
      </p>
    </>
  );
}
