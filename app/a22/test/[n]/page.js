"use client";
import { useParams } from "next/navigation";
import BookTest from "@/components/course/BookTest";
import { A22_COURSE } from "@/components/courses";

export default function A22BookTestPage() {
  const { n } = useParams();
  return <BookTest key={n} course={A22_COURSE} n={+n} />;
}
