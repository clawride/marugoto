"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import CertView from "@/components/Certificate";
import { MN2_COURSE } from "@/components/courses";

export default function Mn2CertPage() {
  const { n } = useParams();
  const ex = MN2_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy chứng chỉ. <Link href={MN2_COURSE.base}>{MN2_COURSE.title}</Link></p>;
  return <CertView cfg={MN2_COURSE.exam} ex={ex} />;
}
