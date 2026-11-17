"use client";
// Chọn số câu của bài kiểm tra: 10 · 20 · 30 · toàn bộ (0 = tất cả từ trong danh sách)
import { KANJI_LENS } from "@/lib/course";

export default function LenPicker({ value, onChange, total }) {
  return (
    <div className="chips lenpick" role="radiogroup" aria-label="Số câu kiểm tra">
      <span className="lenlbl">Số câu:</span>
      {KANJI_LENS.filter((n) => n === 0 || n < total).map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} className={`chip dk sm ${value === n ? "on" : ""}`} onClick={() => onChange(n)}>
          {n === 0 ? `Toàn bộ (${total})` : n}
        </button>
      ))}
    </div>
  );
}
