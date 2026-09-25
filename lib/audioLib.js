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
export function createAudioLib({ slot, pickerId, withDir = false }) {
  const files = new Map(); // khóa → File hoặc FileSystemFileHandle
  const subs = new Set();
  let count = 0;
  const emit = () => subs.forEach((f) => f(count));
  const put = (name, parent, h) => {
    count++;
    files.set(name, h);
    if (withDir && parent) files.set(`${parent}/${name}`, h);
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
    async restoreFolder(ask = false) {
      const h = await loadHandle();
      if (!h) return 0;
      let p = await h.queryPermission?.({ mode: "read" });
      if (p !== "granted" && ask) p = await h.requestPermission?.({ mode: "read" });
      if (p === "granted") { reset(); await indexDir(h); emit(); }
      return count;
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
// A2/B1: file tham chiếu dạng "MarugotoPre-IntermediateMp3Topic2/024_2_2_1[2]_tanaka_san.mp3"
export const AB1_AUDIO = createAudioLib({ slot: "dir-ab1", pickerId: "marugoto-ab1-audio", withDir: true });
// A1: tên file không trùng (Katsudou saNNN.mp3, Rikai scNNN.mp3)
export const A1_AUDIO = createAudioLib({ slot: "dir-a1", pickerId: "marugoto-a1-audio" });

export const { onAudioChange, audioCount, hasFile, pickFolder, setFileList, restoreFolder, hasSavedFolder, audioUrl } = A21_AUDIO;
