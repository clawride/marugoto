"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { MN2_COURSE } from "@/components/courses";

export default function Mn2ExamPage() {
  const { n } = useParams();
  const ex = MN2_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href={MN2_COURSE.base}>{MN2_COURSE.title}</Link></p>;
  return <ExamRunner key={ex.n} cfg={MN2_COURSE.exam} ex={ex} />;
}
