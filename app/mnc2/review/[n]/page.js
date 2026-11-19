"use client";
// 復習 của sách bài tập 標準問題集: /mnc2/review/<n>
import { useParams } from "next/navigation";
import ReviewView from "@/components/course/ReviewView";
import { MNC2_COURSE } from "@/components/courses";

export default function ReviewPage() {
  const { n } = useParams();
  return <ReviewView key={n} course={MNC2_COURSE} n={+n} />;
}
