"use client";
// Đọc lời thoại bằng giọng tiếng Nhật của trình duyệt (dùng khi không có file audio)
let token = 0;

function jaVoices() {
  const all = typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  return all.filter((v) => /^ja/i.test(v.lang));
}
export const ttsAvailable = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function stopSpeak() { token++; try { speechSynthesis.cancel(); } catch {} }

// lines: [{sp, t}] — mỗi người nói một giọng/cao độ khác nhau
export async function speakLines(lines, { rate = 0.9 } = {}) {
  if (!ttsAvailable()) return;
  stopSpeak();
  const my = ++token;
  if (!speechSynthesis.getVoices().length) await new Promise((r) => { speechSynthesis.onvoiceschanged = r; setTimeout(r, 800); });
  const vs = jaVoices();
  const speakers = [...new Set(lines.map((l) => l.sp || "A"))];
  for (const l of lines) {
    if (my !== token) return;
    await new Promise((res) => {
      const u = new SpeechSynthesisUtterance(l.t);
      u.lang = "ja-JP"; u.rate = rate;
      const k = speakers.indexOf(l.sp || "A");
      if (vs.length) u.voice = vs[k % vs.length];
      u.pitch = vs.length > 1 ? 1 : k % 2 ? 0.8 : 1.15;
      u.onend = u.onerror = () => setTimeout(res, 250);
      speechSynthesis.speak(u);
    });
  }
}
