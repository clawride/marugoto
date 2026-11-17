"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { MN1_COURSE } from "@/components/courses";

export default function Mn1LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={MN1_COURSE} lesson={+l} />;
}
