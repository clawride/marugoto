"use client";
// Tải trước giọng đọc tạo sẵn (cả file của chương / của phần trò chuyện) trước khi vào, có thanh tiến độ — để câu đầu phát ngay, không phải chờ.
import { useEffect, useState } from "react";
import { preloadVoice } from "@/lib/voicevox";

// key: chuỗi đổi khi cần tải lại (đổi chương / mức / giọng) · getLines(): các câu sẽ đọc · trả về { pct: 0..1 | null (null = xong hoặc không cần chờ), skip }
export function useVoicePreload(key, getLines, D, set) {
  const [pct, setPct] = useState(null);
  useEffect(() => {
    if (!D || !set.tts || set.voice === "web") { setPct(null); return; }
    let alive = true;
    setPct(0);
    preloadVoice(getLines(), { D, set }, (p) => alive && setPct(p)).catch(() => {}).finally(() => alive && setPct(null));
    return () => { alive = false; };
  }, [D, key, set.tts, set.voice, set.trav]); // eslint-disable-line react-hooks/exhaustive-deps
  return { pct, skip: () => setPct(null) };
}

export function VoiceLoading({ pct, onSkip, what = "giọng đọc" }) {
  if (pct === null || pct === undefined) return null;
  const n = Math.round(pct * 100);
  return (
    <div className="vvload" role="status" aria-live="polite">
      <div className="box panel">
        <div className="vvico" aria-hidden="true">🎧</div>
        <b>Đang tải {what}…</b>
        <div className="bar"><i style={{ width: `${Math.max(4, n)}%` }} /></div>
        <small>{n}% · chỉ tải lần đầu, những lần sau mở lại là nghe ngay</small>
        <button type="button" className="gbtn sm x dark" onClick={onSkip}><span className="c" />Bỏ qua</button>
      </div>
    </div>
  );
}
