"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { A1_COURSE } from "@/components/courses";

export default function A1BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={A1_COURSE} topic={+t} />;
}
