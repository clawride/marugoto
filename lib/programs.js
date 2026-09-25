// Danh sách chương trình học — MỘT nguồn duy nhất cho menu và trang chủ, xếp từ cấp thấp đến cấp cao
const AV = (icon) => `https://gi.yatta.moe/assets/UI/UI_AvatarIcon_${icon}.png`;
const starsIn = (p) => Object.values(p || {}).reduce((a, x) => a + (x?.stars || 0), 0);
const passed = (ex) => Object.values(ex || {}).filter((e) => e?.passed).length;

// progress(S) → { stars?, certs?, certMax?, text? }
export const PROGRAMS = [
  // ===== Bắt đầu =====
  { id: "kana", group: "start", href: "/kana", ico: "あ", lv: "Bước đầu", jp: "かな", name: "Bảng Chữ Cái", host: "Klee", avatar: AV("Klee"), color: "255,150,110",
    desc: "Chữ mềm & chữ cứng: luyện viết có sửa nét, âm đục, âm ghép, trường âm, âm ngắt", progress: (S) => ({ stars: starsIn(S.kana?.p) }) },
  // ===== Lộ trình Marugoto theo cấp =====
  { id: "a1", group: "path", href: "/a1", ico: "🍃", lv: "A1", jp: "入門", name: "Marugoto A1", host: "Venti", avatar: AV("Venti"), color: "110,220,190",
    desc: "18 bài nhập môn · từ vựng, nghe, chữ, đọc, ngữ pháp · boss mỗi Topic", progress: (S) => ({ stars: starsIn(S.a1?.p), certs: passed(S.a1?.ex), certMax: 2 }) },
  { id: "a21", group: "path", href: "/a21", ico: "⚡", lv: "A2-1", jp: "初級1", name: "Marugoto A2-1", host: "Raiden Shogun", avatar: AV("Shougun"), color: "170,130,240",
    desc: "18 bài sơ cấp 1 · nghe hội thoại, kanji, đọc, ngữ pháp · boss mỗi Topic", progress: (S) => ({ stars: starsIn(S.a21?.p), certs: passed(S.a21?.ex), certMax: 2 }) },
  { id: "a22", group: "path", href: "/a22", ico: "🌱", lv: "A2-2", jp: "初級2", name: "Marugoto A2-2", host: "Nahida", avatar: AV("Nahida"), color: "126,200,90",
    desc: "18 bài sơ cấp 2 · nghe hội thoại, kanji, đọc, ngữ pháp · boss mỗi Topic", progress: (S) => ({ stars: starsIn(S.a22?.p), certs: passed(S.a22?.ex), certMax: 2 }) },
  { id: "ab1", group: "path", href: "/ab1", ico: "🌊", lv: "A2/B1", jp: "初中級", name: "Marugoto A2/B1", host: "Furina", avatar: AV("Furina"), color: "110,170,240",
    desc: "9 Topic sơ trung cấp · nghe hội thoại, kanji, đọc, ngữ pháp · boss mỗi Topic", progress: (S) => ({ stars: starsIn(S.ab1?.p), certs: passed(S.ab1?.ex), certMax: 2 }) },
  { id: "b1", group: "path", href: "/b1", ico: "🎓", lv: "B1-1", jp: "中級1", name: "Học Viện B1-1", host: "Zhongli", avatar: AV("Zhongli"), color: "240,185,60",
    desc: "9 Topic trung cấp 1 · ngữ pháp, bài đọc dài, bài nghe · thi kiểu JLPT", progress: (S) => ({ certs: passed(S.b1?.ex), certMax: 3 }) },
  { id: "b12", group: "path", href: "/b12", ico: "🔥", lv: "B1-2", jp: "中級2", name: "Marugoto B1-2", host: "Mavuika", avatar: AV("Mavuika"), color: "255,120,70",
    desc: "18 bài trung cấp 2 · từ vựng từng Part, nghe, kanji, đọc, ngữ pháp · 3 kỳ thi", progress: (S) => ({ stars: starsIn(S.b12?.p), certs: passed(S.b12?.ex), certMax: 3 }) },
  // ===== Luyện chuyên sâu =====
  { id: "kanji", group: "extra", href: "/kanji", ico: "漢", lv: "A1 → B1-2", jp: "漢字", name: "Chữ Hán", host: "Kazuha", avatar: AV("Kazuha"), color: "224,106,80",
    desc: "1.303 chữ theo cấp: cấu tạo, mẹo nhớ, tập viết có sửa nét, đọc, đặt câu, đoán chữ", progress: (S) => ({ stars: starsIn(S.kanji?.p) }) },
  { id: "boss", group: "extra", href: "/boss", ico: "⚔️", lv: "A2-1", jp: "ボス", name: "Thử Thách Boss", host: "Yae Miko", avatar: "https://gi.yatta.moe/assets/UI/monster/UI_MonsterIcon_Shougun_Mitakenarukami.png", color: "211,188,142",
    desc: "18 boss theo 18 bài A2-1: từ vựng, ngữ pháp, xếp câu, hội thoại", progress: (S) => ({ text: `${Object.values(S.boss || {}).filter((b) => b?.cleared).length}/18 boss` }) },
  { id: "nghe", group: "extra", href: "/nghe", ico: "🎧", lv: "A2-1", jp: "聴解", name: "Thử Thách Nghe", host: "Băng Thần", avatar: "https://gi.yatta.moe/assets/UI/monster/UI_MonsterIcon_HerraFrost.png", color: "160,215,255",
    desc: "18 boss nghe theo audio sách A2-1 và boss cuối Ronova", progress: (S) => ({ stars: Object.values(S.listen || {}).reduce((a, b) => a + (b?.best || 0), 0) }) },
];

export const TEYVAT = [
  { id: "wish", href: "/wish", ico: "✨", name: "Cầu Nguyện", desc: "Dùng Nguyên Thạch kiếm được để cầu nguyện nhân vật" },
  { id: "characters", href: "/characters", ico: "👥", name: "Nhân Vật", desc: "Bộ sưu tập nhân vật và cung mệnh" },
  { id: "inventory", href: "/inventory", ico: "🎒", name: "Túi Đồ", desc: "Vũ khí và vật phẩm đã nhận" },
  { id: "rank", href: "/rank", ico: "🏆", name: "Xếp Hạng", desc: "Hồ sơ, chứng chỉ và bảng xếp hạng" },
];

export const GROUPS = [
  { id: "start", name: "Bắt đầu", sub: "Làm quen chữ viết" },
  { id: "path", name: "Lộ trình Marugoto", sub: "Từ cấp thấp đến cấp cao" },
  { id: "extra", name: "Luyện chuyên sâu", sub: "Chữ Hán, boss, nghe" },
];
export const programsIn = (g) => PROGRAMS.filter((p) => p.group === g);
// nhãn tiến độ ngắn: "★ 12 · 🎓 1/2"
export function progressLabel(p, S) {
  if (!S) return "";
  const r = p.progress?.(S) || {};
  return [r.stars != null ? `★ ${r.stars}` : null, r.certMax ? `🎓 ${r.certs || 0}/${r.certMax}` : null, r.text || null].filter(Boolean).join(" · ");
}
