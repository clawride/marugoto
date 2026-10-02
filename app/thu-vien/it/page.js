import CategoryPage from "@/components/library/CategoryPage";

export const metadata = { title: "Tiếng Nhật IT · Thư viện sách", description: "Sổ tay đọc sách tiếng Nhật công nghệ thông tin: mẫu câu, furigana, phiên âm Latinh, dịch tiếng Việt, tách từ." };

export default function Page() {
  return <CategoryPage cat="it" />;
}
