"use client";
// Dòng phiên âm Latinh đặt bên dưới một phần giải thích: mỗi đoạn tiếng Nhật trong `text` kèm romaji
import { annotate, useRomajiDict } from "@/lib/romaji";

export default function Rom({ text }) {
  const D = useRomajiDict();
  if (!D || !text || typeof text !== "string") return null;
  const items = annotate(text, D);
  if (!items.length) return null;
  return (
    <div className="rom" lang="ja-Latn" aria-label="Phiên âm Latinh">
      {items.map((x, i) => <span key={x.seg}>{i > 0 && <em aria-hidden="true"> · </em>}<b className="jpt">{x.seg}</b> <i>{x.rom}</i></span>)}
    </div>
  );
}
