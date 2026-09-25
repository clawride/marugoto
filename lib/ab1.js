// Marugoto 初中級 A2/B1: 9 Topic × 7 phần, boss mỗi Topic, 2 kỳ thi chứng chỉ
import UNITS from "@/data/ab1-units.json";
import { makeCourse } from "@/lib/course";

export const AB1_BOSSES = [
  { topic: 1, name: "Thảo Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Grass", el: "dendro", hp: 90000 },
  { topic: 2, name: "Người Đá Legatus", icon: "UI_MonsterIcon_Golem_Centaur", el: "geo", hp: 115000 },
  { topic: 3, name: "Hiện Thân Sấm Sét", icon: "UI_MonsterIcon_Raijin", el: "electro", hp: 140000 },
  { topic: 4, name: "Máy Phát Trường Thí Nghiệm", icon: "UI_MonsterIcon_MachinaIustitia_Gravitas", el: "geo", hp: 170000 },
  { topic: 5, name: "Giáo Chủ Tà Ác", icon: "UI_MonsterIcon_Invoker_Archdeacon", el: "pyro", hp: 200000 },
  { topic: 6, name: "Máy Săn Bí Nguyên", icon: "UI_MonsterIcon_ToothTrap", el: "pyro", hp: 235000 },
  { topic: 7, name: "Chúa Tể Vực Sâu", icon: "UI_MonsterIcon_Lloigor_Primo", el: "hydro", hp: 275000 },
  { topic: 8, name: "Kình Ngư Nuốt Chửng", icon: "UI_MonsterIcon_Ptahur_Devourer", el: "hydro", hp: 320000 },
  { topic: 9, name: "Arlecchino · Kẻ Hầu", icon: "UI_MonsterIcon_Nihil", el: "pyro", hp: 380000 },
];

// Kỳ thi theo 2 lần テストとふりかえり của sách (p74–75, p116–117)
export const AB1_EXAMS = [
  { n: 1, topics: [1, 2, 3, 4, 5], name: "Chứng Chỉ A2/B1 · Cấp I", short: "Cấp I", sub: "Topic 1–5" },
  { n: 2, topics: [6, 7, 8, 9], name: "Chứng Chỉ A2/B1 · Cấp II", short: "Cấp II", sub: "Topic 6–9" },
];

export const AB1 = makeCourse({ lessons: UNITS, bosses: AB1_BOSSES, exams: AB1_EXAMS });
