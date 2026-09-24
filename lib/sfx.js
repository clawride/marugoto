// Âm thanh tự tổng hợp bằng Web Audio (không dùng file âm thanh gốc của game)
let ctx = null;
let enabled = true;

export function setSoundEnabled(v) { enabled = v; }

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, { t = 0, dur = 0.4, type = "sine", vol = 0.2, attack = 0.005, glide = null } = {}) {
  const c = ac(); if (!c || !enabled) return;
  const t0 = c.currentTime + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

// Tiếng chuông kiểu "bell": hài âm chồng lên nhau
function bell(freq, t = 0, dur = 1.4, vol = 0.12) {
  tone(freq, { t, dur, vol });
  tone(freq * 2.01, { t, dur: dur * 0.6, vol: vol * 0.45 });
  tone(freq * 3.02, { t, dur: dur * 0.35, vol: vol * 0.2 });
}

function noise({ t = 0, dur = 1.5, from = 400, to = 3000, vol = 0.18, q = 1.2 } = {}) {
  const c = ac(); if (!c || !enabled) return;
  const t0 = c.currentTime + t;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q;
  f.frequency.setValueAtTime(from, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0); src.stop(t0 + dur);
}

const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.5, G6: 1568, A6: 1760 };

export const sfx = {
  click() { tone(1400, { dur: 0.06, vol: 0.05, type: "triangle" }); },
  hover() { tone(2200, { dur: 0.04, vol: 0.02 }); },
  correct() { bell(N.E6, 0, 0.6, 0.1); bell(N.A6, 0.09, 0.9, 0.09); },
  wrong() { tone(330, { dur: 0.35, vol: 0.09, type: "triangle", glide: 220 }); tone(247, { t: 0.08, dur: 0.4, vol: 0.06, type: "sine", glide: 180 }); },
  primo() { [N.C6, N.E6, N.G6, N.C6 * 2].forEach((f, i) => tone(f, { t: i * 0.05, dur: 0.25, vol: 0.05 })); },
  page() { noise({ dur: 0.35, from: 1800, to: 5000, vol: 0.03, q: 0.8 }); },
  open() { bell(N.G5, 0, 0.7, 0.07); bell(N.D6, 0.07, 0.8, 0.06); },
  // Sao băng rơi — màu theo độ hiếm cao nhất
  meteor(rank) {
    noise({ dur: 2.6, from: 300, to: 4200, vol: 0.16, q: 0.9 });
    const chord = rank === 5 ? [N.C5, N.E5, N.G5, N.B5, N.D6] : rank === 4 ? [N.D5, N.G5, N.A5, N.D6] : [N.E5, N.A5, N.B5];
    chord.forEach((f, i) => bell(f, 1.6 + i * 0.08, 2.2, rank === 5 ? 0.09 : 0.07));
    if (rank === 5) [N.C6, N.E6, N.G6].forEach((f, i) => bell(f, 2.1 + i * 0.12, 2, 0.06));
  },
  star(i) { bell([N.C6, N.D6, N.E6, N.G6, N.A6][i % 5], 0, 0.8, 0.07); },
  reveal(rank) {
    noise({ dur: 0.7, from: 800, to: 6000, vol: rank >= 4 ? 0.08 : 0.05, q: 0.7 });
    if (rank === 5) { [N.C5, N.G5, N.C6, N.E6].forEach((f, i) => bell(f, i * 0.06, 2.4, 0.08)); }
    else if (rank === 4) { [N.D5, N.A5, N.D6].forEach((f, i) => bell(f, i * 0.06, 1.8, 0.07)); }
    else bell(N.A5, 0, 0.9, 0.05);
  },
  hit(crit) { noise({ dur: 0.18, from: 2500, to: 300, vol: crit ? 0.2 : 0.14, q: 0.8 }); tone(crit ? 180 : 220, { dur: 0.2, vol: 0.12, type: "square", glide: 70 }); if (crit) bell(N.E6, 0.05, 0.5, 0.06); },
  miss() { noise({ dur: 0.25, from: 600, to: 2400, vol: 0.05, q: 2 }); },
  win() { [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6].forEach((f, i) => bell(f, i * 0.09, 1.6, 0.07)); },
  summary() { [N.G5, N.C6, N.E6].forEach((f, i) => bell(f, i * 0.05, 1.2, 0.05)); },
};
