"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { B12_COURSE } from "@/components/courses";

export default function B12CertPage() {
  const { n } = useParams();
  const ex = B12_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href={B12_COURSE.base}>{B12_COURSE.title}</Link></p>;
  return <CertView cfg={B12_COURSE.exam} ex={ex} />;
}
