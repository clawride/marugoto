"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { A22_EXAM } from "@/components/examConfigs";
import { a22ExamOf } from "@/lib/a22";

export default function A22CertPage() {
  const { n } = useParams();
  const ex = a22ExamOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href="/a22">Marugoto A2-2</Link></p>;
  return <CertView cfg={A22_EXAM} ex={ex} />;
}
