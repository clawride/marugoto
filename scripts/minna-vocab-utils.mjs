// Normalize spelling for source-index coverage (kana/katakana, spacing and suffix markers).
export const vocabKey = (s = "") => s.normalize("NFKC")
  .replace(/^ー/, "")
  .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
  .replace(/[\s。、！？!?〜~～・「」（）()….,―－：:／/\[\]【】]/g, "");

export function indexWord(entry) {
  const clean = (s = "") => s.replace(/\[[^\]]*[~〜～][^\]]*\]/g, "")
    .replace(/\[([^\]]*)\]/g, "$1").replace(/[~～]/g, "〜").replace(/[。？?！!]+$/g, "").trim();
  return { jp: clean(entry.w) || clean(entry.h), kana: clean(entry.h) };
}

export function matchingVocab(entry, vocab) {
  const { jp, kana } = indexWord(entry);
  const keys = new Set([jp, kana].map(vocabKey));
  return vocab.find((v) => [v.jp, v.kana, ...(v.aliases || [])].some((w) => w && keys.has(vocabKey(w))));
}
