// Readings follow the printed paragraph or cell, including Japanese words wrapped across PDF lines.
const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]/u;
const unit = /(?:[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー〆ヶ。、，！？「」『』・（）／〜～％℃０-９Ａ-Ｚａ-ｚ]|[0-9]+(?:[.:/][0-9]+)*(?:cm|mm|mg|L|%|X)?|(?<!\p{Script=Latin})(?:SpO2|JCS-?|AED|CPR|FAST|ADL|BP|HR|Dr|PT|ST|OT|\[[A-Z]\]|[A-Z])(?!\p{Script=Latin})|×)/u.source;
const passage = new RegExp(unit + "+(?:[ \\t]+" + unit + "+)*", "gu");

export function japanesePassages(text) {
  return Array.from(text.matchAll(passage)).filter(m => japanese.test(m[0]));
}

export function readingBlocks(text) {
  const blocks = [];
  let paragraph = [], table = [];
  function flushText() {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  }
  function flushTable() {
    if (table.length) blocks.push({ type: "table", rows: table.filter(row => !/^\|[\s|:-]+$/.test(row))
      .map(row => row.replace(/^\||\|$/g, "").split("|").map(cell => cell.trim())) });
    table = [];
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("|")) {
      flushText();
      table.push(line);
    } else if (line && table.length && !table.at(-1).endsWith("|")) {
      table[table.length - 1] += " " + line;
    } else {
      flushTable();
      if (!line) { flushText(); continue; }
      if (/^(?:CHƯƠNG |PHỤ LỤC |MỤC \d|THẺ \d|MẪU \d|Case \d|Tình huống \d|\d+\.\d+\.)/.test(line)) {
        flushText();
        blocks.push({ type: "h4", text: line });
        continue;
      }
      if (/^(?:\*|>|[-•]|\d+[.)]|Q\d+:|A:|Nhóm \d)/.test(line)) flushText();
      paragraph.push(line);
    }
  }
  flushText();
  flushTable();
  return blocks;
}
