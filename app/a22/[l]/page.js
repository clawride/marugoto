"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { A22_COURSE } from "@/components/courses";

export default function A22LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={A22_COURSE} lesson={+l} />;
}
