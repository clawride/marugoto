// Marugoto 初級1 A2-1 (かつどう + りかい): 18 bài × 7 phần, boss mỗi Topic, 2 kỳ thi chứng chỉ
import LESSONS from "@/data/a21-lessons.json";
import { makeCourse } from "@/lib/course";

export const A21_BOSSES = [
  { topic: 1, name: "Hỏa Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Fire", el: "pyro", hp: 45000 },
  { topic: 2, name: "Băng Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Ice", el: "cryo", hp: 60000 },
  { topic: 3, name: "Thợ Săn Di Tích", icon: "UI_MonsterIcon_Formathr_None", el: "geo", hp: 78000 },
  { topic: 4, name: "Sứ Đồ Vực Sâu · Tử Lôi", icon: "UI_MonsterIcon_Invoker_Deacon_Electric_01", el: "electro", hp: 98000 },
  { topic: 5, name: "Sứ Giả Vực Sâu · Thủy Triều", icon: "UI_MonsterIcon_Invoker_Herald_Water_01", el: "hydro", hp: 120000 },
  { topic: 6, name: "Rồng Biển Sâu Nguyên Thủy", icon: "UI_MonsterIcon_Drake_Deepsea_Water", el: "hydro", hp: 145000 },
  { topic: 7, name: "Rồng Biển Sâu Nuốt Sấm", icon: "UI_MonsterIcon_Drake_Deepsea_Electric", el: "electro", hp: 172000 },
  { topic: 8, name: "Hoa Giả Bóng Tối", icon: "UI_MonsterIcon_TheAbyss_Rhizome", el: "dendro", hp: 200000 },
  { topic: 9, name: "Máy Giám Sát Bí Nguyên", icon: "UI_MonsterIcon_DragonCollar", el: "pyro", hp: 235000 },
];

// Kỳ thi theo 2 lần テストとふりかえり của sách (かつどう p86–87, p140–141)
export const A21_EXAMS = [
  { n: 1, topics: [1, 2, 3, 4, 5], name: "Chứng Chỉ A2-1 · Cấp I", short: "Cấp I", sub: "Bài 1–10 (Topic 1–5)" },
  { n: 2, topics: [6, 7, 8, 9], name: "Chứng Chỉ A2-1 · Cấp II", short: "Cấp II", sub: "Bài 11–18 (Topic 6–9)" },
];

export const A21C = makeCourse({ lessons: LESSONS, bosses: A21_BOSSES, exams: A21_EXAMS });
