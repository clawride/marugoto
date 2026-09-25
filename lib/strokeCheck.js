// Chấm nét chữ viết tay so với nét mẫu KanjiVG (toạ độ 0–109).
// Mỗi nét được lấy mẫu thành N điểm cách đều, so sánh theo: thứ tự, chiều viết, hình dạng/vị trí, độ dài.
export const N = 24;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lenOf = (pts) => pts.slice(1).reduce((s, p, i) => s + dist(p, pts[i]), 0);

// Lấy mẫu lại một nét tay (mảng điểm) thành N điểm cách đều theo độ dài
export function resample(pts, n = N) {
  if (pts.length < 2) return Array.from({ length: n }, () => pts[0] || [0, 0]);
  const total = lenOf(pts), step = total / (n - 1), out = [pts[0]];
  let acc = 0, i = 1, prev = pts[0];
  while (out.length < n - 1 && i < pts.length) {
    const d = dist(prev, pts[i]);
    if (acc + d >= step && d > 0) {
      const t = (step - acc) / d;
      const q = [prev[0] + t * (pts[i][0] - prev[0]), prev[1] + t * (pts[i][1] - prev[1])];
      out.push(q); prev = q; acc = 0;
    } else { acc += d; prev = pts[i]; i++; }
  }
  while (out.length < n) out.push(pts[pts.length - 1]);
  return out;
}

// Lấy mẫu nét mẫu từ chuỗi path SVG (chạy trên trình duyệt)
let svgHost = null;
export function samplePath(d, n = N) {
  if (typeof document === "undefined") return [];
  if (!svgHost) {
    svgHost = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgHost.setAttribute("width", "0"); svgHost.setAttribute("height", "0");
    svgHost.style.position = "absolute"; svgHost.style.visibility = "hidden";
    document.body.appendChild(svgHost);
  }
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", d); svgHost.appendChild(p);
  const L = p.getTotalLength();
  const pts = Array.from({ length: n }, (_, i) => { const q = p.getPointAtLength((L * i) / (n - 1)); return [q.x, q.y]; });
  svgHost.removeChild(p);
  return pts;
}

const meanDist = (a, b) => a.reduce((s, p, i) => s + dist(p, b[i]), 0) / a.length;
const bbox = (strokes) => {
  const all = strokes.flat();
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
const dirWord = (dx, dy) => {
  const h = Math.abs(dx) > 6 ? (dx > 0 ? "sang phải" : "sang trái") : "";
  const v = Math.abs(dy) > 6 ? (dy > 0 ? "xuống dưới" : "lên trên") : "";
  return [v, h].filter(Boolean).join(" và ");
};

// Chấm 1 nét: user = điểm tay đã lấy mẫu, tpl = mảng các nét mẫu đã lấy mẫu, k = nét đang chờ
// Trả về { ok, level: "good"|"ok"|"bad", msg, matchIndex }
export function checkStroke(user, tpl, k, done = []) {
  const T = tpl[k];
  const fwd = meanDist(user, T), rev = meanDist(user, [...T].reverse());
  const uLen = lenOf(user), tLen = lenOf(T);
  if (fwd < 9) return { ok: true, level: "good", msg: "Nét đẹp!", score: 100 - fwd * 2 };
  if (rev < 12 && rev < fwd * 0.7) return { ok: false, level: "bad", msg: `Nét ${k + 1} viết ngược chiều — hãy bắt đầu từ đầu kia.` };
  // nét này khớp với một nét khác chưa viết → sai thứ tự
  for (let j = 0; j < tpl.length; j++) {
    if (j === k || done.includes(j)) continue;
    if (meanDist(user, tpl[j]) < 11) return { ok: false, level: "bad", msg: `Đây là nét ${j + 1}, chưa tới lượt. Hãy viết nét ${k + 1} trước.`, matchIndex: j };
  }
  if (fwd < 15) {
    const tips = [];
    const ds = dist(user[0], T[0]), de = dist(user[user.length - 1], T[T.length - 1]);
    if (ds > 9) tips.push(`điểm đầu lệch ${dirWord(user[0][0] - T[0][0], user[0][1] - T[0][1])}`);
    if (de > 9) tips.push(`điểm cuối lệch ${dirWord(user.at(-1)[0] - T.at(-1)[0], user.at(-1)[1] - T.at(-1)[1])}`);
    if (uLen < tLen * 0.7) tips.push("nét hơi ngắn");
    if (uLen > tLen * 1.35) tips.push("nét hơi dài");
    return { ok: true, level: "ok", msg: tips.length ? `Được — nhưng ${tips.join(", ")}.` : "Được, hãy viết mượt hơn một chút.", score: 100 - fwd * 3 };
  }
  const hint = [];
  if (uLen < tLen * 0.55) hint.push("nét quá ngắn");
  else if (uLen > tLen * 1.6) hint.push("nét quá dài");
  if (dist(user[0], T[0]) > 14) hint.push(`bắt đầu sai chỗ (lệch ${dirWord(user[0][0] - T[0][0], user[0][1] - T[0][1])})`);
  return { ok: false, level: "bad", msg: `Nét ${k + 1} chưa đúng hình dạng${hint.length ? ": " + hint.join(", ") : ""}. Xem nét mẫu rồi viết lại.` };
}

// Chấm cả chữ viết tự do: căn khung chữ tay theo khung chữ mẫu để chấm HÌNH DÁNG, chấm riêng ĐỘ CÂN ĐỐI (vị trí, cỡ chữ)
export function checkWhole(userStrokes, tpl) {
  const res = { strokes: [], notes: [] };
  if (!userStrokes.length) return { ...res, score: 0, shape: 0, balance: 0, notes: ["Chưa viết nét nào."] };
  const ub = bbox(userStrokes), tb = bbox(tpl);
  const uw = Math.max(ub.x1 - ub.x0, 8), uh = Math.max(ub.y1 - ub.y0, 8), tw = Math.max(tb.x1 - tb.x0, 8), th = Math.max(tb.y1 - tb.y0, 8);
  const s = Math.min(tw / uw, th / uh);
  const cxu = (ub.x0 + ub.x1) / 2, cyu = (ub.y0 + ub.y1) / 2, cxt = (tb.x0 + tb.x1) / 2, cyt = (tb.y0 + tb.y1) / 2;
  const norm = userStrokes.map((st) => st.map(([x, y]) => [cxt + (x - cxu) * s, cyt + (y - cyu) * s]));
  if (userStrokes.length !== tpl.length) res.notes.push(`Chữ này có ${tpl.length} nét, bạn viết ${userStrokes.length} nét.`);
  let sum = 0;
  for (let k = 0; k < tpl.length; k++) {
    const u = norm[k];
    if (!u) { res.strokes.push({ level: "miss", msg: `Thiếu nét ${k + 1}.` }); continue; }
    const r = checkStroke(u, tpl, k, []);
    const sc = r.level === "good" ? Math.min(100, r.score) : r.level === "ok" ? Math.max(55, r.score) : 20;
    sum += sc;
    res.strokes.push({ level: r.level, msg: r.msg });
  }
  const shape = Math.round(sum / tpl.length) - Math.max(0, userStrokes.length - tpl.length) * 10;
  // độ cân đối: cỡ chữ và tâm chữ so với mẫu (mẫu chiếm ~70–80% ô)
  let balance = 100;
  const sizeRatio = Math.max(uw / tw, uh / th);
  if (sizeRatio < 0.7) { balance -= 25; res.notes.push("Chữ hơi nhỏ — hãy viết to, chiếm khoảng 3/4 ô vuông."); }
  else if (sizeRatio > 1.25) { balance -= 20; res.notes.push("Chữ hơi to, tràn gần mép ô — thu nhỏ lại một chút."); }
  const off = Math.hypot(cxu - cxt, cyu - cyt);
  if (off > 10) { balance -= Math.min(30, off); res.notes.push(`Chữ đang lệch ${dirWord(cxu - cxt, cyu - cyt)} — hãy đặt chữ vào giữa ô, dùng đường chữ thập làm mốc.`); }
  const ar = (uw / uh) / (tw / th);
  if (ar < 0.75) { balance -= 15; res.notes.push("Chữ bị hẹp (dài quá) — mở rộng bề ngang."); }
  else if (ar > 1.33) { balance -= 15; res.notes.push("Chữ bị bè (rộng quá) — thu hẹp bề ngang."); }
  balance = Math.max(0, Math.round(balance));
  const score = Math.max(0, Math.min(100, Math.round(shape * 0.75 + balance * 0.25)));
  return { ...res, score, shape: Math.max(0, shape), balance };
}
