"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExamRunner from "@/components/ExamRunner";
import { MNC2_COURSE } from "@/components/courses";

export default function Mnc2ExamPage() {
  const { n } = useParams();
  const ex = MNC2_COURSE.C.examOf(+n);
  if (!ex) return <p style={{ marginTop: 40 }}>Không tìm thấy kỳ thi. <Link href={MNC2_COURSE.base}>{MNC2_COURSE.title}</Link></p>;
  return <ExamRunner key={ex.n} cfg={MNC2_COURSE.exam} ex={ex} />;
}
