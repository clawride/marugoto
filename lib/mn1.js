// Minna - Genshin Sơ cấp 1 (dựa trên みんなの日本語 初級1, bài 1–25): 5 Topic × 5 bài, boss mỗi Topic, 3 kỳ thi chứng chỉ.
// Dữ liệu từng bài ở data/mnn1/lesson-<số bài>.json (cùng cấu trúc với data/a22-lessons.json).
import L1 from "@/data/mnn1/lesson-1.json";
import L2 from "@/data/mnn1/lesson-2.json";
import L3 from "@/data/mnn1/lesson-3.json";
import L4 from "@/data/mnn1/lesson-4.json";
import L5 from "@/data/mnn1/lesson-5.json";
import L6 from "@/data/mnn1/lesson-6.json";
import L7 from "@/data/mnn1/lesson-7.json";
import L8 from "@/data/mnn1/lesson-8.json";
import L9 from "@/data/mnn1/lesson-9.json";
import L10 from "@/data/mnn1/lesson-10.json";
import L11 from "@/data/mnn1/lesson-11.json";
import L12 from "@/data/mnn1/lesson-12.json";
import L13 from "@/data/mnn1/lesson-13.json";
import L14 from "@/data/mnn1/lesson-14.json";
import L15 from "@/data/mnn1/lesson-15.json";
import L16 from "@/data/mnn1/lesson-16.json";
import L17 from "@/data/mnn1/lesson-17.json";
import L18 from "@/data/mnn1/lesson-18.json";
import L19 from "@/data/mnn1/lesson-19.json";
import L20 from "@/data/mnn1/lesson-20.json";
import L21 from "@/data/mnn1/lesson-21.json";
import L22 from "@/data/mnn1/lesson-22.json";
import L23 from "@/data/mnn1/lesson-23.json";
import L24 from "@/data/mnn1/lesson-24.json";
import L25 from "@/data/mnn1/lesson-25.json";
import { makeCourse } from "@/lib/course";

const LESSONS = [L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, L12, L13, L14, L15, L16, L17, L18, L19, L20, L21, L22, L23, L24, L25];

// Topic = nhóm 5 bài: 1 = bài 1–5, 2 = 6–10, 3 = 11–15, 4 = 16–20, 5 = 21–25
export const MN1_BOSSES = [
  { topic: 1, name: "Hỏa Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Fire", el: "pyro", hp: 20000 },
  { topic: 2, name: "Lôi Điện Cổ Thụ", icon: "UI_MonsterIcon_Regisvine_Electric", el: "electro", hp: 28000 },
  { topic: 3, name: "Thủy Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Water", el: "hydro", hp: 38000 },
  { topic: 4, name: "Vua Mũ Sấm Hilichurl", icon: "UI_MonsterIcon_Brute_Electric_01", el: "electro", hp: 50000 },
  { topic: 5, name: "Nham Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Rock", el: "geo", hp: 65000 },
];

// Kỳ thi theo các nhóm bài ôn (復習) của sách: Cấp I = bài 1–10, Cấp II = bài 11–20, Cấp III = bài 21–25
export const MN1_EXAMS = [
  { n: 1, topics: [1, 2], name: "Chứng Chỉ Minna-Genshin 1 · Cấp I", short: "Cấp I", sub: "Bài 1–10 (Topic 1–2)" },
  { n: 2, topics: [3, 4], name: "Chứng Chỉ Minna-Genshin 1 · Cấp II", short: "Cấp II", sub: "Bài 11–20 (Topic 3–4)" },
  { n: 3, topics: [5], name: "Chứng Chỉ Minna-Genshin 1 · Cấp III", short: "Cấp III", sub: "Bài 21–25 (Topic 5)" },
];

export const MN1 = makeCourse({ lessons: LESSONS, bosses: MN1_BOSSES, exams: MN1_EXAMS });
