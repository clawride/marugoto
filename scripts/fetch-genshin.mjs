// Tải danh sách nhân vật & vũ khí Genshin (tên tiếng Việt + tiếng Anh) từ gi.yatta.moe
// Chạy: node scripts/fetch-genshin.mjs  → ghi data/genshin.json
import { writeFileSync } from "node:fs";

const API = "https://gi.yatta.moe/api/v2";
const get = async (lang, kind) => Object.values((await (await fetch(`${API}/${lang}/${kind}`)).json()).data.items);

const [avVi, avEn, wpVi, wpEn] = await Promise.all([get("vi", "avatar"), get("en", "avatar"), get("vi", "weapon"), get("en", "weapon")]);
const enName = (list) => Object.fromEntries(list.map((x) => [x.id, x.name]));
const avEnMap = enName(avEn), wpEnMap = enName(wpEn);

const WTYPES = ["WEAPON_SWORD_ONE_HAND", "WEAPON_CLAYMORE", "WEAPON_POLE", "WEAPON_BOW", "WEAPON_CATALYST"];
const ELEMS = { Ice: "cryo", Wind: "anemo", Electric: "electro", Water: "hydro", Fire: "pyro", Rock: "geo", Grass: "dendro" };
const now = Date.now() / 1000;

const characters = avVi
  .filter((a) => a.rank === 4 || a.rank === 5) // bỏ Aloy (105) — không có trong ước nguyện
  .filter((a) => !/PlayerBoy|PlayerGirl|Manekin/i.test(a.icon) && !/^Manekin/i.test(avEnMap[a.id] || ""))
  .filter((a) => !a.release || a.release <= now)
  .map((a) => ({
    id: a.id,
    vi: a.name,
    en: avEnMap[a.id] || a.name,
    rank: a.rank,
    el: ELEMS[a.element] || "anemo",
    wt: WTYPES.indexOf(a.weaponType),
    icon: a.icon.replace("UI_AvatarIcon_", ""),
    release: a.release || 0,
  }));

const weapons = wpVi
  .filter((w) => w.rank >= 3 && !w.isWeaponSkin && WTYPES.includes(w.type))
  .map((w) => ({
    id: w.id,
    vi: w.name,
    en: wpEnMap[w.id] || w.name,
    rank: w.rank,
    wt: WTYPES.indexOf(w.type),
    icon: w.icon.replace("UI_EquipIcon_", ""),
  }));

writeFileSync(new URL("../data/genshin.json", import.meta.url), JSON.stringify({ characters, weapons }));
console.log(`characters: ${characters.length} (5★ ${characters.filter((c) => c.rank === 5).length}), weapons: ${weapons.length}`);
