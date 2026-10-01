import { SITE_URL } from "@/lib/site";
import { PROGRAMS } from "@/lib/programs";

// /sitemap.xml — các trang học chính (bỏ các mục game vì giao diện mặc định ẩn chúng)
export default function sitemap() {
  const paths = ["/", ...PROGRAMS.filter((p) => !p.game).map((p) => p.href), "/quiz", "/rank"];
  const now = new Date();
  return [...new Set(paths)].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
