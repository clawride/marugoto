"use client";
import { useEffect, useRef, useState } from "react";
import { audioCount, audioUrl, canPickDir, hasFile, hasSavedFolder, onAudioChange, pickFolder, restoreFolder, setFileList } from "@/lib/audioLib";
import { speakLines, stopSpeak, ttsAvailable } from "@/lib/tts";
import { TSARITSA } from "@/lib/listenBosses";
import { MCQ, FillQ } from "@/components/Battle";
import { sfx } from "@/lib/sfx";

// Huy hiệu Băng Thần (dùng khi chưa có ảnh /bang-than.jpg)
export function TsaritsaEmblem({ size = 120 }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id="tsg" cx=".5" cy=".45" r=".6"><stop offset="0" stopColor="#eaf8ff" /><stop offset=".55" stopColor="#7fc8f0" /><stop offset="1" stopColor="#1d3b7a" /></radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#tsg)" stroke="#cfeeff" strokeWidth="2" />
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".95">
        {[0, 60, 120].map((r) => <g key={r} transform={`rotate(${r} 60 60)`}><path d="M60 18v84M60 30l-9-9M60 30l9-9M60 90l-9 9M60 90l9 9" /></g>)}
      </g>
      <path d="M38 40l8-14 7 10 7-14 7 14 7-10 8 14z" fill="#f3fbff" stroke="#9bd4f3" strokeWidth="1.5" />
    </svg>
  );
}

export function TsaritsaPortrait({ className = "" }) {
  const [err, setErr] = useState(false);
  return err
    ? <div className={`tsa-portrait emblem ${className}`}><TsaritsaEmblem /></div>
    : <img className={`tsa-portrait ${className}`} src={TSARITSA.img} alt={TSARITSA.name} onError={() => setErr(true)} />;
}

// Huy hiệu Ronova — đồng hồ cát, lửa tím
export function RonovaEmblem() {
  return (
    <svg viewBox="0 0 200 200" width="200" height="200" className="ronova-emblem" aria-hidden="true">
      <defs>
        <radialGradient id="rvg" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#2a0f3f" /><stop offset=".7" stopColor="#12061f" /><stop offset="1" stopColor="#000" /></radialGradient>
        <linearGradient id="rvf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#6a2bd6" /><stop offset=".6" stopColor="#b77cff" /><stop offset="1" stopColor="#f2e3ff" /></linearGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill="url(#rvg)" stroke="#8a5cf0" strokeWidth="2" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#b77cff" strokeWidth="1" strokeDasharray="3 6" opacity=".7" className="rv-ring" />
      <path d="M70 48h60M70 152h60M76 48c0 30 24 38 24 52s-24 22-24 52M124 48c0 30-24 38-24 52s24 22 24 52" stroke="#e6d4ff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M86 70h28l-14 22z" fill="url(#rvf)" opacity=".9" />
      <path d="M100 118c-10 10-16 18-16 26h32c0-8-6-16-16-26z" fill="url(#rvf)" className="rv-flame" />
      {[0, 72, 144, 216, 288].map((r) => <circle key={r} cx="100" cy="14" r="3" fill="#d9b8ff" transform={`rotate(${r} 100 100)`} />)}
    </svg>
  );
}

// Bảng kết nối thư mục audio trên máy
export function AudioSetup() {
  const [n, setN] = useState(0);
  const [saved, setSaved] = useState(false);
  const inp = useRef(null);
  useEffect(() => {
    setN(audioCount());
    const off = onAudioChange(setN);
    restoreFolder(false).then(setN).catch(() => {});
    hasSavedFolder().then(setSaved);
    return off;
  }, []);
  const choose = async () => {
    try {
      if (canPickDir()) { setN(await pickFolder()); setSaved(true); }
      else inp.current?.click();
    } catch {}
  };
  return (
    <div className={`panel audiosetup ${n ? "ok" : ""}`}>
      <div className="as-ico">{n ? "🎧" : "📁"}</div>
      <div className="as-txt">
        {n ? <><b>Đã kết nối {n} file audio</b><span>Bài nghe sẽ phát bằng audio gốc của sách, đọc thẳng từ máy bạn (không tải lên đâu cả).</span></>
          : <><b>Chưa kết nối audio sách</b><span>Chọn thư mục <i>New A2-1 Katsudou audio</i> trên máy để nghe audio gốc. Không có audio thì trang dùng giọng đọc tiếng Nhật của trình duyệt với lời thoại viết lại.</span></>}
      </div>
      <div className="as-btns">
        {!n && saved && canPickDir() && <button className="gbtn sm" onClick={async () => setN(await restoreFolder(true))}><span className="c" />Kết nối lại</button>}
        <button className="gbtn sm tri" onClick={choose}><span className="c" />{n ? "Đổi thư mục" : "Chọn thư mục audio"}</button>
      </div>
      <input ref={inp} type="file" multiple accept="audio/mpeg" style={{ display: "none" }} {...{ webkitdirectory: "", directory: "" }} onChange={(e) => setN(setFileList(e.target.files))} />
    </div>
  );
}

// Nút phát: audio gốc nếu có, không thì TTS
export function Player({ file, tts, autoPlay = true, onPlayed }) {
  const [mode] = useState(() => (file && hasFile(file) ? "file" : "tts"));
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const audio = useRef(null);
  const play = async () => {
    stopSpeak();
    if (audio.current) { audio.current.pause(); }
    setPlaying(true); setPlays((p) => p + 1); onPlayed?.();
    try {
      if (mode === "file") {
        const u = await audioUrl(file);
        const a = audio.current || (audio.current = new Audio());
        a.src = u; a.currentTime = 0;
        a.onended = () => setPlaying(false);
        await a.play();
      } else {
        await speakLines(tts || []);
        setPlaying(false);
      }
    } catch { setPlaying(false); }
  };
  useEffect(() => {
    if (autoPlay) { const t = setTimeout(play, 350); return () => clearTimeout(t); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => { stopSpeak(); audio.current?.pause(); }, []);
  const disabled = mode === "tts" && !ttsAvailable();
  return (
    <div className={`player ${playing ? "on" : ""}`}>
      <button className="playbtn" onClick={play} disabled={disabled} aria-label="Phát">{playing ? "❚❚" : "▶"}</button>
      <div className="pl-info">
        <b>{playing ? "Đang phát…" : plays ? "Nghe lại" : "Bấm để nghe"}</b>
        <span>{mode === "file" ? `Audio sách · ${file}` : disabled ? "Trình duyệt không hỗ trợ giọng đọc" : "Giọng đọc máy · lời thoại viết lại"}</span>
      </div>
      <div className="wave">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ animationDelay: `${i * 0.07}s` }} />)}</div>
    </div>
  );
}

// Một câu nghe: phát audio rồi hỏi (mc) hoặc điền cụm từ nghe được (catch)
export function ListenQ({ item, onScore, onNext, host }) {
  const [showScript, setShowScript] = useState(false);
  const player = <Player file={item.file} tts={item.tts} />;
  const script = item.tts?.length ? (
    <div className="scriptbox">
      <button className="chip" onClick={() => setShowScript((v) => !v)}>{showScript ? "Ẩn lời thoại" : "Xem lời thoại (viết lại)"}</button>
      {showScript && <div className="scriptlines">{item.tts.map((l, i) => <p key={i}><b>{l.sp}:</b> <span className="jpt">{l.t}</span></p>)}</div>}
    </div>
  ) : null;
  const top = <>{host}{player}</>;
  if (item.type === "catch") {
    return <FillQ q={{ sub: "Nghe và chọn cụm từ còn thiếu", q: item.q, opts: item.optsShuffled, answer: item.opts[item.a], explain: item.explain, after: script }} onScore={onScore} onNext={() => { stopSpeak(); onNext(); }} top={top} />;
  }
  return <MCQ q={{ sub: "Nghe và trả lời", prompt: item.q, opts: item.optsShuffled, answer: item.opts[item.a], explain: item.explain, after: script }} onScore={onScore} onNext={() => { stopSpeak(); onNext(); }} top={top} />;
}

// Chép chính tả rút gọn: máy đọc câu đã học ở boss sách, chọn từ còn thiếu
export function DictationQ({ item, onScore, onNext, host }) {
  const full = item.q.replace(/（\s*）|\(\s*\)|（　）/, item.answer);
  return <FillQ q={{ sub: "Nghe câu và chọn từ còn thiếu", q: item.q, opts: item.opts, answer: item.answer, explain: item.explain, vi: item.vi }} onScore={onScore} onNext={() => { stopSpeak(); sfx.click(); onNext(); }} top={<>{host}<Player tts={[{ sp: "A", t: full }]} /></>} />;
}
