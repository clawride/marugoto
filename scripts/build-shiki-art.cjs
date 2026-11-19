// Build non-destructive, individually framed views of the original album JPEGs.
// Run from the project: node scripts/build-shiki-art.cjs "<Bo-the-Shikihime directory>"
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const catalog = require("../data/shikihime.json");

const album = process.argv[2];
const output = path.resolve(__dirname, "../public/shiki-duel");
const W = 900, H = 571;
const pixels = W * H;
// Printed card corners in the album layout. The figure can extend past any edge.
const corners = [[472, 0], [790, 37], [728, 569], [409, 531]];
// Right-hand limit through the sprite strip. Coordinates follow visible feet,
// robes and weapons on sheets where a sprite touches the main drawing.
const spriteLimits = {
  "24": [[460,756],[515,756],[523,749],[538,743],[550,747],[561,735]],
  "25": [[462,748],[515,752],[524,748],[532,736]],
  "26": [[442,800],[465,789],[473,781],[477,760],[481,749],[513,740]],
  "34": [[450,753],[476,761],[488,762],[497,750],[502,735]],
  "36": [[463,752],[475,759],[492,758],[507,752],[520,736]],
  "45": [[442,817],[461,811],[469,784],[475,768],[484,759],[490,736]],
  "51": [[454,801],[470,822],[478,828],[489,813],[498,805],[527,815],[537,803],[540,736]],
  "52": [[452,752],[474,761],[492,760],[502,748],[506,736]],
  "54": [[449,778],[465,767],[477,743],[482,735]],
  "63": [[449,758],[467,763],[487,775],[499,787],[518,817],[527,842],[538,811],[541,736]],
  "64": [[448,768],[463,762],[483,751],[502,738],[514,732]],
  "66": [[438,890],[451,880],[458,867],[466,862],[474,846],[484,839],[490,811],[494,771],[513,738]],
};
function spriteLimit(key, y) {
  const points = spriteLimits[key] || [];
  if (!points.length) return y < 445 ? W : 732;
  if (y < points[0][0]) return W;
  for (let i = 1; i < points.length; i++) {
    const [y0, x0] = points[i - 1], [y1, x1] = points[i];
    if (y <= y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0);
  }
  return 732;
}
function onCard(x, y) {
  return corners.every(([ax, ay], i) => {
    const [bx, by] = corners[(i + 1) % 4];
    return (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= -350;
  });
}
async function build() {
  const entries = JSON.parse(await fs.readFile(path.join(album, "nguon-anh.json"), "utf8")).characters;
  if (entries.length !== catalog.length || !catalog.every((c) => entries.some((e) => e.id === c.id))) throw Error("Album and game IDs differ");
  for (const entry of entries) {
    entry.jpeg = await fs.readFile(path.join(album, entry.local));
    const raw = await sharp(entry.jpeg).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    if (raw.info.width !== W || raw.info.height !== H || raw.info.channels !== 3) throw Error(entry.local);
    entry.rgb = raw.data;
  }
  // Outside the printed frame all 36 sheets use the same cream paper and clouds.
  // Find an actual background sample per pixel, rejecting darker foreground ink.
  const paper = Buffer.alloc(pixels * 3), sample = new Uint16Array(entries.length);
  const frame = Buffer.alloc(pixels);
  for (let p = 0; p < pixels; p++) {
    const x = p % W, y = Math.floor(p / W);
    if (onCard(x, y)) { frame[p] = 255; continue; }
    for (let k = 0; k < entries.length; k++) {
      const rgb = entries[k].rgb, j = p * 3;
      sample[k] = (rgb[j] + rgb[j+1] + rgb[j+2]) * 64 + k;
    }
    sample.sort();
    const k = sample[Math.floor(entries.length * 0.65)] % 64;
    entries[k].rgb.copy(paper, p * 3, p * 3, p * 3 + 3);
  }
  await fs.mkdir(output, { recursive: true });
  for (const entry of entries) {
    const mask = Buffer.from(frame);
    const limits = Array.from({ length: H }, (_, y) => spriteLimit(entry.key, y));
    for (let p = 0; p < pixels; p++) {
      if (mask[p]) continue;
      const x = p % W, y = Math.floor(p / W);
      // The labels at upper left and two separate sprite samples at lower right
      // are album annotations, outside the main illustration.
      if ((x < 325 && y < 96) || x > limits[y]) continue;
      const j = p * 3;
      const diff = Math.max(...[0,1,2].map((c) => Math.abs(entry.rgb[j+c] - paper[j+c])));
      if (diff >= 17) mask[p] = 255;
    }
    // Close narrow outline gaps before tracing the exterior paper. This keeps
    // light ribbons, white sleeves and highlights inside the figure opaque.
    const closed = await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
      .greyscale().dilate(1).erode(1).raw().toBuffer();
    const queue = new Int32Array(pixels);
    let head = 0, tail = 0;
    function visit(p) { if (!closed[p]) { closed[p] = 96; queue[tail++] = p; } }
    for (let x = 0; x < W; x++) { visit(x); visit((H - 1) * W + x); }
    for (let y = 1; y < H - 1; y++) { visit(y * W); visit(y * W + W - 1); }
    while (head < tail) {
      const p = queue[head++], x = p % W;
      if (x) visit(p - 1);
      if (x < W - 1) visit(p + 1);
      if (p >= W) visit(p - W);
      if (p + W < pixels) visit(p + W);
    }
    // Discard isolated JPEG specks, keeping even small detached petals.
    const visited = Buffer.alloc(pixels);
    for (let p = 0; p < pixels; p++) {
      if (closed[p] === 96 || visited[p]) continue;
      head = 0; tail = 1; queue[0] = p; visited[p] = 1;
      while (head < tail) {
        const i = queue[head++], x = i % W, y = Math.floor(i / W);
        for (let yy = Math.max(0,y-1); yy <= Math.min(H-1,y+1); yy++) {
          for (let xx = Math.max(0,x-1); xx <= Math.min(W-1,x+1); xx++) {
            const at = yy*W + xx;
            if (!visited[at] && closed[at] !== 96) { visited[at] = 1; queue[tail++] = at; }
          }
        }
      }
      if (tail < 18) for (let i = 0; i < tail; i++) closed[queue[i]] = 96;
    }
    let left = W, right = 0, top = H, bottom = 0;
    for (let p = 0; p < pixels; p++) {
      closed[p] = closed[p] === 96 ? 0 : 255;
      if (!closed[p]) continue;
      const x = p % W, y = Math.floor(p / W);
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    const alpha = await sharp(closed, { raw: { width: W, height: H, channels: 1 } })
      .greyscale().blur(0.45).raw().toBuffer();
    const full = await sharp(entry.jpeg).joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
    await sharp(full).extract({ left, top, width: right-left+1, height: bottom-top+1 })
      .extend({ top: 3, bottom: 3, left: 3, right: 3, background: "#0000" })
      .webp({ quality: 88, alphaQuality: 100, effort: 5 }).toFile(path.join(output, entry.id + ".webp"));
  }
}
build().catch((e) => { console.error(e); process.exitCode = 1; });
