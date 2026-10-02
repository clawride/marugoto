"use client";
// 📚 Kệ sách: danh sách sách của một khu (Tiếng Nhật IT · Tiếng Nhật Điều dưỡng…) — dùng ở /thu-vien và /thu-vien/<khu>
import Link from "next/link";
import { useGame } from "@/components/Game";
import { booksIn } from "@/lib/library";
import { sfx } from "@/lib/sfx";

export function BookCard({ b }) {
  const { S } = useGame();
  const read = Object.keys(S?.lib?.[b.id] || {}).length;
  const cv = b.cover || {};
  return (
    <Link href={`/thu-vien/${b.id}`} className="panel lbbook" style={{ "--c": b.color, "--cv1": cv.c1, "--cv2": cv.c2 }} onClick={() => sfx.page()}>
      <div className="lbcover" aria-hidden="true">
        <b className={(cv.top || "IT").length > 2 ? "long" : ""}>{cv.top || "IT"}</b><span className="jpt">{cv.mid || "の日本語"}</span>
        {cv.badge && <em>{cv.badge}</em>}{cv.sub && <small className="jpt">{cv.sub}</small>}
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
}

export default function Shelf({ cat }) {
  const books = booksIn(cat);
  if (!books.length) return <p className="hint" style={{ textAlign: "center" }}>Chưa có sách trong khu này.</p>;
  return <div className="lbshelf">{books.map((b) => <BookCard key={b.id} b={b} />)}</div>;
}
