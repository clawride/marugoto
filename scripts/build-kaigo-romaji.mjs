// Rebuild after editing the Tài Kaigo reader or its practice material.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { japanesePassages, readingBlocks } from "../lib/kaigoText.js";
import { bookById, lessonName } from "../lib/library.js";

const require = createRequire(import.meta.url);
const { init, furi } = require("./lib/furi.cjs");
const root = fileURLToPath(new URL("../", import.meta.url));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const book = bookById("kaigo-jiko");
const source = new Set(), practice = new Set(), known = new Map();
function collect(value, dest) {
  if (typeof value === "string") {
    for (const match of japanesePassages(value)) dest.add(match[0]);
  } else if (Array.isArray(value)) {
    value.forEach(v => collect(v, dest));
  }
}
for (const section of Object.values(read("data/readings/kaigo-jiko.json"))) {
  for (const page of section) {
    for (const block of readingBlocks(page.text)) collect(block.text || block.rows, source);
  }
}
for (const l of book.lessons) {
  const data = read("data/library/kaigo-jiko/" + String(l.n).padStart(2, "0") + ".json");
  for (const v of [...data.vocab, ...data.terms]) known.set(v.w, v.ro);
  known.set(l.jp, l.ro);
  known.set(lessonName(book, l.n), "dai " + ["ikka","nika","sanka","yonka","goka","rokka","nanaka","hakka","kyuuka","jukka","juu ikka","juu nika"][l.n-1]);
  collect([l.jp, lessonName(book,l.n), data.scene, data.goals, data.know, data.discuss, data.tips], practice);
  for (const g of data.grammar) collect([g.form, g.use, g.notes], practice);
}
for (const x of book.extras) {
  collect(x.jp, practice);
  if (x.id === "tu-vung") continue;
  const extra = read("data/library/kaigo-jiko/x-" + x.id + ".json");
  for (const b of extra.blocks) collect([b.h,b.head,b.rows,b.p], practice);
}
collect([book.sub,book.title,"あいうえお"],practice);
known.set(book.title,book.titleRo);
const corrections = read("scripts/lib/kaigo-readings.json");
const terms = Object.keys(corrections).sort((a,b)=>b.length-a.length);
const escape = s => s.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g, "\\$&");
const correctedTerms = new RegExp(terms.map(escape).join("|"),"gu");
const wanakana = require("wanakana");
await init();
function romanize(original) {
  const text = original.normalize("NFKC").replace(/\s+/g,"").replace(/[⼠]/g,"士");
  if (known.has(text)) return known.get(text);
  // Protect specialist terms while tokenizing the rest of the sentence in context.
  const replacements = [];
  const fixed = text.replace(correctedTerms, term => {
    const marker = "QZX" + String.fromCharCode(65 + replacements.length) + "XZQ";
    const kana = wanakana.toKatakana(corrections[term]);
    replacements.push([marker, wanakana.toRomaji(kana, { customRomajiMapping: { "でぃ":"di", "てぃ":"ti" } })]);
    return " " + marker + " ";
  });
  let result = furi(fixed.trim(),{noCap:true}).ro.trim();
  for (const [marker, ro] of replacements) result = result.replace(marker, ro);
  result = result.replace(/^yoo(?=\s|$)/,"sama").replace(/^toshi (?=juugatsu)/,"nen ").replace(/\( +/g,"(");
  if (!/[a-z]/i.test(result) || /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(result))
    throw new Error("Missing Latin reading for " + original + " -> " + result);
  return result;
}
for (const [file, keys] of [["source",source],["practice",practice]]) {
  const dict = Object.fromEntries([...keys].sort().map(key => [key,romanize(key)]));
  fs.writeFileSync(path.join(root,"data/readings/kaigo-romaji-"+file+".json"), JSON.stringify(dict,null,2)+"\n");
  console.log(file + ": " + keys.size + " readings");
}
