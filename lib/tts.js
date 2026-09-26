"use client";
// Đọc lời thoại bằng giọng tiếng Nhật của trình duyệt (dùng khi không có file audio)
// Bản offline: máy thường không có giọng tiếng Nhật của Windows (Chrome dùng giọng online của Google) → đọc bằng VOICEVOX trên máy qua /vvapi
let token = 0;
const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";

const MALE = /ichiro|keita|takumi|kenji|daichi|naoki|shinji|male|男/i;
function jaVoices() {
  const all = typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  return all.filter((v) => /^ja/i.test(v.lang));
}
export const ttsAvailable = () => typeof window !== "undefined" && (OFFLINE || "speechSynthesis" in window);

export const hasJaVoice = () => OFFLINE || jaVoices().length > 0;

let vvAudio = null;
export function stopSpeak() { token++; try { speechSynthesis.cancel(); } catch {} if (vvAudio) vvAudio.pause(); }

// ——— VOICEVOX trên máy (bản offline) ———
// giọng đọc bài học: nữ 冥鳴ひまり · 四国めたん · 春日部つむぎ, nam 玄野武宏 · 青山龍星 · 雀松朱司 (xen kẽ theo người nói)
const VV = { f: [14, 2, 8], m: [11, 13, 52], x: [14, 11, 2, 13] };
const vvCache = new Map();
function vvUrl(text, speaker, rate) {
  const k = `${speaker}|${rate}|${text}`;
  if (!vvCache.has(k)) {
    const p = (async () => {
      const q = await fetch(`/vvapi/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`, { method: "POST" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
      q.speedScale = rate / 0.9; q.prePhonemeLength = 0.05; q.postPhonemeLength = 0.1;
      const r = await fetch(`/vvapi/synthesis?speaker=${speaker}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
      if (!r.ok) throw new Error(r.status);
      return URL.createObjectURL(await r.blob());
    })();
    p.catch(() => vvCache.delete(k));
    vvCache.set(k, p);
  }
  return vvCache.get(k);
}
async function vvSay(text, speaker, rate, my) {
  const url = await vvUrl(text, speaker, rate);
  if (my !== token) return;
  vvAudio = vvAudio || new Audio();
  vvAudio.src = url;
  await vvAudio.play();
  await new Promise((r) => { vvAudio.onended = vvAudio.onpause = r; });
}

// lines: [{sp, t, g?}] — g: "m" | "f" (giới tính giọng); mỗi người nói một giọng/cao độ khác nhau
export async function speakLines(lines, { rate = 0.9, onLine } = {}) {
  if (!ttsAvailable()) return;
  stopSpeak();
  const my = ++token;
  const speakers = [...new Set(lines.map((l) => l.sp || "A"))];
  if (OFFLINE) {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (my !== token) return;
      onLine?.(i);
      const pool = VV[l.g === "m" || l.g === "f" ? l.g : "x"], k = speakers.indexOf(l.sp || "A");
      try { await vvSay(l.t, pool[k % pool.length], rate, my); } catch { if (my !== token) return; }
      // tạo trước câu kế tiếp trong lúc câu này đang đọc
      if (my === token && lines[i + 1]) { const n = lines[i + 1], np = VV[n.g === "m" || n.g === "f" ? n.g : "x"]; vvUrl(n.t, np[speakers.indexOf(n.sp || "A") % np.length], rate).catch(() => {}); }
      await new Promise((r) => setTimeout(r, 200));
    }
    onLine?.(-1);
    return;
  }
  if (!speechSynthesis.getVoices().length) await new Promise((r) => { speechSynthesis.onvoiceschanged = r; setTimeout(r, 800); });
  const vs = jaVoices();
  const males = vs.filter((v) => MALE.test(v.name)), females = vs.filter((v) => !MALE.test(v.name));
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
