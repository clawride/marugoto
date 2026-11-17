"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { MN2_COURSE } from "@/components/courses";

export default function Mn2LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={MN2_COURSE} lesson={+l} />;
}
