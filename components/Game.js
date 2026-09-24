"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { newBannerState } from "@/lib/gacha";
import { setSoundEnabled, sfx } from "@/lib/sfx";

const KEY = "teyvat_b11_v2";
const HISTORY_MAX = 3000;

const defaults = () => ({
  primo: 1600, // quà tân thủ
  total: 0,
  best: {},
  pick: {},
  showKana: true,
  lastN: 20,
  imgTab: "photo",
  sound: true,
  fates: { i: 0, a: 10 }, // i = Mối Duyên Vương Vấn (sự kiện), a = Mối Duyên Tương Ngộ (thường trú)
  glitter: 0,
  dust: 0,
  dustShop: { m: "", n: 0 },
  banners: newBannerState(),
  inv: {},
  history: [],
  wishes: 0,
});

const Ctx = createContext(null);

export function GameProvider({ children }) {
  const [S, setS] = useState(null);
  const ref = useRef(null);
  const [toastMsg, setToast] = useState(null);

  useEffect(() => {
    let s = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        s = { ...s, ...p, fates: { ...s.fates, ...p.fates }, banners: { ...s.banners, ...p.banners } };
      }
    } catch {}
    ref.current = s;
    setS(s);
    setSoundEnabled(s.sound);
  }, []);

  // Chạy fn trên bản sao state (chỉ 1 lần — an toàn cho logic ngẫu nhiên), lưu và trả về kết quả của fn
  const update = useCallback((fn) => {
    const next = structuredClone(ref.current);
    const ret = fn(next);
    if (next.history.length > HISTORY_MAX) next.history.length = HISTORY_MAX;
    ref.current = next;
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return ret;
  }, []);

  const toast = useCallback((m) => { setToast(m); setTimeout(() => setToast(null), 2400); }, []);

  const toggleSound = useCallback(() => {
    update((s) => { s.sound = !s.sound; setSoundEnabled(s.sound); });
    sfx.click();
  }, [update]);

  return (
    <Ctx.Provider value={{ S, update, toast, toggleSound }}>
      {children}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </Ctx.Provider>
  );
}

export const useGame = () => useContext(Ctx);
