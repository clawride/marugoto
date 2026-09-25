"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { A21_COURSE } from "@/components/courses";

export default function A21ExamPage() {
  const { n } = useParams();
  const ex = A21_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href={A21_COURSE.base}>{A21_COURSE.title}</Link></p>;
  return <ExamRunner key={ex.n} cfg={A21_COURSE.exam} ex={ex} />;
}
