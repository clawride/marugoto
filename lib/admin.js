// Quyền quản trị — chỉ dùng phía máy chủ.
// Ai là quản trị: biến môi trường ADMIN_IDS (id hồ sơ, bền vững nhất) và/hoặc ADMIN_USERNAMES (tên đăng nhập), cách nhau bằng dấu phẩy.
// Mọi thao tác quản trị đều kiểm lại id + token của người gọi trên MÁY CHỦ; người không phải quản trị nhận lỗi 404 như thể trang không tồn tại.
import { store, auth } from "@/lib/store";
import { SITE_DEFAULTS, normalizeSite } from "@/lib/siteCfg";

const list = (v) => String(v || "").split(/[,\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
export const isAdminUser = (u) => !!u && (list(process.env.ADMIN_IDS).includes(String(u.id).toLowerCase()) || (!!u.username && list(process.env.ADMIN_USERNAMES).includes(u.username.toLowerCase())));
export const adminConfigured = () => list(process.env.ADMIN_IDS).length + list(process.env.ADMIN_USERNAMES).length > 0;

// → hồ sơ quản trị đã xác thực, hoặc null
export async function requireAdmin(b) {
  if (!adminConfigured()) return null;
  const u = await auth(b?.id, b?.token);
  return u && isAdminUser(u) ? u : null;
}

// cấu hình trang (có nhớ tạm 15 giây trên mỗi máy chủ để không truy vấn liên tục)
let cache = { at: 0, v: SITE_DEFAULTS };
export async function getSite(force) {
  if (!store) return SITE_DEFAULTS;
  if (!force && Date.now() - cache.at < 15000) return cache.v;
  try { cache = { at: Date.now(), v: normalizeSite(await store.getSettings()) }; } catch { /* chưa có bảng → mặc định */ }
  return cache.v;
}
export function dropSiteCache() { cache.at = 0; }
