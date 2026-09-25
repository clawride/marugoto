"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { AB1_COURSE } from "@/components/courses";

export default function AB1LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={AB1_COURSE} lesson={+l} />;
}
