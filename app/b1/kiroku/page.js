"use client";
import Kiroku from "@/components/course/Kiroku";
import { B11_BOOK_COURSE } from "@/components/courses";

// 学習記録シート của sách 中級1 (tr.250–267)
export default function B11KirokuPage() {
  return <Kiroku course={B11_BOOK_COURSE} />;
}
