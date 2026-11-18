"use client";
import { useParams } from "next/navigation";
import LessonView from "@/components/course/LessonView";
import { MNC2_COURSE } from "@/components/courses";

export default function Mnc2LessonPage() {
  const { l } = useParams();
  return <LessonView key={l} course={MNC2_COURSE} lesson={+l} />;
}
