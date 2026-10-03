"use client";
// Cấu hình trang (do trang quản trị điều chỉnh) + kiểm tra "tài khoản này có phải quản trị không" — chỉ để ẩn/hiện giao diện;
// quyền thật luôn được máy chủ kiểm lại ở /api/admin.
import { useEffect, useState } from "react";
import { SITE_DEFAULTS, normalizeSite } from "@/lib/siteCfg";

let cache = null, at = 0, inflight = null;
export function loadSite(force) {
  if (!force && cache && Date.now() - at < 30000) return Promise.resolve(cache);
  inflight ||= fetch("/api/site", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { cache = normalizeSite(j || SITE_DEFAULTS); at = Date.now(); return cache; })
    .catch(() => cache || SITE_DEFAULTS)
    .finally(() => { inflight = null; });
  return inflight;
}
export const dropSiteCache = () => { cache = null; at = 0; };

export function useSite() {
  const [s, set] = useState(cache || SITE_DEFAULTS);
  useEffect(() => { let on = true; loadSite().then((v) => on && set(v)); return () => { on = false; }; }, []);
  return s;
}

// → true / false / null (đang kiểm hoặc tiến độ chưa nạp xong). Truyền cả state S (không phải S.profile) để phân biệt
// "chưa nạp" với "không đăng nhập". Kết quả nhớ trong phiên làm việc theo hồ sơ.
export function useAdmin(S) {
  const profile = S?.profile;
  const k = !S ? null : profile?.id && profile?.token && profile?.username ? profile.id : "none";
  const [st, setSt] = useState({ k: null, v: null });
  useEffect(() => {
    if (!k) return;
    if (k === "none") { setSt({ k, v: false }); return; }
    const key = `adm_${k}`;
    try { const c = sessionStorage.getItem(key); if (c === "1" || c === "0") { setSt({ k, v: c === "1" }); return; } } catch {}
    let on = true;
    fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: profile.id, token: profile.token, action: "whoami" }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { const a = !!j?.admin; try { sessionStorage.setItem(key, a ? "1" : "0"); } catch {} if (on) setSt({ k, v: a }); })
      .catch(() => on && setSt({ k, v: false }));
    return () => { on = false; };
  }, [k, profile?.token]); // eslint-disable-line react-hooks/exhaustive-deps
  return st.k === k ? st.v : null;
}

export async function adminCall(profile, action, body = {}) {
  const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: profile?.id, token: profile?.token, action, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || (r.status === 404 ? "Không có quyền" : `Lỗi ${r.status}`));
  return j;
}
