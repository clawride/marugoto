"use client";
// Phiên âm Latinh (romaji) cho các đoạn tiếng Nhật trong phần giải thích.
// Kana: đổi trực tiếp. Chữ Hán: tra từ điển public/romaji-dict.json (scripts/build-romaji.mjs) — từ nhiều chữ khớp dài nhất trước,
// chữ Hán đứng một mình hiện các cách đọc On/Kun chính. Đoạn nào không đọc chắc chắn được thì bỏ qua (không đoán sai).
import { useEffect, useState } from "react";
import { toRomaji as transliterate } from "wanakana";

const foreignSounds = { "でぃ": "di", "てぃ": "ti", "ふぁ": "fa", "ふぃ": "fi", "ふぇ": "fe", "ふぉ": "fo", "うぃ": "wi", "うぇ": "we", "うぉ": "wo", "しぇ": "she", "ちぇ": "che", "じぇ": "je", "とぅ": "tu", "どぅ": "du" };
const toRomaji = (text) => ({ "こんにちは": "konnichiwa", "こんばんは": "konbanwa" }[text] || transliterate(text, { customRomajiMapping: foreignSounds }));

const JP = /[぀-ヿ㐀-鿿々ー〜]+/g;
const HAS_KANJI = /[㐀-鿿々]/;
const IS_KANA = /[぀-ヿー]/;

let dict = null, wait = null;
export function loadRomajiDict() {
  if (dict) return Promise.resolve(dict);
  wait ||= fetch("/romaji-dict.json").then((r) => (r.ok ? r.json() : { w: {}, k: {} })).catch(() => ({ w: {}, k: {} })).then((d) => (dict = d));
  return wait;
}
export function useRomajiDict() {
  const [d, setD] = useState(dict);
  useEffect(() => { if (!dict) { let on = true; loadRomajiDict().then((x) => on && setD(x)); return () => { on = false; }; } }, []);
  return d;
}

// Một đoạn tiếng Nhật liên tục → romaji, hoặc null nếu có chữ Hán không tra được
export function romajiOfSegment(seg, D) {
  if (!HAS_KANJI.test(seg)) return toRomaji(seg);
  const cs = [...seg];
  if (cs.length === 1) { const r = D.k[seg]; return r ? r.map(toRomaji).join(" / ") : null; }
  const parts = [];
  let i = 0;
  while (i < cs.length) {
    if (IS_KANA.test(cs[i])) { // okurigana / kana: gom đến chữ Hán kế tiếp
      let j = i; while (j < cs.length && IS_KANA.test(cs[j])) j++;
      parts.push(toRomaji(cs.slice(i, j).join(""))); i = j; continue;
    }
    let hit = null;
    for (let len = Math.min(10, cs.length - i); len >= 2; len--) { const w = cs.slice(i, i + len).join(""); if (D.w[w]) { hit = [len, D.w[w]]; break; } }
    if (!hit) return null;
    parts.push(toRomaji(hit[1])); i += hit[0];
  }
  return parts.join(" ");
}

// Văn bản → [{ seg, rom }] cho mọi đoạn tiếng Nhật đọc được (bỏ trùng, tối đa max đoạn)
export function annotate(text, D, max = 10) {
  const out = [], seen = new Set();
  for (const m of String(text || "").matchAll(JP)) {
    const seg = m[0];
    if (seen.has(seg) || /^[ー〜]+$/.test(seg)) continue;
    seen.add(seg);
    const rom = romajiOfSegment(seg, D);
    if (rom) out.push({ seg, rom });
    if (out.length >= max) break;
  }
  return out;
}
