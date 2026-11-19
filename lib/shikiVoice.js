"use client";
// Giọng nói của đối thủ ở bàn bài: VOICEVOX online (giọng anime, có cache), chậm/lỗi thì dùng giọng tiếng Nhật của trình duyệt.
import { onlineClip } from "@/lib/voicevox";

// Mỗi nhân vật một giọng VOICEVOX hợp tính cách (khóa trong FAM của lib/voiceCast.js)
const CAST = {
  Amber: "hanamaru", Barbara: "nana", Kaeya: "kurono", Lisa: "soraSexy", Xiangling: "sora", Bennett: "kotaro",
  Fischl: "ritsuQueen", Ningguang: "metanSexy", Diluc: "ryuseiCalm", Keqing: "tsurugi", Zhongli: "kigashima",
  Ganyu: "himari", "Raiden Shogun": "itako", Neuvillette: "saeshiro", Nahida: "mikoLoli",
};
const MALE = new Set(["Kaeya", "Bennett", "Diluc", "Zhongli", "Neuvillette"]);
const LS = "shiki_voice";
const LS_LANG = "shiki_talk_lang";
export const talkLang = () => { try { return localStorage.getItem(LS_LANG) === "ja" ? "ja" : "vi"; } catch { return "vi"; } };
export const setTalkLang = (l) => { try { localStorage.setItem(LS_LANG, l); } catch {} };
let audio = null, tok = 0;

export const voiceOn = () => { try { return localStorage.getItem(LS) !== "0"; } catch { return true; } };
export const setVoiceOn = (v) => { try { localStorage.setItem(LS, v ? "1" : "0"); } catch {} if (!v) stopVoice(); };

// iPhone/Android chỉ cho phát âm thanh sau một lần chạm: gọi hàm này trong sự kiện chạm đầu tiên
export function unlockVoice() {
  try {
    audio = audio || new Audio();
    audio.muted = true;
    audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    audio.play().catch(() => {}).finally(() => { audio.muted = false; });
    if (typeof speechSynthesis !== "undefined") speechSynthesis.getVoices();
  } catch {}
}

export function stopVoice() { tok++; viNext = null; viBusy = false; try { audio?.pause(); } catch {} try { speechSynthesis.cancel(); } catch {} }

function browserVoice(name, text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    const v = speechSynthesis.getVoices().filter((x) => /^ja/i.test(x.lang));
    const male = MALE.has(name);
    u.voice = v.find((x) => (male ? /Keita|Ichiro|Daichi|Naoki|Otoya/i : /Nanami|Aoi|Mayu|Shiori|Kyoko|Haruka|Ayumi|Google/i).test(x.name)) || v[0] || null;
    u.pitch = male ? 0.85 : 1.3; u.rate = 1.08;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch {}
}

// Đọc một câu thoại bằng giọng của nhân vật; câu mới cắt câu cũ
export async function speakAs(name, text) {
  if (!text || !voiceOn()) return;
  const my = ++tok;
  try { audio?.pause(); speechSynthesis.cancel(); } catch {}
  try {
    const url = await Promise.race([
      onlineClip({ fam: CAST[name] || "sora", p: 0, i: 1.15, s: 1.05 }, text, true),
      new Promise((_, no) => setTimeout(() => no(new Error("slow")), 5000)),
    ]);
    if (my !== tok) return;
    audio = audio || new Audio();
    audio.src = url;
    await audio.play();
    return;
  } catch {}
  if (my === tok) browserVoice(name, text);
}

// Giọng tiếng Việt miền Bắc (Edge: HoaiMy/NamMinh · iPhone: Linh · Chrome: Google Tiếng Việt).
// Đọc nhanh, ngữ điệu "láo": cao giọng khi khoe, ré lên khi cay. Đọc lần lượt: câu đang đọc phải xong mới tới câu sau
// (chỉ giữ câu mới nhất đang chờ, bỏ các câu cũ hơn).
const VI_MOOD = { capture: [1.35, 1.3], win: [1.45, 1.3], setback: [1.6, 1.35], lose: [1.55, 1.35], tease: [1.3, 1.25], opening: [1.3, 1.25], draw: [1.2, 1.25] };
const NORTH = { f: [/HoaiMy|Hoai My|Hoài My/i, /Linh/i, /Google/i], m: [/NamMinh|Nam Minh/i, /\bAn\b/i, /Google/i] };
let viBusy = false, viNext = null;
function viVoice(male) {
  const v = speechSynthesis.getVoices().filter((x) => /^vi/i.test(x.lang));
  for (const re of NORTH[male ? "m" : "f"]) { const hit = v.find((x) => re.test(x.name)); if (hit) return hit; }
  return v[0] || null;
}
function runVi({ name, text, mood }) {
  viBusy = true;
  const my = tok;
  let ended = false;
  const done = () => {
    if (ended) return; ended = true;
    if (my !== tok) return;
    viBusy = false;
    const n = viNext; viNext = null;
    if (n) setTimeout(() => runVi(n), 200);
  };
  try {
    const male = MALE.has(name);
    const [p, r] = VI_MOOD[mood] || [1.3, 1.25];
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    u.voice = viVoice(male);
    u.pitch = Math.min(2, male ? p * 0.72 : p);
    u.rate = r;
    u.onend = done; u.onerror = done;
    speechSynthesis.speak(u);
    setTimeout(done, 2500 + text.length * 110); // phòng khi trình duyệt không báo đọc xong
  } catch { done(); }
}
export function speakVi(name, text, mood) {
  if (!text || !voiceOn() || typeof speechSynthesis === "undefined") return;
  try { audio?.pause(); } catch {}
  const job = { name, text, mood };
  if (viBusy) { viNext = job; return; }
  runVi(job);
}
