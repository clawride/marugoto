// Giọng đọc tiếng Việt cho lời thoại boss ở game Đấu thẻ (Gemini TTS, giọng Hà Nội, có cảm xúc).
// GET /api/shiki/tts?t=<câu>&g=f|m&m=<tâm trạng> → audio/wav. Cùng câu + giọng thì CDN trả lại bản đã tạo.
// Trình duyệt nhiều máy (Chrome trên Windows…) không có giọng tiếng Việt nên phải đọc ở máy chủ.
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 30;

let ai = null;
const client = () => (ai ||= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
const MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts", "gemini-2.5-pro-preview-tts"];
let goodModel = null;
const VOICES = { f: ["Leda", "Zephyr", "Kore", "Aoede", "Callirrhoe"], m: ["Puck", "Fenrir", "Orus", "Charon"] };
const MOOD = {
  capture: "khoái chí, vênh váo, khiêu khích",
  win: "đắc thắng, cười cợt, mỉa mai",
  setback: "cay cú, ấm ức, hơi gắt",
  lose: "cay cú, ức chế, lèm bèm",
  tease: "trêu chọc, tinh nghịch, giục giã",
  opening: "tự tin, láo lếu, chào hỏi",
  draw: "hậm hực",
};

// giới hạn đơn giản theo IP (mỗi máy chủ) để không bị dùng tràn lan
const hits = new Map();
function limited(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  h.push(now); hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  return h.length > 40;
}

// PCM 16-bit mono 24 kHz → WAV
function wav(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

export async function GET(req) {
  const u = new URL(req.url);
  const text = (u.searchParams.get("t") || "").trim().slice(0, 220);
  const g = u.searchParams.get("g") === "m" ? "m" : "f";
  const vi = Math.abs(Number(u.searchParams.get("v")) || 0);
  const mood = MOOD[u.searchParams.get("m")] || "tinh nghịch, khiêu khích";
  if (!text) return new Response("missing text", { status: 400 });
  if (!process.env.GEMINI_API_KEY) return new Response("tts off", { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (limited(ip)) return new Response("slow down", { status: 429 });
  const voiceName = VOICES[g][vi % VOICES[g].length];
  const prompt = `Đọc câu sau bằng tiếng Việt, giọng Hà Nội (miền Bắc), tốc độ hơi nhanh, giọng điệu ${mood}, như nhân vật game đang trêu đối thủ. Chỉ đọc đúng câu, không thêm gì:\n${text}`;
  for (const model of goodModel ? [goodModel] : MODELS) {
    try {
      const r = await client().models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
      });
      const data = r?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
      if (!data) continue;
      goodModel = model;
      const rate = Number(/rate=(\d+)/.exec(data.mimeType || "")?.[1]) || 24000;
      return new Response(wav(Buffer.from(data.data, "base64"), rate), {
        headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
      });
    } catch (e) {
      if (goodModel) { goodModel = null; }
      if (/API key|PERMISSION|401|403/i.test(String(e?.message))) return new Response("tts unavailable", { status: 503 });
    }
  }
  return new Response("tts failed", { status: 502 });
}
