"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { MNC2_COURSE } from "@/components/courses";

export default function Mnc2BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={MNC2_COURSE} topic={+t} />;
}
