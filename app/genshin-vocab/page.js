"use client";
// Bảng tra cứu "Từ vựng thêm có trong Genshin Impact": mọi từ KHÔNG có trong Marugoto gặp trong truyện & trò chuyện nhân vật
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadGenshinVocab, topicsOf, bookTotal } from "@/lib/notebook";
import GenshinVocabTable from "@/components/GenshinVocab";
import { sfx } from "@/lib/sfx";

export default function GenshinVocabPage() {
  const [D, setD] = useState(null);
  const [err, setErr] = useState(false);
  const [who, setWho] = useState("");
  useEffect(() => { loadGenshinVocab().then(setD).catch(() => setErr(true)); }, []);
  const topics = topicsOf("gi");
  const rows = useMemo(() => {
    if (!D) return [];
    const T = new Map(topics.map((t) => [t.id, t]));
    const where = new Map(); // id từ → các nhân vật có từ đó
    for (const x of D.C) {
      const t = T.get(`gi-${x.c}`);
      if (who && t?.id !== who) continue;
      for (const [, ids] of x.s) for (const id of ids) { if (!where.has(id)) where.set(id, []); where.get(id).push({ label: t?.vi || x.c, href: `/topic/${t?.id}` }); }
    }
    return [...where].map(([id, tags]) => { const [w, r, m, ro] = D.W[id]; return { w, r, m, ro, tags }; })
      .sort((a, b) => b.tags.length - a.tags.length || a.r.localeCompare(b.r, "ja"));
  }, [D, who]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Link href="/#sotay" className="back" onClick={() => sfx.page()}>‹ Về Sổ Tay</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>SỔ TAY TỪ VỰNG · GENSHIN IMPACT</p>
        <h1>✨ Từ vựng thêm có trong Genshin Impact</h1>
        <p>{bookTotal("gi").toLocaleString("vi-VN")} từ không có trong giáo trình Marugoto, gặp trong truyện & trò chuyện của {topics.length} nhân vật. Từ gặp ở nhiều nhân vật được xếp lên trước.</p>
        <div className="orn"><span /></div>
      </div>
      {err && <p className="panel" style={{ textAlign: "center" }}>Không tải được bảng từ vựng. Hãy kiểm tra mạng rồi tải lại trang.</p>}
      {!D && !err && <p className="hint" style={{ textAlign: "center" }}>Đang tải bảng từ vựng…</p>}
      {D && (
        <GenshinVocabTable rows={rows} tagHead="Gặp trong truyện của"
          extra={<select className="gvsel" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">Tất cả nhân vật</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.char?.rank}★ {t.vi}</option>)}
          </select>} />
      )}
    </>
  );
}
