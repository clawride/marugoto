import { SITE_URL } from "@/lib/site";

// /robots.txt — chỉ dùng chỉ thị chuẩn; Sitemap phải là địa chỉ đầy đủ (https://…)
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/vv/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
