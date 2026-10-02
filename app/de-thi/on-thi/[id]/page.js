"use client";
// 📘 Một bài ôn thi: khuôn trang tra cứu (đoạn văn, bảng, câu ví dụ có phân tích)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Block } from "@/components/library/ExtraView";
import { ViewBar } from "@/components/library/Sentence";
import { sfx } from "@/lib/sfx";

export default function ReviewPage() {
  const { id } = useParams();
  const [X, setX] = useState(undefined);
  useEffect(() => { fetch(`/exams/on-thi/${id}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setX); }, [id]);
  return (
    <>
      <Link href="/de-thi/on-thi" className="back" onClick={() => sfx.page()}>‹ Ôn thi</Link>
      {X === undefined && <p className="hint" style={{ textAlign: "center", marginTop: 30 }}>Đang tải…</p>}
      {X === null && <p style={{ marginTop: 30 }}>Không tìm thấy bài ôn. <Link href="/de-thi/on-thi">Về danh sách</Link></p>}
      {X && <>
        <div className="pagehead" style={{ marginTop: 10 }}>
          <p style={{ letterSpacing: 2, margin: "0 0 6px" }} className="jpt">{X.jp}{X.level ? ` · ${X.level}` : ""}</p>
          <h1>{X.ico || "📘"} {X.vi}</h1>
          {X.intro && <p>{X.intro}</p>}
          <div className="orn"><span /></div>
        </div>
        <div className="lbbar"><ViewBar /></div>
        {X.blocks.map((b, i) => <Block key={i} b={b} />)}
        {X.source && <p className="hint lbnote">Tổng hợp tham khảo: {X.source}</p>}
      </>}
    </>
  );
}
