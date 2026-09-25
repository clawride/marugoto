// Marugoto 中級2 B1-2: 9 Topic × 2 bài (A: 準備・Part 1–2 · B: Part 3–5), boss mỗi Topic, 3 kỳ thi chứng chỉ
import LESSONS from "@/data/b12-lessons.json";
import { makeCourse } from "@/lib/course";

export const B12_BOSSES = [
  { topic: 1, name: "Chiến Binh Tepetlisaurus", icon: "UI_MonsterIcon_Tribalwarrior_Chainsword_Drillhead", el: "geo", hp: 120000 },
  { topic: 2, name: "Tepetlisaurus Khoan Đá", icon: "UI_MonsterIcon_Natsaurus_Drillhead_Normal", el: "geo", hp: 150000 },
  { topic: 3, name: "Hiện Thân Wayob · Lá Xanh", icon: "UI_MonsterIcon_Wayob_Hookwalker", el: "dendro", hp: 180000 },
  { topic: 4, name: "Hiện Thân Wayob · Rực Lửa", icon: "UI_MonsterIcon_Wayob_Flamingo", el: "pyro", hp: 215000 },
  { topic: 5, name: "Hiện Thân Wayob · Sấm Rền", icon: "UI_MonsterIcon_Wayob_Bisonsaurus", el: "electro", hp: 255000 },
  { topic: 6, name: "Máy Bí Nguyên · Thiết Bị Cấu Hình", icon: "UI_MonsterIcon_DragonClaw", el: "pyro", hp: 300000 },
  { topic: 7, name: "Hiện Thân Wayob · Dòng Chảy Ngược", icon: "UI_MonsterIcon_Wayob_Mosasaurus", el: "hydro", hp: 350000 },
  { topic: 8, name: "Tượng Rồng Dung Nham", icon: "UI_MonsterIcon_LavaTitan", el: "pyro", hp: 400000 },
  { topic: 9, name: "Chúa Tể Lửa Nguyên Thủy Xói Mòn", icon: "UI_MonsterIcon_TheAbyssXiuhcoatl", el: "pyro", hp: 480000 },
];

// Kỳ thi theo 3 phần テストの問題例 của sách (Topic 1–3, 4–6, 7–9)
export const B12_EXAMS = [
  { n: 1, topics: [1, 2, 3], name: "Chứng Chỉ B1-2 · Cấp I", short: "Cấp I", sub: "Topic 1–3" },
  { n: 2, topics: [4, 5, 6], name: "Chứng Chỉ B1-2 · Cấp II", short: "Cấp II", sub: "Topic 4–6" },
  { n: 3, topics: [7, 8, 9], name: "Chứng Chỉ B1-2 · Cấp III", short: "Cấp III", sub: "Topic 7–9" },
];

export const B12 = makeCourse({ lessons: LESSONS, bosses: B12_BOSSES, exams: B12_EXAMS });
