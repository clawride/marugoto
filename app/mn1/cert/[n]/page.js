"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { MN1_COURSE } from "@/components/courses";

export default function Mn1CertPage() {
  const { n } = useParams();
  const ex = MN1_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href={MN1_COURSE.base}>{MN1_COURSE.title}</Link></p>;
  return <CertView cfg={MN1_COURSE.exam} ex={ex} />;
}
