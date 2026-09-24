"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Đưa popup/hoạt cảnh ra thẳng <body> để luôn nằm trên header
export default function Portal({ children }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok ? createPortal(children, document.body) : null;
}
