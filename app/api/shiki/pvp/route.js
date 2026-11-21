import { auth, store } from "@/lib/store";
import { getSite } from "@/lib/admin";
import { lobbyAction, PvpError, validatePvpDeck } from "@/lib/shikiPvp";

export const dynamic = "force-dynamic";

const reply = (value, status = 200) => Response.json(value, {
  status,
  headers: { "Cache-Control": "no-store" },
});

export async function POST(req) {
  if (!store) return reply({ error: "Chưa cấu hình máy chủ." }, 503);
  const body = await req.json().catch(() => null);
  const user = await auth(body?.id, body?.token);
  if (!user) return reply({ error: "Cần đăng nhập để đấu PvP." }, 401);
  try {
    if (body.action === "invite" || body.action === "accept") await validatePvpDeck(user.id, body.deck);
    const chatEnabled = body.action !== "chat" || (await getSite()).chatEnabled;
    return reply(await lobbyAction(user, body, chatEnabled));
  } catch (error) {
    if (error instanceof PvpError) return reply({ error: error.message }, error.status);
    console.error("[shiki-pvp]", error);
    return reply({ error: "Chưa kết nối được bàn PvP. Hãy thử lại." }, 503);
  }
}
