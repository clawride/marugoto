// Minna - Genshin Trung cấp 1 (みんなの日本語 中級I, bài 1–12): 3 Topic × 4 bài, boss mỗi Topic, 3 kỳ thi chứng chỉ.
// Dữ liệu từng bài: data/mnnc1/lesson-<số bài>.json (cùng cấu trúc với data/mnn2) · "Học theo sách": data/book/mnc1/<bài>.json
// Cấu trúc, mục tiêu, mẫu ngữ pháp, từ vựng và dạng/số lượng bài tập theo sách; bài đọc, hội thoại, câu luyện tập được viết mới.
import L1 from "@/data/mnnc1/lesson-1.json";
import L2 from "@/data/mnnc1/lesson-2.json";
import L3 from "@/data/mnnc1/lesson-3.json";
import L4 from "@/data/mnnc1/lesson-4.json";
import L5 from "@/data/mnnc1/lesson-5.json";
import L6 from "@/data/mnnc1/lesson-6.json";
import L7 from "@/data/mnnc1/lesson-7.json";
import L8 from "@/data/mnnc1/lesson-8.json";
import L9 from "@/data/mnnc1/lesson-9.json";
import L10 from "@/data/mnnc1/lesson-10.json";
import L11 from "@/data/mnnc1/lesson-11.json";
import L12 from "@/data/mnnc1/lesson-12.json";
import { makeCourse } from "@/lib/course";

const LESSONS = [L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, L12];

// Topic = nhóm 4 bài: 1 = bài 1–4, 2 = 5–8, 3 = 9–12
export const MNC1_BOSSES = [
  { topic: 1, name: "Nham Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Rock", el: "geo", hp: 220000 },
  { topic: 2, name: "Cỗ Máy Công Lý · Trọng Lực", icon: "UI_MonsterIcon_MachinaIustitia_Gravitas", el: "geo", hp: 290000 },
  { topic: 3, name: "Rồng Đất Cổ - Nham", icon: "UI_MonsterIcon_Drake_Primo_Rock", el: "geo", hp: 380000 },
];

// Kỳ thi: Cấp I = bài 1–4, Cấp II = bài 5–8, Cấp III = bài 9–12
export const MNC1_EXAMS = [
  { n: 1, topics: [1], name: "Chứng Chỉ Minna-Genshin Trung cấp 1 · Cấp I", short: "Cấp I", sub: "Bài 1–4 (Topic 1)" },
  { n: 2, topics: [2], name: "Chứng Chỉ Minna-Genshin Trung cấp 1 · Cấp II", short: "Cấp II", sub: "Bài 5–8 (Topic 2)" },
  { n: 3, topics: [3], name: "Chứng Chỉ Minna-Genshin Trung cấp 1 · Cấp III", short: "Cấp III", sub: "Bài 9–12 (Topic 3)" },
];

export const MNC1 = makeCourse({ lessons: LESSONS, bosses: MNC1_BOSSES, exams: MNC1_EXAMS });
