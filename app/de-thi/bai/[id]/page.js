"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamPaper from "@/components/exam/ExamPaper";
import { examUrl } from "@/lib/exams";

export default function ExamPage() {
  const { id } = useParams();
  const [E, setE] = useState(undefined);
  useEffect(() => { fetch(examUrl(id)).then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setE); }, [id]);
  if (E === undefined) return <p className="hint" style={{ textAlign: "center", marginTop: 40 }}>Đang tải đề…</p>;
  if (!E) return <p style={{ marginTop: 40 }}>Không tìm thấy đề thi. <Link href="/de-thi">Về danh sách đề</Link></p>;
  return <ExamPaper key={E.id} E={E} />;
}
