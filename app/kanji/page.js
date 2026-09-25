"use client";
import { Suspense } from "react";
import KanjiHub from "@/components/kanji/KanjiHub";

export default function KanjiPage() {
  return <Suspense fallback={null}><KanjiHub /></Suspense>;
}
