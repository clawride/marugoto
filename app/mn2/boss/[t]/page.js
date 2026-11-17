"use client";
import { useParams } from "next/navigation";
import BossView from "@/components/course/BossView";
import { MN2_COURSE } from "@/components/courses";

export default function Mn2BossPage() {
  const { t } = useParams();
  return <BossView key={t} course={MN2_COURSE} topic={+t} />;
}
