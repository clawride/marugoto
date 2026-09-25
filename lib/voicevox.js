"use client";
// Lồng tiếng VOICEVOX cho truyện nhân vật: mỗi người nói một giọng hợp tuổi & giới tính, đổi sắc thái theo cảm xúc (mood).
// Nguồn giọng: "online" (api.tts.quest — không cần cài gì) · "local" (VOICEVOX chạy trên máy) · "web" (giọng có sẵn của trình duyệt).
// Âm thanh đã tạo được lưu vào Cache Storage của trình duyệt → mỗi câu chỉ phải tạo một lần.
// Điều khoản VOICEVOX: phải ghi "VOICEVOX:<tên giọng>" ở nơi dùng giọng — xem voiceCredit().
import { speakLines, stopSpeak as stopWeb } from "@/lib/tts";
import { FAM, castOf, styleOf, tuneOf, voiceHash } from "@/lib/voiceCast";
export { FAM, GROUP, storyCast, castOf, voiceCredit, groupLabel } from "@/lib/voiceCast";


// ——— cài đặt riêng của máy (không đồng bộ lên hồ sơ) ———
const LS = { url: "vv_local_url", key: "vv_api_key" };
const lsGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
export const localUrl = () => (lsGet(LS.url, "http://127.0.0.1:50021") || "").trim().replace(/\/+$/, "");
export const setLocalUrl = (v) => { lsSet(LS.url, v); localIds = null; };
export const apiKey = () => (lsGet(LS.key, "") || "").trim();
export const setApiKey = (v) => lsSet(LS.key, v);

// ——— trạng thái (để giao diện hiện "đang tạo giọng…" / lỗi) ———
const subs = new Set();
let status = { busy: 0, err: "" };
const emit = (patch) => { status = { ...status, ...patch }; subs.forEach((f) => f(status)); };
export const onVoiceStatus = (f) => { subs.add(f); f(status); return () => subs.delete(f); };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchT(url, opt = {}, ms = 15000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opt, signal: ctl.signal }); } finally { clearTimeout(t); }
}

// ——— VOICEVOX trên máy ———
let localIds = null; // "tên|kiểu" → id (lấy từ /speakers để khớp đúng phiên bản VOICEVOX đang chạy)
async function localId(name, [style, id]) {
  if (!localIds) {
    localIds = fetchT(localUrl() + "/speakers", {}, 6000).then((r) => r.json()).then((sp) => {
      const m = new Map(); for (const s of sp) for (const st of s.styles) m.set(`${s.name}|${st.name}`, st.id); return m;
    }).catch((e) => { localIds = null; throw e; });
  }
  const m = await localIds;
  return m.get(`${name}|${style}`) ?? id;
}
async function synthLocal(c, mood, text, speed) {
  const b = localUrl(), f = FAM[c.fam], st = styleOf(c, mood), tn = tuneOf(c, mood, speed);
  const id = await localId(f.n, st);
  const qr = await fetchT(`${b}/audio_query?speaker=${id}&text=${encodeURIComponent(text)}`, { method: "POST" });
  if (!qr.ok) throw new Error(`VOICEVOX: audio_query ${qr.status}`);
  const q = await qr.json();
  Object.assign(q, { speedScale: tn.s, pitchScale: tn.p, intonationScale: tn.i, prePhonemeLength: 0.08, postPhonemeLength: 0.12 });
  const r = await fetchT(`${b}/synthesis?speaker=${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) }, 30000);
  if (!r.ok) throw new Error(`VOICEVOX: synthesis ${r.status}`);
  return r.blob();
}
export async function checkLocal() {
  try {
    const v = await fetchT(localUrl() + "/version", {}, 4000).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    localIds = null; await localId("", ["", 0]);
    return { ok: true, version: v };
  } catch {
    // kết nối được nhưng bị chặn CORS → yêu cầu "no-cors" vẫn thành công
    const alive = await fetchT(localUrl() + "/version", { mode: "no-cors" }, 4000).then(() => true, () => false);
    return { ok: false, alive };
  }
}

// ——— VOICEVOX online (api.tts.quest) — giới hạn ~1 yêu cầu / 2 giây nên xếp hàng, câu cần phát ngay được ưu tiên ———
const Q = []; let running = false, lastAt = 0;
const GAP = 1800;
function enqueueJob(fn, now) {
  let item;
  const promise = new Promise((resolve, reject) => {
    item = { fn, resolve, reject, now };
    if (now) Q.unshift(item);
    else {
      Q.push(item);
      const pre = Q.filter((j) => !j.now); // giữ tối đa 6 câu tạo trước, bỏ câu cũ nhất
      if (pre.length > 6) { const old = pre[0]; Q.splice(Q.indexOf(old), 1); old.reject(new Error("skip")); }
    }
    pump();
  });
  const bump = () => { const i = Q.indexOf(item); if (i > 0) { Q.splice(i, 1); item.now = true; Q.unshift(item); } };
  return { promise, bump };
}
async function pump() {
  if (running) return;
  running = true;
  while (Q.length) {
    const job = Q.shift();
    const w = lastAt + GAP - Date.now();
    if (w > 0) await sleep(w);
    try { job.resolve(await job.fn()); } catch (e) { job.reject(e); }
    lastAt = Date.now();
  }
  running = false;
}
// Bước 1 (bị giới hạn lượt, đi qua hàng đợi): gửi yêu cầu tạo giọng → nhận đường dẫn trạng thái / phát trực tiếp / tải về
async function requestOnline(id, text) {
  const k = apiKey();
  const url = `https://api.tts.quest/v3/voicevox/synthesis?speaker=${id}&text=${encodeURIComponent(text)}${k ? `&key=${encodeURIComponent(k)}` : ""}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetchT(url);
    let j = null; try { j = await r.json(); } catch {}
    if (r.status === 429 || (j && !j.success && j.retryAfter)) { lastAt = Date.now(); await sleep(((j?.retryAfter) || 3) * 1000 + 300); continue; }
    if (!j?.success) throw new Error(j?.errorMessage || `tts.quest lỗi ${r.status}`);
    return j;
  }
  throw new Error("VOICEVOX online đang quá tải, thử lại sau ít phút");
}
// Bước 2 (chạy song song, không tốn lượt): chờ tạo xong rồi tải file mp3 hoàn chỉnh
async function downloadOnline(j) {
  for (let i = 0; ; i++) {
    const s = await fetchT(j.audioStatusUrl, {}, 8000).then((x) => x.json()).catch(() => ({}));
    if (s.isAudioError) throw new Error("tts.quest không tạo được âm thanh");
    if (s.isAudioReady) break;
    if (i > 150) throw new Error("tts.quest phản hồi quá lâu");
    await sleep(600);
  }
  const a = await fetchT(j.mp3DownloadUrl, {}, 20000);
  if (!a.ok) throw new Error(`tts.quest tải âm thanh lỗi ${a.status}`);
  return a.blob();
}

// ——— bộ nhớ đệm: trong phiên (Promise) + Cache Storage (giữ qua các lần mở trang) ———
const CACHE = "vv-audio-v1";
const mem = new Map();
async function keyOf(engine, c, mood, text, speed) {
  const st = styleOf(c, mood), tn = engine === "local" ? tuneOf(c, mood, speed) : null;
  const raw = [engine, FAM[c.fam].n, st[0], tn ? `${tn.p.toFixed(3)},${tn.i.toFixed(3)},${tn.s.toFixed(3)}` : "", text].join("|");
  let h = raw;
  try { const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(raw)); h = [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""); } catch { h = encodeURIComponent(raw); }
  return `https://vv-cache.local/${engine}/${h}`;
}
// Trả về { full: Promise<url file hoàn chỉnh>, stream: Promise<url phát trực tiếp | null> }
async function audioFor(engine, c, mood, text, speed, now) {
  const k = await keyOf(engine, c, mood, text, speed);
  let job = mem.get(k);
  if (job && now && job.pending) job.bump?.(); // câu đang chờ trong hàng đợi (tạo trước) → cho lên đầu
  if (job) return job;
  job = { pending: true };
  const cached = (async () => { try { const cc = await caches.open(CACHE); const hit = await cc.match(k); return hit ? URL.createObjectURL(await hit.blob()) : null; } catch { return null; } })();
  const save = async (blob) => { try { const cc = await caches.open(CACHE); await cc.put(k, new Response(blob, { headers: { "Content-Type": blob.type || "audio/mpeg" } })); } catch {} return URL.createObjectURL(blob); };
  if (engine === "local") {
    job.stream = Promise.resolve(null);
    job.full = cached.then((u) => u || synthLocal(c, mood, text, speed).then(save));
  } else {
    const meta = cached.then((u) => {
      if (u) return null;
      const [, id] = styleOf(c, mood);
      const { promise, bump } = enqueueJob(() => requestOnline(id, text), now);
      job.bump = bump;
      return promise;
    });
    job.stream = meta.then((j) => j?.mp3StreamingUrl || null);
    job.full = cached.then((u) => u || meta.then((j) => downloadOnline(j)).then(save));
  }
  job.stream.catch(() => {});
  job.full.then(() => { job.done = true; }, () => mem.delete(k)).finally(() => { job.pending = false; });
  mem.set(k, job);
  if (mem.size > 150) mem.delete(mem.keys().next().value);
  return job;
}

// ——— lồng tiếng tạo sẵn (scripts/gen-voice.mjs → public/vn/voice): mỗi chương một file mp3, mục lục ghi vị trí từng câu ———
const packs = new Map(); // id truyện → Promise<Map voiceHash → { url, s: giây bắt đầu, d: độ dài }>
export function loadVoicePack(id) {
  if (!packs.has(id)) {
    packs.set(id, fetch(`/vn/voice/${id}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((man) => {
      const m = new Map();
      for (const e of Object.values(man)) for (const [h, [s, d]] of Object.entries(e.s || {})) m.set(h, { url: `/vn/voice/${id}/${e.f}?v=${e.v}`, s, d });
      return m;
    }));
  }
  return packs.get(id);
}
const sprites = new Map(); // url → <audio> (tải trước cả file của chương)
function spriteOf(url) {
  let a = sprites.get(url);
  if (!a) { a = new Audio(); a.preload = "auto"; a.src = url; sprites.set(url, a); }
  return a;
}
async function preOf(D, c, mood, text) {
  if (!D?.id) return null;
  return (await loadVoicePack(D.id)).get(voiceHash(c, mood, text)) || null;
}
// Tải trước file âm thanh tạo sẵn của các câu (gọi khi mở chương)
export async function warmVoice(lines, { D, set }) {
  if (!D?.id || set?.voice === "web") return;
  for (const l of lines) { const p = l?.text && (await preOf(D, castOf(l.sp, D, set?.trav), l.mood, l.text)); if (p) spriteOf(p.url); }
}
async function playSprite(p, rate, my) {
  const a = spriteOf(p.url);
  if (a.readyState < 1) {
    if (a.networkState !== a.NETWORK_LOADING) a.load();
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("tải file lồng tiếng quá lâu")), 5000);
      a.addEventListener("loadedmetadata", () => { clearTimeout(t); res(); }, { once: true });
      a.addEventListener("error", () => { clearTimeout(t); rej(new Error("không tải được file lồng tiếng")); }, { once: true });
    });
  }
  if (my !== seq) return;
  sprite = a;
  a.defaultPlaybackRate = rate; a.playbackRate = rate;
  a.currentTime = Math.max(0, p.s - 0.03);
  await a.play();
  await new Promise((res) => {
    const t = setTimeout(() => a.pause(), ((p.d + 0.1) / rate) * 1000);
    a.onpause = a.onended = () => { clearTimeout(t); res(); };
  });
}

// ——— phát ———
let audio = null, sprite = null, seq = 0;
export function stopVoice() { seq++; if (audio) audio.pause(); if (sprite) sprite.pause(); stopWeb(); }

// line: { text, sp, mood } · ctx: { D, set } (set = cài đặt truyện: voice, trav, vspeed)
export async function playVoice({ text, sp, mood }, { D, set }) {
  if (!text) return;
  stopVoice();
  const my = seq, c = castOf(sp, D, set?.trav), engine = set?.voice || "online", speed = +set?.vspeed || 1;
  const web = () => speakLines([{ sp, t: text, g: FAM[c.fam].g }], { rate: 0.95 * speed });
  if (engine === "web") return web();
  // có sẵn file lồng tiếng → phát ngay
  const pre = await preOf(D, c, mood, text);
  if (my !== seq) return;
  if (pre) {
    try { emit({ err: "" }); return await playSprite(pre, speed, my); }
    catch (e) { if (my !== seq || e?.name === "AbortError" || e?.name === "NotAllowedError") return; } // file lỗi → tạo giọng như bình thường
  }
  emit({ busy: status.busy + 1 });
  try {
    const job = await audioFor(engine, c, mood, text, speed, true);
    // file hoàn chỉnh có sẵn (đã lưu / đã tạo xong) → dùng luôn; chưa có → phát trực tiếp trong lúc đang tạo
    let url = job.done ? await job.full : await Promise.race([job.full, job.stream.then((s) => s || job.full)]);
    if (my !== seq) return;
    audio = audio || new Audio();
    const rate = engine === "online" ? speed : 1;
    audio.defaultPlaybackRate = rate; audio.src = url; audio.playbackRate = rate;
    emit({ err: "" });
    await audio.play();
    await new Promise((r) => { audio.onended = audio.onpause = r; });
  } catch (e) {
    if (my !== seq || e?.name === "AbortError" || e?.name === "NotAllowedError") return;
    emit({ err: engine === "local" ? "Không kết nối được VOICEVOX trên máy — tạm dùng giọng trình duyệt." : `${e.message || "VOICEVOX online lỗi"} — tạm dùng giọng trình duyệt.` });
    await web();
  } finally { emit({ busy: Math.max(0, status.busy - 1) }); }
}

// Tạo trước giọng cho các câu sắp tới (không phát)
export async function prefetchVoice(lines, { D, set }) {
  const engine = set?.voice || "online";
  if (engine === "web") return;
  const speed = +set?.vspeed || 1;
  for (const l of lines.slice(0, 4)) if (l?.text && !(await preOf(D, castOf(l.sp, D, set?.trav), l.mood, l.text))) audioFor(engine, castOf(l.sp, D, set?.trav), l.mood, l.text, speed, false).then((j) => { j.full.catch(() => {}); j.stream.catch(() => {}); }).catch(() => {});
}
