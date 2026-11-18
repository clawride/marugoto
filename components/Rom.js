"use client";
// Phiên âm Latinh (romaji):
//  - câu / đoạn tiếng Nhật → MỘT dòng romaji cả câu, đặt ngay dưới câu tiếng Nhật (trên nghĩa tiếng Việt)
//  - phần giải thích tiếng Việt có xen tiếng Nhật → dải "đoạn tiếng Nhật · romaji" cho từng đoạn
// Dữ liệu: public/romaji/s-XX.json (scripts/build-romaji-sent.mjs, sinh bằng kuromoji); thiếu thì dùng từ điển cũ public/romaji-dict.json.
import { useEffect, useState } from "react";
import { romajiOfSegment, useRomajiDict } from "@/lib/romaji";
import { shardOf, segmentsOf, isMostlyJapanese } from "@/lib/romajiKey";

const cache = new Map(); // shard → { chuỗi: romaji }
const waits = new Map();
function loadShard(i) {
  if (cache.has(i)) return Promise.resolve(cache.get(i));
  if (!waits.has(i)) waits.set(i, fetch(`/romaji/s-${String(i).padStart(2, "0")}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => { cache.set(i, m); return m; }));
  return waits.get(i);
}
const lookup = (s) => cache.get(shardOf(s))?.[s];

// Tải trước các phần chứa những chuỗi cần tra; trả về true khi đã sẵn sàng
export function useRomajiFor(keys) {
  const ids = [...new Set(keys.filter(Boolean).map(shardOf))];
  const sig = ids.join(",");
  const [, bump] = useState(0);
  const ready = ids.every((i) => cache.has(i));
  useEffect(() => { if (!ready) { let on = true; Promise.all(ids.map(loadShard)).then(() => on && bump((x) => x + 1)); return () => { on = false; }; } }, [sig, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  return ready;
}
// romaji của một câu tiếng Nhật (sau khi đã tải phần chứa nó)
export const romajiOf = (s) => (s ? lookup(String(s).trim()) : null);

export default function Rom({ text }) {
  const t = typeof text === "string" ? text.trim() : "";
  const whole = !!t && isMostlyJapanese(t);
  const segs = t && !whole ? segmentsOf(t) : [];
  const ready = useRomajiFor(whole ? [t] : segs);
  const D = useRomajiDict();
  if (!t || !ready) return null;
  if (whole) {
    const r = lookup(t);
    if (r) return <div className="rom rom-line" lang="ja-Latn" aria-label="Phiên âm Latinh">{r}</div>;
  }
  // dải từng đoạn: ưu tiên romaji sinh sẵn, thiếu thì dùng từ điển cũ
  const items = (whole ? segmentsOf(t) : segs).slice(0, 10).map((seg) => ({ seg, rom: lookup(seg) || (D && romajiOfSegment(seg, D)) })).filter((x) => x.rom);
  if (!items.length) return null;
  return (
    <div className="rom" lang="ja-Latn" aria-label="Phiên âm Latinh">
      {items.map((x, i) => <span key={x.seg}>{i > 0 && <em aria-hidden="true"> · </em>}<b className="jpt">{x.seg}</b> <i>{x.rom}</i></span>)}
    </div>
  );
}
