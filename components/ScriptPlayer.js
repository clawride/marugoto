"use client";
import { useEffect, useState } from "react";
import { speakLines, stopSpeak, ttsAvailable, hasJaVoice } from "@/lib/tts";
import { findClip, warmClip } from "@/lib/listenClip";

// Phát lời thoại bằng giọng đọc máy; giới hạn số lượt nghe (dùng cho đề thi)
export default function ScriptPlayer({ lines, maxPlays = 99, showScript = false }) {
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const [cur, setCur] = useState(-1);
  const [ja, setJa] = useState(true);
  const [pre, setPre] = useState(null); // audio tạo sẵn
  useEffect(() => { let alive = true; findClip(lines).then((c) => alive && setPre(c)).catch(() => {}); return () => { alive = false; }; }, [lines]);
  useEffect(() => {
    if (!ttsAvailable()) return;
    const chk = () => setJa(hasJaVoice());
    if (speechSynthesis.getVoices().length) chk();
    speechSynthesis.addEventListener?.("voiceschanged", chk);
    const t = setTimeout(chk, 1200);
    return () => { clearTimeout(t); speechSynthesis.removeEventListener?.("voiceschanged", chk); stopSpeak(); };
  }, []);
  const play = async () => {
    if (plays >= maxPlays) return;
    if (ja || pre) setPlays((p) => p + 1); // không có giọng Nhật (và không có audio tạo sẵn) thì không tính lượt
    setPlaying(true);
    await speakLines(lines, { onLine: setCur });
    setPlaying(false); setCur(-1);
  };
  return (
    <div>
      <div className={`player ${playing ? "on" : ""}`} onPointerEnter={() => pre && warmClip(lines)}>
        <button className="playbtn" onClick={playing ? () => { stopSpeak(); setPlaying(false); } : play} disabled={!ttsAvailable() || (!playing && plays >= maxPlays)}>{playing ? "■" : "▶"}</button>
        <div className="pl-info">
          <b>{playing ? "Đang phát…" : plays ? "Nghe lại" : "Bấm để nghe"}</b>
          <span>{pre ? `Giọng đọc tạo sẵn · VOICEVOX:${pre.voices.join("・")}${maxPlays < 99 ? ` · còn ${maxPlays - plays} lượt nghe` : ""}` : ttsAvailable() ? `Giọng đọc máy${maxPlays < 99 ? ` · còn ${maxPlays - plays} lượt nghe` : ""}` : "Trình duyệt không hỗ trợ giọng đọc tiếng Nhật"}</span>
        </div>
        <div className="wave">{Array.from({ length: 14 }, (_, k) => <i key={k} style={{ animationDelay: `${k * 0.07}s` }} />)}</div>
      </div>
      {!ja && !pre && <div className="nojavoice">⚠ Máy/trình duyệt này chưa có giọng đọc tiếng Nhật nên có thể không nghe được. Hãy dùng Chrome/Edge, hoặc cài giọng Japanese trong Windows: Cài đặt → Thời gian &amp; ngôn ngữ → Giọng nói (Speech).</div>}
      {showScript && (
        <div className="scriptlines">{lines.map((l, k) => <p key={k} className={cur === k ? "now" : ""}><b>{l.sp}:</b> <span className="jpt">{l.t}</span></p>)}</div>
      )}
    </div>
  );
}

