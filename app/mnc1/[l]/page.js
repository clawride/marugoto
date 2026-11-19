"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { MNC1_COURSE } from "@/components/courses";

export default function Mnc1LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={MNC1_COURSE} lesson={+l} />;
}
