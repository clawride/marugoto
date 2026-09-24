"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { BANNER_INFO } from "@/lib/gacha";
import { itemOf, iconOf, WTYPE_VI } from "@/lib/genshin";

const PER = 15;

export default function HistoryPage() {
  const { S } = useGame();
  const [bid, setBid] = useState("char");
  const [page, setPage] = useState(0);
  const rows = useMemo(() => (S?.history || []).filter((h) => h.b === bid), [S, bid]);
  if (!S) return null;
  const st = S.banners[bid];
  const fives = rows.filter((h) => h.r === 5);
  const fours = rows.filter((h) => h.r === 4).length;
  const avg = fives.length ? (fives.reduce((a, h) => a + h.p, 0) / fives.length).toFixed(1) : "—";
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const view = rows.slice(page * PER, page * PER + PER);
  return (
    <>
      <Link href="/wish" className="back">‹ Về Cầu Nguyện</Link>
      <div className="pagehead" style={{ marginTop: 10 }}><h1>Lịch Sử Cầu Nguyện</h1><div className="orn"><span /></div></div>
      <div className="chips" style={{ marginBottom: 16 }}>
        {Object.entries(BANNER_INFO).map(([k, b]) => <button key={k} className={`chip dk ${bid === k ? "on" : ""}`} onClick={() => { setBid(k); setPage(0); }}>{b.name}</button>)}
      </div>
      <div className="stats">
        <div className="panel stat"><b>{rows.length}</b><span>Tổng số lần</span></div>
        <div className="panel stat"><b>{fives.length}</b><span>Số 5★</span></div>
        <div className="panel stat"><b>{fours}</b><span>Số 4★</span></div>
        <div className="panel stat"><b>{avg}</b><span>Bảo hiểm TB mỗi 5★</span></div>
        <div className="panel stat"><b>{st.p5}</b><span>Bảo hiểm 5★ hiện tại</span></div>
      </div>
      {fives.length > 0 && (
        <div className="panel" style={{ padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--gold)" }}>Các lần ra 5★ (số lần quay để ra)</div>
          <div className="fivelist">
            {fives.map((h, k) => { const it = itemOf(h.k); return it && <span key={k} title={it.vi}><img src={iconOf(it)} alt="" />{it.vi} <b className={h.p <= 50 ? "lo" : h.p >= 75 ? "hi" : ""}>{h.p}</b></span>; })}
          </div>
        </div>
      )}
      <div className="parch" style={{ padding: 12, overflowX: "auto" }}>
        <table className="htable">
          <thead><tr><th>Loại vật phẩm</th><th>Tên vật phẩm</th><th>Bảo hiểm</th><th>Thời gian</th></tr></thead>
          <tbody>
            {view.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 20 }}>Chưa có lịch sử.</td></tr>}
            {view.map((h, k) => {
              const it = itemOf(h.k);
              if (!it) return null;
              return (
                <tr key={k}>
                  <td>{it.kind === "c" ? "Nhân vật" : `Vũ khí · ${WTYPE_VI[it.wt]}`}</td>
                  <td className={`r${h.r}`}>{it.vi} ({h.r}★){h.f?.includes("radiance") && <span className="tag">Ánh Sáng Bắt Giữ</span>}{h.f?.includes("lost5050") && <span className="tag">Lệch 50/50</span>}</td>
                  <td>{h.r >= 4 ? h.p : ""}</td>
                  <td>{new Date(h.t).toLocaleString("vi-VN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pager">
          <button className="chip" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
          <span>{page + 1} / {pages}</span>
          <button className="chip" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>›</button>
        </div>
      </div>
    </>
  );
}
