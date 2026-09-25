"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/components/Game";
import { CHARS, WEAPONS, WTYPE_VI, charSplash, charIcon, weaponArt, weaponIcon } from "@/lib/genshin";
import { ELEM, TOPIC_EL, shuffle } from "@/lib/data";

const TABS = [["photo", "📷 Ảnh thật"], ["meme", "😂 Meme"], ["anime", "🎌 Anime"], ["genshin", "✨ Genshin"]];
const cache = new Map();

function genshinList(item) {
  const el = item.el || TOPIC_EL[item.t] || "anemo";
  const m = item.m.toLowerCase();
  // Từ liên quan vũ khí → ưu tiên ảnh vũ khí đúng loại
  const wt = /kiếm|dao/.test(m) ? [0, 1] : /cung|tên/.test(m) ? [3] : /giáo|thương|gậy/.test(m) ? [2] : /sách|phép/.test(m) ? [4] : null;
  const out = [];
  if (wt) shuffle(WEAPONS.filter((w) => wt.includes(w.wt) && w.rank >= 4)).slice(0, 6)
    .forEach((w) => out.push({ url: weaponArt(w), fb: weaponIcon(w), src: `Genshin Impact · ${w.vi} (${WTYPE_VI[w.wt]} ${w.rank}★)`, contain: true }));
  shuffle(CHARS.filter((c) => c.el === el)).concat(shuffle(CHARS.filter((c) => c.el !== el))).slice(0, 14)
    .forEach((c) => out.push({ url: charSplash(c), fb: charIcon(c), src: `Genshin Impact · ${c.vi} (Hệ ${ELEM[c.el].vi} · ${c.rank}★)`, splash: true }));
  return out;
}

function load(item, tab, ok) {
  const key = `${tab}|${item.w}|${tab === "photo" || tab === "genshin" ? "" : ok ? 1 : 0}`;
  if (!cache.has(key)) {
    const p = tab === "genshin"
      ? Promise.resolve({ items: genshinList(item) })
      : fetch(`/api/media?type=${tab}&w=${encodeURIComponent(item.w)}&ok=${ok ? 1 : 0}`).then((r) => r.json()).catch(() => ({ items: [] }));
    cache.set(key, p);
  }
  return cache.get(key);
}

// Tải trước ảnh của tab đang chọn khi câu hỏi vừa hiện
export function preloadMedia(item, tab) { if (tab === "photo") load(item, "photo", true); }

export default function MediaPanel({ item, ok }) {
  const { S, update } = useGame();
  const tab = S?.imgTab || "photo";
  const [list, setList] = useState(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const tries = useRef(0);

  useEffect(() => {
    let alive = true;
    setList(null); setLoaded(false); setFb(false); tries.current = 0;
    load(item, tab, ok).then((j) => {
      if (!alive) return;
      const items = j.items || [];
      setList(items); setQuery(j.query || "");
      setIdx(tab === "photo" ? Math.min(S?.pick[item.w] || 0, Math.max(items.length - 1, 0)) : 0);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.w, tab, ok]);

  const cur = list && list[idx];
  const next = () => { if (!list?.length) return; setLoaded(false); setFb(false); setIdx((i) => (i + 1) % list.length); };
  const onErr = () => {
    if (cur?.fb && !fb) { setFb(true); return; }
    if (++tries.current >= (list?.length || 0)) { setList([]); return; }
    next();
  };
  const onLoad = () => {
    setLoaded(true); tries.current = 0;
    if (tab === "photo" && S?.pick[item.w] !== idx) update((s) => { s.pick[item.w] = idx; });
  };

  return (
    <div>
      <div className="mtabs">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => update((s) => { s.imgTab = k; })}>{l}</button>)}
      </div>
      <div className="frame">
        <div className="inner">
          {(!loaded || !cur) && <div className={`ph ${list === null || (cur && !loaded) ? "load" : ""}`}>{list && !list.length ? item.w : ""}</div>}
          {cur && (
            <img key={`${cur.url}|${fb}`} src={fb ? cur.fb : cur.url} alt={item.m} onLoad={onLoad} onError={onErr}
              className={`${loaded ? "on" : ""} ${cur.contain || fb ? "contain" : ""} ${cur.splash && !fb ? "splash" : ""}`} referrerPolicy="no-referrer" />
          )}
        </div>
        <div className="cap">
          {list && !list.length ? "Không tìm thấy ảnh — thử tab khác" : cur ? `${cur.src} · ${idx + 1}/${list.length}${query ? ` · “${query}”` : ""}` : ""}
        </div>
        {list?.length > 1 && <button className="swap" onClick={next}>↻ Ảnh khác</button>}
      </div>
    </div>
  );
}
