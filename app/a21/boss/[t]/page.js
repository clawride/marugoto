"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { A21_COURSE } from "@/components/courses";

export default function A21BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={A21_COURSE} topic={+t} />;
}
