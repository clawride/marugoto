"use client";
import { useParams } from "next/navigation";
import SampleTest from "@/components/course/SampleTest";
import { B12_COURSE } from "@/components/courses";

// テストの問題例 của sách 中級2: /b12/test/1 (Topic 1–3), /b12/test/2 (4–6), /b12/test/3 (7–9)
export default function B12SampleTestPage() {
  const { n } = useParams();
  return <SampleTest key={n} course={B12_COURSE} n={+n} />;
}
