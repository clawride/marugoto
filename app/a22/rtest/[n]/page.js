"use client";
import { useParams } from "next/navigation";
import RikaiTest from "@/components/course/RikaiTest";
import { A22_COURSE } from "@/components/courses";

export default function A22RikaiTestPage() {
  const { n } = useParams();
  return <RikaiTest key={n} course={A22_COURSE} n={+n} />;
}
