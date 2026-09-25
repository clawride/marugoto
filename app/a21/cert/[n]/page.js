"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { A21_COURSE } from "@/components/courses";

export default function A21CertPage() {
  const { n } = useParams();
  const ex = A21_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href={A21_COURSE.base}>{A21_COURSE.title}</Link></p>;
  return <CertView cfg={A21_COURSE.exam} ex={ex} />;
}
