"use client";
import { useParams } from "next/navigation";
import RikaiTest from "@/components/course/RikaiTest";
import { A1_COURSE } from "@/components/courses";

export default function A1RikaiTestPage() {
  const { n } = useParams();
  return <RikaiTest key={n} course={A1_COURSE} n={+n} />;
}
