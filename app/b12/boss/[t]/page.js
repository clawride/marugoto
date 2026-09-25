"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { B12_COURSE } from "@/components/courses";

export default function B12BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={B12_COURSE} topic={+t} />;
}
