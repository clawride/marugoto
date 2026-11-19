"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { MNC1_COURSE } from "@/components/courses";

export default function Mnc1BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={MNC1_COURSE} topic={+t} />;
}
