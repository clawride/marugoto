"use client";
// Cấu hình giao diện cho từng khóa học dùng khung chung (Hub / bài / boss / thi)
import { ZhongliHost, ZhongliHero, ZL, ZHONGLI } from "@/components/Zhongli";
import { NahidaHost, NahidaHero, ND, NAHIDA } from "@/components/Nahida";
import { FurinaHost, FurinaHero, FU, FURINA } from "@/components/Furina";
import { VentiHost, VentiHero, VT, VENTI } from "@/components/Venti";
import { RaidenHost, RaidenHero, RD, RAIDEN } from "@/components/Raiden";
import { MavuikaHost, MavuikaHero, MV, MAVUIKA } from "@/components/Mavuika";
import { A22_EXAM, AB1_EXAM, A1_EXAM, A21_EXAM, B12_EXAM } from "@/components/examConfigs";
import { B11_AUDIO, A22_AUDIO, AB1_AUDIO, A1_AUDIO, A21_AUDIO, A21R_AUDIO, A21C_AUDIO, NO_AUDIO } from "@/lib/audioLib";
import { A22 } from "@/lib/a22";
import { AB1 } from "@/lib/ab1";
import { A1C } from "@/lib/a1";
import { A21C } from "@/lib/a21";
import { B12 } from "@/lib/b12";

// lối vào Phiếu luyện viết Kanji của cấp (hiện ở trang tổng khóa học)
const sheetLink = (lv, name) => [{ href: `/kanji/phieu?lv=${lv}`, title: `📝 Phiếu luyện viết Kanji ${name}`, sub: "Phiếu theo Topic như phiếu giấy của lớp: tô chữ mờ, viết vào ô kẻ, viết cách đọc & chữ Hán phần gạch chân — có chấm điểm, in được" }];

export const A22_COURSE = {
  store: "a22", C: A22, base: "/a22", title: "Marugoto A2-2",
  unit: "Bài", unitTag: (L) => `TOPIC ${L.topic} · ${L.topicTitle} · だい${L.lesson}か`,
  audio: A22_AUDIO, folder: "New Marugoto A2-2 audio",
  Host: NahidaHost, Hero: NahidaHero, lines: ND, char: NAHIDA, hostName: "Nahida",
  exam: A22_EXAM,
  // Học theo sách 初級2 A2 かつどう (📖) và りかい (📘) — public/book/a22/<bài>.json, public/book/a22-rikai/<bài>.json
  // audio chung một thư mục, tách theo thư mục con: "Katsudou/004.mp3" · "Rikai/004.mp3"
  books: [
    { key: "book", ico: "📖", short: "Katsudou", name: "Sách Katsudou · まるごと初級2 A2 かつどう", url: (n) => `/book/a22/${n}.json`, prefix: "Katsudou/" },
    { key: "rikai", ico: "📘", short: "Rikai", name: "Sách Rikai · まるごと初級2 A2 りかい", url: (n) => `/book/a22-rikai/${n}.json`, prefix: "Rikai/", check: "/a22/nihongo-check", checkPages: "194–199" },
  ],
  // テストとふりかえり: Katsudou (app/a22/test/[n]) và Rikai (app/a22/rtest/[n]) sau Topic 5 và Topic 9
  bookTests: [{ n: 1, after: 5, topics: "1–5", page: 87 }, { n: 2, after: 9, topics: "6–9", page: 138 }],
  rikaiTests: [{ n: 1, after: 5, topics: "1–5", page: 101 }, { n: 2, after: 9, topics: "6–9", page: 168 }],
  extra: [...sheetLink("a22", "A2-2"), { href: "/a22/nihongo-check", title: "✅ にほんごチェック · sách Rikai", sub: "Tự kiểm tra các câu cơ bản (きほんぶん) và câu hỏi 「日本語で 言いましょう」 của từng bài — tự chấm sao, ghi nhận xét như trang 194–199 của sách" }],
};

export const AB1_COURSE = {
  store: "ab1", C: AB1, base: "/ab1", title: "Marugoto A2/B1",
  unit: "Topic", unitTag: (L) => `TOPIC ${L.topic} · 初中級 A2/B1`,
  audio: AB1_AUDIO, folder: "Marugoto A2B1 Audio",
  Host: FurinaHost, Hero: FurinaHero, lines: FU, char: FURINA, hostName: "Furina",
  exam: AB1_EXAM,
  // Học theo sách 初中級 A2/B1 (một cuốn): public/book/ab1/<Topic>.json — audio mỗi Topic một thư mục, số track tính riêng
  books: [
    { key: "book", ico: "📖", short: "初中級", name: "Sách まるごと 初中級 A2/B1", url: (n) => `/book/ab1/${n}.json`, prefix: (n) => `MarugotoPre-IntermediateMp3Topic${n}/#` },
  ],
  // テストとふりかえり: 会話テスト (app/ab1/test/[n]) và 読解・文法テスト (app/ab1/rtest/[n]) sau Topic 5 và Topic 9
  bookTests: [{ n: 1, after: 5, topics: "1–5", page: 74, tag: "THEO SÁCH · テストとふりかえり · 会話テスト", desc: "Can-do チェック · 会話テスト (câu hỏi + thẻ tình huống)" }, { n: 2, after: 9, topics: "6–9", page: 116, tag: "THEO SÁCH · テストとふりかえり · 会話テスト", desc: "Can-do チェック · 会話テスト (câu hỏi + thẻ tình huống)" }],
  rikaiTests: [{ n: 1, after: 5, topics: "1–5", page: 160, tag: "THEO SÁCH · テストとふりかえり · 読解・文法テスト", desc: "Câu hỏi mẫu 読解・文法テスト y như sách (đọc blog, đọc Kanji, chia dạng, sắp xếp, trợ từ) · bài luyện thêm cùng dạng · ふりかえり" }, { n: 2, after: 9, topics: "6–9", page: 161, tag: "THEO SÁCH · テストとふりかえり · 読解・文法テスト", desc: "Câu hỏi mẫu 読解・文法テスト y như sách (đọc blog, đọc Kanji, chia dạng, sắp xếp, trợ từ) · bài luyện thêm cùng dạng · ふりかえり" }],
  extra: sheetLink("ab1", "A2/B1"),
};

export const A1_COURSE = {
  store: "a1", C: A1C, base: "/a1", title: "Marugoto A1",
  unit: "Bài", unitTag: (L) => `TOPIC ${L.topic} · ${L.topicTitle} · だい${L.lesson}か`,
  audio: A1_AUDIO, folder: "new marugoto A1 (chứa Audio Katsudou và Audio Rikai)",
  partLabels: { kanji: "Chữ & Kanji" },
  Host: VentiHost, Hero: VentiHero, lines: VT, char: VENTI, hostName: "Venti",
  exam: A1_EXAM,
  // Học theo sách: dựng lại sách 入門 かつどう (📖) và りかい (📘) từng bài — public/book/a1/<bài>.json, public/book/a1-rikai/<bài>.json
  // key = khóa thẻ trong bài & khóa lưu sao ("book" giữ cho Katsudou); prefix = tên file audio của sách (sa060.mp3 / sc054.mp3)
  books: [
    { key: "book", ico: "📖", short: "Katsudou", name: "Sách Katsudou · まるごと入門 A1 かつどう", url: (n) => `/book/a1/${n}.json`, prefix: "sa" },
    { key: "rikai", ico: "📘", short: "Rikai", name: "Sách Rikai · まるごと入門 A1 りかい", url: (n) => `/book/a1-rikai/${n}.json`, prefix: "sc", check: "/a1/nihongo-check", checkPages: "194–197" },
  ],
  book: { name: "Sách Katsudou · まるごと入門 A1 かつどう", short: "Katsudou", url: (n) => `/book/a1/${n}.json`, prefix: "sa" },
  // テストとふりかえり của sách: sau Topic 5 và Topic 9 (app/a1/test/[n])
  bookTests: [{ n: 1, after: 5, topics: "1–5", page: 71 }, { n: 2, after: 9, topics: "6–9", page: 114 }],
  // テストとふりかえり của sách Rikai (app/a1/rtest/[n]) và にほんごチェック (app/a1/nihongo-check)
  rikaiTests: [{ n: 1, after: 5, topics: "1–5", page: 99 }, { n: 2, after: 9, topics: "6–9", page: 165 }],
  extra: [...sheetLink("a1", "A1"), { href: "/a1/nihongo-check", title: "✅ にほんごチェック · sách Rikai", sub: "Tự kiểm tra 57 câu cơ bản (きほんぶん) và các câu hỏi 「にほんごで いいましょう」 của từng bài — tự chấm sao, ghi nhận xét như trang 194–197 của sách" }],
};

export const A21_COURSE = {
  store: "a21", C: A21C, base: "/a21", title: "Marugoto A2-1",
  unit: "Bài", unitTag: (L) => `TOPIC ${L.topic} · ${L.topicTitle} · だい${L.lesson}か`,
  audio: A21C_AUDIO,
  audioSetups: [{ lib: A21_AUDIO, folder: "New A2-1 Katsudou audio" }, { lib: A21R_AUDIO, folder: "New A2-1 Rikai audio" }],
  Host: RaidenHost, Hero: RaidenHero, lines: RD, char: RAIDEN, hostName: "Raiden Shogun",
  exam: A21_EXAM,
  // Học theo sách 初級1 A2 かつどう (📖) và りかい (📘) — public/book/a21/<bài>.json, public/book/a21-rikai/<bài>.json
  // mỗi sách một thư mục audio riêng; file audio tra theo số track của sách ("#004.mp3" → 004_1_2_1[1].mp3)
  books: [
    { key: "book", ico: "📖", short: "Katsudou", name: "Sách Katsudou · まるごと初級1 A2 かつどう", url: (n) => `/book/a21/${n}.json`, prefix: "#", lib: A21_AUDIO, folder: "New A2-1 Katsudou audio" },
    { key: "rikai", ico: "📘", short: "Rikai", name: "Sách Rikai · まるごと初級1 A2 りかい", url: (n) => `/book/a21-rikai/${n}.json`, prefix: "#", lib: A21R_AUDIO, folder: "New A2-1 Rikai audio", check: "/a21/nihongo-check", checkPages: "196–201" },
  ],
  // テストとふりかえり của sách: Katsudou (app/a21/test/[n]) và Rikai (app/a21/rtest/[n]) sau Topic 5 và Topic 9
  bookTests: [{ n: 1, after: 5, topics: "1–5", page: 86 }, { n: 2, after: 9, topics: "6–9", page: 140 }],
  rikaiTests: [{ n: 1, after: 5, topics: "1–5", page: 101 }, { n: 2, after: 9, topics: "6–9", page: 168 }],
  extra: [...sheetLink("a21", "A2-1"), { href: "/a21/nihongo-check", title: "✅ にほんごチェック · sách Rikai", sub: "Tự kiểm tra các câu cơ bản (きほんぶん) và câu hỏi 「日本語で 言いましょう」 của từng bài — tự chấm sao, ghi nhận xét như trang 196–201 của sách" }],
};

export const B12_COURSE = {
  store: "b12", C: B12, base: "/b12", title: "Marugoto B1-2",
  unit: "Bài", unitTag: (L) => `TOPIC ${L.topic} · ${L.topicTitle} · ${L.lesson % 2 ? "準備・PART 1–2" : "PART 3–5"}`,
  audio: NO_AUDIO, audioSetups: [],
  Host: MavuikaHost, Hero: MavuikaHero, lines: MV, char: MAVUIKA, hostName: "Mavuika",
  exam: B12_EXAM,
  extra: sheetLink("b12", "B1-2"),
};

// Học Viện B1-1 (trang riêng /b1): chỉ dùng phần "Học theo sách 中級1" — public/book/b11/<Topic>.json
export const B11_BOOK_COURSE = {
  store: "b1", base: "/b1", title: "Học Viện B1-1",
  audio: B11_AUDIO, folder: "Marugoto 中級1 audio",
  Host: ZhongliHost, Hero: ZhongliHero, lines: { ...ZL, order: ZL.grammar }, char: ZHONGLI, hostName: "Zhongli",
  books: [{ key: "book", ico: "📖", short: "中級1", name: "Sách まるごと 中級1 B1-1", url: (n) => `/book/b11/${n}.json`, prefix: "#" }],
};
