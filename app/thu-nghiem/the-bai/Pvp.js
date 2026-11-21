"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./Card";
import "./pvp.css";

const EMPTY = { people: [], room: null, messages: [], incoming: null, outgoing: null };

export function usePvp(profile, busy, playing, deck, onRefresh, toast) {
  const [data, setData] = useState(EMPTY);
  const [peer, setPeer] = useState(null);
  const [dismissedRoom, setDismissedRoom] = useState(null);
  const [sending, setSending] = useState(false);
  const [clock, setClock] = useState(0);
  const state = useRef(null);
  const pvpPending = useRef(false);
  const latest = useRef(0);
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
    if (!signal?.aborted && payload.now >= latest.current) {
      latest.current = payload.now;
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
    async function poll() {
      try { await request("poll", {}, controller.signal); }
      catch { /* Lần lấy trạng thái tiếp theo sẽ thử lại. */ }
      if (!controller.signal.aborted) timer = setTimeout(poll, document.hidden ? 4500 : 850);
    }
    poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [id, token]); // eslint-disable-line react-hooks/exhaustive-deps

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

export function PvpBoard({ pvp, byId }) {
  const { room, clock, act, closeRoom, sending } = pvp;
  const [selection, setSelection] = useState(null);
  const shape = (card) => ({ ...byId[card.cardId], ...card });
  const end = room.status === "done" || room.status === "cancelled";
  const left = room.deadline ? Math.max(0, Math.ceil((room.deadline - clock) / 1000)) : null;
  const selected = room.hand?.some((c) => c.id === selection) ? selection : null;
  return (
    <main className="tt pvp-board panel">
      <h1>Đấu với {room.opponent}</h1>
      {room.status === "preparing" && <p role="status">Đang chuẩn bị bàn và kiểm tra bộ bài…</p>}
      {room.error && <p role="alert">{room.error}</p>}
      {room.board && (
        <>
          <p className="pvp-score">Bạn <b>{room.scores.me}</b> — <b>{room.scores.foe}</b> {room.opponent}</p>
          <p className="hint">Xúc xắc {room.roll.me} – {room.roll.foe} · {room.roll.me > room.roll.foe ? "Bạn" : room.opponent} đi trước</p>
          {room.status === "playing" && <p role="status">{room.turn === "me" ? "Lượt của bạn" : "Lượt của đối thủ"} · {left}s</p>}
          <div className="pvp-grid" aria-label="Bàn đấu 3×3">
            {room.board.map((cell, i) => <div key={i}>
              {cell ? <Card c={shape(cell.card)} owner={cell.owner} /> :
                <button type="button" disabled={sending || room.status !== "playing" || room.turn !== "me" || !selected}
                  onClick={async () => { if (await act("move", { room: room.id, card: selected, cell: i })) setSelection(null); }}
                  aria-label={"Đặt thẻ vào ô " + (i + 1)}>{i + 1}</button>}
            </div>)}
          </div>
          {room.status === "playing" && <>
            <p>Chọn một lá rồi bấm ô trống. Đối thủ còn {room.foeCount} lá.</p>
            <div className="pvp-hand">
              {room.hand.map((card) => <div key={card.id}><Card c={shape(card)} owner="me" sel={selected === card.id}
                onClick={() => { if (!sending && room.turn === "me") setSelection(selected === card.id ? null : card.id); }} /></div>)}
            </div>
            <button type="button" className="chip dk" disabled={sending} onClick={() => {
              if (confirm("Bỏ trận sẽ tính là thua. Đối thủ có thể lấy một lá trong bộ bài bạn mang vào trận.")) act("leave", { room: room.id });
            }}>Bỏ trận</button>
          </>}
          {room.status !== "playing" && (
            <p><b>{room.winner === "me" ? "Bạn thắng!" : room.winner === "foe" ? "Bạn thua." : "Hòa!"}</b></p>
          )}
          {room.status === "pick" && (room.winner === "me" ? <>
            <p>Chọn một lá từ bộ bài vừa đấu của đối thủ · {left}s</p>
            <div className="pvp-hand">
              {room.choices.map((id) => byId[id] && <div key={id}><Card c={byId[id]} owner="foe" named
                onClick={() => act("claim", { room: room.id, card: id })} /></div>)}
            </div>
          </> : <p>Đối thủ đang chọn lá nhận thưởng · {left}s</p>)}
          {room.status === "settling" && <p role="status">Đang chuyển thẻ…</p>}
          {room.status === "done" && room.prize && <p>{room.winner === "me" ? "Bạn nhận" : "Bạn mất"} lá <b>{byId[room.prize]?.name || room.prize}</b>.</p>}
        </>
      )}
      {end && <button type="button" className="chip dk on" onClick={closeRoom}>Về bản đồ</button>}
    </main>
  );
}
