"use client";
// Thành phần dùng chung của truyện nhân vật: dòng thoại (Nhật · romaji · dịch), ngữ pháp kèm chỗ tham khảo trong Marugoto, cài đặt
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { TIERS, tierFromCerts, certsText, vnSettings, activeTier, loadGrammar, grammarHref } from "@/lib/vn";
import { speakLines, stopSpeak } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

export function useVN() {
  const { S, update } = useGame();
  const set = vnSettings(S);
  const tier = activeTier(S);
  const change = (patch) => update((s) => { s.vnSet = { ...vnSettings(s), ...patch }; });
  return { S, update, set, tier, maxTier: tierFromCerts(S), change };
}

export function useGrammar() {
  const [G, setG] = useState(null);
  useEffect(() => { let on = true; loadGrammar().then((g) => on && setG(g)); return () => { on = false; }; }, []);
  return G;
}

export const pick = (t, tier) => t?.[tier] || t?.[String(tier)] || t?.["1"] || t?.[1] || null;
export const say = (jp) => { stopSpeak(); speakLines([{ t: jp }], { rate: 0.9 }); };

// Một dòng thoại theo mức đang chọn; bật/tắt romaji và dịch theo cài đặt
export function Line({ t, g, tier, set, onGrammar, big = false }) {
  const x = pick(t, tier);
  if (!x) return null;
  const gs = (g?.[tier] || g?.[String(tier)] || []);
  return (
    <div className={`vnline ${big ? "big" : ""}`}>
      <div className="jp jpt">{x.jp}</div>
      {set.ro && <div className="ro">{x.ro}</div>}
      {set.vi && <div className="vi">{x.vi}</div>}
      {gs.length > 0 && onGrammar && (
        <div className="vngchips">{gs.map((id) => <button key={id} className="chip sm" onClick={(e) => { e.stopPropagation(); onGrammar(id); sfx.click(); }}>📘 {id.split("-")[0].toUpperCase()}</button>)}</div>
      )}
    </div>
  );
}

// Bảng giải thích một điểm ngữ pháp + chỗ học trong Marugoto
export function GrammarCard({ id, G, onClose }) {
  const g = G?.[id];
  if (!id) return null;
  return (
    <div className="vngpop" role="dialog" aria-label="Ngữ pháp" onClick={(e) => e.stopPropagation()}>
      <button className="vnx" onClick={onClose} aria-label="Đóng">✕</button>
      {!g ? <p>Đang tải…</p> : (
        <>
          <div className="vngpt jpt">{g[4]}</div>
          <div className="vngvi">{g[5]}</div>
          <p>{g[6]}</p>
          <Link href={grammarHref(g)} className="vngref" onClick={() => stopSpeak()}>📚 Học kỹ trong <b>{g[2]}</b>{g[3] ? ` — ${g[3]}` : ""} · phần Ngữ pháp ›</Link>
        </>
      )}
    </div>
  );
}

// Danh sách ngữ pháp của cả một đoạn (dùng cho Script)
export function GrammarList({ ids, G }) {
  if (!ids.length) return null;
  return (
    <ul className="vnglist">
      {ids.map((id) => { const g = G?.[id]; return g ? <li key={id}><b className="jpt">{g[4]}</b> — {g[5]} <Link href={grammarHref(g)}>{g[2]}</Link></li> : null; })}
    </ul>
  );
}

// Cài đặt: phiên âm, phụ đề, giọng đọc, mức ngôn ngữ (không vượt quá chứng chỉ)
export function VNSettings({ compact = false }) {
  const { S, set, tier, maxTier, change } = useVN();
  return (
    <div className={`panel vnset ${compact ? "compact" : ""}`}>
      <label className="vntog"><input type="checkbox" checked={set.ro} onChange={(e) => change({ ro: e.target.checked })} /> Phiên âm latinh</label>
      <label className="vntog"><input type="checkbox" checked={set.vi} onChange={(e) => change({ vi: e.target.checked })} /> Phụ đề tiếng Việt</label>
      <label className="vntog"><input type="checkbox" checked={set.tts} onChange={(e) => change({ tts: e.target.checked })} /> Tự đọc giọng Nhật</label>
      <div className="vntier">
        <span>Mức ngôn ngữ:</span>
        {[1, 2, 3].map((t) => (
          <button key={t} className={`chip sm ${tier === t ? "on" : ""}`} disabled={t > maxTier} title={t > maxTier ? `Cần ${TIERS[t].need}` : ""} onClick={() => change({ tier: t === maxTier ? 0 : t })}>
            {t > maxTier ? "🔒 " : ""}{TIERS[t].name} ({TIERS[t].short})
          </button>
        ))}
      </div>
      {!compact && <small className="vnhint">Nhân vật nói theo mức chứng chỉ cao nhất bạn đã đạt ({certsText(S)}). Muốn nghe mức khó hơn, hãy thi đỗ chứng chỉ ở các khóa học.</small>}
    </div>
  );
}
