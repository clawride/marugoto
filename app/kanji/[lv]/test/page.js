"use client";
import { useParams } from "next/navigation";
import { KanjiTest } from "@/components/kanji/KanjiTest";

export default function KanjiTestPage() {
  const { lv } = useParams();
  return <KanjiTest key={lv} lv={lv} />;
}
