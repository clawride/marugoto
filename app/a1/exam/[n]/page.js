"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { A1_COURSE } from "@/components/courses";

export default function A1ExamPage() {
  const { n } = useParams();
  const ex = A1_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href={A1_COURSE.base}>{A1_COURSE.title}</Link></p>;
  return <ExamRunner key={ex.n} cfg={A1_COURSE.exam} ex={ex} />;
}
