"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { AB1_COURSE } from "@/components/courses";

export default function AB1BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={AB1_COURSE} topic={+t} />;
}
