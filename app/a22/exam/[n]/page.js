"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { A22_EXAM } from "@/components/examConfigs";
import { a22ExamOf } from "@/lib/a22";

export default function A22ExamPage() {
  const { n } = useParams();
  const ex = a22ExamOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href="/a22">Marugoto A2-2</Link></p>;
  return <ExamRunner key={ex.n} cfg={A22_EXAM} ex={ex} />;
}
