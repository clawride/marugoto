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
  const [bot, setBot] = useState(false); // Lumie đã được bật trên server chưa
  const [wait, setWait] = useState(0); // id tin nhắn đang chờ Lumie trả lời (0 = không chờ)
  const [now, setNow] = useState(() => Date.now());
  const [seen, setSeen] = useState(() => { try { return +localStorage.getItem(SEEN) || 0; } catch { return 0; } });
  const listRef = useRef(null), inpRef = useRef(null);
  const atBottom = useRef(true); // đang xem tin cuối → có tin mới thì tự cuộn xuống; đang kéo lên đọc tin cũ thì giữ nguyên chỗ
  const [fresh, setFresh] = useState(0); // số tin mới đến trong lúc đang kéo lên đọc tin cũ
  const [touch, setTouch] = useState(false); // điện thoại: không tự bật bàn phím khi mở khung
  useEffect(() => { try { setTouch(matchMedia("(pointer: coarse)").matches); } catch {} }, []);
  const toBottom = (smooth) => { const el = listRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" }); setFresh(0); atBottom.current = true; };
  const onScroll = () => { const el = listRef.current; if (!el) return; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; if (atBottom.current) setFresh(0); };
  const openRef = useRef(open); openRef.current = open;

  const addMsgs = useCallback((arr) => setMsgs((cur) => {
    const by = new Map(cur.map((m) => [m.id, m]));
    for (const m of arr) by.set(m.id, m);
    return [...by.values()].sort((a, b) => a.id - b.id).slice(-300);
  }), []);
  const load = useCallback(() => fetch("/api/chat").then((r) => r.json()).then((j) => { addMsgs(j.messages || []); setBot(!!j.lumie); }).catch(() => {}).finally(() => setLoaded(true)), [addMsgs]);

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
          // tin bị xóa (dọn ngày cũ, gỡ tin xấu) → biến mất ngay ở mọi máy đang mở
          .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (p) => {
            const id = p.old?.id;
            if (id != null) setMsgs((cur) => cur.filter((m) => m.id !== id));
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
  // Lumie đã trả lời tin đang chờ → tắt "đang gõ"; quá 45 giây cũng tắt
  const answered = wait && today.some((m) => m.user_id === "lumie" && m.reply_to === me?.id && m.id > wait);
  useEffect(() => { if (answered) setWait(0); }, [answered]);
  useEffect(() => { if (!wait) return; const t = setTimeout(() => setWait(0), 45000); return () => clearTimeout(t); }, [wait]);
  const unread = open ? 0 : today.filter((m) => m.id > seen && m.user_id !== me?.id).length;

  // mở khung → đánh dấu đã xem + cuộn xuống cuối
  useEffect(() => { if (open) requestAnimationFrame(() => toBottom(false)); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  // có tin mới khi đang mở: đang ở cuối (hoặc tin của mình) → cuộn theo; đang đọc tin cũ → hiện nút "↓ tin mới"
  const prevLast = useRef(0);
  useEffect(() => {
    if (!open) { prevLast.current = lastId; return; }
    if (lastId > seen) { setSeen(lastId); try { localStorage.setItem(SEEN, String(lastId)); } catch {} }
    const added = today.filter((m) => m.id > prevLast.current);
    prevLast.current = lastId;
    if (!added.length && !wait) return;
    if (atBottom.current || added.some((m) => m.user_id === me?.id)) requestAnimationFrame(() => toBottom(true));
    else setFresh((f) => f + added.length);
  }, [open, lastId, wait]); // eslint-disable-line react-hooks/exhaustive-deps
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
      else { addMsgs([j.message]); setText(""); sfx.click?.(); if (j.lumie) setWait(j.message.id); }
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
              <small title={bot ? "Tin nhắn có gọi Lumie được gửi tới Google Gemini để Lumie trả lời." : undefined}><i className={`cb-dot ${live ? "ok" : ""}`} />{live ? "Trực tiếp" : "Đang kết nối…"} · làm mới sau {left(nextResetVN(now).getTime() - now)}</small>
            </div>
            <button type="button" className="cb-x" onClick={() => setOpen(false)} aria-label="Đóng">✕</button>
          </header>
          <div className="cb-list" ref={listRef} onScroll={onScroll}>
            {!loaded && <div className="cb-empty"><p>Đang tải tin nhắn…</p></div>}
            {loaded && today.length === 0 && <div className="cb-empty"><span aria-hidden="true">👋</span><p>Hôm nay chưa ai nhắn gì.<br />Chào mọi người một câu nhé — tiếng Nhật càng tốt!</p>{bot && <p className="cb-tip">Gọi <b>Lumie</b> ✨ trong tin nhắn để trò chuyện với bot bằng tiếng Nhật (từ vựng Marugoto A1 → B1-2) hoặc tiếng Việt.</p>}</div>}
            {today.map((m, i) => {
              const mine = m.user_id === me.id, isBot = m.user_id === "lumie", prev = today[i - 1];
              const same = prev && prev.user_id === m.user_id && Date.parse(m.created_at) - Date.parse(prev.created_at) < 3 * 60e3;
              return (
                <div key={m.id} className={`cb-msg ${mine ? "me" : ""} ${isBot ? "bot" : ""} ${same ? "same" : ""}`}>
                  {!mine && <div className="cb-av">{!same && <Avatar avatar={m.avatar} name={m.name} size={30} />}</div>}
                  <div className="cb-bub">
                    {!same && <div className="cb-meta">{!mine && <b>{m.name}</b>}{isBot && <em className="cb-bottag">bot</em>}<time dateTime={m.created_at}>{hhmm(m.created_at)}</time></div>}
                    <p>{m.body}</p>
                  </div>
                </div>
              );
            })}
            {wait > 0 && <div className="cb-msg bot cb-typing" aria-live="polite"><div className="cb-av"><Avatar avatar="i:star" name="Lumie" size={30} /></div><div className="cb-bub"><p><i /><i /><i /><span className="sr-only">Lumie đang trả lời…</span></p></div></div>}
          </div>
          {fresh > 0 && <button type="button" className="cb-new" onClick={() => toBottom(true)}>↓ {fresh} tin mới</button>}
          <form className="cb-form" onSubmit={send}>
            {err && <div className="cb-err" role="alert">{err}</div>}
            <div className="cb-row">
              <textarea ref={inpRef} value={text} onChange={(e) => { setText(e.target.value); setErr(""); }} placeholder={bot ? "Nhắn gì đó… gọi “Lumie” để hỏi bot" : "Nhắn gì đó… (Enter để gửi)"} rows={1} maxLength={CHAT_MAX + 50}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} aria-label="Tin nhắn" autoFocus={!touch} enterKeyHint="send" />
              <button type="submit" className="cb-send" disabled={busy || !text.trim() || n > CHAT_MAX} aria-label="Gửi">➤</button>
            </div>
            {n > CHAT_MAX - 50 && <small className={`cb-count ${n > CHAT_MAX ? "over" : ""}`}>{n}/{CHAT_MAX}</small>}
          </form>
        </section>
      )}
    </>
  );
}
