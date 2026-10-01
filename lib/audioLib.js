"use client";
// Thư viện audio CỤC BỘ: người học tự chọn thư mục audio Marugoto trên máy mình.
// File chỉ được đọc trong trình duyệt — không bao giờ tải lên server.
// Mỗi bộ sách (A2-1, A2-2…) có một thư viện riêng, lưu thư mục riêng.
const DB = "teyvat_audio", STORE = "handles";
export const canPickDir = () => typeof window !== "undefined" && "showDirectoryPicker" in window;

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

// slot: khóa lưu thư mục trong IndexedDB · withDir: thêm khóa "thư mục/tên" (A2-2 có Katsudou/001.mp3 và Rikai/001.mp3 trùng tên)
export function createAudioLib({ slot, pickerId, withDir = false, trackPair = false }) {
  const files = new Map(); // khóa → File hoặc FileSystemFileHandle
  const subs = new Set();
  let count = 0;
  const emit = () => subs.forEach((f) => f(count));
  const put = (name, parent, h) => {
    count++;
    files.set(name, h);
    if (withDir && parent) files.set(`${parent}/${name}`, h);
    // tra theo số track của sách: "004_1_2_1[1].mp3" → "#004.mp3" (Học theo sách A2-1)
    const m = name.match(/^(\d{3})[_\-. ]/);
    if (m && !files.has(`#${m[1]}.mp3`)) files.set(`#${m[1]}.mp3`, h);
    // A2/B1: số track tính riêng trong từng thư mục Topic → "MarugotoPre-IntermediateMp3Topic1/#004.mp3"
    if (m && withDir && parent && !files.has(`${parent}/#${m[1]}.mp3`)) files.set(`${parent}/#${m[1]}.mp3`, h);
    // 中級1 (B1-1): số track dạng "Topic_số" (1_10) — lấy cặp số cuối trong tên file, bỏ số 0 đứng đầu → "#1_10.mp3"
    const p = trackPair && name.match(/(\d{1,2})[_-](\d{1,3})\D*\.mp3$/i);
    if (p) { const k = `#${+p[1]}_${+p[2]}.mp3`; if (!files.has(k)) files.set(k, h); }
    // テストの問題例 của 中級1: track "T_01" → "#T_01.mp3"
    const t = trackPair && name.match(/(?:^|[^a-z])T[_-]?(\d{1,2})\D*\.mp3$/i);
    if (t) { const k = `#T_${t[1].padStart(2, "0")}.mp3`; if (!files.has(k)) files.set(k, h); }
  };
  const reset = () => { files.clear(); count = 0; };

  async function saveHandle(h) {
    try { const db = await idb(); db.transaction(STORE, "readwrite").objectStore(STORE).put(h, slot); } catch {}
  }
  async function loadHandle() {
    try {
      const db = await idb();
      return await new Promise((res) => { const q = db.transaction(STORE).objectStore(STORE).get(slot); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); });
    } catch { return null; }
  }
  async function indexDir(dir, depth = 0) {
    for await (const [name, h] of dir.entries()) {
      if (h.kind === "file" && /\.mp3$/i.test(name)) put(name, dir.name, h);
      else if (h.kind === "directory" && depth < 3) await indexDir(h, depth + 1);
    }
  }
  const urls = new Map();
  let restoring = null;
  async function doRestore(ask) {
    const h = await loadHandle();
    if (!h) return 0;
    let p = await h.queryPermission?.({ mode: "read" });
    if (p !== "granted" && ask) p = await h.requestPermission?.({ mode: "read" });
    if (p === "granted") { reset(); await indexDir(h); emit(); }
    return count;
  }

  return {
    onAudioChange: (f) => { subs.add(f); return () => subs.delete(f); },
    audioCount: () => count,
    hasFile: (name) => files.has(name),
    canPickDir,
    // Chọn thư mục (Chrome/Edge) — lưu quyền truy cập để lần sau khỏi chọn lại
    async pickFolder() {
      const dir = await window.showDirectoryPicker({ id: pickerId, mode: "read" });
      reset(); await indexDir(dir); await saveHandle(dir); emit();
      return count;
    },
    // Trình duyệt khác: <input type="file" webkitdirectory>
    setFileList(list) {
      reset();
      for (const f of list) {
        if (!/\.mp3$/i.test(f.name)) continue;
        const parts = (f.webkitRelativePath || "").split("/");
        put(f.name, parts.length > 1 ? parts[parts.length - 2] : "", f);
      }
      emit();
      return count;
    },
    // Khôi phục thư mục đã chọn trước đó (nếu quyền còn hiệu lực)
    // Nhiều Player cùng gọi lúc mở trang → chỉ đọc thư mục một lần (hỏi quyền thì luôn chạy lại)
    restoreFolder(ask = false) {
      if (!ask) return (restoring ||= doRestore(false)).then(() => count);
      return doRestore(true).then(() => count);
    },
    hasSavedFolder: async () => !!(await loadHandle()),
    async audioUrl(name) {
      if (urls.has(name)) return urls.get(name);
      const x = files.get(name);
      if (!x) return null;
      const f = x.getFile ? await x.getFile() : x;
      const u = URL.createObjectURL(f);
      urls.set(name, u);
      return u;
    },
  };
}

// A2-1 (giữ nguyên khóa "dir" để người dùng cũ không phải chọn lại thư mục)
export const A21_AUDIO = createAudioLib({ slot: "dir", pickerId: "marugoto-audio" });
// A2-2: file tham chiếu dạng "Katsudou/004.mp3" hoặc "Rikai/004.mp3"
export const A22_AUDIO = createAudioLib({ slot: "dir-a22", pickerId: "marugoto-a22-audio", withDir: true });
// B1-1 (中級1): tra theo số track "1_10" của sách
export const B11_AUDIO = createAudioLib({ slot: "dir-b11", pickerId: "marugoto-b11-audio", trackPair: true });
// A2/B1: file tham chiếu dạng "MarugotoPre-IntermediateMp3Topic2/024_2_2_1[2]_tanaka_san.mp3"
export const AB1_AUDIO = createAudioLib({ slot: "dir-ab1", pickerId: "marugoto-ab1-audio", withDir: true });
// A1: tên file không trùng (Katsudou saNNN.mp3, Rikai scNNN.mp3)
export const A1_AUDIO = createAudioLib({ slot: "dir-a1", pickerId: "marugoto-a1-audio" });

// A2-1 Rikai (thư mục riêng) — A2-1 Katsudou dùng lại A21_AUDIO
export const A21R_AUDIO = createAudioLib({ slot: "dir-a21r", pickerId: "marugoto-a21r-audio" });
// Gộp nhiều thư viện: khóa "K/tên.mp3" → libs.K, "R/tên.mp3" → libs.R
export function combineAudioLibs(libs) {
  const split = (key) => { const i = key.indexOf("/"); return [libs[key.slice(0, i)], key.slice(i + 1)]; };
  return {
    onAudioChange: (f) => { const offs = Object.values(libs).map((l) => l.onAudioChange?.(f)); return () => offs.forEach((o) => o?.()); },
    restoreFolder: (ask) => Promise.all(Object.values(libs).map((l) => l.restoreFolder?.(ask))),
    hasFile: (key) => { const [l, n] = split(key); return !!l?.hasFile(n); },
    audioUrl: (key) => { const [l, n] = split(key); return l ? l.audioUrl(n) : null; },
  };
}
export const A21C_AUDIO = combineAudioLibs({ K: A21_AUDIO, R: A21R_AUDIO });

// Khóa không có audio sách (B1-2): luôn dùng giọng máy
export const NO_AUDIO = { hasFile: () => false, audioUrl: () => null };

export const { onAudioChange, audioCount, hasFile, pickFolder, setFileList, restoreFolder, hasSavedFolder, audioUrl } = A21_AUDIO;
