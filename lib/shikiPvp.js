import { randomInt } from "node:crypto";
import { store } from "@/lib/store";
import { getShikiConfig } from "@/lib/shikiConfig";
import { boosted, MIN_KINDS, power, RANK_RANGES, score } from "@/lib/shikiCards";
import { duelMove } from "@/lib/shikiDuel";

const KEY = "shiki:pvp-lobby";
const ONLINE = 18000;
const OFFER_MS = 5000;
const TURN_MS = 60000;
const PICK_MS = 120000;
const ARCHIVE_MS = 120000;

export class PvpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function emptyLobby() {
  return { people: {}, offers: {}, rooms: {}, messages: [] };
}

async function change(key, apply) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const previous = await store.getKV(key);
    const next = previous ? structuredClone(previous) : key === KEY ? emptyLobby() : {};
    const result = await apply(next, previous);
    if (!result.write) return result.value;
    next.rev = crypto.randomUUID();
    if (await store.replaceKV(key, next, previous)) return result.value;
  }
  throw new PvpError("Máy chủ đang bận. Hãy thử lại.", 409);
}

const write = (value) => ({ write: true, value });
const keep = (value) => ({ write: false, value });
const playerKey = (id) => "shiki:" + id;
const terminal = (room) => !room || room.status === "done" || room.status === "cancelled";
const hasPlayer = (room, id) => room.players.me.id === id || room.players.foe.id === id;
const sideOf = (room, id) => room.players.me.id === id ? "me" : "foe";
const other = (side) => side === "me" ? "foe" : "me";
const liveRoom = (lobby, id) => Object.values(lobby.rooms).find((room) => !terminal(room) && hasPlayer(room, id));
const latestRoom = (lobby, id) => Object.values(lobby.rooms).reverse().find((room) => hasPlayer(room, id));
const describe = (user) => ({ id: user.id, name: user.name || user.username || "Người chơi" });

export async function pvpLocked(lock) {
  if (!lock) return false;
  const lobby = await store.getKV(KEY);
  return !terminal(lobby?.rooms?.[lock.room]);
}

function prune(lobby, now) {
  let changed = false;
  for (const [id, person] of Object.entries(lobby.people)) {
    if (person.until > now) continue;
    delete lobby.people[id];
    changed = true;
  }
  for (const [id, offer] of Object.entries(lobby.offers)) {
    if (offer.status === "pending" && (offer.deadline ?? offer.deliverBy) <= now) {
      offer.status = "expired";
      offer.closed = now;
      changed = true;
    }
    if (offer.closed && now - offer.closed >= ARCHIVE_MS) {
      delete lobby.offers[id];
      changed = true;
    }
  }
  for (const [id, room] of Object.entries(lobby.rooms)) {
    if (terminal(room) && now - room.updated >= ARCHIVE_MS) {
      delete lobby.rooms[id];
      changed = true;
    }
  }
  return changed;
}

function playableDeck(data, ids, byId) {
  if (!data.starter || data.match || data.pending) throw new PvpError("Cần hoàn thành trận hoặc nhận thưởng đang chờ trước khi đấu PvP.");
  if (!Array.isArray(ids) || ids.length !== 5 || new Set(ids).size !== 5 ||
      ids.some((id) => typeof id !== "string" || !(data.box?.[id] > 0) || !Object.hasOwn(byId, id))) {
    throw new PvpError("Hãy chọn đủ 5 lá đang có trong Hộp bài.");
  }
  const kinds = Object.keys(data.box).filter((id) => data.box[id] > 0 && byId[id]).length;
  const stakes = ids.filter((id) => kinds > MIN_KINDS || data.box[id] > 1);
  if (!stakes.length) throw new PvpError("Cần ít nhất một lá có thể chuyển cho đối thủ. Hộp bài luôn giữ tối thiểu 5 loại thẻ.");
  return stakes;
}

async function reserve(room, side, byId) {
  const { id, deck } = room.players[side];
  return change(playerKey(id), async (data) => {
    if (data.pvp?.room === room.id) return keep(data.pvp);
    const lobby = await store.getKV(KEY);
    if (lobby?.rooms?.[room.id]?.status !== "preparing") throw new PvpError("Lời thách đấu đã đóng.", 409);
    if (data.pvp && !terminal(lobby.rooms[data.pvp.room])) throw new PvpError("Tài khoản đang có trận PvP khác.", 409);
    const stakes = playableDeck(data, deck, byId);
    data.pvp = {
      room: room.id,
      stakes,
      cards: deck.map((id) => {
        const c = boosted(byId[id], data.boost?.[id], RANK_RANGES) || byId[id];
        return { id, n: c.n, el: c.el, rank: c.rank };
      }),
    };
    return write(data.pvp);
  });
}

function makeMatch(room, a, b) {
  const cards = {};
  const hands = { me: [], foe: [] };
  for (const [side, lock] of [["me", a], ["foe", b]]) {
    for (const card of lock.cards) {
      const key = side + ":" + card.id;
      hands[side].push(key);
      cards[key] = { ...card, id: key, cardId: card.id };
    }
  }
  let me, foe;
  do { me = randomInt(1, 7); foe = randomInt(1, 7); } while (me === foe);
  return {
    id: room.id, cards, hands, roll: { me, foe },
    rules: {}, cells: Array(9).fill(null), els: Array(9).fill(null),
    turn: me > foe ? "me" : "foe",
  };
}

async function prepare(room) {
  const { byId } = await getShikiConfig();
  let a, b, error;
  try {
    a = await reserve(room, "me", byId);
    b = await reserve(room, "foe", byId);
  } catch (e) {
    if (!(e instanceof PvpError) || e.status === 409) throw e;
    error = e.message;
  }
  await change(KEY, (lobby) => {
    const current = lobby.rooms[room.id];
    if (current?.status !== "preparing") return keep();
    current.updated = Date.now();
    if (error) {
      current.status = "cancelled";
      current.error = error;
    } else {
      current.match = makeMatch(current, a, b);
      current.stakes = { me: a.stakes, foe: b.stakes };
      current.deadline = current.updated + TURN_MS;
      current.status = "playing";
    }
    return write();
  });
}

function finishRoom(room, winner, now) {
  room.winner = winner;
  room.updated = now;
  room.status = winner ? "pick" : "done";
  room.deadline = winner ? now + PICK_MS : null;
}

async function applyPrize(room, side, byId) {
  const id = room.players[side].id;
  await change(playerKey(id), (data) => {
    if (data.pvp?.room !== room.id) throw new PvpError("Không thể xác nhận thẻ thưởng.", 409);
    if (data.pvp.transferred) return keep();
    if (side === room.winner) {
      data.box[room.prize] = (data.box[room.prize] || 0) + 1;
    } else {
      const count = data.box[room.prize];
      if (!(count > 0)) throw new PvpError("Lá bài thưởng không còn trong Hộp bài.", 409);
      if (count > 1) data.box[room.prize]--;
      else {
        delete data.box[room.prize];
        if (data.boost) delete data.boost[room.prize];
        if (data.deck?.includes(room.prize)) {
          data.deck = data.deck.filter((id) => id !== room.prize);
          const spare = Object.keys(data.box).filter((id) => byId[id] && !data.deck.includes(id))
            .sort((a, b) => power(byId[b]) - power(byId[a]))[0];
          if (spare) data.deck.push(spare);
        }
      }
    }
    data.pvp.transferred = true;
    return write();
  });
}

async function settle(room) {
  const { byId } = await getShikiConfig();
  // Trừ thẻ trước. Mỗi hồ sơ ghi dấu đã chuyển để yêu cầu lặp không cộng/trừ thêm lần nữa.
  await applyPrize(room, other(room.winner), byId);
  await applyPrize(room, room.winner, byId);
  await change(KEY, (lobby) => {
    const current = lobby.rooms[room.id];
    if (current?.status !== "settling") return keep();
    current.status = "done";
    current.updated = Date.now();
    return write();
  });
}

function publicRoom(room, id) {
  if (!room) return null;
  const side = sideOf(room, id);
  const peer = other(side);
  const match = room.match;
  const result = {
    id: room.id, status: room.status, opponent: room.players[peer].name,
    deadline: room.deadline, error: room.error, prize: room.prize,
    winner: room.winner == null ? null : room.winner === side ? "me" : "foe",
  };
  if (!match) return result;
  const owner = (s) => s === side ? "me" : "foe";
  const expose = (key) => match.cards[key];
  return {
    ...result,
    board: match.cells.map((cell) => cell && { owner: owner(cell.owner), card: expose(cell.id) }),
    hand: match.hands[side].map(expose),
    foeCount: match.hands[peer].length,
    roll: { me: match.roll[side], foe: match.roll[peer] },
    turn: match.turn === "done" ? "done" : owner(match.turn),
    scores: (() => { const value = score(match.cells, match.hands); return { me: value[side], foe: value[peer] }; })(),
    choices: room.status === "pick" && room.winner === side ? room.stakes[peer] : [],
  };
}

export async function lobbyAction(user, body, chatEnabled) {
  const id = user.id;
  let lobby = await change(KEY, (lobby) => {
    const now = Date.now();
    let dirty = prune(lobby, now);
    const person = lobby.people[id];
    const status = body.playing === true ? "playing" : "online";
    const available = body.busy !== true && status === "online";
    if (!person || person.until - now < ONLINE - 6000 || person.status !== status || person.available !== available) {
      lobby.people[id] = { ...describe(user), status, available, until: now + ONLINE };
      dirty = true;
    }
    const room = liveRoom(lobby, id);
    if (room?.status === "playing" && room.deadline <= now) {
      finishRoom(room, other(room.match.turn), now);
      dirty = true;
    }
    if (room?.status === "pick" && room.deadline <= now) {
      room.prize = room.stakes[other(room.winner)][0];
      room.status = "settling";
      dirty = true;
    }

    switch (body.action) {
      case "poll": {
        const incoming = Object.values(lobby.offers).find((offer) => offer.to.id === id && offer.status === "pending");
        if (incoming && !incoming.deadline) { incoming.deadline = now + OFFER_MS; dirty = true; }
        break;
      }
      case "chat": {
        if (!chatEnabled) throw new PvpError("Trò chuyện đang tạm đóng.", 403);
        if (typeof body.peer !== "string" || body.peer === id || !Object.hasOwn(lobby.people, body.peer)) throw new PvpError("Người chơi đã rời trang.");
        const text = typeof body.text === "string" ? body.text.trim() : "";
        if (!text || text.length > 240) throw new PvpError("Tin nhắn cần từ 1 đến 240 ký tự.");
        if (lobby.messages.some((m) => m.from === id && now - m.at < 1500)) throw new PvpError("Bạn gửi hơi nhanh.", 429);
        lobby.messages = lobby.messages.filter((m) => now - m.at < 300000).slice(-159);
        lobby.messages.push({ id: crypto.randomUUID(), from: id, to: body.peer, text, at: now });
        dirty = true;
        break;
      }
      case "invite": {
        const peer = typeof body.peer === "string" && Object.hasOwn(lobby.people, body.peer) ? lobby.people[body.peer] : null;
        if (!peer?.available || peer.id === id || !available || room || liveRoom(lobby, peer.id)) {
          throw new PvpError("Người chơi hiện không thể nhận thách đấu.");
        }
        const offers = Object.values(lobby.offers);
        if (offers.some((o) => o.status === "pending" && [o.from.id, o.to.id].some((p) => p === id || p === peer.id))) {
          throw new PvpError("Đang có lời thách đấu chờ trả lời.");
        }
        if (offers.some((o) => o.from.id === id && now - o.created < 8000)) throw new PvpError("Hãy chờ trước khi gửi lời thách đấu tiếp theo.", 429);
        const offerId = crypto.randomUUID();
        lobby.offers[offerId] = {
          id: offerId, from: describe(user), to: describe(peer),
          deck: body.deck, status: "pending", created: now, deliverBy: now + ONLINE,
        };
        dirty = true;
        break;
      }
      case "accept":
      case "decline": {
        const offer = typeof body.offer === "string" && Object.hasOwn(lobby.offers, body.offer) ? lobby.offers[body.offer] : null;
        if (!offer || offer.to.id !== id || offer.status !== "pending" || !offer.deadline || now >= offer.deadline) {
          throw new PvpError("Lời thách đấu đã hết thời gian.", 409);
        }
        if (body.action === "decline") offer.status = "declined";
        else {
          if (!available || room || liveRoom(lobby, offer.from.id) || !lobby.people[offer.from.id]?.available) {
            throw new PvpError("Hai người cần sẵn sàng để vào đấu.");
          }
          offer.status = "accepted";
          lobby.rooms[offer.id] = {
            id: offer.id, status: "preparing", updated: now,
            players: {
              me: { ...offer.from, deck: offer.deck },
              foe: { ...offer.to, deck: body.deck },
            },
          };
        }
        offer.closed = now;
        dirty = true;
        break;
      }
      case "move": {
        if (!room || room.id !== body.room || room.status !== "playing") throw new PvpError("Trận đã kết thúc.", 409);
        if (room.match.turn !== sideOf(room, id)) throw new PvpError("Chưa đến lượt bạn.", 409);
        try { room.match = duelMove(room.match, body.card, body.cell).match; }
        catch { throw new PvpError("Nước đi không hợp lệ."); }
        if (room.match.turn === "done") {
          const tally = score(room.match.cells, room.match.hands);
          finishRoom(room, tally.me === tally.foe ? null : tally.me > tally.foe ? "me" : "foe", now);
        } else room.deadline = now + TURN_MS;
        dirty = true;
        break;
      }
      case "leave": {
        if (!room || room.id !== body.room || room.status !== "playing") throw new PvpError("Không có trận để bỏ.", 409);
        finishRoom(room, other(sideOf(room, id)), now);
        dirty = true;
        break;
      }
      case "claim": {
        if (!room || room.id !== body.room || room.status !== "pick" || room.winner !== sideOf(room, id) ||
            !room.stakes[other(room.winner)].includes(body.card)) throw new PvpError("Không thể chọn lá này.", 409);
        room.prize = body.card;
        room.status = "settling";
        dirty = true;
        break;
      }
      default: throw new PvpError("Thao tác không hợp lệ.");
    }
    return dirty ? write(lobby) : keep(lobby);
  });

  const requested = liveRoom(lobby, id);
  if (requested?.status === "preparing" || requested?.status === "settling") {
    if (requested.status === "preparing") await prepare(requested);
    else await settle(requested);
    lobby = await store.getKV(KEY) || emptyLobby();
  }
  const current = liveRoom(lobby, id) || latestRoom(lobby, id);
  const offers = Object.values(lobby.offers).filter((o) => o.from.id === id || o.to.id === id);
  const publicOffer = ({ deck, ...offer }) => offer;
  const peer = typeof body.peer === "string" ? body.peer : "";
  return {
    now: Date.now(),
    people: Object.values(lobby.people).filter((p) => p.id !== id && p.until > Date.now()).map((person) => {
      const playing = Boolean(liveRoom(lobby, person.id));
      return { id: person.id, name: person.name, status: playing ? "playing" : person.status, available: !playing && person.available };
    }),
    incoming: offers.filter((o) => o.to.id === id && o.status === "pending" && o.deadline).map(publicOffer)[0] || null,
    outgoing: offers.reverse().filter((o) => o.from.id === id).map(publicOffer)[0] || null,
    room: publicRoom(current, id),
    messages: lobby.messages.filter((m) => Date.now() - m.at < 300000 &&
      ((m.from === id && m.to === peer) || (m.from === peer && m.to === id))),
  };
}

export async function validatePvpDeck(id, deck) {
  const { byId } = await getShikiConfig();
  playableDeck(await store.getKV(playerKey(id)) || {}, deck, byId);
}
