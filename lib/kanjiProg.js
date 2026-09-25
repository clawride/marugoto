// Chương trình Chữ Hán (Kazuha): chữ Hán gom từ vốn từ của mọi cấp Marugoto A1 → B1-2.
// Dữ liệu: data/kanji/meta.json (cấp độ, bài, chỉ mục nhỏ), data/kanji/lv-<cấp>.json (chi tiết), public/kanji/strokes-<cấp>.json (nét).
// Chỉ dạy nghĩa tiếng Việt, không dùng âm Hán Việt.
// Nguồn: KANJIDIC2 (EDRDG, CC BY-SA 4.0) cho âm đọc/số nét · KanjiVG (Ulrich Apel, CC BY-SA 3.0) cho nét và cấu tạo.
import META from "@/data/kanji/meta.json";
import COMPS from "@/data/kanji/comps.json";
import { shuffle, pickRand } from "@/lib/data";

export const KLEVELS = META.levels; // [{id, name, full, ico, lessons:[{n, k:"…", t:[topics]}]}]
export const KIDX = META.idx; // { 漢: [nghĩa, cấp, bài] }
export { COMPS };
export const K_TOTAL = Object.keys(KIDX).length;
export const PARTS = [
  { key: "learn", ico: "📜", vi: "Học chữ", scored: false },
  { key: "write", ico: "✍️", vi: "Tập viết" },
  { key: "memo", ico: "🧠", vi: "Ghi nhớ" },
  { key: "read", ico: "📖", vi: "Tập đọc" },
  { key: "sent", ico: "✏️", vi: "Đặt câu" },
  { key: "guess", ico: "🔮", vi: "Đoán chữ" },
];
export const SCORED = PARTS.filter((p) => p.scored !== false).map((p) => p.key);
export const levelOf = (id) => KLEVELS.find((l) => l.id === id);
export const lessonOf = (lv, n) => levelOf(lv)?.lessons.find((L) => L.n === +n);
export const lessonKey = (lv, n) => `${lv}-${n}`;

const LOAD = {
  a1: () => import("@/data/kanji/lv-a1.json"),
  a21: () => import("@/data/kanji/lv-a21.json"),
  a22: () => import("@/data/kanji/lv-a22.json"),
  ab1: () => import("@/data/kanji/lv-ab1.json"),
  b1: () => import("@/data/kanji/lv-b1.json"),
  b12: () => import("@/data/kanji/lv-b12.json"),
};
const cache = {}, sCache = {};
export async function loadLevel(lv) {
  if (!cache[lv]) cache[lv] = LOAD[lv]().then((m) => m.default || m);
  return cache[lv];
}
export async function loadStrokes(lv) {
  if (!sCache[lv]) sCache[lv] = fetch(`/kanji/strokes-${lv}.json`).then((r) => r.json()).catch(() => ({}));
  return sCache[lv];
}

// ===== tiện ích chữ =====
export const toHira = (s) => (s || "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
export const kunParts = (r) => { const t = r.replace(/-/g, ""); const i = t.indexOf("."); return i < 0 ? [t, ""] : [t.slice(0, i), t.slice(i + 1)]; };
export const kunPlain = (r) => kunParts(r).join("");
export const readingsOf = (E) => [...new Set([...(E.on || []).map(toHira), ...(E.kun || []).map((r) => kunParts(r)[0])])].filter(Boolean);
export const compName = (el) => COMPS[el]?.name || el;
// Tập chữ đã học tính đến bài của chữ k (mọi bài trước trong chương trình + bài hiện tại)
const learnedCache = {};
export function learnedFor(k) {
  const I = KIDX[k];
  if (!I) return null;
  const key = `${I[1]}-${I[2]}`;
  if (learnedCache[key]) return learnedCache[key];
  const set = new Set();
  outer: for (const L of KLEVELS) for (const les of L.lessons) { [...les.k].forEach((c) => set.add(c)); if (L.id === I[1] && les.n === I[2]) break outer; }
  return (learnedCache[key] = set);
}
// Lọc các danh sách chữ ví dụ trong một câu (vd "…: 海, 酒, 泳."): chỉ giữ chữ đã học; không còn chữ nào thì bỏ cả cụm ví dụ
export function onlyLearned(text, set, keep = []) {
  if (!text || !set) return text || "";
  const ok = (c) => set.has(c) || keep.includes(c);
  return text
    .replace(/(\s*(?:của|như|:)\s*)?([一-鿿](?:\s*[,、・]\s*[一-鿿])*)/g, (m, pre, list) => {
      const ks = list.split(/\s*[,、・]\s*/);
      if (ks.length === 1 && ok(ks[0])) return m;
      const kept = ks.filter(ok);
      return kept.length ? (pre || "") + kept.join(", ") : "";
    })
    .replace(/\(\s*\)/g, "").replace(/\s+([.,;)])/g, "$1").replace(/:\s*\./g, ".").replace(/\s{2,}/g, " ").trim();
}
// "bộ nước (ba chấm) · nước" — không lặp lại nghĩa nếu tên đã có; set = chữ đã học (lọc chữ ví dụ trong tên)
export const compLabel = (el, set) => { const n = onlyLearned(compName(el), set, [el]) || compName(el), v = COMPS[el]?.vi; return v && !n.includes(v) ? `${n} (${v})` : n; };

// ===== câu hỏi =====
const uniq = (a) => [...new Set(a.filter(Boolean))];
const mc = (sub, prompt, answer, wrongs, extra = {}) => {
  const w = uniq(wrongs).filter((x) => x !== answer);
  if (w.length < 3) return null;
  return { sub, prompt, answer, opts: shuffle([answer, ...w.slice(0, 3)]), ...extra }; // wrongs: phương án nhiễu tốt nhất đứng trước
};
const vis = (E) => E.vi;
const kOf = (E) => E.k;

// Chữ gây nhiễu: giống mặt chữ (similar) → cùng thành phần → cùng cấp
function lookAlikes(E, pool) {
  const sim = (E.similar || []).map((s) => s.k).filter((k) => KIDX[k]);
  const els = new Set((E.comps || []).map((c) => c.el).filter(Boolean));
  const share = pool.filter((x) => x.k !== E.k && (x.comps || []).some((c) => els.has(c.el))).map(kOf);
  return uniq([...sim, ...shuffle(share), ...shuffle(pool.map(kOf))]).filter((k) => k !== E.k);
}

// 🧠 Ghi nhớ: chữ → nghĩa · nghĩa → chữ · nghĩa của từ chứa chữ · mẹo nhớ → chữ
export function memoQs(lesson, pool, n = 12) {
  const qs = [];
  const list = shuffle([...lesson, ...shuffle(lesson).slice(0, Math.max(0, n - lesson.length))]).slice(0, n);
  list.forEach((E, i) => {
    const kind = (i + Math.floor(i / Math.max(1, lesson.length))) % 4; // chữ lặp lại → đổi dạng câu
    const others = shuffle(pool.filter((x) => x.k !== E.k));
    const exp = `${E.k} — ${E.vi}. ${E.mnemonic || ""}`;
    let q = null;
    if (kind === 0) q = mc("Chữ này nghĩa là gì?", E.k, E.vi, [...(E.similar || []).map((s) => KIDX[s.k]?.[0]), ...others.map(vis)], { jpPrompt: true, explain: exp });
    else if (kind === 1) q = mc("Chọn chữ Hán có nghĩa này", E.vi, E.k, lookAlikes(E, pool), { jpOpts: true, explain: exp });
    else if (kind === 2) {
      // nghĩa của một từ có chứa chữ đang học
      const w = pickRand(E.words || []);
      const wrong = shuffle(pool.filter((x) => x.k !== E.k).flatMap((x) => (x.words || []).map((y) => y.vi)));
      q = w ? mc(`Từ này nghĩa là gì? (chữ ${E.k} = ${E.vi})`, w.w, w.vi, wrong, { jpPrompt: true, explain: `${w.w} (${w.r || w.w}) — ${w.vi}. ${exp}` })
        : mc("Chữ này nghĩa là gì?", E.k, E.vi, others.map(vis), { jpPrompt: true, explain: exp });
    }
    else {
      const m = (E.mnemonic || "").split(E.k).join("□");
      q = m.length > 8 ? mc("Mẹo nhớ này nói về chữ nào?", `“${m}”`, E.k, lookAlikes(E, pool), { jpOpts: true, explain: exp })
        : mc("Chữ này nghĩa là gì?", E.k, E.vi, others.map(vis), { jpPrompt: true, explain: exp });
    }
    if (q) qs.push(q);
  });
  return qs;
}

// 📖 Tập đọc: đọc từ · đọc chữ trong từ · nghe chọn từ · âm On/Kun
export function readQs(lesson, pool, n = 12) {
  const qs = [];
  const allWords = pool.flatMap((E) => (E.words || []).map((w) => ({ ...w, k: E.k })));
  lesson.forEach((E, i) => {
    const ws = shuffle(E.words || []);
    const w = ws[0], w2 = ws[1];
    const rd = readingsOf(E);
    if (w) {
      const r = w.r || w.w;
      // cách đọc sai: thay phần đọc của chữ bằng cách đọc khác của chính chữ đó
      const alt = shuffle(rd.filter((x) => x !== w.kr).map((x) => r.replace(w.kr, x)));
      const q = mc(`Đọc từ này · “${w.vi}”`, w.w, r, [...alt, ...shuffle(allWords.filter((x) => x.w !== w.w)).map((x) => x.r || x.w)],
        { jpPrompt: true, jpOpts: true, explain: `${w.w} đọc là ${r}: chữ ${E.k} ở đây đọc “${w.kr}”. ${E.tip || ""}` });
      if (q) qs.push(q);
    }
    if (w2 && w2.w.length > 1) {
      const marked = w2.w.replace(E.k, `【${E.k}】`);
      const q = mc(`Trong từ này, chữ ${E.k} đọc là gì? · “${w2.vi}”`, marked, w2.kr, [...shuffle(rd), ...shuffle(pool.flatMap(readingsOf))],
        { jpPrompt: true, jpOpts: true, explain: `${w2.w} (${w2.r || w2.w}) — ${E.k} đọc “${w2.kr}”. Các cách đọc của ${E.k}: ${[...(E.on || []), ...(E.kun || []).map(kunPlain)].join("、")}.` });
      if (q) qs.push(q);
    }
    if (i % 3 === 2 && w) {
      const q = mc("Nghe và chọn từ đúng", "🔊", w.w, shuffle(allWords.filter((x) => x.w !== w.w && (x.r || x.w) !== (w.r || w.w))).map((x) => x.w),
        { listen: w.r || w.w, jpOpts: true, explain: `Từ vừa nghe: ${w.w} (${w.r || w.w}) — ${w.vi}.` });
      if (q) qs.push(q);
    }
  });
  return shuffle(qs).slice(0, n);
}

// ✏️ Đặt câu: điền từ vào câu · chọn đúng chữ Hán cho từ · sắp xếp câu
export function sentQs(lesson, pool, n = 12) {
  const qs = [];
  const allWords = uniq(pool.flatMap((E) => (E.words || []).map((w) => w.w)));
  lesson.forEach((E, i) => {
    const [a, b] = shuffle(E.ex || []);
    if (a && a.jp.includes(a.w)) {
      const wr = shuffle(allWords.filter((x) => x !== a.w && !a.jp.includes(x)));
      if (wr.length >= 3) qs.push({ type: "fill", q: a.jp.replace(a.w, "（　）"), vi: a.vi, answer: a.w, opts: shuffle([a.w, ...wr.slice(0, 3)]), explain: `${a.jp} — ${a.vi}` });
    }
    if (b && b.chunks?.length >= 3) qs.push({ type: "order", chunks: b.chunks, vi: b.vi, jp: b.jp });
    // chọn chữ đúng: câu có từ viết bằng kana → chọn cách viết chữ Hán đúng
    const w = (E.words || []).find((x) => x.w.includes(E.k) && x.r && (E.ex || []).some((e) => e.w === x.w));
    const e = w && (E.ex || []).find((x) => x.w === w.w);
    if (e && i % 2 === 0) {
      const fakes = lookAlikes(E, pool).slice(0, 6).map((k) => w.w.replace(E.k, k));
      const q = mc("Chọn chữ Hán đúng cho phần gạch chân", e.jp.replace(w.w, `［${w.r}］`), w.w, fakes, { jpPrompt: true, jpOpts: true, explain: `${w.w} (${w.r}) — ${w.vi}. ${E.k}: ${E.vi}.` });
      if (q) qs.push({ type: "mc", ...q });
    }
  });
  return shuffle(qs).slice(0, n);
}

// ===== 🔮 Đoán chữ: mẹo đoán âm/nghĩa khi chỉ nhớ một phần =====
export function stripTone(s) { return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase(); }

export function guessQs(lesson, pool, learned, n = 10) {
  const qs = [];
  const onPool = uniq(pool.flatMap((x) => x.on || []));
  lesson.forEach((E) => {
    // 1) thanh phù: chữ cùng họ đọc giống nhau
    const F = E.fam;
    const famOn = F ? uniq([...(F.phonOn || []), ...(F.members || []).flatMap((m) => m.on || [])]) : [];
    const hit = (E.on || []).find((o) => famOn.includes(o));
    if (F && hit) {
      const ex = (F.members || []).filter((m) => (m.on || []).includes(hit)).slice(0, 3).map((m) => `${m.k}(${hit})`).join("、");
      const q = mc(`Chữ ${E.k} có phần biểu âm ${F.phon}. Đoán âm On của ${E.k}`, `${F.phon}${F.phonOn?.length ? ` đọc ${F.phonOn[0]}` : ""}${ex ? ` · cùng họ: ${ex}` : ""}`, hit,
        shuffle(onPool.filter((o) => !famOn.includes(o))), { jpOpts: true, explain: `${E.k} đọc ${hit}: chữ có phần ${F.phon} thường đọc giống ${F.phon}. ${E.tip || ""}` });
      if (q) qs.push(q);
    }
    // 2) bộ chỉ nghĩa → đoán nghĩa
    const rad0 = (E.comps || []).find((c) => c.rad && COMPS[c.el]?.vi) || (E.radical && COMPS[E.radical]?.vi ? { el: E.radical } : null);
    // chỉ hỏi khi bộ thật sự chỉ nghĩa: chữ hình thanh (có phần chỉ âm) + bộ chỉ nghĩa phổ biến; chữ tự nó là bộ → bỏ
    const rad = rad0 && rad0.el !== E.k && COMPS[rad0.el]?.hint && (E.comps || []).some((c) => c.phon) ? rad0 : null;
    if (rad) {
      const others = pool.filter((x) => x.k !== E.k && !(x.comps || []).some((c) => c.el === rad.el) && x.radical !== rad.el);
      const q = mc(`Chữ ${E.k} có ${compLabel(rad.el, learned)}. Nghĩa nào hợp nhất?`, E.k, E.vi, shuffle(others).map(vis),
        { jpPrompt: true, explain: `${E.k} = ${E.vi}. ${onlyLearned(COMPS[rad.el].hint || "", learned, [rad.el, E.k])} ${E.explain || ""}` });
      if (q) qs.push(q);
    }
  });
  // 3) từ ghép: biết nghĩa từng chữ → đoán nghĩa cả từ
  const comp = uniq(lesson.flatMap((E) => (E.words || []).filter((w) => /^[一-鿿]{2}$/.test(w.w) && !/địa danh|tên riêng|tên người/i.test(w.vi) && [...w.w].every((c) => learned.has(c))).map((w) => JSON.stringify(w))))
    .map((s) => JSON.parse(s));
  const allComp = pool.flatMap((E) => (E.words || []).filter((w) => /^[一-鿿]{2}$/.test(w.w)));
  shuffle(comp).slice(0, 4).forEach((w) => {
    const parts = [...w.w].map((c) => `${c} (${KIDX[c]?.[0] || ""})`).join(" + ");
    const q = mc(`Đoán nghĩa từ ghép ${w.w}`, parts, w.vi, shuffle(allComp.filter((x) => x.w !== w.w)).map((x) => x.vi),
      { explain: `${w.w} (${w.r}) = ${[...w.w].map((c) => KIDX[c]?.[0] || c).join(" + ")} → ${w.vi}.` });
    if (q) qs.push(q);
  });
  // 4) từ ghép Hán thường đọc âm On: đoán cách đọc, nhiễu = ghép các cách đọc khác của hai chữ
  const byK = Object.fromEntries(pool.map((x) => [x.k, x]));
  shuffle(comp).slice(0, 4).forEach((w) => {
    const [a, b] = [...w.w].map((c) => byK[c]);
    if (!a || !b || !w.r) return;
    const onA = (a.on || []).map(toHira), onB = (b.on || []).map(toHira);
    if (!onA.some((x) => onB.some((y) => x + y === w.r))) return; // chỉ hỏi khi từ thật sự đọc theo âm On của hai chữ
    const combos = readingsOf(a).flatMap((x) => readingsOf(b).map((y) => x + y)).filter((x) => x !== w.r);
    const on = (E) => (E.on || []).map(toHira).join("・") || "—";
    const q = mc(`Đoán cách đọc từ ghép ${w.w} (${w.vi})`, `${a.k}: On ${on(a)} · ${b.k}: On ${on(b)}`, w.r, shuffle(combos),
      { jpOpts: true, explain: `${w.w} đọc ${w.r}. Từ gồm hai chữ Hán, không có kana đi kèm, thường đọc bằng âm On của từng chữ.` });
    if (q) qs.push(q);
  });
  return shuffle(qs).slice(0, n);
}

// Kiểm tra cả cấp: trộn mọi dạng trên các chữ ngẫu nhiên của cấp
export function testQs(levelEntries, learned) {
  const pick = shuffle(levelEntries).slice(0, 16);
  const a = memoQs(pick.slice(0, 8), levelEntries, 8);
  const b = readQs(pick.slice(4, 12), levelEntries, 8);
  const c = sentQs(pick.slice(8, 16), levelEntries, 6).filter((q) => q.type !== "order");
  const d = guessQs(pick, levelEntries, learned, 8);
  return shuffle([...a, ...b, ...c, ...d]).slice(0, 30);
}

export const kanjiHost = (host, line) => ({ ...host, line });
export { pickRand };
