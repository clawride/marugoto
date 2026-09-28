// Sinh app/plain.auto.css: bản "giao diện học tập cơ bản" (nền sáng) tự suy ra từ CSS giao diện game.
//   node scripts/build-plain-css.mjs
// Với mọi luật trong app/*.css có màu viết cứng: chữ sáng → chữ tối (giữ sắc màu), nền tối → nền sáng,
// viền trắng mờ → viền xám, bỏ bóng chữ phát sáng. Mỗi luật được đặt dưới [data-ui="plain"].
// Chỉnh tay thêm ở app/plain.css (nạp sau, ưu tiên hơn).
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const APP = path.join(ROOT, "app");
const P = '[data-ui="plain"]';

// ——— màu ———
function parseColor(s) {
  s = s.trim().toLowerCase();
  let m;
  if ((m = s.match(/^#([0-9a-f]{3,8})$/))) {
    let h = m[1]; if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  if ((m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/))) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] };
  if (s === "white") return { r: 255, g: 255, b: 255, a: 1 };
  if (s === "black") return { r: 0, g: 0, b: 0, a: 1 };
  return null;
}
const lum = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
const hsl = (h, s, l, a = 1) => (a < 1 ? `hsla(${Math.round(h)},${Math.round(s * 100)}%,${Math.round(l * 100)}%,${+a.toFixed(3)})` : `hsl(${Math.round(h)},${Math.round(s * 100)}%,${Math.round(l * 100)}%)`);
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\bwhite\b|\bblack\b/g;

// chữ: sáng → tối
function textColor(v) {
  let changed = false;
  const out = v.replace(COLOR_RE, (c) => {
    const x = parseColor(c); if (!x || lum(x) < 0.55) return c;
    changed = true;
    const [h, s] = toHsl(x);
    if (s < 0.22) return lum(x) > 0.8 ? (x.a < 1 ? `rgba(31,41,55,${Math.max(0.55, x.a)})` : "#1f2937") : "#4b5563";
    return hsl(h, Math.min(1, s * 0.9 + 0.1), 0.36, Math.max(x.a, 0.8));
  });
  return changed ? out : null;
}
// nền: tối → sáng (trong suốt tối → xám rất nhạt)
function bgColor(v) {
  let changed = false;
  const out = v.replace(COLOR_RE, (c) => {
    const x = parseColor(c); if (!x || lum(x) > 0.45) return c;
    changed = true;
    const [h, s] = toHsl(x);
    if (x.a < 1) return x.a <= 0.35 ? `rgba(15,23,42,${+(x.a * 0.25).toFixed(3)})` : (s < 0.2 ? "#ffffff" : hsl(h, Math.min(0.7, s), 0.95));
    return s < 0.2 ? "#ffffff" : hsl(h, Math.min(0.7, s), 0.95);
  });
  return changed ? out : null;
}
// viền: trắng/sáng mờ → xám
function borderColor(v) {
  let changed = false;
  const out = v.replace(COLOR_RE, (c) => {
    const x = parseColor(c); if (!x) return c;
    const [, s] = toHsl(x);
    if (lum(x) > 0.7 && s < 0.25) { changed = true; return x.a < 1 ? `rgba(15,23,42,${+(Math.min(0.9, x.a * 0.9 + 0.08)).toFixed(3)})` : "#d9e0ea"; }
    if (lum(x) < 0.25) { changed = true; return "#d9e0ea"; }
    return c;
  });
  return changed ? out : null;
}

// ——— đọc CSS (luật thường + @media) ———
function splitDecls(body) {
  const out = []; let depth = 0, cur = "";
  for (const ch of body) {
    if (ch === "(") depth++; else if (ch === ")") depth--;
    if (ch === ";" && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((d) => { const i = d.indexOf(":"); return i < 0 ? null : [d.slice(0, i).trim(), d.slice(i + 1).trim()]; }).filter(Boolean);
}
function* rules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  const block = (start) => { let d = 0; for (let j = start; j < css.length; j++) { if (css[j] === "{") d++; else if (css[j] === "}") { d--; if (!d) return j; } } return css.length; };
  while (i < css.length) {
    const o = css.indexOf("{", i); if (o < 0) break;
    const sel = css.slice(i, o).trim(), end = block(o);
    if (sel.startsWith("@media") || sel.startsWith("@supports")) { for (const r of rules(css.slice(o + 1, end))) yield { ...r, media: sel }; }
    else if (!sel.startsWith("@")) yield { sel, body: css.slice(o + 1, end) };
    i = end + 1;
  }
}
const prefix = (sel) => sel.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (/^(:root|html)\b/.test(s) ? null : `${P} ${s}`)).filter(Boolean).join(",");

// bỏ qua: phiếu luyện viết (giấy trắng sẵn, trừ thẻ danh sách), hộp tra từ / ngữ pháp (nền sáng sẵn), bảng viết nét, màn gacha,
// nhãn chữ trắng trên nền màu và thẻ ghi chú giấy trong phần Học theo sách
const SKIP_SEL = /\.kw(?!card|words|list|bar|nav)|\.vngpop|\.vndock|\.kpad|\.wfx|\.rv\b|\.shop|\.bkn\b|\.bkk\b|\.bkgrp|\.bkcando|\.bknote|\.bkjp mark|\.bkcdstars|\.bkm|\.bkflower|\.fl-|\.bkex \.|\.bkorderans\.|\.bkchoices b/;
let out = `/* TỰ SINH bởi scripts/build-plain-css.mjs — không sửa tay (chỉnh ở app/plain.css) */\n`, n = 0;
for (const f of fs.readdirSync(APP).filter((f) => f.endsWith(".css") && !f.startsWith("plain"))) {
  for (const { sel, body, media } of rules(fs.readFileSync(path.join(APP, f), "utf8"))) {
    if (SKIP_SEL.test(sel)) continue;
    const ps = prefix(sel); if (!ps) continue;
    const decls = [];
    for (const [p, v] of splitDecls(body)) {
      let nv = null;
      if (p === "color") nv = textColor(v);
      else if (p === "background" || p === "background-color" || p === "background-image") nv = bgColor(v);
      else if (/^border(-(top|right|bottom|left))?(-color)?$/.test(p) || p === "outline") nv = borderColor(v);
      else if (p === "text-shadow" && v !== "none") nv = "none";
      if (nv) decls.push(`${p}:${nv}`);
    }
    if (!decls.length) continue;
    const r = `${ps}{${decls.join(";")}}`;
    out += media ? `${media}{${r}}\n` : `${r}\n`; n++;
  }
}
fs.writeFileSync(path.join(APP, "plain.auto.css"), out);
console.log(`plain.auto.css: ${n} luật`);
