"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { B12_COURSE } from "@/components/courses";

export default function B12ExamPage() {
  const { n } = useParams();
  const ex = B12_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href={B12_COURSE.base}>{B12_COURSE.title}</Link></p>;
  return <ExamRunner key={ex.n} cfg={B12_COURSE.exam} ex={ex} />;
}
