"use client";
// Thư viện audio CỤC BỘ: người học tự chọn thư mục audio Marugoto trên máy mình.
// File chỉ được đọc trong trình duyệt — không bao giờ tải lên server.
const DB = "teyvat_audio", STORE = "handles";
const files = new Map(); // tên file → File hoặc FileSystemFileHandle
const subs = new Set();
const emit = () => subs.forEach((f) => f(files.size));
export const onAudioChange = (f) => { subs.add(f); return () => subs.delete(f); };
export const audioCount = () => files.size;
export const hasFile = (name) => files.has(name);
export const canPickDir = () => typeof window !== "undefined" && "showDirectoryPicker" in window;

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function saveHandle(h) {
  try { const db = await idb(); db.transaction(STORE, "readwrite").objectStore(STORE).put(h, "dir"); } catch {}
}
async function loadHandle() {
  try {
    const db = await idb();
    return await new Promise((res) => { const q = db.transaction(STORE).objectStore(STORE).get("dir"); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); });
  } catch { return null; }
}
async function indexDir(dir, depth = 0) {
  for await (const [name, h] of dir.entries()) {
    if (h.kind === "file" && /\.mp3$/i.test(name)) files.set(name, h);
    else if (h.kind === "directory" && depth < 2) await indexDir(h, depth + 1);
  }
}

// Chọn thư mục (Chrome/Edge) — lưu quyền truy cập để lần sau khỏi chọn lại
export async function pickFolder() {
  const dir = await window.showDirectoryPicker({ id: "marugoto-audio", mode: "read" });
  files.clear(); await indexDir(dir); await saveHandle(dir); emit();
  return files.size;
}
// Trình duyệt khác: <input type="file" webkitdirectory>
export function setFileList(list) {
  files.clear();
  for (const f of list) if (/\.mp3$/i.test(f.name)) files.set(f.name, f);
  emit();
  return files.size;
}
// Khôi phục thư mục đã chọn trước đó (nếu quyền còn hiệu lực)
export async function restoreFolder(ask = false) {
  const h = await loadHandle();
  if (!h) return 0;
  let p = await h.queryPermission?.({ mode: "read" });
  if (p !== "granted" && ask) p = await h.requestPermission?.({ mode: "read" });
  if (p === "granted") { files.clear(); await indexDir(h); emit(); }
  return files.size;
}
export const hasSavedFolder = async () => !!(await loadHandle());

const urls = new Map();
export async function audioUrl(name) {
  if (urls.has(name)) return urls.get(name);
  const x = files.get(name);
  if (!x) return null;
  const f = x.getFile ? await x.getFile() : x;
  const u = URL.createObjectURL(f);
  urls.set(name, u);
  return u;
}
