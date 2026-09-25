"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { AB1_COURSE } from "@/components/courses";

export default function AB1ExamPage() {
  const { n } = useParams();
  const ex = AB1_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href={AB1_COURSE.base}>{AB1_COURSE.title}</Link></p>;
  return <ExamRunner key={ex.n} cfg={AB1_COURSE.exam} ex={ex} />;
}
