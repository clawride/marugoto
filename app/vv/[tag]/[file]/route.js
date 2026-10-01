// Trung gian cho file lồng tiếng tạo sẵn nằm ở GitHub Releases.
// Tải thẳng từ GitHub thì mỗi lần phải qua 1 lượt chuyển hướng sang link ký tên, không cache được (Cache-Control: no-cache) → chậm.
// Qua đây: Vercel lấy 1 lần rồi giữ trên CDN, trình duyệt giữ lại luôn (tên file có mã phiên bản nên cache vĩnh viễn được).
import fs from "node:fs";
import path from "node:path";

const REPO = "clawride/marugoto";
const TAG_RE = /^voice-[a-z0-9-]{1,40}$/;
const FILE_RE = /^[A-Za-z0-9_-]{1,80}\.mp3$/;

export async function GET(_req, { params }) {
  const { tag, file } = await params;
  if (!TAG_RE.test(tag) || !FILE_RE.test(file)) return new Response("Not found", { status: 404 });
  // Thử cục bộ: VV_LOCAL_DIR trỏ tới thư mục chứa shard-<n>/<file>.mp3 do scripts/gen-listen.mjs tạo (chưa tải lên GitHub)
  if (process.env.VV_LOCAL_DIR) {
    const m = tag.match(/^voice-listen-(\d+)$/);
    const f = m && path.join(process.env.VV_LOCAL_DIR, `shard-${m[1]}`, file);
    if (f && fs.existsSync(f)) return new Response(fs.readFileSync(f), { headers: { "Content-Type": "audio/mpeg" } });
  }
  const up = await fetch(`https://github.com/${REPO}/releases/download/${tag}/${file}`, { redirect: "follow" });
  if (!up.ok) return new Response("Not found", { status: up.status === 404 ? 404 : 502 });
  return new Response(up.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      ...(up.headers.get("content-length") ? { "Content-Length": up.headers.get("content-length") } : {}),
    },
  });
}
