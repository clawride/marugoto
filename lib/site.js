// Địa chỉ chính thức của trang (tiengnhat.online tự chuyển về bản www). Đổi bằng NEXT_PUBLIC_SITE_URL nếu cần.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tiengnhat.online").replace(/\/+$/, "");
