"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { A22_COURSE } from "@/components/courses";

export default function A22CertPage() {
  const { n } = useParams();
  const ex = A22_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href={A22_COURSE.base}>{A22_COURSE.title}</Link></p>;
  return <CertView cfg={A22_COURSE.exam} ex={ex} />;
}
