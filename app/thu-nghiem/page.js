"use client";
// 🧪 Khu thử nghiệm chức năng mới — các trò/chức năng đang thử, có thể thay đổi hoặc xóa
import Link from "next/link";
import { sfx } from "@/lib/sfx";

const LAB = [
  { href: "/thu-nghiem/dau-luot", ico: "⚔️", name: "Đấu lượt 3×3", sub: "Bản đồ thử nghiệm 3×3 · chọn thẻ Shikihime và vũ khí trong túi đồ · đánh theo lượt", tag: "Mới" },
];

export default function LabPage() {
  return (
    <>
      <div className="pagehead">
        <h1>🧪 Khu Thử Nghiệm</h1>
        <p>Chức năng mới đang thử nghiệm — có thể còn lỗi và sẽ thay đổi theo góp ý.</p>
        <div className="orn"><span /></div>
      </div>
      <div className="progrid teyvat">
        {LAB.map((x) => (
          <Link key={x.href} href={x.href} className="panel procard mini" onClick={() => sfx.page()}>
            <span className="proico" aria-hidden="true">{x.ico}</span>
            <div className="protxt"><h3>{x.name} {x.tag && <small className="labtag">{x.tag}</small>}</h3><p>{x.sub}</p></div>
          </Link>
        ))}
      </div>
    </>
  );
}
