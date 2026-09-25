"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { B12_COURSE } from "@/components/courses";

export default function B12LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={B12_COURSE} lesson={+l} />;
}
