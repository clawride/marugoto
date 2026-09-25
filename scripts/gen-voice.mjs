// Tạo sẵn file lồng tiếng VOICEVOX cho truyện nhân vật → public/vn/voice/<id>/c<chương>-t<mức>.mp3 + mục lục public/vn/voice/<id>.json
// Mỗi chương/mức là MỘT file mp3 ghép các câu (cách nhau khoảng lặng); mục lục ghi vị trí [giây bắt đầu, độ dài] của từng câu,
// khóa bằng voiceHash (giọng + kiểu + chỉnh âm + câu chữ) nên đổi phân vai hay sửa câu thì câu đó tự dùng lại giọng online cho tới khi tạo lại.
//
// Cần: VOICEVOX Engine đang chạy (mặc định http://127.0.0.1:50021) và ffmpeg.
//   node --no-warnings scripts/gen-voice.mjs --chapters 0 --tiers 1
//   node --no-warnings scripts/gen-voice.mjs --chapters 0-6 --tiers 1,2,3 --ids 10000030,10000029
// Tùy chọn: --engine URL · --ffmpeg đường-dẫn · --bitrate 32k · --out thư-mục · --force (tạo lại cả phần đã có)
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { castOf, styleOf, tuneOf, voiceHash, FAM } from "../lib/voiceCast.js";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const range = (s) => s.split(",").flatMap((p) => { const [a, b] = p.split("-").map(Number); return b >= a ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a]; });
const ENGINE = arg("engine", "http://127.0.0.1:50021").replace(/\/+$/, "");
const FFMPEG = arg("ffmpeg", "ffmpeg");
const BITRATE = arg("bitrate", "32k");
const CHAPTERS = range(arg("chapters", "0"));
const TIERS = range(arg("tiers", "1"));
const IDS = arg("ids", "") ? arg("ids").split(",").map(Number) : null;
const FORCE = process.argv.includes("--force");
const GAP = 0.35; // giây lặng giữa hai câu

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const VN = path.join(ROOT, "public", "vn");
const OUT = path.resolve(arg("out", path.join(VN, "voice")));
const pick = (t, tier) => t?.[tier] || t?.[String(tier)] || t?.["1"] || null;

// "tên|kiểu" → id của đúng phiên bản VOICEVOX đang chạy
const ids = new Map();
for (const s of await (await fetch(`${ENGINE}/speakers`)).json()) for (const st of s.styles) ids.set(`${s.name}|${st.name}`, st.id);
const engineVer = await (await fetch(`${ENGINE}/version`)).json();
console.log(`VOICEVOX ${engineVer} · ${ids.size} giọng · chương ${CHAPTERS.join(",")} · mức ${TIERS.join(",")}`);

// Thử lại khi VOICEVOX lỗi tạm thời (engine bận / GPU trục trặc); lỗi mãi thì dừng — chạy lại lệnh sẽ tiếp tục từ chỗ dừng
async function synth(c, mood, text) {
  for (let i = 1; ; i++) {
    try { return await synthOnce(c, mood, text); }
    catch (e) {
      if (i >= 4) throw e;
      console.log(`  ⚠ lỗi (${e.message.slice(0, 40)}…), thử lại lần ${i}`);
      await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
}
async function synthOnce(c, mood, text) {
  const f = FAM[c.fam], [style, fallbackId] = styleOf(c, mood), tn = tuneOf(c, mood, 1);
  const id = ids.get(`${f.n}|${style}`) ?? fallbackId;
  const q = await (await fetch(`${ENGINE}/audio_query?speaker=${id}&text=${encodeURIComponent(text)}`, { method: "POST" })).json();
  Object.assign(q, { speedScale: tn.s, pitchScale: tn.p, intonationScale: tn.i, prePhonemeLength: 0.05, postPhonemeLength: 0.1, outputSamplingRate: 24000, outputStereo: false });
  const r = await fetch(`${ENGINE}/synthesis?speaker=${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
  if (!r.ok) throw new Error(`synthesis ${r.status}: ${text}`);
  return pcmOf(Buffer.from(await r.arrayBuffer()));
}
// Lấy dữ liệu PCM 16-bit từ file WAV
function pcmOf(wav) {
  let p = 12;
  while (p < wav.length) {
    const id = wav.toString("ascii", p, p + 4), size = wav.readUInt32LE(p + 4);
    if (id === "data") return wav.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size & 1);
  }
  throw new Error("WAV không có dữ liệu");
}
function wavOf(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(VN).filter((f) => /^\d+\.json$/.test(f)).filter((f) => !IDS || IDS.includes(+f.slice(0, -5)));
let made = 0, skipped = 0, lines = 0, secs = 0;
const t0 = Date.now();
for (const [fi, file] of files.entries()) {
  const D = JSON.parse(fs.readFileSync(path.join(VN, file), "utf8"));
  const manPath = path.join(OUT, `${D.id}.json`);
  const man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, "utf8")) : {};
  for (const ch of CHAPTERS) {
    const C = D.chapters.find((x) => x.c === ch);
    if (!C) continue;
    for (const tier of TIERS) {
      // các câu cần đọc: mỗi câu theo giọng Lữ Khách nam và nữ (trùng mã thì chỉ tạo một lần)
      const want = [];
      const seen = new Set();
      for (const n of C.nodes) {
        const text = pick(n.t, tier)?.jp;
        if (!text) continue;
        for (const trav of ["m", "f"]) {
          const c = castOf(n.sp, D, trav), h = voiceHash(c, n.mood, text);
          if (!seen.has(h)) { seen.add(h); want.push({ h, c, mood: n.mood, text }); }
        }
      }
      const key = `c${ch}-t${tier}`, old = man[key];
      if (!FORCE && old && want.every((w) => old.s[w.h])) { skipped++; continue; }
      const parts = [], seg = {};
      const gap = Buffer.alloc(Math.round(GAP * 24000) * 2);
      let at = GAP;
      parts.push(gap);
      for (const w of want) {
        const pcm = await synth(w.c, w.mood, w.text);
        const dur = pcm.length / 2 / 24000;
        seg[w.h] = [+at.toFixed(3), +dur.toFixed(3)];
        parts.push(pcm, gap);
        at += dur + GAP;
        lines++; secs += dur;
      }
      fs.mkdirSync(path.join(OUT, String(D.id)), { recursive: true });
      const tmp = path.join(os.tmpdir(), `vv-${D.id}-${key}.wav`);
      const mp3 = path.join(OUT, String(D.id), `${key}.mp3`);
      fs.writeFileSync(tmp, wavOf(Buffer.concat(parts)));
      execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", BITRATE, "-ar", "24000", "-ac", "1", mp3]);
      fs.unlinkSync(tmp);
      const v = voiceHash({ fam: "zunda", p: 0, i: 1, s: 1 }, "", Object.keys(seg).join(",")).slice(0, 8);
      man[key] = { f: `${key}.mp3`, v, s: seg };
      fs.writeFileSync(manPath, JSON.stringify(man));
      made++;
    }
  }
  const el = (Date.now() - t0) / 1000;
  console.log(`[${fi + 1}/${files.length}] ${D.name} · đã tạo ${made} file, bỏ qua ${skipped} · ${lines} câu, ${(secs / 60).toFixed(1)} phút âm thanh · ${(el / 60).toFixed(1)} phút`);
}
console.log(`Xong: ${made} file mới, ${skipped} file giữ nguyên, ${lines} câu (${(secs / 3600).toFixed(2)} giờ âm thanh).`);
