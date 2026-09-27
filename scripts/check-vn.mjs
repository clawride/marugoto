// Kiểm tra file truyện nhân vật public/vn/<id>.json đúng khuôn (dùng khi viết truyện mới)
//   node scripts/check-vn.mjs 10000023            → kiểm tra một nhân vật
//   node scripts/check-vn.mjs --rank 4            → kiểm tra mọi nhân vật 4★ đã có file
//   node scripts/check-vn.mjs                     → kiểm tra tất cả
// Lỗi (✗) phải sửa; cảnh báo (⚠) nên xem lại.
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const VN = path.join(ROOT, "public", "vn");
const G = JSON.parse(fs.readFileSync(path.join(VN, "grammar.json"), "utf8"));
const GI = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "genshin.json"), "utf8"));
const vnSrc = fs.readFileSync(path.join(ROOT, "lib", "vn.js"), "utf8");
const SCENES = new Set([...vnSrc.slice(vnSrc.indexOf("export const SCENES")).matchAll(/(?:"([a-z-]+)"|\b([a-z]+)):\s*\[/g)].map((m) => m[1] || m[2]));
const MOODS = new Set(["calm", "happy", "sad", "angry", "surprised", "shy", "serious"]);
const REGIONS = new Set(["mondstadt", "liyue", "inazuma", "sumeru", "fontaine", "natlan", "snezhnaya", "nod-krai", "other"]);
const TIER_OK = { 1: ["a1"], 2: ["a1", "a21", "a22"], 3: ["a1", "a21", "a22", "ab1", "b1", "b12"] };
const castSrc = fs.readFileSync(path.join(ROOT, "lib", "voiceCast.js"), "utf8");

export function check(file) {
  const E = [], W = [];
  let D;
  try { D = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { E: [`JSON lỗi: ${e.message}`], W }; }
  const id = +path.basename(file, ".json");
  const c = GI.characters.find((x) => x.id === id);
  if (D.id !== id) E.push(`id ${D.id} ≠ tên file ${id}`);
  if (!c) E.push(`không có nhân vật id ${id} trong data/genshin.json`);
  if (!D.name || typeof D.name !== "string") E.push("thiếu name (tên tiếng Nhật)");
  if (!Array.isArray(D.names) || !D.names.includes(D.name)) E.push("names phải là mảng tên riêng và có chứa name");
  if (!REGIONS.has(D.region)) E.push(`region không hợp lệ: ${D.region}`);

  const txt = (t, where) => {
    for (const k of ["1", "2", "3"]) {
      const x = t?.[k];
      if (!x || typeof x.jp !== "string" || !x.jp.trim() || typeof x.ro !== "string" || !x.ro.trim() || typeof x.vi !== "string" || !x.vi.trim()) { E.push(`${where}: thiếu jp/ro/vi ở mức ${k}`); continue; }
      if (/[぀-ヿ一-鿿]/.test(x.ro)) E.push(`${where} mức ${k}: romaji có chữ Nhật`);
      if (!/[぀-ヿ一-鿿]/.test(x.jp)) E.push(`${where} mức ${k}: jp không có chữ Nhật`);
      if (/[぀-ヿ一-鿿]/.test(x.vi)) W.push(`${where} mức ${k}: phụ đề tiếng Việt có chữ Nhật`);
    }
    if (t?.["1"]?.jp === t?.["3"]?.jp) W.push(`${where}: câu mức A1 và B1 giống hệt nhau`);
  };
  const gram = (g, where) => {
    for (const k of ["1", "2", "3"]) {
      const a = g?.[k];
      if (!Array.isArray(a)) { E.push(`${where}: thiếu g mức ${k} (mảng thẻ ngữ pháp)`); continue; }
      if (!a.length) { W.push(`${where}: không có thẻ ngữ pháp mức ${k} (chỉ nên để trống với câu cảm thán rất ngắn)`); continue; }
      for (const gid of a) {
        if (!G[gid]) E.push(`${where}: thẻ ngữ pháp không tồn tại "${gid}"`);
        else if (!TIER_OK[k].includes(gid.split("-")[0])) E.push(`${where}: thẻ "${gid}" vượt trình độ mức ${k}`);
      }
    }
  };
  const speakers = new Set();

  if (!Array.isArray(D.chapters) || D.chapters.length !== 7) E.push(`cần đúng 7 chương (C0–C6), đang có ${D.chapters?.length}`);
  for (const [ci, C] of (D.chapters || []).entries()) {
    const w = `C${C.c}`;
    if (C.c !== ci) E.push(`${w}: số chương phải là ${ci}`);
    if (!C.title?.jp || !C.title?.vi) E.push(`${w}: thiếu title.jp/title.vi`);
    if (!C.summary || C.summary.length < 20) E.push(`${w}: thiếu summary (tóm tắt tiếng Việt)`);
    if (!SCENES.has(C.bg)) E.push(`${w}: bg không có trong SCENES: ${C.bg}`);
    const N = C.nodes || [];
    if (N.length < 10 || N.length > 22) W.push(`${w}: ${N.length} câu (nên 12–18)`);
    const by = new Map();
    for (const n of N) { if (by.has(n.id)) E.push(`${w}: trùng id ${n.id}`); by.set(n.id, n); }
    let forks = 0, ends = 0, charLines = 0;
    for (const n of N) {
      const wn = `${w}/${n.id}`;
      if (!n.sp) E.push(`${wn}: thiếu sp`); else speakers.add(n.sp);
      if (n.sp === "char") charLines++;
      if (n.mood && !MOODS.has(n.mood)) E.push(`${wn}: mood không hợp lệ ${n.mood}`);
      if (n.bg && !SCENES.has(n.bg)) E.push(`${wn}: bg không có trong SCENES: ${n.bg}`);
      txt(n.t, wn); gram(n.g, wn);
      const kinds = [!!n.next, !!n.choices, !!n.end].filter(Boolean).length;
      if (kinds !== 1) E.push(`${wn}: phải có đúng một trong next / choices / end`);
      if (n.next && !by.has(n.next)) E.push(`${wn}: next trỏ tới câu không có ${n.next}`);
      if (n.end) ends++;
      if (n.choices) {
        forks++;
        if (n.choices.length < 2 || n.choices.length > 3) E.push(`${wn}: cần 2–3 lựa chọn`);
        for (const [i, ch] of n.choices.entries()) {
          txt(ch.t, `${wn}/lựa chọn ${i + 1}`); gram(ch.g, `${wn}/lựa chọn ${i + 1}`);
          if (!by.has(ch.next)) E.push(`${wn}/lựa chọn ${i + 1}: next trỏ tới câu không có ${ch.next}`);
        }
      }
    }
    if (!ends) E.push(`${w}: không có câu kết thúc (end: true)`);
    if (!forks) E.push(`${w}: cần ít nhất 1 điểm lựa chọn`);
    if (charLines < 3) W.push(`${w}: nhân vật chính (sp "char") nói quá ít (${charLines} câu)`);
    // mọi câu đi tới được từ câu đầu, và từ mọi câu đều đi tới được một kết thúc
    if (N.length) {
      const nx = (n) => [n.next, ...(n.choices || []).map((c) => c.next)].filter(Boolean);
      const seen = new Set([N[0].id]), q = [N[0].id];
      while (q.length) for (const k of nx(by.get(q.shift()) || {})) if (!seen.has(k)) { seen.add(k); q.push(k); }
      for (const n of N) if (!seen.has(n.id)) E.push(`${w}/${n.id}: không đi tới được từ câu đầu`);
      const good = new Set(N.filter((n) => n.end).map((n) => n.id));
      for (let changed = true; changed;) { changed = false; for (const n of N) if (!good.has(n.id) && nx(n).some((k) => good.has(k))) { good.add(n.id); changed = true; } }
      for (const n of N) if (!good.has(n.id)) E.push(`${w}/${n.id}: đi vào ngõ cụt (không tới được kết thúc)`);
    }
  }

  if (!Array.isArray(D.chat) || D.chat.length !== 4) E.push(`cần đúng 4 chủ đề trò chuyện, đang có ${D.chat?.length}`);
  const tids = new Set();
  for (const [ti, T] of (D.chat || []).entries()) {
    const w = `Trò chuyện ${ti + 1}`;
    if (!T.id || tids.has(T.id)) E.push(`${w}: thiếu id hoặc trùng`); tids.add(T.id);
    if (!T.title) E.push(`${w}: thiếu title`);
    if (!Array.isArray(T.turns) || T.turns.length < 2 || T.turns.length > 4) E.push(`${w}: cần 2–4 lượt (thường 3)`);
    for (const [ui, tu] of (T.turns || []).entries()) {
      const wu = `${w}/lượt ${ui + 1}`;
      txt(tu.t, wu); gram(tu.g, wu);
      if (!Array.isArray(tu.opts) || tu.opts.length < 2 || tu.opts.length > 3) E.push(`${wu}: cần 2–3 câu trả lời`);
      for (const [oi, o] of (tu.opts || []).entries()) {
        txt(o.t, `${wu}/trả lời ${oi + 1}`); gram(o.g, `${wu}/trả lời ${oi + 1}`);
        txt(o.r, `${wu}/nhân vật đáp ${oi + 1}`); gram(o.rg, `${wu}/nhân vật đáp ${oi + 1}`);
      }
    }
  }
  // người nói phụ phải có giọng trong bảng phân vai (lib/voiceCast.js)
  for (const sp of speakers) {
    if (["char", "trav", "paimon", "narr"].includes(sp)) continue;
    if (!castSrc.includes(`${sp}:`) && !castSrc.includes(`"${sp}":`)) W.push(`người nói "${sp}" chưa có giọng trong lib/voiceCast.js (CAST)`);
  }
  return { E, W, D };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const a = process.argv.slice(2);
  const rank = a.includes("--rank") ? +a[a.indexOf("--rank") + 1] : 0;
  const ids = a.filter((x) => /^\d+$/.test(x) && x.length > 3);
  let files = ids.length ? ids.map((i) => path.join(VN, `${i}.json`)) : fs.readdirSync(VN).filter((f) => /^\d+\.json$/.test(f)).map((f) => path.join(VN, f));
  if (rank) files = files.filter((f) => GI.characters.find((c) => c.id === +path.basename(f, ".json"))?.rank === rank);
  let bad = 0;
  for (const f of files) {
    if (!fs.existsSync(f)) { console.log(`✗ ${path.basename(f)}: chưa có file`); bad++; continue; }
    const { E, W, D } = check(f);
    const nodes = (D?.chapters || []).reduce((a, C) => a + (C.nodes?.length || 0), 0);
    console.log(`${E.length ? "✗" : "✓"} ${path.basename(f)} ${D?.name || ""} · ${nodes} câu · ${E.length} lỗi, ${W.length} cảnh báo`);
    for (const e of E.slice(0, 40)) console.log("   ✗", e);
    if (E.length > 40) console.log(`   … và ${E.length - 40} lỗi nữa`);
    for (const x of W.slice(0, 15)) console.log("   ⚠", x);
    if (E.length) bad++;
  }
  console.log(bad ? `\n${bad} file có lỗi` : `\nTất cả ${files.length} file đều đạt`);
  process.exit(bad ? 1 : 0);
}
