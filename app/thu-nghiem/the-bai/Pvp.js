"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./Card";
import Arena from "./Arena";
import "./pvp.css";

const EMPTY = { people: [], room: null, messages: [], incoming: null, outgoing: null };
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function usePvp(profile, busy, playing, deck, onRefresh, toast) {
  const [data, setData] = useState(EMPTY);
  const [peer, setPeer] = useState(null);
  const [dismissedRoom, setDismissedRoom] = useState(null);
  const [sending, setSending] = useState(false);
  const [clock, setClock] = useState(0);
  const state = useRef(null);
  const pvpPending = useRef(false);
  const latest = useRef(0);
  const wake = useRef(null);
  const offset = useRef(0);
  const id = profile?.id;
  const token = profile?.token;
  state.current = { busy, playing, peer: data.incoming?.from.id || peer?.id, toast };

  async function request(action, params = {}, signal) {
    const current = state.current;
    const response = await fetch("/api/shiki/pvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({ id, token, action, busy: current.busy, playing: current.playing, peer: current.peer, ...params }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Lỗi kết nối PvP.");
    if (!signal?.aborted && payload.version >= latest.current) {
      latest.current = payload.version;
      offset.current = payload.now - Date.now();
      setClock(payload.now);
      setData(payload);
    }
    return payload;
  }

  useEffect(() => {
    if (!id || !token) return;
    try { setDismissedRoom(localStorage.getItem("shiki-pvp-dismissed:" + id)); } catch {}
    const controller = new AbortController();
    let timer;
    let running = false;
    let queued = false;
    async function poll() {
      if (controller.signal.aborted) return;
      if (running) { queued = true; return; }
      clearTimeout(timer);
      running = true;
      try { await request("poll", {}, controller.signal); }
      catch { /* Lần lấy trạng thái tiếp theo sẽ thử lại. */ }
      running = false;
      if (controller.signal.aborted) return;
      const wait = queued ? 0 : document.hidden ? 4500 : state.current.inRoom ? 450 : 850;
      queued = false;
      timer = setTimeout(poll, wait);
    }
    wake.current = poll;
    document.addEventListener("visibilitychange", poll);
    poll();
    return () => {
      controller.abort(); clearTimeout(timer);
      wake.current = null;
      document.removeEventListener("visibilitychange", poll);
    };
  }, [id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const liveRoomId = ["playing", "pick", "settling"].includes(data.room?.status) ? data.room.id : null;
  state.current.inRoom = Boolean(liveRoomId);
  useEffect(() => {
    if (!liveRoomId || !SB_URL || !SB_KEY) return;
    let alive = true;
    let client, channel;
    import("@supabase/supabase-js").then(({ createClient }) => {
      if (!alive) return;
      client = createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      channel = client.channel("shiki-pvp:" + liveRoomId)
        .on("broadcast", { event: "changed" }, () => wake.current?.())
        .subscribe((status) => { if (alive && status === "SUBSCRIBED") wake.current?.(); });
    }).catch(() => {});
    return () => { alive = false; if (channel) client.removeChannel(channel); };
  }, [liveRoomId]);

  useEffect(() => {
    if (data.incoming) setPeer(null);
  }, [data.incoming?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data.incoming && !data.room?.deadline) return;
    const timer = setInterval(() => setClock(Date.now() + offset.current), 200);
    return () => clearInterval(timer);
  }, [data.incoming?.id, data.room?.deadline]); // eslint-disable-line react-hooks/exhaustive-deps

  const notice = data.outgoing;
  const lastNotice = useRef(null);
  useEffect(() => {
    if (!notice || !["declined", "expired"].includes(notice.status) || lastNotice.current === notice.id) return;
    lastNotice.current = notice.id;
    toast(notice.status === "declined" ? notice.to.name + " đã từ chối thách đấu." : "Lời thách đấu đã hết hạn.");
  }, [notice, toast]);

  async function act(action, params) {
    if (pvpPending.current) return false;
    pvpPending.current = true;
    setSending(true);
    try {
      await request(action, params);
      return true;
    } catch (error) {
      state.current.toast(error.message);
      return false;
    } finally {
      pvpPending.current = false;
      setSending(false);
    }
  }

  const room = data.room?.id !== dismissedRoom ? data.room : null;
  const incoming = data.incoming?.deadline > clock ? data.incoming : null;
  const closeRoom = async () => {
    try {
      await onRefresh();
      setDismissedRoom(room.id);
      try { localStorage.setItem("shiki-pvp-dismissed:" + id, room.id); } catch {}
    } catch (error) {
      state.current.toast(error.message);
    }
  };
  return { data, room, incoming, clock, peer, setPeer, act, closeRoom, sending, deck, busy };
}

export function PvpLobby({ pvp }) {
  const { data, incoming, clock, peer, setPeer, act, sending, deck, busy } = pvp;
  const [message, setMessage] = useState("");
  const partner = incoming?.from || peer;
  const present = data.people.find((person) => person.id === partner?.id);
  const outgoing = data.outgoing?.to.id === partner?.id ? data.outgoing : null;
  const canInvite = !busy && deck.length === 5 && present?.available && outgoing?.status !== "pending" && !incoming;
  const deadline = incoming ? Math.max(0, Math.ceil((incoming.deadline - clock) / 1000)) : 0;
  const messages = data.messages.filter((m) => m.from === partner?.id || m.to === partner?.id);

  return (
    <div className="tt">
      <section className="panel pvp-lobby" aria-label="Người chơi online">
        <h3>Người chơi online <small>· {data.people.length}</small></h3>
        {data.people.length === 0 ? <p className="hint">Chưa có người chơi khác trên trang Đấu thẻ.</p> : (
          <ul>{data.people.map((person) => (
            <li key={person.id}>
              <button type="button" className="chip dk" onClick={() => { setPeer(person); setMessage(""); }}>
                {person.name} <small>· {person.status === "playing" ? "Đang đấu" : "Đang online"}</small>
              </button>
            </li>
          ))}</ul>
        )}
      </section>
      {partner && (
        <section className="panel pvp-chat" key={partner.id} aria-label={"Trò chuyện với " + partner.name}>
          <header><b>{partner.name}</b>{!incoming && <button type="button" className="chip dk" onClick={() => setPeer(null)} aria-label="Đóng chat">✕</button>}</header>
          {incoming ? (
            <div className="pvp-invite" role="alert">
              <p><b>{partner.name}</b> mời bạn đấu thẻ. <strong>{deadline}s</strong></p>
              <p className="hint">Người thắng được chọn một lá đủ điều kiện từ bộ bài bên thua.</p>
              <button type="button" className="chip dk on" disabled={sending || busy || deck.length !== 5} onClick={() => {
                setPeer(null);
                act("accept", { offer: incoming.id, deck });
              }}>Đồng ý</button>{" "}
              <button type="button" className="chip dk" disabled={sending} onClick={() => {
                setPeer(null);
                act("decline", { offer: incoming.id });
              }}>Từ chối</button>
            </div>
          ) : (
            <>
              <div className="pvp-messages" role="log">
                {messages.map((m) => <p key={m.id} className={m.from === partner.id ? "foe" : "me"}>{m.text}</p>)}
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (await act("chat", { peer: partner.id, text: message })) setMessage("");
              }}>
                <input aria-label="Tin nhắn" maxLength={240} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Nhập tin nhắn…" />
                <button className="chip dk" disabled={sending || !present || !message.trim()}>Gửi</button>
              </form>
              <button type="button" className="chip dk on" disabled={sending || !canInvite}
                onClick={() => act("invite", { peer: partner.id, deck })}>⚔️ Thách đấu</button>
              {outgoing?.status === "pending" && <small role="status">Đang chờ trả lời…</small>}
              {outgoing?.status === "declined" && <small role="status">Đối thủ đã từ chối.</small>}
              {outgoing?.status === "expired" && <small role="status">Lời thách đấu đã hết hạn.</small>}
              {deck.length !== 5 && <small>Chọn đủ 5 lá để thách đấu.</small>}
            </>
          )}
        </section>
      )}
    </div>
  );
}

export function PvpBoard({ pvp, byId, profile }) {
  const { room, clock, act, closeRoom, sending } = pvp;
  if (!room.board) {
    return <div className="tt pvp-board panel">
      <h1>Đấu với {room.opponent}</h1>
      <p role={room.error ? "alert" : "status"}>{room.error || "Đang chuẩn bị bàn và kiểm tra bộ bài…"}</p>
      {room.status === "cancelled" && <button type="button" className="chip dk on" onClick={closeRoom}>Về bản đồ</button>}
    </div>;
  }

  const revealed = [...room.hand, ...room.board.flatMap((cell) => cell ? [cell.card] : [])];
  const match = {
    id: room.id,
    roll: room.roll,
    cards: Object.fromEntries(revealed.map((card) => [card.id, card])),
    cells: room.board.map((cell) => cell && { id: cell.card.id, owner: cell.owner }),
    hands: { me: room.hand.map((card) => card.id), foe: Array(room.foeCount) },
    turn: room.status === "playing" ? room.turn : "done",
    els: Array(9).fill(null),
    rules: {},
  };
  const left = Math.max(0, Math.ceil((room.deadline - clock) / 1000));
  const resultContent = (
    <div className="ar-pvp-result">
      {room.status === "pick" && (room.winner === "me" ? <>
        <p>Chọn một lá thưởng · {left}s</p>
        <div className="pvp-hand">
          {room.choices.map((id) => byId[id] && <div key={id}>
            <Card c={byId[id]} owner="foe" named onClick={() => {
              if (!sending && left > 0) act("claim", { room: room.id, card: id });
            }} />
          </div>)}
        </div>
      </> : <p>Đối thủ đang chọn lá thưởng · {left}s</p>)}
      {room.status === "settling" && <p role="status">Đang chuyển thẻ…</p>}
      {room.status === "done" && <>
        {room.prize && <p>{room.winner === "me" ? "Bạn nhận" : "Bạn mất"} lá <b>{byId[room.prize]?.name || room.prize}</b>.</p>}
        <button type="button" className="chip dk on" onClick={closeRoom}>Về bản đồ</button>
      </>}
    </div>
  );
  return <Arena m0={match} pvp={{ ...pvp, resultContent }} byId={byId} profile={profile} leaving={sending} />;
}
