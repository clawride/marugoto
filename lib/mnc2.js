// Minna - Genshin Trung cấp 2 (みんなの日本語 中級II, bài 13–24): 3 Topic × 4 bài, boss mỗi Topic, 3 kỳ thi chứng chỉ.
// Dữ liệu từng bài: data/mnnc2/lesson-<số bài>.json (cùng cấu trúc với data/mnn2) · "Học theo sách": data/book/mnc2/<bài>.json
// Cấu trúc, mục tiêu, mẫu ngữ pháp, từ vựng và dạng/số lượng bài tập theo sách; bài đọc, hội thoại, câu luyện tập được viết mới.
import L13 from "@/data/mnnc2/lesson-13.json";
import L14 from "@/data/mnnc2/lesson-14.json";
import L15 from "@/data/mnnc2/lesson-15.json";
import L16 from "@/data/mnnc2/lesson-16.json";
import L17 from "@/data/mnnc2/lesson-17.json";
import L18 from "@/data/mnnc2/lesson-18.json";
import L19 from "@/data/mnnc2/lesson-19.json";
import L20 from "@/data/mnnc2/lesson-20.json";
import L21 from "@/data/mnnc2/lesson-21.json";
import L22 from "@/data/mnnc2/lesson-22.json";
import L23 from "@/data/mnnc2/lesson-23.json";
import L24 from "@/data/mnnc2/lesson-24.json";
import { makeCourse } from "@/lib/course";

const LESSONS = [L13, L14, L15, L16, L17, L18, L19, L20, L21, L22, L23, L24];

// Topic = nhóm 4 bài: 1 = bài 13–16, 2 = 17–20, 3 = 21–24
export const MNC2_BOSSES = [
  { topic: 1, name: "Thủy Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Water", el: "hydro", hp: 260000 },
  { topic: 2, name: "Cỗ Máy Công Lý · Kẹp Hạt Dẻ", icon: "UI_MonsterIcon_MachinaIustitia_Nutcracker", el: "hydro", hp: 340000 },
  { topic: 3, name: "Rồng Biển Sâu Thủy", icon: "UI_MonsterIcon_Drake_Deepsea_Water", el: "hydro", hp: 440000 },
];

// Kỳ thi: Cấp I = bài 13–16, Cấp II = bài 17–20, Cấp III = bài 21–24
export const MNC2_EXAMS = [
  { n: 1, topics: [1], name: "Chứng Chỉ Minna-Genshin Trung cấp 2 · Cấp I", short: "Cấp I", sub: "Bài 13–16 (Topic 1)" },
  { n: 2, topics: [2], name: "Chứng Chỉ Minna-Genshin Trung cấp 2 · Cấp II", short: "Cấp II", sub: "Bài 17–20 (Topic 2)" },
  { n: 3, topics: [3], name: "Chứng Chỉ Minna-Genshin Trung cấp 2 · Cấp III", short: "Cấp III", sub: "Bài 21–24 (Topic 3)" },
];

export const MNC2 = makeCourse({ lessons: LESSONS, bosses: MNC2_BOSSES, exams: MNC2_EXAMS });
