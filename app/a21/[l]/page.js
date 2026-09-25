"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { A21_COURSE } from "@/components/courses";

export default function A21LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={A21_COURSE} lesson={+l} />;
}
