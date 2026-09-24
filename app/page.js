import { redirect } from "next/navigation";

// Bản tạm: dùng phiên bản HTML đang hoạt động trong khi bản Next.js đầy đủ đang được hoàn thiện
export default function Home() {
  redirect("/legacy.html");
}
