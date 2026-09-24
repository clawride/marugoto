// 18 boss ứng với 18 bài của Marugoto 初級1 A2 かつどう — độ khó tăng dần
// Ảnh quái Genshin Impact © HoYoverse (qua gi.yatta.moe)
import LESSONS from "@/data/boss-lessons.json";

export const MONSTER_ASSET = "https://gi.yatta.moe/assets/UI/monster/";

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
