"use client";
// PWA: đăng ký /sw.js, tự cập nhật khi có bản build mới, và giữ lời mời cài ứng dụng cho nút "📲 Cài app" (components/Header.js)
// Cập nhật: kiểm tra bản mới khi mở trang, khi quay lại tab và mỗi 30 phút. SW mới tự kích hoạt (skipWaiting) → nếu tab đang ẩn
// thì tải lại ngay; đang xem thì hiện thông báo "Đã có phiên bản mới" kèm nút Tải lại (tự tải lại ở lần chuyển trang kế tiếp).
import { useEffect, useRef, useState } from "react";

const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";
let installEvt = null;
const subs = new Set();
const emit = () => subs.forEach((f) => f(!!installEvt));
// hook cho Header: có thể cài ngay không + hàm cài
export function usePwaInstall() {
  const [can, setCan] = useState(!!installEvt);
  useEffect(() => { subs.add(setCan); return () => subs.delete(setCan); }, []);
  const install = async () => {
    if (!installEvt) return false;
    installEvt.prompt();
    const r = await installEvt.userChoice.catch(() => null);
    installEvt = null; emit();
    return r?.outcome === "accepted";
  };
  return { can, install };
}

export default function PwaRegister() {
  const [fresh, setFresh] = useState(false);
  const freshRef = useRef(false); // đọc được trong trình xử lý sự kiện (state trong closure bị cũ)
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); installEvt = e; emit(); };
    const onInstalled = () => { installEvt = null; emit(); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (OFFLINE || !("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };

    let reg = null, hadController = !!navigator.serviceWorker.controller, reloading = false;
    const check = () => reg?.update().catch(() => {});
    const onChange = () => {
      if (!hadController) { hadController = true; return; } // lần đầu cài SW: không cần tải lại
      if (reloading) return;
      if (document.hidden) { reloading = true; location.reload(); } else { freshRef.current = true; setFresh(true); }
    };
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((r) => { reg = r; check(); }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    const onVis = () => { if (!document.hidden) check(); else if (freshRef.current && !reloading) { reloading = true; location.reload(); } };
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(check, 30 * 60 * 1000);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // đã có bản mới: chuyển trang kế tiếp sẽ tải bản mới luôn
  useEffect(() => {
    if (!fresh) return;
    const onClick = (e) => { const a = e.target.closest?.("a[href^='/']"); if (a && !a.target && !e.ctrlKey && !e.metaKey) { e.preventDefault(); location.href = a.getAttribute("href"); } };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [fresh]);

  if (!fresh) return null;
  return (
    <div className="pwafresh" role="status">
      <span>✨ Đã có phiên bản mới của trang</span>
      <button type="button" onClick={() => location.reload()}>Tải lại</button>
      <button type="button" className="x" aria-label="Để sau" onClick={() => { freshRef.current = false; setFresh(false); }}>✕</button>
    </div>
  );
}
