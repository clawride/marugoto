// 18 boss ứng với 18 bài của Marugoto 初級1 A2 かつどう — độ khó tăng dần
// Ảnh quái Genshin Impact © HoYoverse (qua gi.yatta.moe)
import LESSONS from "@/data/boss-lessons.json";

import { MONSTER_ASSET } from "@/lib/genshin";
export { MONSTER_ASSET };

export const BOSSES = [
  { lesson: 1, name: "Slime Phong Lớn", icon: "UI_MonsterIcon_Slime_Wind_03", el: "anemo", hp: 12000 },
  { lesson: 2, name: "Hilichurl Chiến Sĩ", icon: "UI_MonsterIcon_Hili_None_01", el: "geo", hp: 15000 },
  { lesson: 3, name: "Pháp Sư Vực Sâu Thủy", icon: "UI_MonsterIcon_Abyss_Water_01", el: "hydro", hp: 20000 },
  { lesson: 4, name: "Vua Mũ Đá Hilichurl", icon: "UI_MonsterIcon_Brute_Rock_None", el: "geo", hp: 26000 },
  { lesson: 5, name: "Lôi Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Electric", el: "electro", hp: 34000 },
  { lesson: 6, name: "Tinh Linh Nước Trong", icon: "UI_MonsterIcon_Oceanid", el: "hydro", hp: 42000 },
  { lesson: 7, name: "Cây Cấp Đông", icon: "UI_MonsterIcon_Regisvine_Ice", el: "cryo", hp: 52000 },
  { lesson: 8, name: "Rồng Đất Cổ - Nham", icon: "UI_MonsterIcon_Drake_Primo_Rock", el: "geo", hp: 64000 },
  { lesson: 9, name: "Maguu Kenki", icon: "UI_MonsterIcon_Samurai_Ningyo", el: "anemo", hp: 78000 },
  { lesson: 10, name: "Mô Hình Động Cơ Vĩnh Cửu", icon: "UI_MonsterIcon_Apparatus_Perpetual", el: "geo", hp: 94000 },
  { lesson: 11, name: "Vua Thú Hoàng Kim", icon: "UI_MonsterIcon_Hound_Planelurker", el: "geo", hp: 112000 },
  { lesson: 12, name: "Nấm Thúy Linh", icon: "UI_MonsterIcon_Fungus_Raptor", el: "dendro", hp: 132000 },
  { lesson: 13, name: "Mãng Xà Di Tích", icon: "UI_MonsterIcon_Nithhoggr_None", el: "geo", hp: 156000 },
  { lesson: 14, name: "Phong Ma Long Bão Tố", icon: "UI_MonsterIcon_Dvalin", el: "anemo", hp: 184000 },
  { lesson: 15, name: "Childe", icon: "UI_MonsterIcon_Tartaglia", el: "hydro", hp: 216000 },
  { lesson: 16, name: "Azhdaha", icon: "UI_MonsterIcon_Dahaka", el: "geo", hp: 252000 },
  { lesson: 17, name: "La Signora", icon: "UI_MonsterIcon_LaSignora", el: "cryo", hp: 294000 },
  { lesson: 18, name: "Magatsu Mitake Narukami no Mikoto", icon: "UI_MonsterIcon_Shougun_Mitakenarukami", el: "electro", hp: 340000 },
];

export const bossOf = (lesson) => BOSSES.find((b) => b.lesson === lesson);
export const bossIcon = (b) => `${MONSTER_ASSET}${b.icon}.png`;
export const lessonOf = (lesson) => LESSONS.find((l) => l.lesson === lesson);
export const LESSON_LIST = LESSONS;

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Thưởng mỗi ngày cho mỗi boss (lần đầu hạ gục trong ngày)
export const rewardFor = (stars) => 40 + stars * 20;

// ===== Boss tổng hợp (まとめ問題): mỗi boss ôn 3 Topic của một cuốn, 7 phần như bài まとめ của Marugoto =====
// Nội dung: public/boss-matome/<id>.json · tiến độ: S.matome[id] = { best, cleared, reward }
export const MATOME_BOOKS = [
  { id: "a21", name: "Marugoto 初級1 A2-1", host: "Shougun", color: "170,130,240" },
  { id: "a22", name: "Marugoto 初級2 A2-2", host: "Nahida", color: "126,200,90" },
  { id: "ab1", name: "Marugoto 初中級 A2/B1", host: "Furina", color: "110,170,240" },
];
export const MATOME = [
  { id: "a21-1", book: "a21", topics: [1, 2, 3], name: "Hiện Thân Sấm Sét", icon: "UI_MonsterIcon_Raijin", el: "electro", hp: 380000 },
  { id: "a21-2", book: "a21", topics: [4, 5, 6], name: "Rồng Biển Sâu Lôi", icon: "UI_MonsterIcon_Drake_Deepsea_Electric", el: "electro", hp: 420000 },
  { id: "a21-3", book: "a21", topics: [7, 8, 9], name: "Long Ngư Lôi Nguyên Thủy", icon: "UI_MonsterIcon_SeaHorse_Primo_Electric", el: "electro", hp: 460000 },
  { id: "a22-1", book: "a22", topics: [1, 2, 3], name: "Thảo Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Grass", el: "dendro", hp: 500000 },
  { id: "a22-2", book: "a22", topics: [4, 5, 6], name: "Rễ Vực Sâu", icon: "UI_MonsterIcon_TheAbyss_Rhizome", el: "dendro", hp: 540000 },
  { id: "a22-3", book: "a22", topics: [7, 8, 9], name: "Cổ Long Apep", icon: "UI_MonsterIcon_Apep", el: "dendro", hp: 580000 },
  { id: "ab1-1", book: "ab1", topics: [1, 2, 3], name: "Thủy Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Water", el: "hydro", hp: 620000 },
  { id: "ab1-2", book: "ab1", topics: [4, 5, 6], name: "Rồng Biển Sâu Thủy", icon: "UI_MonsterIcon_Drake_Deepsea_Water", el: "hydro", hp: 660000 },
  { id: "ab1-3", book: "ab1", topics: [7, 8, 9], name: "Thương Long Wayob", icon: "UI_MonsterIcon_Wayob_Mosasaurus", el: "hydro", hp: 720000 },
];
export const matomeOf = (id) => MATOME.find((m) => m.id === id);
export const matomeBook = (id) => MATOME_BOOKS.find((b) => b.id === id);
// mở khóa: boss đầu của mỗi cuốn mở sẵn, boss sau cần hạ boss trước trong cùng cuốn
export const matomePrev = (m) => { const L = MATOME.filter((x) => x.book === m.book); const i = L.indexOf(m); return i > 0 ? L[i - 1] : null; };
export const matomeReward = (stars) => 80 + stars * 40;
