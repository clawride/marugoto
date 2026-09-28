"use client";
import { useParams } from "next/navigation";
import BookTest from "@/components/course/BookTest";
import { A21_COURSE } from "@/components/courses";

export default function A21BookTestPage() {
  const { n } = useParams();
  return <BookTest key={n} course={A21_COURSE} n={+n} />;
}
