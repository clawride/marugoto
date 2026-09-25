"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { A22_COURSE } from "@/components/courses";

export default function A22ExamPage() {
  const { n } = useParams();
  const ex = A22_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href={A22_COURSE.base}>{A22_COURSE.title}</Link></p>;
  return <ExamRunner key={ex.n} cfg={A22_COURSE.exam} ex={ex} />;
}
