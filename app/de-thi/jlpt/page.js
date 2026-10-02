import ExamList from "@/components/exam/ExamList";

export const metadata = { title: "Luyện đề JLPT N1–N5" };

export default function Page() {
  return <ExamList kind="jlpt" />;
}
