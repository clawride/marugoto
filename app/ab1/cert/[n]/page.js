"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { AB1_COURSE } from "@/components/courses";

export default function AB1CertPage() {
  const { n } = useParams();
  const ex = AB1_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href={AB1_COURSE.base}>{AB1_COURSE.title}</Link></p>;
  return <CertView cfg={AB1_COURSE.exam} ex={ex} />;
}
