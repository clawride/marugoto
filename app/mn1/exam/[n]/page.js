"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { MN1_COURSE } from "@/components/courses";

export default function Mn1ExamPage() {
  const { n } = useParams();
  const ex = MN1_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href={MN1_COURSE.base}>{MN1_COURSE.title}</Link></p>;
  return <ExamRunner key={ex.n} cfg={MN1_COURSE.exam} ex={ex} />;
}
