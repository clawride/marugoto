"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { A1_COURSE } from "@/components/courses";

export default function A1LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={A1_COURSE} lesson={+l} />;
}
