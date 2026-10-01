"use client";
// Nhạc nền tiếng mưa rơi — tự tổng hợp bằng Web Audio (không dùng file âm thanh, không tốn băng thông, dùng được cả khi offline).
// Gồm: mưa đều (nhiễu lọc), mưa nặng hạt (trầm hơn), tiếng giọt lách tách ngẫu nhiên hai bên tai, thỉnh thoảng sấm xa.
// Trình duyệt chỉ cho phát tiếng sau lần chạm/bấm đầu tiên → startRainOnGesture() chờ cử chỉ đó rồi mới bật.

const KEY = "ambient_rain";
const VOL = 0.5;       // âm lượng nền (0..1)
const DUCK = 0.22;     // hạ xuống mức này (nhân với VOL) khi đang đọc giọng nhân vật

let ctx = null, master = null, started = false, enabled = true, duckN = 0, timers = [], nodes = [];
const subs = new Set();

export const rainEnabled = () => enabled;
export const onRain = (f) => { subs.add(f); return () => subs.delete(f); };
const emit = () => subs.forEach((f) => f(enabled));

try { enabled = localStorage.getItem(KEY) !== "0"; } catch {}

function noiseBuffer(c, secs) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate), d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0; // lọc hồng nhẹ cho đỡ chói
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22;
  }
  return buf;
}
const loopSrc = (c, buf, offset = 0) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, offset); nodes.push(s); return s; };
const filt = (c, type, freq, q) => { const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q; return f; };
const chain = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const buf = noiseBuffer(ctx, 9);

  // mưa đều: nhiễu lọc dải cao-trung
  const hiss = ctx.createGain(); hiss.gain.value = 0.55;
  chain(loopSrc(ctx, buf, 0), filt(ctx, "highpass", 700), filt(ctx, "lowpass", 8500), hiss).connect(master);
  // hạt nặng: dải trầm-trung
  const body = ctx.createGain(); body.gain.value = 0.5;
  chain(loopSrc(ctx, buf, 4.3), filt(ctx, "bandpass", 380, 0.6), body).connect(master);
  // cơn mưa lúc nặng lúc nhẹ: LFO rất chậm
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
  lfo.frequency.value = 0.07; lfoG.gain.value = 0.12; lfo.connect(lfoG); lfoG.connect(hiss.gain); lfo.start(); nodes.push(lfo);

  // giọt lách tách
  const drop = () => {
    if (!ctx || ctx.state !== "running" || document.hidden) return;
    const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    s.buffer = buf; f.type = "bandpass"; f.frequency.value = 1800 + Math.random() * 4200; f.Q.value = 4 + Math.random() * 6;
    const peak = 0.05 + Math.random() * 0.12, dur = 0.012 + Math.random() * 0.03;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (p) { p.pan.value = Math.random() * 2 - 1; chain(s, f, g, p).connect(master); } else chain(s, f, g).connect(master);
    s.start(t, Math.random() * 8, dur + 0.02);
  };
  timers.push(setInterval(() => { const n = 1 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) setTimeout(drop, Math.random() * 90); }, 110));

  // sấm xa thỉnh thoảng
  const thunder = () => {
    if (ctx && ctx.state === "running" && !document.hidden) {
      const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = buf; f.type = "lowpass"; f.frequency.value = 140;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 1.2); g.gain.linearRampToValueAtTime(0.18, t + 2.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
      chain(s, f, g).connect(master); s.start(t, Math.random() * 3, 6.2);
    }
    timers.push(setTimeout(thunder, 45000 + Math.random() * 60000));
  };
  timers.push(setTimeout(thunder, 30000 + Math.random() * 30000));
  return true;
}

const target = () => (enabled ? VOL * (duckN > 0 ? DUCK : 1) : 0);
function applyGain(secs = 0.6) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(target(), t + secs);
}

// Bật tiếng mưa (gọi sau một cử chỉ của người dùng)
export async function startRain() {
  if (!started) { try { started = build(); } catch { started = false; } }
  if (!started) return;
  try { await ctx.resume(); } catch {}
  applyGain(enabled ? 2.5 : 0.3);
}
export function setRain(on) {
  enabled = !!on;
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch {}
  if (on) startRain(); else applyGain(0.4);
  emit();
}
// Đang đọc giọng nhân vật → hạ tiếng mưa xuống cho dễ nghe (đếm lồng nhau)
export function duckRain(on) {
  duckN = Math.max(0, duckN + (on ? 1 : -1));
  applyGain(0.35);
}

let armed = false;
export function startRainOnGesture() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const go = () => { window.removeEventListener("pointerdown", go, true); window.removeEventListener("keydown", go, true); if (enabled) startRain(); else started = false; };
  window.addEventListener("pointerdown", go, true);
  window.addEventListener("keydown", go, true);
  // tab ẩn → tạm dừng cho đỡ tốn pin
  document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend?.(); else if (enabled) ctx.resume?.(); });
}
