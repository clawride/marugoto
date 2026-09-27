"use client";
import { useParams } from "next/navigation";
import KanjiSheet from "@/components/kanji/KanjiSheet";

export default function SheetPage() {
  const { id } = useParams();
  return <KanjiSheet key={id} id={decodeURIComponent(id)} />;
}
