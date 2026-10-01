// Tạo sẵn audio cho BÀI NGHE (kịch bản đọc bằng giọng máy) → mỗi kịch bản MỘT file mp3, mục lục public/listen/index.json
//   node --no-warnings scripts/gen-listen.mjs --dry                       (chỉ đếm số kịch bản / câu / ký tự)
//   node --no-warnings scripts/gen-listen.mjs --out D:/listen --limit 20   (thử 20 kịch bản đầu)
//   node --no-warnings scripts/gen-listen.mjs --out D:/listen              (tạo tất cả; chạy lại sẽ tiếp tục từ chỗ dừng)
// Cần VOICEVOX Engine đang chạy (mặc định http://127.0.0.1:50021) và ffmpeg.
// File mp3 chia vào các thư mục shard-1, shard-2… (mỗi shard ≤ 900 file, để tải lên mỗi GitHub Release `voice-listen-<n>`).
// Mục lục: { "<mã kịch bản>": [shard, tổng giây, giây bắt đầu của từng dòng…] } — mã tính bằng lib/listenKey.js (giống trình duyệt).
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { FAM, styleOf, tuneOf } from "../lib/voiceCast.js";
import { castLines, listenKey, LISTEN_SPEED } from "../lib/listenKey.js";
import { scriptLines, wordLines, notesLines, sampleLines } from "../lib/listenSources.js";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(`--${k}`);
const ENGINE = arg("engine", "http://127.0.0.1:50021").replace(/\/+$/, "");
const FFMPEG = arg("ffmpeg", "ffmpeg");
const BITRATE = arg("bitrate", "32k");
const LIMIT = +arg("limit", "0");
const PER_SHARD = 900;
const GAP = 0.5; // giây lặng giữa hai dòng
const PAUSE = +arg("pause", "0");
const MAXL = +arg("max-lines", "0"); // sau ngần này câu MỚI thì thoát (mã 75) để vòng lặp bên ngoài khởi động lại engine — GPU DirectML hay treo sau ~500 câu
let fresh = 0;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const OUT = path.resolve(arg("out", path.join(ROOT, ".tmp", "listen-out")));
const MAN = path.join(ROOT, "public", "listen", "index.json");

// ——— 1. gom kịch bản từ dữ liệu ———
const scripts = new Map(); // mã → { lines (đã phân giọng), src }
const add = (lines, src) => {
  const L = castLines(lines);
  if (!L.length) return;
  const k = listenKey(lines);
  if (!scripts.has(k)) scripts.set(k, { lines: L, src });
};
const isLine = (x) => x && typeof x === "object" && typeof x.t === "string";
function walk(o, src) {
  if (Array.isArray(o)) { o.forEach((x) => walk(x, src)); return; }
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o.tts) && o.tts.every(isLine)) add(o.tts, src);
  if (Array.isArray(o.lines) && o.lines.length && o.lines.every(isLine) && o.lines.some((l) => l.sp)) add(o.lines, src);
  if (Array.isArray(o.scripts)) for (const s of o.scripts) add(scriptLines(s), src);
  if (Array.isArray(o.script) && o.script.length && o.script.every((l) => l && (l.jp || l.kana))) add(sampleLines(o), src);
  if (Array.isArray(o.notes) && o.notesAudio) add(notesLines(o), src);
  if (o.words && Array.isArray(o.words.items) && o.words.items.length) add(wordLines(o), src);
  for (const k in o) walk(o[k], src);
}
const scan = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!["node_modules", "voice", "kanji"].includes(e.name)) scan(p); }
    else if (e.name.endsWith(".json")) { try { walk(JSON.parse(fs.readFileSync(p, "utf8")), path.relative(ROOT, p).replace(/\\/g, "/")); } catch { /* bỏ qua file không đọc được */ } }
  }
};
scan(path.join(ROOT, "data"));
scan(path.join(ROOT, "public", "book"));

const all = [...scripts.entries()];
const nLines = all.reduce((a, [, s]) => a + s.lines.length, 0), nChars = all.reduce((a, [, s]) => a + s.lines.reduce((b, l) => b + l.t.length, 0), 0);
const uniq = new Set(all.flatMap(([, s]) => s.lines.map((l) => `${l.fam}|${l.t}`)));
console.log(`Kịch bản: ${all.length} · dòng: ${nLines} (${uniq.size} dòng khác nhau) · ký tự: ${nChars}`);
const bySrc = {}; for (const [, s] of all) { const k = s.src.replace(/\/\d+\.json$/, "/N.json"); bySrc[k] = (bySrc[k] || 0) + 1; }
console.log(Object.entries(bySrc).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k}:${v}`).join("  "));
if (has("dry")) process.exit(0);

// ——— 2. tạo audio ———
const ids = new Map();
for (const s of await (await fetch(`${ENGINE}/speakers`)).json()) for (const st of s.styles) ids.set(`${s.name}|${st.name}`, st.id);
console.log(`VOICEVOX ${await (await fetch(`${ENGINE}/version`)).json()} · ${ids.size} giọng`);

const cache = path.join(OUT, "_pcm");
fs.mkdirSync(cache, { recursive: true });
const pcmOf = (wav) => { let p = 12; while (p < wav.length) { const id = wav.toString("ascii", p, p + 4), size = wav.readUInt32LE(p + 4); if (id === "data") return wav.subarray(p + 8, p + 8 + size); p += 8 + size + (size & 1); } throw new Error("WAV không có dữ liệu"); };
const wavOf = (pcm, rate = 24000) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };

async function synthOnce(fam, text) {
  const c = { fam, p: 0, i: 1, s: LISTEN_SPEED };
  const f = FAM[fam], [style, fallbackId] = styleOf(c, undefined), tn = tuneOf(c, undefined, 1);
  const id = ids.get(`${f.n}|${style}`) ?? fallbackId;
  const rq = await fetch(`${ENGINE}/audio_query?speaker=${id}&text=${encodeURIComponent(text)}`, { method: "POST" });
  if (!rq.ok) throw new Error(`audio_query ${rq.status}`);
  const q = await rq.json();
  Object.assign(q, { speedScale: tn.s, pitchScale: tn.p, intonationScale: tn.i, prePhonemeLength: 0.05, postPhonemeLength: 0.12, outputSamplingRate: 24000, outputStereo: false });
  const r = await fetch(`${ENGINE}/synthesis?speaker=${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
  if (!r.ok) throw new Error(`synthesis ${r.status}: ${text}`);
  return pcmOf(Buffer.from(await r.arrayBuffer()));
}
// engine bận / GPU trục trặc → thử lại; lỗi mãi thì dừng, chạy lại lệnh sẽ tiếp tục
async function synth(fam, text) {
  const file = path.join(cache, `${fam}-${Buffer.from(text).toString("base64url").slice(0, 80)}-${text.length}.pcm`);
  if (fs.existsSync(file)) return fs.readFileSync(file);
  for (let i = 1; ; i++) {
    try { const pcm = await synthOnce(fam, text); fs.writeFileSync(file, pcm); fresh++; if (PAUSE) await new Promise((r) => setTimeout(r, PAUSE)); return pcm; }
    catch (e) { if (i >= 4) throw e; console.log(`  ⚠ ${String(e.message).slice(0, 60)} — thử lại lần ${i}`); await new Promise((r) => setTimeout(r, 3000 * i)); }
  }
}

fs.mkdirSync(path.dirname(MAN), { recursive: true });
const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, "utf8")) : {};
const gap = Buffer.alloc(Math.round(GAP * 24000) * 2);
const todo = (LIMIT ? all.slice(0, LIMIT) : all);
const shardOf = (i) => Math.floor(i / PER_SHARD) + 1;
let made = 0, skipped = 0, secs = 0;
const t0 = Date.now();
for (const [i, [key, s]] of todo.entries()) {
  const shard = shardOf(i), dir = path.join(OUT, `shard-${shard}`);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${key}.mp3`);
  if (man[key] && fs.existsSync(out)) { skipped++; continue; }
  const parts = [], off = [];
  let at = 0;
  for (const [j, l] of s.lines.entries()) {
    const pcm = await synth(l.fam, l.t);
    const dur = pcm.length / 2 / 24000;
    off.push(+at.toFixed(2));
    parts.push(pcm);
    at += dur;
    if (j < s.lines.length - 1) { parts.push(gap); at += GAP; }
  }
  const tmp = path.join(os.tmpdir(), `listen-${key}.wav`);
  fs.writeFileSync(tmp, wavOf(Buffer.concat(parts)));
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", BITRATE, "-ar", "24000", "-ac", "1", out]);
  fs.unlinkSync(tmp);
  man[key] = [shard, +at.toFixed(2), ...off];
  made++; secs += at;
  if (MAXL && fresh >= MAXL) { fs.writeFileSync(MAN, JSON.stringify(man)); console.log(`Đã tạo ${fresh} câu mới — thoát để khởi động lại engine (tiếp tục sau)`); process.exit(75); }
  if (made % 10 === 0) { fs.writeFileSync(MAN, JSON.stringify(man)); }
  if (made % 25 === 0 || i === todo.length - 1) {
    const el = (Date.now() - t0) / 1000;
    console.log(`[${i + 1}/${todo.length}] tạo ${made}, bỏ qua ${skipped} · ${(secs / 60).toFixed(0)} phút âm thanh · ${(el / 60).toFixed(1)} phút · còn ~${((el / made) * (todo.length - i - 1) / 60).toFixed(0)} phút`);
  }
}
fs.writeFileSync(MAN, JSON.stringify(man));
console.log(`Xong: ${made} file mới, ${skipped} giữ nguyên. Mục lục: ${Object.keys(man).length} kịch bản → ${path.relative(ROOT, MAN)}. File mp3 ở ${OUT}`);
