"use client";
import { useParams } from "next/navigation";
import StoryPlayer from "@/components/vn/StoryPlayer";

export default function StoryChapterPage() {
  const { id, c } = useParams();
  return <StoryPlayer key={`${id}-${c}`} id={id} c={c} />;
}
