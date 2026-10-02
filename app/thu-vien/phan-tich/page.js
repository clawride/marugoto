"use client";
// 🔍 Đọc & Phân tích: dán đoạn tiếng Nhật → /api/analyze (Gemini) → từng câu có furigana, Latinh, dịch, tách từ, ngữ pháp.
// Lịch sử phân tích chỉ lưu trên máy người dùng (localStorage), không gửi đi đâu khác.
import { useEffect, useState } from "react";
import Link from "next/link";
import Sentence, { ViewBar } from "@/components/library/Sentence";
import { speakLines, stopSpeak } from "@/lib/tts";
import { sfx } from "@/lib/sfx";

const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";
const MAX = 600;
const HKEY = "lib_analyze";
const HMAX = 30;
const SAMPLE = "お疲れさまです。昨日ご依頼いただいた画面の修正ですが、本日中に対応できる見込みです。念のため、修正後の画面を共有させていただきますので、ご確認いただけますでしょうか。";

const readH = () => { try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { return []; } };
const writeH = (h) => { try { localStorage.setItem(HKEY, JSON.stringify(h.slice(0, HMAX))); } catch {} };

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [res, setRes] = useState(null); // { text, sentences, t }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hist, setHist] = useState([]);
  const [playing, setPlaying] = useState(-1);
  useEffect(() => { setHist(readH()); return () => stopSpeak(); }, []);

  const len = [...text].length;
  const run = async () => {
    const t = text.trim();
    if (!t || busy) return;
    if ([...t].length > MAX) return setErr(`Mỗi lần tối đa ${MAX} ký tự — hãy chia nhỏ đoạn văn.`);
    // đã phân tích đoạn này rồi → mở lại từ lịch sử, không tốn lượt
    const old = readH().find((h) => h.text === t);
    if (old) { setRes(old); setErr(""); return; }
    setBusy(true); setErr(""); sfx.click();
    try {
      const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Có lỗi khi phân tích, hãy thử lại");
      const item = { text: t, sentences: d.sentences, t: Date.now() };
      setRes(item);
      const h = [item, ...readH().filter((x) => x.text !== t)];
      writeH(h); setHist(h.slice(0, HMAX));
    } catch (e) {
      setErr(e.message || "Có lỗi khi phân tích, hãy thử lại");
    } finally { setBusy(false); }
  };
  const playAll = async () => {
    if (playing >= 0) { stopSpeak(); setPlaying(-1); return; }
    setPlaying(0);
    await speakLines(res.sentences.map((s) => ({ t: s.jp })), { rate: 0.9, onLine: (i) => setPlaying(i) });
    setPlaying(-1);
  };
  const remove = (t) => { const h = readH().filter((x) => x.t !== t); writeH(h); setHist(h); };

  return (
    <>
      <Link href="/thu-vien" className="back" onClick={() => sfx.page()}>‹ Thư viện sách</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }} className="jpt">文章分析</p>
        <h1>🔍 Đọc &amp; Phân Tích</h1>
        <p>Dán một đoạn tiếng Nhật → mỗi câu có furigana, phiên âm Latinh, bản dịch tiếng Việt, tách từ kèm nghĩa và giải thích ngữ pháp</p>
        <div className="orn"><span /></div>
      </div>

      {OFFLINE ? (
        <p className="panel lbsec" style={{ textAlign: "center" }}>Công cụ này cần kết nối máy chủ trực tuyến — hãy dùng ở trang web <b>tiengnhat.online</b>.</p>
      ) : <>
        <div className="panel lbsec lbinput">
          <textarea className="jpt" value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={MAX * 2}
            placeholder="Dán đoạn tiếng Nhật vào đây… (ví dụ một đoạn hội thoại trong sách bạn đang đọc, email của khách hàng, tài liệu dự án)"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }} />
          <div className="lbinbar">
            <small className={len > MAX ? "bad" : ""}>{len}/{MAX} ký tự</small>
            <button className="chip sm" onClick={() => { setText(SAMPLE); setErr(""); }}>Thử câu mẫu</button>
            {text && <button className="chip sm" onClick={() => setText("")}>Xóa</button>}
            <button className="gbtn sm tri" onClick={run} disabled={busy || !text.trim()}><span className="c" />{busy ? "Đang phân tích…" : "Phân tích"}</button>
          </div>
          {busy && <p className="hint">Mất khoảng 10–30 giây tùy độ dài đoạn văn…</p>}
          {err && <p className="lberr">⚠️ {err}</p>}
        </div>

        {res && (
          <section className="panel lbsec">
            <div className="lbdhead">
              <h2 style={{ margin: 0 }}>Kết quả <small>{res.sentences.length} câu</small></h2>
              <button className="chip sm" onClick={playAll}>{playing >= 0 ? "⏹ Dừng" : "▶ Nghe cả đoạn"}</button>
            </div>
            <div className="lbbar"><ViewBar /></div>
            {res.sentences.map((s, i) => <div key={`${res.t}-${i}`} className={playing === i ? "lbcur" : ""}><Sentence s={s} no={i + 1} defaultOpen /></div>)}
            <p className="hint">Bản phân tích do AI (Google Gemini) tạo tự động — có thể có chỗ chưa chính xác, nhất là tên riêng và thuật ngữ chuyên ngành.</p>
          </section>
        )}

        {!!hist.length && (
          <section className="panel lbsec">
            <h2>🕘 Đã phân tích <small>lưu trên máy này</small></h2>
            <ul className="lbhist">
              {hist.map((h) => (
                <li key={h.t}>
                  <button className="lbhbtn jpt" onClick={() => { setRes(h); setText(h.text); setErr(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{h.text.slice(0, 80)}{h.text.length > 80 ? "…" : ""}</button>
                  <small>{new Date(h.t).toLocaleDateString("vi-VN")}</small>
                  <button className="lbhdel" onClick={() => remove(h.t)} aria-label="Xóa">✕</button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>}
    </>
  );
}
