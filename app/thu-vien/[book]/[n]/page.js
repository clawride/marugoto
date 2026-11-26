import LessonView from "@/components/library/LessonView";
import ExtraView from "@/components/library/ExtraView";
import { BookMatter, SourceReading, endMatter, readingIds } from "@/components/library/KaigoReading";

export function generateStaticParams() {
  return readingIds.map(n => ({ book: "kaigo-jiko", n }));
}

export default async function LibraryItemPage({ params }) {
  const { book, n } = await params;
  const isReading = book === "kaigo-jiko" && readingIds.includes(n);
  if (isReading && Object.hasOwn(endMatter, n)) return <BookMatter id={n} />;
  const source = isReading ? <SourceReading id={n} /> : null;
  return /^\d+$/.test(n)
    ? <LessonView key={n} bookId={book} n={+n}>{source}</LessonView>
    : <ExtraView key={n} bookId={book} id={n}>{source}</ExtraView>;
}
