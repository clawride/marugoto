// Thông tin phụ cho 120 nhân vật Genshin dùng trong game Đấu thẻ: vùng (ảnh nền bàn đấu, nhãn ải) và nhân vật nam (giọng, xưng hô).
const REGIONS = {
  Mondstadt: ["Jean", "Lisa", "Barbara", "Kaeya", "Diluc", "Razor", "Amber", "Venti", "Klee", "Fischl", "Bennett", "Noelle", "Albedo", "Diona", "Mona", "Sucrose", "Rosaria", "Eula", "Mika", "Dahlia", "Varka"],
  Liyue: ["Xiangling", "Beidou", "Xingqiu", "Xiao", "Ningguang", "Zhongli", "Qiqi", "Chongyun", "Ganyu", "Keqing", "Xinyan", "Hu Tao", "Yanfei", "Shenhe", "Yun Jin", "Yelan", "Yaoyao", "Baizhu", "Gaming", "Xianyun", "Lan Yan", "Zibai"],
  Inazuma: ["Kamisato Ayaka", "Kaedehara Kazuha", "Yoimiya", "Thoma", "Raiden Shogun", "Sayu", "Sangonomiya Kokomi", "Gorou", "Kujou Sara", "Arataki Itto", "Yae Miko", "Shikanoin Heizou", "Kirara", "Kuki Shinobu", "Kamisato Ayato", "Chiori", "Yumemizuki Mizuki"],
  Sumeru: ["Collei", "Dori", "Tighnari", "Nilou", "Cyno", "Candace", "Nahida", "Layla", "Wanderer", "Faruzan", "Alhaitham", "Dehya", "Kaveh", "Sethos"],
  Fontaine: ["Lynette", "Lyney", "Freminet", "Wriothesley", "Neuvillette", "Charlotte", "Furina", "Chevreuse", "Navia", "Sigewinne", "Clorinde", "Emilie", "Escoffier"],
  Natlan: ["Kachina", "Kinich", "Mualani", "Xilonen", "Chasca", "Ororon", "Mavuika", "Citlali", "Iansan", "Varesa", "Ifa"],
  Snezhnaya: ["Tartaglia", "Arlecchino", "Skirk", "Columbina", "Sandrone"],
};
const BY = {};
for (const [r, list] of Object.entries(REGIONS)) for (const n of list) BY[n] = r;
// Nhân vật chưa có trong bảng (bản mới) xếp vào Nod-Krai
export const regionOf = (en) => BY[en] || "Nod-Krai";
// Ảnh nền bàn đấu theo vùng (vùng chưa có tranh riêng dùng tranh hợp không khí nhất)
const BG = { Mondstadt: "mondstadt", Liyue: "liyue", Inazuma: "inazuma", Sumeru: "sumeru", Fontaine: "fontaine", Natlan: "sumeru", Snezhnaya: "fontaine", "Nod-Krai": "fontaine" };
export const bgOf = (en) => BG[regionOf(en)] || "inazuma";

export const MALE_CHARS = new Set(["Diluc", "Kaeya", "Razor", "Venti", "Xingqiu", "Xiao", "Zhongli", "Bennett", "Tartaglia", "Chongyun", "Albedo",
  "Kaedehara Kazuha", "Thoma", "Gorou", "Arataki Itto", "Shikanoin Heizou", "Kamisato Ayato", "Tighnari", "Cyno", "Wanderer", "Alhaitham", "Kaveh",
  "Baizhu", "Mika", "Lyney", "Freminet", "Wriothesley", "Neuvillette", "Gaming", "Sethos", "Kinich", "Ororon", "Ifa", "Flins", "Varka", "Dahlia"]);
