import { after } from "next/server";
import { store, auth } from "@/lib/store";
import { dayStartVN, cleanBody, CHAT_MAX } from "@/lib/chat";
import { LUMIE_ID, LUMIE_ENABLED, LUMIE_PER_USER, LUMIE_PER_DAY, callsLumie, lumieReply } from "@/lib/lumie";

export const maxDuration = 60; // Lumie trả lời sau khi đã phản hồi người gửi (after) — cần đủ thời gian gọi Gemini

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const LIMIT = 200; // số tin gần nhất trả về khi mở phòng chat

// GET → tin trong ngày (giờ Việt Nam)
export async function GET() {
  if (!store) return Response.json({ messages: [] });
  const since = dayStartVN();
  const messages = await store.chatToday(since.toISOString(), LIMIT);
  return Response.json({ dayStart: since.toISOString(), messages, lumie: LUMIE_ENABLED }, { headers: { "Cache-Control": "no-store" } });
}

// Lumie đọc vài tin gần nhất rồi trả lời người vừa gọi; tin trả lời đến mọi người qua Realtime như tin thường
async function answer(u, msg) {
  const since = dayStartVN().toISOString();
  const say = (body) => store.chatBotPost({ userId: LUMIE_ID, name: "Lumie", avatar: "i:star", body, replyTo: u.id });
  try {
    const c = await store.botCounts(LUMIE_ID, u.id, since);
    if (c.all >= LUMIE_PER_DAY) return; // hết lượt chung của cả phòng hôm nay → im lặng
    if (c.mine >= LUMIE_PER_USER) {
      if (c.mine === LUMIE_PER_USER) await say(`${u.name} ơi, hôm nay Lumie trò chuyện với bạn đủ ${LUMIE_PER_USER} câu rồi 😴 Mai mình nói tiếp nhé! またあした！`);
      return;
    }
    const recent = (await store.chatToday(since, 13)).filter((m) => m.id !== msg.id).slice(-12);
    const text = await lumieReply({ history: recent.map((m) => ({ name: m.name, body: m.body })), from: u.name, text: msg.body });
    await say(text || `Xin lỗi ${u.name}, Lumie không trả lời câu này được 🙏 Mình nói chuyện tiếng Nhật khác nhé!`);
  } catch (e) {
    console.error("[lumie]", e?.status || "", e?.message || e);
    try { await say(`Lumie đang hơi mệt, ${u.name} thử gọi lại sau một chút nhé 🌙`); } catch {}
  }
}

// POST { id, token, body } → gửi tin (chỉ tài khoản đã đăng nhập)
export async function POST(req) {
  if (!store) return bad("Chưa cấu hình máy chủ", 503);
  const b = await req.json().catch(() => ({}));
  const u = await auth(b.id, b.token);
  if (!u || !u.username) return bad("Cần đăng nhập để chat", 401);
  const body = cleanBody(b.body);
  if (!body) return bad("Tin nhắn trống");
  if ([...body].length > CHAT_MAX) return bad(`Tin nhắn tối đa ${CHAT_MAX} ký tự`);
  // chống spam (tối thiểu 2,5 giây giữa hai tin, tối đa 15 tin / 5 phút) tính bằng đồng hồ của cơ sở dữ liệu
  const r = await store.chatPost({ userId: u.id, name: u.name, avatar: u.avatar, body });
  if (r.error === "slow") return bad("Gửi chậm lại một chút nhé", 429);
  if (r.error === "burst") return bad("Bạn gửi nhiều quá, nghỉ vài phút rồi chat tiếp nhé", 429);
  const lumie = LUMIE_ENABLED && callsLumie(body);
  if (lumie) after(() => answer(u, r.message));
  return Response.json({ message: r.message, lumie });
}
