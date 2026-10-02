"use client";
// 📘 Ôn thi – chuẩn bị trước thi: danh sách bài ôn (tổng hợp kiến thức luyện đề), dùng ở /de-thi và /de-thi/on-thi
import { useEffect, useState } from "react";
import Link from "next/link";
import { sfx } from "@/lib/sfx";

export const REVIEW_INDEX = "/exams/on-thi.json";
// tên ngắn cho nút bài ôn
const short = (r) => (/ngu-phap$/.test(r.id) ? "Ngữ pháp" : /chu-han/.test(r.id) ? "Chữ Hán & từ vựng" : /meo-lam-bai$/.test(r.id) ? "Mẹo làm bài" : /cau-truc/.test(r.id) ? "Cấu trúc đề & cách tính điểm" : r.vi.replace(/^N\d\s*[–-]\s*/, ""));

export function ReviewCards({ limit }) {
  const [list, setList] = useState(undefined);
  useEffect(() => { fetch(REVIEW_INDEX).then((r) => (r.ok ? r.json() : [])).catch(() => null).then(setList); }, []);
  if (list === undefined) return <p className="hint" style={{ textAlign: "center" }}>Đang tải…</p>;
  if (!list?.length) return <p className="panel lbsec exempty">Chưa có bài ôn nào. Bài ôn sẽ được tổng hợp từ sách luyện đề khi có tài liệu.</p>;
  const xs = limit ? list.slice(0, limit) : list;
  // gom theo cấp: Chung → N5 → … → N1; mỗi bài một nút gọn (giới thiệu hiện khi rê chuột)
  const ORDER = ["", "N5", "N4", "N3", "N2", "N1"];
  const groups = ORDER.map((lv) => [lv, xs.filter((x) => (x.level || "") === lv)]).filter(([, g]) => g.length);
  return (
    <div className="exrevgroups">
      {groups.map(([lv, g]) => (
        <div key={lv || "all"} className="panel exrevgrp">
          <span className="exrevlv">{lv || "Chung"}</span>
          <div className="exrevitems">
            {g.map((x) => (
              <Link key={x.id} href={`/de-thi/on-thi/${x.id}`} className="exrevchip" title={x.intro || x.vi} onClick={() => sfx.page()}>
                {x.ico} {short(x)}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReviewList() {
  return (
    <>
      <Link href="/de-thi" className="back" onClick={() => sfx.page()}>‹ Luyện đề thi</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }} className="jpt">試験対策 · ÔN THI</p>
        <h1>📘 Ôn Thi – Chuẩn Bị Trước Thi</h1>
        <p>Kiến thức tổng hợp từ sách luyện đề: cấu trúc đề, cách chấm, mẹo làm từng dạng câu, mẫu hay ra — ví dụ có furigana, Latinh, dịch, tách từ</p>
        <div className="orn"><span /></div>
      </div>
      <ReviewCards />
    </>
  );
}
