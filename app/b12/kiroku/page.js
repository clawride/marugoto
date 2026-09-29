"use client";
import Kiroku from "@/components/course/Kiroku";
import { B12_COURSE } from "@/components/courses";

// 学習記録シート của sách 中級2
export default function B12KirokuPage() {
  return <Kiroku course={B12_COURSE} />;
}
