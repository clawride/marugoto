"use client";
import { useParams } from "next/navigation";
import RikaiTest from "@/components/course/RikaiTest";
import { A21_COURSE } from "@/components/courses";

export default function A21RikaiTestPage() {
  const { n } = useParams();
  return <RikaiTest key={n} course={A21_COURSE} n={+n} />;
}
