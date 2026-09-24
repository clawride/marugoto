"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { B1_EXAM } from "@/components/examConfigs";
import { examOf } from "@/lib/b1";

export default function ExamPage() {
  const { n } = useParams();
  const ex = examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href="/b1">Học Viện B1-1</Link></p>;
  return <ExamRunner key={ex.n} cfg={B1_EXAM} ex={ex} />;
}
