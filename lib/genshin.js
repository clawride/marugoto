import GI from "@/data/genshin.json";

// Ảnh nhân vật/vũ khí Genshin Impact © HoYoverse — lấy qua gi.yatta.moe
export const ASSET = "https://gi.yatta.moe/assets/UI/";
export const WTYPE_VI = ["Kiếm Đơn", "Trọng Kiếm", "Vũ Khí Cán Dài", "Cung", "Pháp Khí"];

export const CHARS = GI.characters;
export const WEAPONS = GI.weapons;

const charById = new Map(CHARS.map((c) => [c.id, c]));
const weaponById = new Map(WEAPONS.map((w) => [w.id, w]));

export function itemOf(key) {
  const [k, id] = key.split(":");
  const x = k === "c" ? charById.get(+id) : weaponById.get(+id);
  return x ? { ...x, kind: k, key } : null;
}
export const keyOf = (kind, x) => `${kind}:${x.id}`;

export const iconOf = (it) => (it.kind === "c" ? `${ASSET}UI_AvatarIcon_${it.icon}.png` : `${ASSET}UI_EquipIcon_${it.icon}.png`);
export const artOf = (it) => (it.kind === "c" ? `${ASSET}UI_Gacha_AvatarImg_${it.icon}.png` : `${ASSET}UI_Gacha_EquipIcon_${it.icon}.png`);
export const charIcon = (c) => `${ASSET}UI_AvatarIcon_${c.icon}.png`;
export const charSplash = (c) => `${ASSET}UI_Gacha_AvatarImg_${c.icon}.png`;
export const weaponArt = (w) => `${ASSET}UI_Gacha_EquipIcon_${w.icon}.png`;
export const weaponIcon = (w) => `${ASSET}UI_EquipIcon_${w.icon}.png`;

// Biểu tượng nguyên tố gốc
const EL_ASSET = { cryo: "Ice", anemo: "Wind", electro: "Electric", hydro: "Water", pyro: "Fire", geo: "Rock", dendro: "Grass" };
export const elemIcon = (el) => `${ASSET}UI_Buff_Element_${EL_ASSET[el] || "Wind"}.png`;
