"use client";
// Phòng chat chung: nút nổi góc phải dưới → khung chat. Tin mới đến trực tiếp qua Supabase Realtime (khóa công khai, chỉ ĐỌC được tin trong ngày);
// gửi tin qua /api/chat (kiểm tra đăng nhập + chống spam). Làm mới lúc 0:00 mỗi ngày (giờ Việt Nam).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/components/Game";
import Avatar from "@/components/Avatar";
import { dayStartVN, nextResetVN, CHAT_MAX } from "@/lib/chat";
import { sfx } from "@/lib/sfx";

const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL, SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SEEN = "chat_seen_id";
const hhmm = (iso) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
const left = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60} phút` : `${m} phút`; };

export default function ChatBox() {
  const { S } = useGame();
  const me = S?.profile;
  const on = !OFFLINE && !!(me?.id && me?.token && me?.username);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [seen, setSeen] = useState(() => { try { return +localStorage.getItem(SEEN) || 0; } catch { return 0; } });
  const listRef = useRef(null), inpRef = useRef(null);
  const openRef = useRef(open); openRef.current = open;

  const addMsgs = useCallback((arr) => setMsgs((cur) => {
    const by = new Map(cur.map((m) => [m.id, m]));
    for (const m of arr) by.set(m.id, m);
    return [...by.values()].sort((a, b) => a.id - b.id).slice(-300);
  }), []);
  const load = useCallback(() => fetch("/api/chat").then((r) => r.json()).then((j) => addMsgs(j.messages || [])).catch(() => {}).finally(() => setLoaded(true)), [addMsgs]);

  // tải tin trong ngày + nghe tin mới
  useEffect(() => {
    if (!on) return;
    let ch = null, sb = null, alive = true;
    const t = setTimeout(async () => {
      await load();
      if (!SB_URL || !SB_KEY || !alive) return;
      try {
        const { createClient } = await import("@supabase/supabase-js");
        if (!alive) return;
        sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
        ch = sb.channel("chat-room")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => {
            addMsgs([p.new]);
            if (!openRef.current && p.new.user_id !== me.id) sfx.click?.();
          })
          .subscribe((s) => alive && setLive(s === "SUBSCRIBED"));
      } catch { /* không kết nối được Realtime → dùng tải lại định kỳ khi mở khung chat */ }
    }, 1500);
    return () => { alive = false; clearTimeout(t); if (ch && sb) sb.removeChannel(ch); };
  }, [on, me?.id, load, addMsgs]);

  // không có Realtime: mở khung chat thì tải lại mỗi 5 giây
  useEffect(() => { if (!open || live || !on) return; const i = setInterval(load, 5000); return () => clearInterval(i); }, [open, live, on, load]);
  useEffect(() => { if (open && !loaded) load(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  // đồng hồ cho đếm ngược làm mới + bỏ tin của ngày cũ khi qua 0:00
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);

  const start = dayStartVN(now).toISOString();
  const today = useMemo(() => msgs.filter((m) => m.created_at >= start), [msgs, start]);
  const lastId = today.length ? today[today.length - 1].id : 0;
  const unread = open ? 0 : today.filter((m) => m.id > seen && m.user_id !== me?.id).length;

  // mở khung / có tin mới khi đang mở → đánh dấu đã xem + cuộn xuống cuối
  useEffect(() => {
    if (!open) return;
    if (lastId > seen) { setSeen(lastId); try { localStorage.setItem(SEEN, String(lastId)); } catch {} }
    const el = listRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [open, lastId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!open) return; const k = (e) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open]);

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: me.id, token: me.token, body }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || "Không gửi được, thử lại sau");
      else { addMsgs([j.message]); setText(""); sfx.click?.(); }
    } catch { setErr("Không kết nối được máy chủ"); }
    setBusy(false);
    inpRef.current?.focus();
  };

  if (!on) return null;
  const n = [...text].length;
  return (
    <>
      <button type="button" className={`cb-fab ${open ? "on" : ""}`} onClick={() => { setOpen((v) => !v); sfx.click?.(); }} aria-label={open ? "Đóng phòng chat" : "Mở phòng chat"} aria-expanded={open}>
        <span aria-hidden="true">{open ? "✕" : "💬"}</span>
        {unread > 0 && <b className="cb-badge">{unread > 99 ? "99+" : unread}</b>}
      </button>
      {open && (
        <section className="cb-panel" role="dialog" aria-label="Phòng chat chung">
          <header className="cb-head">
            <div>
              <b>💬 Phòng chat chung</b>
              <small><i className={`cb-dot ${live ? "ok" : ""}`} />{live ? "Trực tiếp" : "Đang kết nối…"} · làm mới sau {left(nextResetVN(now).getTime() - now)}</small>
            </div>
            <button type="button" className="cb-x" onClick={() => setOpen(false)} aria-label="Đóng">✕</button>
          </header>
          <div className="cb-list" ref={listRef}>
            {!loaded && <div className="cb-empty"><p>Đang tải tin nhắn…</p></div>}
            {loaded && today.length === 0 && <div className="cb-empty"><span aria-hidden="true">👋</span><p>Hôm nay chưa ai nhắn gì.<br />Chào mọi người một câu nhé — tiếng Nhật càng tốt!</p></div>}
            {today.map((m, i) => {
              const mine = m.user_id === me.id, prev = today[i - 1];
              const same = prev && prev.user_id === m.user_id && Date.parse(m.created_at) - Date.parse(prev.created_at) < 3 * 60e3;
              return (
                <div key={m.id} className={`cb-msg ${mine ? "me" : ""} ${same ? "same" : ""}`}>
                  {!mine && <div className="cb-av">{!same && <Avatar avatar={m.avatar} name={m.name} size={30} />}</div>}
                  <div className="cb-bub">
                    {!same && <div className="cb-meta">{!mine && <b>{m.name}</b>}<time dateTime={m.created_at}>{hhmm(m.created_at)}</time></div>}
                    <p>{m.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <form className="cb-form" onSubmit={send}>
            {err && <div className="cb-err" role="alert">{err}</div>}
            <div className="cb-row">
              <textarea ref={inpRef} value={text} onChange={(e) => { setText(e.target.value); setErr(""); }} placeholder="Nhắn gì đó… (Enter để gửi)" rows={1} maxLength={CHAT_MAX + 50}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} aria-label="Tin nhắn" autoFocus />
              <button type="submit" className="cb-send" disabled={busy || !text.trim() || n > CHAT_MAX} aria-label="Gửi">➤</button>
            </div>
            {n > CHAT_MAX - 50 && <small className={`cb-count ${n > CHAT_MAX ? "over" : ""}`}>{n}/{CHAT_MAX}</small>}
          </form>
        </section>
      )}
    </>
  );
}
