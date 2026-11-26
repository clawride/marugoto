import { japanesePassages } from "@/lib/kaigoText";

export default function KaigoText({ text, readings }) {
  if (!readings || typeof text !== "string") return text;
  const pieces = [];
  let start = 0;
  for (const match of japanesePassages(text)) {
    const jp = match[0];
    const ro = readings[jp];
    if (!ro) continue;
    pieces.push(text.slice(start, match.index), <span className="lbjpreading" key={match.index}>
      <span lang="ja">{jp}</span><span className="lbromaji" lang="ja-Latn">{ro}</span>
    </span>);
    start = match.index + jp.length;
  }
  return <>{pieces}{text.slice(start)}</>;
}
