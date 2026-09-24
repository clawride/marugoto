"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { B1_EXAM } from "@/components/examConfigs";
import { examOf } from "@/lib/b1";

export default function CertPage() {
  const { n } = useParams();
  const ex = examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href="/b1">Học Viện B1-1</Link></p>;
  return <CertView cfg={B1_EXAM} ex={ex} />;
}
