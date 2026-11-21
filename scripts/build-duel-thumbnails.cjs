const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const root = path.join("public", "shiki-duel");
async function main() {
  for (const folder of ["gi", "v2"]) {
    const source = path.join(root, folder);
    const target = path.join(root, "thumb-v1", folder);
    const ids = folder === "gi"
      ? require("../data/genshin.json").characters.map((card) => card.id)
      : require("../data/genshin-duel-v2.json").map((card) => card.id);
    await fs.mkdir(target, { recursive: true });
    let before = 0, after = 0;
    for (const id of ids) {
      const name = id + ".webp";
      const original = await fs.readFile(path.join(source, name));
      const thumbnail = await sharp(original).resize({ width: 192, withoutEnlargement: true })
        .webp({ quality: 70, alphaQuality: 75, effort: 5 }).toBuffer();
      await fs.writeFile(path.join(target, name), thumbnail);
      before += original.length;
      after += thumbnail.length;
    }
    console.log(folder, ids.length, before, after);
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
