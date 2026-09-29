"use client";
import { useParams } from "next/navigation";
import SampleTest from "@/components/course/SampleTest";
import { B11_BOOK_COURSE } from "@/components/courses";

// テストの問題例 của sách 中級1: /b1/test/1 (Topic 1–3), /b1/test/2 (4–6), /b1/test/3 (7–9)
export default function B11SampleTestPage() {
  const { n } = useParams();
  return <SampleTest key={n} course={B11_BOOK_COURSE} n={+n} />;
}
