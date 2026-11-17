"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { MN1_COURSE } from "@/components/courses";

export default function Mn1BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={MN1_COURSE} topic={+t} />;
}
