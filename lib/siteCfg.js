// Cấu hình trang do quản trị điều chỉnh (bảng site_settings) — dùng chung cho máy chủ và trình duyệt
export const SITE_DEFAULTS = {
  banner: { text: "", level: "info" },       // thông báo hiện trên đầu mọi trang
  maintenance: { on: false, message: "" },   // bảo trì: người dùng thường thấy màn hình thông báo, quản trị vẫn vào được
  examMult: 1,                               // hệ số nhân Nguyên Thạch ở Luyện đề thi (0–5)
  hiddenExams: [],                           // id đề thi tạm ẩn
  chatEnabled: true,                         // phòng chat
  signupEnabled: true,                       // đăng ký tài khoản mới
};

const str = (v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, n);

// chuẩn hóa bất kỳ giá trị nào (từ cơ sở dữ liệu hoặc từ form quản trị) về đúng dạng, bỏ khóa lạ
export function normalizeSite(raw = {}) {
  const r = raw || {};
  const level = ["info", "warn", "ok"].includes(r.banner?.level) ? r.banner.level : "info";
  const mult = Number(r.examMult);
  return {
    banner: { text: str(r.banner?.text, 300).trim(), level },
    maintenance: { on: r.maintenance?.on === true, message: str(r.maintenance?.message, 300).trim() },
    examMult: Number.isFinite(mult) ? Math.min(5, Math.max(0, Math.round(mult * 10) / 10)) : 1,
    hiddenExams: Array.isArray(r.hiddenExams) ? [...new Set(r.hiddenExams.map(String).filter((x) => /^[a-z0-9-]{2,40}$/.test(x)))].slice(0, 300) : [],
    chatEnabled: r.chatEnabled !== false,
    signupEnabled: r.signupEnabled !== false,
  };
}
