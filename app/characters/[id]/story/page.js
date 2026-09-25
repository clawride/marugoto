"use client";
import { useParams } from "next/navigation";
import StoryHub from "@/components/vn/StoryHub";

export default function StoryPage() {
  const { id } = useParams();
  return <StoryHub key={id} id={id} />;
}
