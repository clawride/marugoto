"use client";
// Giao diện: "game" (mặc định, phong cách Genshin) hoặc "plain" (giao diện học tập cơ bản: nền sáng, không ảnh anime)
// Lưu trong localStorage (theo từng máy/trình duyệt); áp dụng bằng <html data-ui="plain"> — script trong layout đặt sẵn trước khi vẽ trang.
import { useEffect, useState } from "react";

const KEY = "ui_theme";

export const getUITheme = () => (typeof document !== "undefined" && document.documentElement.dataset.ui === "plain" ? "plain" : "game");
export function setUITheme(t) {
  const el = document.documentElement;
  if (t === "plain") el.dataset.ui = "plain"; else delete el.dataset.ui;
  try { localStorage.setItem(KEY, t); } catch {}
  window.dispatchEvent(new CustomEvent("ui-theme", { detail: t }));
}
export function useUITheme() {
  const [t, setT] = useState("game");
  useEffect(() => {
    setT(getUITheme());
    const on = (e) => setT(e.detail);
    window.addEventListener("ui-theme", on);
    return () => window.removeEventListener("ui-theme", on);
  }, []);
  return t;
}
