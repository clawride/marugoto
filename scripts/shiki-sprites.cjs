// Sinh public/shiki/<id>-f.png (nhìn trước) và <id>-b.png (nhìn sau): tách model chibi ở góc ảnh thẻ Shikihime.
// Chạy (cần sharp và thư mục ảnh thẻ F:/Bo-the-Shikihime): node scripts/shiki-sprites.cjs public/shiki
// Tách model chibi (f = nhìn trước, b = nhìn sau) ở góc thẻ → PNG nền trong suốt (phóng 2× kiểu pixel)
// 1) flood-fill từ mép xóa nền giấy sáng ít màu · 2) chỉ giữ khối lớn nhất + các mảnh nằm trong khung của nó (bỏ mảng tranh lấn vào)
const sharp = require("sharp"), fs = require("fs");
const d = require("F:/Bo-the-Shikihime/nguon-anh.json");
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const BOX = { f: { left: 742, top: 432, width: 70, height: 104 }, b: { left: 823, top: 432, width: 70, height: 104 } };
(async () => {
  for (const c of d.characters) for (const [k, box] of Object.entries(BOX)) {
    const { data, info } = await sharp("F:/Bo-the-Shikihime/" + c.local).extract(box).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const bg = (i) => { const r = data[i], g = data[i + 1], b = data[i + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx > 160 && mx - mn < 80 && r >= b; };
    const seen = new Uint8Array(W * H), st = [];
    for (let x = 0; x < W; x++) { st.push([x, 0], [x, H - 1]); } for (let y = 0; y < H; y++) { st.push([0, y], [W - 1, y]); }
    while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= W || y >= H) continue; const j = y * W + x; if (seen[j]) continue; seen[j] = 1; if (!bg(j * 4)) continue; data[j * 4 + 3] = 0; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
    // xóa viền bục hình thoi (đỉnh ~0.68H ở giữa, xuống ~0.86H ở hai mép), giữ vùng chân ở giữa
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = Math.abs(x - W / 2) / (W / 2), line = H * (0.66 + 0.2 * dx);
      const i = (y * W + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const pedestal = r >= b && g >= b - 10 && mx > 90 && mx - mn < 110 && !(r > 150 && g < 90); // be/vàng nhạt/ô-liu của bục (không phải đỏ/đen/xanh)
      if (y >= line - 3 && dx > 0.2 && pedestal) data[i + 3] = 0;
      if (y >= H * 0.9 && dx > 0.14 && pedestal) data[i + 3] = 0;
    }
    // khối liên thông của điểm còn hiện
    const lab = new Int32Array(W * H).fill(-1), comps = [];
    for (let j = 0; j < W * H; j++) {
      if (data[j * 4 + 3] === 0 || lab[j] >= 0) continue;
      const id = comps.length, q = [j]; lab[j] = id; let n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
      while (q.length) { const p = q.pop(), x = p % W, y = (p / W) | 0; n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const nj = ny * W + nx; if (lab[nj] < 0 && data[nj * 4 + 3] !== 0) { lab[nj] = id; q.push(nj); } } }
      comps.push({ n, x0, x1, y0, y1 });
    }
    // khối chính = khối lớn nhất có tâm ở giữa ảnh
    const mid = comps.map((c, i) => ({ ...c, i })).filter((c) => (c.x0 + c.x1) / 2 > W * 0.25 && (c.x0 + c.x1) / 2 < W * 0.75).sort((a, b) => b.n - a.n)[0];
    const keep = new Set(comps.map((c, i) => i).filter((i) => {
      const cc = comps[i]; if (!mid) return true; if (i === mid.i) return true;
      const touchEdge = cc.x0 === 0 || cc.x1 === W - 1 || cc.y0 === 0;
      const inside = cc.x0 >= mid.x0 - 4 && cc.x1 <= mid.x1 + 4 && cc.y0 >= mid.y0 - 6 && cc.y1 <= mid.y1 + 4;
      return inside && !touchEdge;
    }));
    for (let j = 0; j < W * H; j++) if (lab[j] >= 0 && !keep.has(lab[j])) data[j * 4 + 3] = 0;
    await sharp(data, { raw: { width: W, height: H, channels: 4 } }).resize(W * 2, H * 2, { kernel: "nearest" }).png({ compressionLevel: 9, palette: true }).toFile(`${out}/${c.id}-${k}.png`);
  }
  console.log("ok");
})();
