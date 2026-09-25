// Marugoto 入門 A1 (かつどう + りかい): 18 bài × 7 phần, boss mỗi Topic, 2 kỳ thi chứng chỉ
import LESSONS from "@/data/a1-lessons.json";
import { makeCourse } from "@/lib/course";

export const A1_BOSSES = [
  { topic: 1, name: "Mắt Bão", icon: "UI_MonsterIcon_Elemental_Wind_01", el: "anemo", hp: 20000 },
  { topic: 2, name: "Hộ Vệ Di Tích", icon: "UI_MonsterIcon_Defender_Noner_01", el: "geo", hp: 28000 },
  { topic: 3, name: "Phong Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Wind", el: "anemo", hp: 36000 },
  { topic: 4, name: "Cây Hỏa", icon: "UI_MonsterIcon_Regisvine_Fire", el: "pyro", hp: 45000 },
  { topic: 5, name: "Nham Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Rock", el: "geo", hp: 55000 },
  { topic: 6, name: "Vua Mũ Sấm Hilichurl", icon: "UI_MonsterIcon_Brute_Electric_01", el: "electro", hp: 66000 },
  { topic: 7, name: "Máy Nghiền Di Tích", icon: "UI_MonsterIcon_Konungmathr", el: "geo", hp: 78000 },
  { topic: 8, name: "Sứ Giả Vực Sâu · Băng", icon: "UI_MonsterIcon_Invoker_Herald_Ice", el: "cryo", hp: 92000 },
  { topic: 9, name: "Andrius · Vua Sói Phương Bắc", icon: "UI_MonsterIcon_LupiBoreas", el: "anemo", hp: 110000 },
];

// Kỳ thi theo 2 lần テストとふりかえり của sách (かつどう p71–72, p114–115)
export const A1_EXAMS = [
  { n: 1, topics: [1, 2, 3, 4, 5], name: "Chứng Chỉ A1 · Cấp I", short: "Cấp I", sub: "Bài 1–10 (Topic 1–5)" },
  { n: 2, topics: [6, 7, 8, 9], name: "Chứng Chỉ A1 · Cấp II", short: "Cấp II", sub: "Bài 11–18 (Topic 6–9)" },
];

export const A1C = makeCourse({ lessons: LESSONS, bosses: A1_BOSSES, exams: A1_EXAMS });
