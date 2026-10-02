// Kiểm tra "ID token" do nút Đăng nhập bằng Google (Google Identity Services) trả về — chỉ dùng phía server.
// Google tự kiểm chữ ký tại endpoint tokeninfo; ở đây kiểm thêm: đúng Client ID của trang, đúng nơi cấp, còn hạn, email đã xác minh.
// Biến môi trường: NEXT_PUBLIC_GOOGLE_CLIENT_ID (Client ID loại "Web application" trong Google Cloud Console).

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
// chỉ để chạy thử trên máy (giả lập Google); production không đặt biến này
const TOKENINFO = (process.env.NODE_ENV !== "production" && process.env.GOOGLE_TOKENINFO_URL) || "https://oauth2.googleapis.com/tokeninfo?id_token=";

export async function verifyGoogleCredential(credential) {
  if (!GOOGLE_CLIENT_ID || typeof credential !== "string" || credential.length > 4096) return null;
  let p;
  try {
    const r = await fetch(TOKENINFO + encodeURIComponent(credential), { cache: "no-store" });
    if (!r.ok) return null;
    p = await r.json();
  } catch {
    return null;
  }
  const okIss = p.iss === "accounts.google.com" || p.iss === "https://accounts.google.com";
  const okAud = p.aud === GOOGLE_CLIENT_ID;
  const okExp = Number(p.exp) * 1000 > Date.now();
  const okMail = p.email_verified === true || p.email_verified === "true";
  if (!okIss || !okAud || !okExp || !okMail || !p.sub) return null;
  return { sub: String(p.sub), email: String(p.email || ""), name: String(p.name || p.given_name || ""), givenName: String(p.given_name || "") };
}
