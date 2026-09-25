"use client";
import { useParams } from "next/navigation";
import KanjiLesson from "@/components/kanji/KanjiLesson";

export default function KanjiLessonPage() {
  const { lv, n } = useParams();
  return <KanjiLesson key={`${lv}-${n}`} lv={lv} n={+n} />;
}
