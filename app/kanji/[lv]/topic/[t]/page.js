"use client";
import { useParams } from "next/navigation";
import { KanjiTopicTest } from "@/components/kanji/KanjiTest";

export default function KanjiTopicTestPage() {
  const { lv, t } = useParams();
  return <KanjiTopicTest key={`${lv}-${t}`} lv={lv} t={+t} />;
}
