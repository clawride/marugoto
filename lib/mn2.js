// Minna - Genshin Sơ cấp 2 (みんなの日本語 初級2, bài 26–50): 5 Topic × 5 bài, boss mỗi Topic, 3 kỳ thi chứng chỉ.
// Dữ liệu từng bài ở data/mnn2/lesson-<số bài>.json (cùng cấu trúc với data/a22-lessons.json); thêm bài mới = thêm file + một dòng import ở đây.
import L26 from "@/data/mnn2/lesson-26.json";
import L27 from "@/data/mnn2/lesson-27.json";
import L28 from "@/data/mnn2/lesson-28.json";
import L29 from "@/data/mnn2/lesson-29.json";
import L30 from "@/data/mnn2/lesson-30.json";
import L31 from "@/data/mnn2/lesson-31.json";
import L32 from "@/data/mnn2/lesson-32.json";
import L33 from "@/data/mnn2/lesson-33.json";
import L34 from "@/data/mnn2/lesson-34.json";
import L35 from "@/data/mnn2/lesson-35.json";
import L36 from "@/data/mnn2/lesson-36.json";
import L37 from "@/data/mnn2/lesson-37.json";
import L38 from "@/data/mnn2/lesson-38.json";
import L39 from "@/data/mnn2/lesson-39.json";
import L40 from "@/data/mnn2/lesson-40.json";
import L41 from "@/data/mnn2/lesson-41.json";
import L42 from "@/data/mnn2/lesson-42.json";
import L43 from "@/data/mnn2/lesson-43.json";
import L44 from "@/data/mnn2/lesson-44.json";
import L45 from "@/data/mnn2/lesson-45.json";
import L46 from "@/data/mnn2/lesson-46.json";
import L47 from "@/data/mnn2/lesson-47.json";
import L48 from "@/data/mnn2/lesson-48.json";
import L49 from "@/data/mnn2/lesson-49.json";
import L50 from "@/data/mnn2/lesson-50.json";
import { makeCourse } from "@/lib/course";

const LESSONS = [L26, L27, L28, L29, L30, L31, L32, L33, L34, L35, L36, L37, L38, L39, L40, L41, L42, L43, L44, L45, L46, L47, L48, L49, L50];

// Topic = nhóm 5 bài: 1 = bài 26–30, 2 = 31–35, 3 = 36–40, 4 = 41–45, 5 = 46–50
export const MN2_BOSSES = [
  { topic: 1, name: "Băng Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Ice", el: "cryo", hp: 60000 },
  { topic: 2, name: "Mắt Bão Phương Bắc", icon: "UI_MonsterIcon_Elemental_Wind_01", el: "anemo", hp: 85000 },
  { topic: 3, name: "Hộ Vệ Di Tích Băng Giá", icon: "UI_MonsterIcon_Defender_Noner_01", el: "geo", hp: 115000 },
  { topic: 4, name: "Cây Băng Cổ Thụ", icon: "UI_MonsterIcon_Regisvine_Fire", el: "pyro", hp: 150000 },
  { topic: 5, name: "Andrius · Vua Sói Tuyết", icon: "UI_MonsterIcon_LupiBoreas", el: "anemo", hp: 200000 },
];

// Kỳ thi theo các nhóm bài ôn (復習) của sách: Cấp I = bài 26–35, Cấp II = bài 36–45, Cấp III = bài 46–50
export const MN2_EXAMS = [
  { n: 1, topics: [1, 2], name: "Chứng Chỉ Minna-Genshin 2 · Cấp I", short: "Cấp I", sub: "Bài 26–35 (Topic 1–2)" },
  { n: 2, topics: [3, 4], name: "Chứng Chỉ Minna-Genshin 2 · Cấp II", short: "Cấp II", sub: "Bài 36–45 (Topic 3–4)" },
  { n: 3, topics: [5], name: "Chứng Chỉ Minna-Genshin 2 · Cấp III", short: "Cấp III", sub: "Bài 46–50 (Topic 5)" },
];

export const MN2 = makeCourse({ lessons: LESSONS, bosses: MN2_BOSSES, exams: MN2_EXAMS });
