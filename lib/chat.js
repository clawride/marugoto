// Phòng chat chung — dùng chung cho server (/api/chat) và trình duyệt (components/ChatBox.js)
// Làm mới lúc 0:00 mỗi ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè).
const VN = 7 * 3600e3, DAY = 86400e3;
export const dayStartVN = (now = Date.now()) => new Date(Math.floor((now + VN) / DAY) * DAY - VN);
export const nextResetVN = (now = Date.now()) => new Date(dayStartVN(now).getTime() + DAY);
export const CHAT_MAX = 300;
// Bỏ ký tự điều khiển, gộp khoảng trắng thừa (giữ xuống dòng tối đa 2 lần liên tiếp)
export const cleanBody = (s) => String(s || "")
  .normalize("NFC")
  .replace(/[\u0000-\u0009\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g, "")
  .replace(/[ \t]+/g, " ")
  .replace(/\n{3,}/g, "\n\n")
  .trim();
