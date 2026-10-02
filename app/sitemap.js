import { SITE_URL } from "@/lib/site";
import { PROGRAMS } from "@/lib/programs";
import { LIBRARY, CATEGORIES } from "@/lib/library";

// /sitemap.xml — các trang học chính (bỏ các mục game vì giao diện mặc định ẩn chúng)
export default function sitemap() {
  const paths = ["/", ...PROGRAMS.filter((p) => !p.game).map((p) => p.href), "/quiz", "/rank", "/thu-vien", "/de-thi", ...CATEGORIES.map((c) => `/thu-vien/${c.id}`),
    ...LIBRARY.flatMap((b) => [`/thu-vien/${b.id}`, ...b.lessons.map((l) => `/thu-vien/${b.id}/${l.n}`), ...b.extras.map((x) => `/thu-vien/${b.id}/${x.id}`)])];
  const now = new Date();
  return [...new Set(paths)].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
