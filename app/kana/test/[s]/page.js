"use client";
import { useParams } from "next/navigation";
import KanaTest from "@/components/kana/KanaTest";

export default function KanaTestPage() {
  const { s } = useParams();
  return <KanaTest key={s} s={s} />;
}
