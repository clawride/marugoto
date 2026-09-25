"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { A1_COURSE } from "@/components/courses";

export default function A1CertPage() {
  const { n } = useParams();
  const ex = A1_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href={A1_COURSE.base}>{A1_COURSE.title}</Link></p>;
  return <CertView cfg={A1_COURSE.exam} ex={ex} />;
}
