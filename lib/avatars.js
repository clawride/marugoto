// Avatar dạng icon (emoji trên nền màu) — dùng được ở cả giao diện trắng lẫn giao diện game.
// Lưu trong hồ sơ dưới dạng "i:<id>" (cột avatar); avatar nhân vật Genshin cũ (vd "Qin") vẫn hợp lệ.
export const ICON_AVATARS = [
  { id: "fox", e: "🦊", vi: "Cáo", c: ["#ffd3a8", "#ff8a4c"] },
  { id: "cat", e: "🐱", vi: "Mèo", c: ["#ffe29a", "#ffb03d"] },
  { id: "dog", e: "🐶", vi: "Cún", c: ["#f1d9b8", "#d1a46d"] },
  { id: "panda", e: "🐼", vi: "Gấu trúc", c: ["#eef0f3", "#a8b0bd"] },
  { id: "rabbit", e: "🐰", vi: "Thỏ", c: ["#ffd9ec", "#f77fba"] },
  { id: "owl", e: "🦉", vi: "Cú", c: ["#e6d5b8", "#b08a55"] },
  { id: "penguin", e: "🐧", vi: "Cánh cụt", c: ["#cdeaff", "#5aa9e6"] },
  { id: "lion", e: "🦁", vi: "Sư tử", c: ["#ffe9a3", "#f6ad2b"] },
  { id: "tiger", e: "🐯", vi: "Hổ", c: ["#ffd9a0", "#f28a2a"] },
  { id: "frog", e: "🐸", vi: "Ếch", c: ["#d3f5ac", "#6cc24a"] },
  { id: "octopus", e: "🐙", vi: "Bạch tuộc", c: ["#f9c9e8", "#c860b8"] },
  { id: "unicorn", e: "🦄", vi: "Kỳ lân", c: ["#eadcff", "#b794f4"] },
  { id: "dragon", e: "🐲", vi: "Rồng", c: ["#c2f3d8", "#35b87a"] },
  { id: "sakura", e: "🌸", vi: "Hoa anh đào", c: ["#ffe0ec", "#ff8fb1"] },
  { id: "moon", e: "🌙", vi: "Trăng", c: ["#e4e8ff", "#8a94f0"] },
  { id: "star", e: "⭐", vi: "Sao", c: ["#fff6bd", "#ffcf33"] },
  { id: "fire", e: "🔥", vi: "Lửa", c: ["#ffd0b0", "#ff6b3d"] },
  { id: "water", e: "💧", vi: "Nước", c: ["#d3f0ff", "#4fb3f0"] },
  { id: "leaf", e: "🍃", vi: "Lá", c: ["#dcf7c8", "#79c75a"] },
  { id: "bolt", e: "⚡", vi: "Sét", c: ["#f3e1ff", "#b36cf0"] },
  { id: "onigiri", e: "🍙", vi: "Onigiri", c: ["#f6f7f9", "#cfd5de"] },
  { id: "ramen", e: "🍜", vi: "Ramen", c: ["#ffe8bd", "#f4a440"] },
  { id: "fuji", e: "🗻", vi: "Núi Phú Sĩ", c: ["#d6e6ff", "#6f9be0"] },
  { id: "book", e: "📚", vi: "Sách", c: ["#d6e4ff", "#5b8fd9"] },
];

export const ICON_IDS = new Set(ICON_AVATARS.map((a) => "i:" + a.id));
export const DEFAULT_ICON = "i:fox";
export const iconOf = (avatar) => (typeof avatar === "string" && avatar.startsWith("i:") ? ICON_AVATARS.find((a) => "i:" + a.id === avatar) || null : null);

// Màu nền ổn định theo tên cho người dùng còn dùng avatar nhân vật Genshin khi xem ở giao diện trắng
const PALETTE = ICON_AVATARS.map((a) => a.c);
export const colorsFor = (seed) => {
  let h = 0;
  for (const ch of String(seed || "?")) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};
