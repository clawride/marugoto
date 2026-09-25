"use client";
import { useParams } from "next/navigation";
import { KanjiChar } from "@/components/kanji/KanjiTest";

export default function KanjiCharPage() {
  const { k } = useParams();
  const c = decodeURIComponent(k);
  return <KanjiChar key={c} k={c} />;
}
