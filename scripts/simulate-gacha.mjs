// Mô phỏng tỉ lệ ước nguyện để đối chiếu với số liệu Genshin
// Chạy: node scripts/simulate-gacha.mjs
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = pathToFileURL(process.cwd() + "/").href;
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith("@/")) { let p = spec.slice(2); if (!/\.\w+$/.test(p)) p += ".js"; return next(root + p, ctx); }
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url.startsWith(root) && url.endsWith(".json")) return { format: "module", source: `export default ${readFileSync(fileURLToPath(url), "utf8")}`, shortCircuit: true };
    if (url.startsWith(root) && url.endsWith(".js")) return { format: "module", source: readFileSync(fileURLToPath(url), "utf8"), shortCircuit: true };
    return next(url, ctx);
  },
});

const { rollOnce, newBannerState, currentBanners } = await import("../lib/gacha.js");
const banners = currentBanners();
const N = 1_000_000;

for (const bid of ["char", "weapon", "chronicled", "standard"]) {
  const st = newBannerState()[bid];
  if (bid === "weapon") st.path = banners.weapon.featured5[0].id;
  if (bid === "chronicled") st.path = `c:${banners.chronicled.chars5[0].id}`;
  let c5 = 0, c4 = 0, feat = 0, radiance = 0, pitySum = 0, maxP = 0;
  for (let i = 0; i < N; i++) {
    const r = rollOnce(bid, st, banners);
    if (r.rank === 5) {
      c5++; pitySum += r.pity; maxP = Math.max(maxP, r.pity);
      if (bid === "char" && r.x.id === banners.char.featured5.id) feat++;
      if (bid === "weapon" && r.x.id === st.path) feat++;
      if (bid === "chronicled" && `${r.kind}:${r.x.id}` === st.path) feat++;
      if (r.flags.radiance) radiance++;
    } else if (r.rank === 4) c4++;
  }
  console.log(`${bid.padEnd(8)} 5★ ${(c5 / N * 100).toFixed(3)}% · TB ${(pitySum / c5).toFixed(1)} lần/5★ · max ${maxP} · 4★ ${(c4 / N * 100).toFixed(2)}%` +
    (bid === "char" ? ` · ra nhân vật sự kiện ${(feat / c5 * 100).toFixed(1)}% · Ánh Sáng Bắt Giữ ${radiance}` : "") +
    (bid === "chronicled" ? ` · ra vật phẩm chỉ định ${(feat / c5 * 100).toFixed(1)}%` : "") +
    (bid === "weapon" ? ` · ra vũ khí đã chọn ${(feat / c5 * 100).toFixed(1)}%` : ""));
}
