"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { MNC1_COURSE } from "@/components/courses";

export default function Mnc1CertPage() {
  const { n } = useParams();
  const ex = MNC1_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href={MNC1_COURSE.base}>{MNC1_COURSE.title}</Link></p>;
  return <CertView cfg={MNC1_COURSE.exam} ex={ex} />;
}
