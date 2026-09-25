"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { A22_COURSE } from "@/components/courses";

export default function A22BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={A22_COURSE} topic={+t} />;
}
