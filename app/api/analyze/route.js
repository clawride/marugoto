import { ANALYZE_ENABLED, ANALYZE_MAX, analyzeText } from "@/lib/analyze";

export const maxDuration = 60;

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
// giới hạn đơn giản theo IP trong bộ nhớ máy chủ (giữ trong hạn mức Gemini miễn phí)
const PER_IP = +(process.env.ANALYZE_PER_IP || 40); // lượt mỗi IP mỗi ngày
const PER_DAY = +(process.env.ANALYZE_PER_DAY || 500); // tổng lượt mỗi ngày
const used = new Map();
let total = { day: "", n: 0 };

export async function GET() {
  return Response.json({ enabled: ANALYZE_ENABLED, max: ANALYZE_MAX });
}

// POST { text } → { sentences: [{ jp, ro, vi, words: [{ w, r, ro, pos, base, vi }], grammar: [{ p, vi }] }] }
export async function POST(req) {
  if (!ANALYZE_ENABLED) return bad("Máy chủ chưa bật tính năng phân tích", 503);
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return bad("Hãy dán một đoạn tiếng Nhật");
  if (!/[぀-ヿ㐀-鿿]/.test(text)) return bad("Đoạn văn chưa có chữ tiếng Nhật");
  if ([...text].length > ANALYZE_MAX) return bad(`Mỗi lần tối đa ${ANALYZE_MAX} ký tự — hãy chia nhỏ đoạn văn`);

  const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // ngày theo giờ Việt Nam
  if (total.day !== day) { total = { day, n: 0 }; used.clear(); }
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const n = used.get(ip) || 0;
  if (n >= PER_IP) return bad(`Hôm nay bạn đã phân tích ${PER_IP} lần rồi, mai dùng tiếp nhé`, 429);
  if (total.n >= PER_DAY) return bad("Hôm nay trang đã dùng hết lượt phân tích, mai quay lại nhé", 429);
  used.set(ip, n + 1); total.n++;

  try {
    const sentences = await analyzeText(text);
    if (!sentences.length) return bad("Không phân tích được đoạn này, hãy thử lại", 502);
    return Response.json({ sentences });
  } catch (e) {
    used.set(ip, Math.max(0, (used.get(ip) || 1) - 1)); total.n--;
    console.error("[analyze]", e?.status || "", e?.message || e);
    return bad(BUSYMSG(e), 502);
  }
}
const BUSYMSG = (e) => ([429, 503].includes(e?.status) || e?.name === "TimeoutError" ? "Máy phân tích đang quá tải, thử lại sau ít phút nhé" : "Có lỗi khi phân tích, hãy thử lại");
