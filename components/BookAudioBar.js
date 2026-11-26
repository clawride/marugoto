"use client";
import { useSyncExternalStore } from "react";
import { bookSnapshot, serverBookSnapshot, subscribeBook, toggleBook, nextBook, stopBook } from "@/lib/bookPlayback";

export default function BookAudioBar() {
  const { lib, track, status, hasNext } = useSyncExternalStore(subscribeBook, bookSnapshot, serverBookSnapshot);
  if (!track) return null;
  const stateLabel = { playing: "Đang phát", paused: "Tạm dừng", ended: "Đã phát xong", loading: "Đang mở", error: "Không đọc được tệp" }[status];
  return <aside className="book-dock" aria-label="Trình phát audio sách">
    <div className="book-dock-inner">
      <div className="book-now" role="status"><small>{lib.bookTitle} · {stateLabel}</small><strong>{track.label}</strong></div>
      <div className="book-controls">
        <button type="button" onClick={toggleBook} disabled={status === "loading"} aria-label={status === "playing" ? "Tạm dừng" : "Phát"}>{status === "playing" ? "Ⅱ" : "▶"} <span>{status === "playing" ? "Tạm dừng" : "Phát"}</span></button>
        <button type="button" onClick={nextBook} disabled={!hasNext} aria-label="Bài tiếp theo">⏭ <span>Bài tiếp</span></button>
        <button type="button" onClick={stopBook} aria-label="Dừng phát">■ <span>Dừng</span></button>
      </div>
    </div>
  </aside>;
}
