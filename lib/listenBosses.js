// Boss bài nghe — do Băng Thần (Nữ Hoàng Băng Giá) quản lý; boss cuối: Chấp Chính Cái Chết Ronova
// Ảnh quái Genshin Impact © HoYoverse (qua gi.yatta.moe)
import LISTEN from "@/data/listen-lessons.json";
import FINAL from "@/data/listen-final.json";
import { MONSTER_ASSET } from "@/lib/bosses";

export const LISTEN_LESSONS = LISTEN; // [{ lesson, items: [...] }]
export const LISTEN_FINAL = FINAL.items;
export const listenOf = (l) => LISTEN.find((x) => x.lesson === l);

export const LISTEN_BOSSES = [
  { lesson: 1, name: "Slime Băng", icon: "UI_MonsterIcon_Slime_Ice_02", hp: 14000 },
  { lesson: 2, name: "Hilichurl Băng Tiễn", icon: "UI_MonsterIcon_Hili_Ice_Range", hp: 18000 },
  { lesson: 3, name: "Phù Thủy Hilichurl Băng", icon: "UI_MonsterIcon_Shaman_Ice_01", hp: 23000 },
  { lesson: 4, name: "Slime Băng Lớn", icon: "UI_MonsterIcon_Slime_Ice_03", hp: 29000 },
  { lesson: 5, name: "Cicin Băng", icon: "UI_MonsterIcon_Cicin_Ice_01", hp: 36000 },
  { lesson: 6, name: "Pháp Sư Vực Sâu Băng", icon: "UI_MonsterIcon_Abyss_Ice_01", hp: 44000 },
  { lesson: 7, name: "Fatui - Thuật Sĩ Cicin Băng", icon: "UI_MonsterIcon_Fatuus_Mage_Ice_01", hp: 54000 },
  { lesson: 8, name: "Hoa Lừa Dối Băng Giá", icon: "UI_MonsterIcon_Mimik_Ice", hp: 66000 },
  { lesson: 9, name: "Bóng Ma - Băng", icon: "UI_MonsterIcon_Sylph_Ice_01", hp: 80000 },
  { lesson: 10, name: "Vua Giáp Băng Hilichurl", icon: "UI_MonsterIcon_Brute_Ice_01", hp: 96000 },
  { lesson: 11, name: "Fatui - Vệ Binh Băng Hạng Nặng", icon: "UI_MonsterIcon_Skirmisher_Male_Fat_SprayGun_Ice_01", hp: 114000 },
  { lesson: 12, name: "Băng Nguyên Bản", icon: "UI_MonsterIcon_Effigy_Ice", hp: 135000 },
  { lesson: 13, name: "Sứ Đồ Vực Sâu - Sương Lạc", icon: "UI_MonsterIcon_Invoker_Herald_Ice", hp: 158000 },
  { lesson: 14, name: "Rồng Biển Sâu - Nanh Băng", icon: "UI_MonsterIcon_Drake_Deepsea_Ice", hp: 184000 },
  { lesson: 15, name: "Thủ Vệ Ngưng Băng", icon: "UI_MonsterIcon_Snegurochka_Male", hp: 214000 },
  { lesson: 16, name: "Liên Khúc Gió Băng", icon: "UI_MonsterIcon_MachinaIustitia_Nutcracker", hp: 248000 },
  { lesson: 17, name: "Sói Băng Bức Xạ", icon: "UI_MonsterIcon_Magbeast_Steppenwolf", hp: 288000 },
  { lesson: 18, name: "Linh Chủ Đêm Sương", icon: "UI_MonsterIcon_HerraFrost", hp: 334000 },
].map((b) => ({ ...b, el: "cryo", img: `${MONSTER_ASSET}${b.icon}.png`, lv: Math.min(90, 12 + b.lesson * 5) }));

export const listenBossOf = (l) => LISTEN_BOSSES.find((b) => b.lesson === l);

export const RONOVA = {
  name: "Chấp Chính Cái Chết · Ronova",
  sub: "Một trong Tứ Ảnh của Thiên Lý",
  el: "electro",
  hp: 999999,
  lv: 100,
  theme: "ronova",
  noEl: true,
};

// Lời Băng Thần
export const TSARITSA = {
  name: "Băng Thần",
  title: "Nữ Hoàng Băng Giá",
  img: "/bang-than.jpg",
  intro: [
    "Hãy lắng nghe, Nhà Lữ Hành. Trong tĩnh lặng của băng giá, mọi âm thanh đều trở nên rõ ràng.",
    "Ta không cần kẻ nghe hời hợt. Hãy chứng minh đôi tai của ngươi xứng đáng.",
    "Mỗi lời nói là một bông tuyết — nắm bắt nó trước khi nó tan.",
  ],
  ok: ["Tốt. Ngươi đã nghe thấy điều cần nghe.", "Chính xác. Băng giá ghi nhận nỗ lực của ngươi.", "Không tệ. Tiếp tục đi."],
  bad: ["Chưa đúng. Hãy nghe lại và để tâm vào từng chữ.", "Tai ngươi còn bị gió tuyết che lấp. Nghe lại lần nữa.", "Sai rồi. Nhưng ta cho phép ngươi học từ sai lầm."],
};

export const RONOVA_LINES = {
  intro: "Mọi sinh mệnh đều có hồi kết. Để xem kiến thức của ngươi có sống sót qua phán quyết của ta không.",
  phases: ["Giai đoạn I · Ký Ức", "Giai đoạn II · Phán Quyết", "Giai đoạn III · Tử Vong"],
  phaseLines: [
    "Hãy nhớ lại những gì ngươi đã học. Ký ức là thứ đầu tiên ta sẽ thử thách.",
    "Phán quyết bắt đầu. Mỗi âm thanh sai lệch đều bị ghi lại.",
    "Đây là hồi kết. Nghe và viết lại lời nói — hoặc bị lãng quên.",
  ],
};
