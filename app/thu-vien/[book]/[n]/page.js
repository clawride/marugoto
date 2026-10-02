"use client";
// /thu-vien/<sách>/<số bài> → bài học · /thu-vien/<sách>/<trang tra cứu> → kính ngữ, từ viết tắt, nhân vật, tra cứu từ vựng
import { useParams } from "next/navigation";
import LessonView from "@/components/library/LessonView";
import ExtraView from "@/components/library/ExtraView";

export default function LibraryItemPage() {
  const { book, n } = useParams();
  const id = decodeURIComponent(n);
  return /^\d+$/.test(id) ? <LessonView key={id} bookId={book} n={+id} /> : <ExtraView key={id} bookId={book} id={id} />;
}
