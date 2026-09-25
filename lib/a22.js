// Marugoto 初級2 A2-2 (かつどう + りかい): 18 bài × 7 phần, boss mỗi Topic, 2 kỳ thi chứng chỉ
import LESSONS from "@/data/a22-lessons.json";
import { makeCourse } from "@/lib/course";

export const A22_BOSSES = [
  { topic: 1, name: "Thủy Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Water", el: "hydro", hp: 60000 },
  { topic: 2, name: "Cây Lôi Điện", icon: "UI_MonsterIcon_Regisvine_Electric", el: "electro", hp: 80000 },
  { topic: 3, name: "Hải Mã Ngàn Năm", icon: "UI_MonsterIcon_SeaHorse_Primo_Electric", el: "electro", hp: 100000 },
  { topic: 4, name: "Hoàng Đế Lửa Và Sắt", icon: "UI_MonsterIcon_HermitCrab_Primo", el: "pyro", hp: 125000 },
  { topic: 5, name: "Rồng Đá Aeonblight", icon: "UI_MonsterIcon_Gargoyle_Fafnir", el: "geo", hp: 150000 },
  { topic: 6, name: "Thuật Toán Ma Trận", icon: "UI_MonsterIcon_Monolith_Starchild", el: "anemo", hp: 180000 },
  { topic: 7, name: "Shouki no Kami", icon: "UI_MonsterIcon_Nada", el: "electro", hp: 215000 },
  { topic: 8, name: "Toan Nghê Cô Độc", icon: "UI_MonsterIcon_Hermit", el: "anemo", hp: 255000 },
  { topic: 9, name: "Hộ Vệ Ốc Đảo Apep", icon: "UI_MonsterIcon_Apep", el: "dendro", hp: 300000 },
];

// Kỳ thi theo 2 lần テストとふりかえり của sách
export const A22_EXAMS = [
  { n: 1, topics: [1, 2, 3, 4, 5], name: "Chứng Chỉ A2-2 · Cấp I", short: "Cấp I", sub: "Bài 1–10 (Topic 1–5)" },
  { n: 2, topics: [6, 7, 8, 9], name: "Chứng Chỉ A2-2 · Cấp II", short: "Cấp II", sub: "Bài 11–18 (Topic 6–9)" },
];

export const A22 = makeCourse({ lessons: LESSONS, bosses: A22_BOSSES, exams: A22_EXAMS });
