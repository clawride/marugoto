"use client";
// Đọc lời thoại bằng giọng tiếng Nhật của trình duyệt (dùng khi không có file audio)
let token = 0;

const MALE = /ichiro|keita|takumi|kenji|daichi|naoki|shinji|male|男/i;
function jaVoices() {
  const all = typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  return all.filter((v) => /^ja/i.test(v.lang));
}
export const ttsAvailable = () => typeof window !== "undefined" && "speechSynthesis" in window;

export const hasJaVoice = () => jaVoices().length > 0;

export function stopSpeak() { token++; try { speechSynthesis.cancel(); } catch {} }

// lines: [{sp, t, g?}] — g: "m" | "f" (giới tính giọng); mỗi người nói một giọng/cao độ khác nhau
export async function speakLines(lines, { rate = 0.9, onLine } = {}) {
  if (!ttsAvailable()) return;
  stopSpeak();
  const my = ++token;
  if (!speechSynthesis.getVoices().length) await new Promise((r) => { speechSynthesis.onvoiceschanged = r; setTimeout(r, 800); });
  const vs = jaVoices();
  const males = vs.filter((v) => MALE.test(v.name)), females = vs.filter((v) => !MALE.test(v.name));
  const speakers = [...new Set(lines.map((l) => l.sp || "A"))];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (my !== token) return;
    onLine?.(i);
    await new Promise((res) => {
      const u = new SpeechSynthesisUtterance(l.t);
      u.lang = "ja-JP"; u.rate = rate;
      const k = speakers.indexOf(l.sp || "A");
      const pool = l.g === "m" ? (males.length ? males : vs) : l.g === "f" ? (females.length ? females : vs) : vs;
      if (pool.length) u.voice = pool[k % pool.length];
      // Không đủ giọng riêng → đổi cao độ để phân biệt người nói
      const sameVoice = l.g === "m" ? !males.length : l.g === "f" ? !females.length : vs.length < 2;
      u.pitch = sameVoice ? (l.g === "m" ? 0.75 : l.g === "f" ? 1.2 : k % 2 ? 0.8 : 1.15) : 1;
      u.onend = u.onerror = () => setTimeout(res, 280);
      speechSynthesis.speak(u);
    });
  }
  onLine?.(-1);
}
