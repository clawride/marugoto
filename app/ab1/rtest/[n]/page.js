"use client";
import { useParams } from "next/navigation";
import RikaiTest from "@/components/course/RikaiTest";
import { AB1_COURSE } from "@/components/courses";

export default function AB1RikaiTestPage() {
  const { n } = useParams();
  return <RikaiTest key={n} course={AB1_COURSE} n={+n} />;
}
