"use client";
// Đồng bộ tiến độ học của tài khoản lên đám mây (POST /api/save). Chỉ tài khoản có username mới đồng bộ.
// Mỗi máy nhớ "bản đã đồng bộ gần nhất" (rev + dấu vân tay) trong localStorage để biết máy này hay đám mây đã đổi.

const META = (id) => `cloud_meta_v1:${id}`;
export const getMeta = (id) => { try { return JSON.parse(localStorage.getItem(META(id))) || null; } catch { return null; } };
export const setMeta = (id, m) => { try { localStorage.setItem(META(id), JSON.stringify(m)); } catch {} };

// Bỏ phần chỉ thuộc về máy này (hồ sơ + token đăng nhập, cờ đồng bộ bảng xếp hạng)
export function strip(S) {
  const x = { ...S };
  for (const k of ["profile", "profileSkip", "syncSig", "gamblePending"]) delete x[k];
  return x;
}
export function hashOf(obj) { // djb2 trên chuỗi JSON — đủ để biết "có đổi hay không"
  const s = JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h}`;
}
// Máy này đã học được gì chưa (để quyết định có cần hỏi khi đăng nhập vào tài khoản đã có tiến độ)
export function hasProgress(S) {
  if (!S) return false;
  if ((S.total || 0) > 0 || (S.wishes || 0) > 0) return true;
  return ["best", "b1", "a22", "ab1", "a1", "a21", "b12", "vn", "kanji", "kana", "boss", "bossPct", "listenPct", "inv"].some((k) => Object.keys(S[k] || {}).length > 0);
}
export const summary = (d) => `${(d?.total || 0).toLocaleString("vi-VN")} câu đúng · ${Object.keys(d?.best || {}).length} bài hoàn thành · ${(d?.primo ?? 0).toLocaleString("vi-VN")} Nguyên Thạch`;

export async function cloud(profile, op, extra = {}) {
  const r = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: profile.id, token: profile.token, op, ...extra }) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, ...j };
}

// Trạng thái để hiện trong hộp thoại hồ sơ
let status = { state: "idle", at: 0 };
const subs = new Set();
export const setCloudStatus = (patch) => { status = { ...status, ...patch }; subs.forEach((f) => f(status)); };
export const onCloudStatus = (f) => { subs.add(f); f(status); return () => subs.delete(f); };
