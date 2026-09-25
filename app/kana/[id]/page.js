"use client";
import { useParams } from "next/navigation";
import KanaLesson from "@/components/kana/KanaLesson";

export default function KanaLessonPage() {
  const { id } = useParams();
  return <KanaLesson key={id} id={+id} />;
}
