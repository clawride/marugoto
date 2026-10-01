import { store, auth } from "@/lib/store";
import { dayStartVN, cleanBody, CHAT_MAX } from "@/lib/chat";

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const LIMIT = 200; // số tin gần nhất trả về khi mở phòng chat

// GET → tin trong ngày (giờ Việt Nam)
export async function GET() {
  if (!store) return Response.json({ messages: [] });
  const since = dayStartVN();
  const messages = await store.chatToday(since.toISOString(), LIMIT);
  return Response.json({ dayStart: since.toISOString(), messages }, { headers: { "Cache-Control": "no-store" } });
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
  return Response.json({ message: r.message });
}
