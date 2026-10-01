// Trung gian cho file lồng tiếng tạo sẵn nằm ở GitHub Releases.
// Tải thẳng từ GitHub thì mỗi lần phải qua 1 lượt chuyển hướng sang link ký tên, không cache được (Cache-Control: no-cache) → chậm.
// Qua đây: Vercel lấy 1 lần rồi giữ trên CDN, trình duyệt giữ lại luôn (tên file có mã phiên bản nên cache vĩnh viễn được).
const REPO = "clawride/marugoto";
const TAG_RE = /^voice-[a-z0-9-]{1,40}$/;
const FILE_RE = /^[A-Za-z0-9_-]{1,80}\.mp3$/;

export async function GET(_req, { params }) {
  const { tag, file } = await params;
  if (!TAG_RE.test(tag) || !FILE_RE.test(file)) return new Response("Not found", { status: 404 });
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
