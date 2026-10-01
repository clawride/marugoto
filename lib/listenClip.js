"use client";
// Bài nghe phát từ audio TẠO SẴN (scripts/gen-listen.mjs → GitHub Releases `voice-listen-<n>`, qua /vv để được cache trên CDN).
// Mục lục public/listen/index.json: { mã kịch bản: [shard, tổng giây, giây bắt đầu của từng dòng…] } — mã tính bằng lib/listenKey.js (giống script tạo).
import { listenKey, castLines, famName } from "@/lib/listenKey";
import { onStop } from "@/lib/tts";

let manP = null;
const manifest = () => (manP ||= fetch("/listen/index.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

// Tìm file tạo sẵn của một kịch bản → { url, dur, off, voices } hoặc null
export async function findClip(lines) {
  if (!lines?.length) return null;
  const key = listenKey(lines), e = (await manifest())[key];
  if (!e) { (window.__clipMiss ||= new Map()).set(key, lines); return null; } // kiểm tra độ phủ: tools/audit ghi lại các kịch bản chưa có audio
  const [shard, dur, ...off] = e;
  const voices = [...new Set(castLines(lines).map((l) => famName(l.fam)).filter(Boolean))];
  return { key, url: `/vv/voice-listen-${shard}/${key}.mp3`, dur, off, voices };
}
export const hasClip = async (lines) => !!(await findClip(lines));

// File mp3 nhỏ (vài chục KB) → tải cả file về bộ nhớ rồi mới phát
const blobs = new Map();
function blobOf(url) {
  if (!blobs.has(url)) {
    const p = fetch(url).then((r) => { if (!r.ok) throw new Error(`audio ${r.status}`); return r.blob(); }).then((b) => URL.createObjectURL(b));
    p.catch(() => blobs.delete(url));
    blobs.set(url, p);
  }
  return blobs.get(url);
}
export function warmClip(lines) { findClip(lines).then((c) => c && blobOf(c.url)).catch(() => {}); }

let tok = 0, audio = null;
onStop(() => { tok++; audio?.pause(); });

// true nếu có file tạo sẵn và đã phát (kể cả bị dừng giữa chừng); false nếu không có → nơi gọi dùng giọng máy
export async function speakClip(lines, { rate = 0.9, onLine } = {}) {
  const my = ++tok;
  const clip = await findClip(lines);
  if (!clip) return false;
  if (my !== tok) return true;
  let url;
  try { url = await blobOf(clip.url); } catch { return false; }
  if (my !== tok) return true;
  audio = audio || new Audio();
  audio.src = url;
  audio.playbackRate = Math.min(1.25, Math.max(0.7, rate / 0.9)); // tạo sẵn ở tốc độ hơi chậm; rate mặc định 0.9 = giữ nguyên
  let cur = -1;
  audio.ontimeupdate = () => {
    let i = clip.off.length - 1;
    while (i > 0 && clip.off[i] > audio.currentTime + 0.05) i--;
    if (i !== cur) { cur = i; onLine?.(i); }
  };
  try {
    await audio.play();
  } catch { return my !== tok; /* trình duyệt chặn tự phát */ }
  await new Promise((r) => { audio.onended = audio.onpause = r; });
  audio.ontimeupdate = null;
  if (my === tok) onLine?.(-1);
  return true;
}
