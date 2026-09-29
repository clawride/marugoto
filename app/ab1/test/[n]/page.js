"use client";
import { useParams } from "next/navigation";
import BookTest from "@/components/course/BookTest";
import { AB1_COURSE } from "@/components/courses";

export default function AB1BookTestPage() {
  const { n } = useParams();
  return <BookTest key={n} course={AB1_COURSE} n={+n} />;
}
