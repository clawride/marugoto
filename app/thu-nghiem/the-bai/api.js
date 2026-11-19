export async function api(profile, action, body = {}) {
  const r = await fetch("/api/shiki/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: profile?.id, token: profile?.token, action, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Lỗi ${r.status}`);
  return j;
}
