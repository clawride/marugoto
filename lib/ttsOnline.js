"use client";
// Bài nghe cho máy KHÔNG có giọng tiếng Nhật: đọc bằng VOICEVOX online (api.tts.quest) — mỗi người nói một giọng nam/nữ khác nhau.
// Tạo trước vài câu tiếp theo trong lúc đang đọc câu hiện tại; âm thanh lưu trong Cache Storage nên lần sau nghe là có ngay.
import { onlineClip, prefetchOnlineClip } from "@/lib/voicevox";
import { onStop } from "@/lib/tts";

const F_POOL = ["himari", "tsumugi", "metan", "sora"];
const M_POOL = ["kurono", "ryusei", "kotaro", "suzumatsu"];
let tok = 0, audio = null;
onStop(() => { tok++; audio?.pause(); });

// Phân vai: cùng người nói → cùng giọng; khác người nói → khác giọng (theo giới tính g nếu có, không thì xen kẽ nữ/nam)
function castsFor(lines) {
  const by = new Map();
  let nf = 0, nm = 0, alt = 0;
  for (const l of lines) {
    const sp = l.sp || "A";
    if (by.has(sp)) continue;
    const g = l.g === "m" || l.g === "f" ? l.g : alt++ % 2 ? "m" : "f";
    const fam = g === "m" ? M_POOL[nm++ % M_POOL.length] : F_POOL[nf++ % F_POOL.length];
    by.set(sp, { grp: g === "m" ? "ym" : "yf", fam, p: 0, i: 1, s: 1 });
  }
  return lines.map((l) => by.get(l.sp || "A"));
}

// Trả về true nếu đã đọc được (kể cả bị dừng giữa chừng), false nếu không tạo được tiếng nào → nơi gọi dùng giọng máy
export async function speakOnline(lines, { rate = 0.9, onLine } = {}) {
  const my = ++tok;
  const casts = castsFor(lines);
  lines.slice(0, 3).forEach((l, i) => prefetchOnlineClip(casts[i], l.t));
  let played = 0;
  for (let i = 0; i < lines.length; i++) {
    if (my !== tok) return true;
    const l = lines[i];
    onLine?.(i);
    let url;
    try { url = await onlineClip(casts[i], l.t, true); } catch { continue; }
    if (my !== tok) return true;
    lines.slice(i + 1, i + 4).forEach((n, k) => prefetchOnlineClip(casts[i + 1 + k], n.t));
    audio = audio || new Audio();
    audio.src = url;
    audio.playbackRate = Math.min(1.1, Math.max(0.7, rate / 0.9)); // 0.9 là tốc độ "hơi chậm" quen thuộc của bài nghe; giọng VOICEVOX gốc vừa phải
    try {
      await audio.play();
      played++;
      await new Promise((r) => { audio.onended = audio.onpause = r; });
    } catch { /* trình duyệt chặn tự phát / bị dừng */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  onLine?.(-1);
  return played > 0 || my !== tok;
}
