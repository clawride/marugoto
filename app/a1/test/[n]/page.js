"use client";
import { useParams } from "next/navigation";
import BookTest from "@/components/course/BookTest";
import { A1_COURSE } from "@/components/courses";

export default function A1BookTestPage() {
  const { n } = useParams();
  return <BookTest key={n} course={A1_COURSE} n={+n} />;
}
