// Cấu hình trang do quản trị điều chỉnh (bảng site_settings) — dùng chung cho máy chủ và trình duyệt
export const SITE_DEFAULTS = {
  banner: { text: "", level: "info" },       // thông báo hiện trên đầu mọi trang
  maintenance: { on: false, message: "" },   // bảo trì: người dùng thường thấy màn hình thông báo, quản trị vẫn vào được
  examMult: 1,                               // hệ số nhân Nguyên Thạch ở Luyện đề thi (0–5)
  hiddenExams: [],                           // id đề thi tạm ẩn
  chatEnabled: true,                         // phòng chat
  signupEnabled: true,                       // đăng ký tài khoản mới
  gadgetEnabled: true,                       // nút "Gadget" trên thanh đầu trang + web app /gadget
  // bản máy tính (Windows) của gadget: tệp zip trên GitHub Releases (tag cố định gadget-latest, thay tệp khi có bản mới)
  gadgetDownload: "https://github.com/clawride/marugoto/releases/download/gadget-latest/TiengNhat-Gadget-win64.zip",
  // chân trang: đếm ngược ngày hết hạn tên miền (lặp lại mỗi năm vào ngày expire "MM-DD") + kêu gọi ủng hộ, bấm đồng ý thì hiện mã QR
  // qr: ảnh (data:image/…;base64) hoặc đường dẫn https — /api/site không gửi ảnh, chỉ gửi qrv; ảnh lấy ở /api/site/qr
  donate: { on: true, cost: 35, expire: "09-01", note: "", qr: "/donate/qr.png" },
};
const QR_MAX = 600000; // ~450KB ảnh

// mã phiên bản ngắn của ảnh QR (để trình duyệt tải lại khi quản trị đổi ảnh)
export function qrVersion(qr) {
  if (!qr) return "";
  let h = 0; for (let i = 0; i < qr.length; i += Math.max(1, Math.floor(qr.length / 4000))) h = (h * 31 + qr.charCodeAt(i)) | 0;
  return `${qr.length.toString(36)}${(h >>> 0).toString(36)}`;
}
// bản gửi cho mọi người (bỏ ảnh QR cho nhẹ)
export function publicSite(s) {
  const { qr, ...d } = s.donate || {};
  // ảnh tĩnh (/donate/…) hoặc https → gửi thẳng đường dẫn; ảnh tải lên (data:) → qua /api/site/qr?v=…
  const qrv = qrVersion(qr), qrSrc = !qr ? "" : qr.startsWith("data:") ? `/api/site/qr?v=${qrv}` : qr;
  return { ...s, donate: { ...d, qrv, qrSrc } };
}

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
    gadgetEnabled: r.gadgetEnabled !== false,
    gadgetDownload: typeof r.gadgetDownload === "string" && /^https:\/\/[^\s"<>]{8,500}$/.test(r.gadgetDownload.trim()) ? r.gadgetDownload.trim() : SITE_DEFAULTS.gadgetDownload,
    donate: normDonate(r.donate),
  };
}
function normDonate(d = {}) {
  d = d || {};
  const cost = Number(d.cost);
  // chưa từng đặt (undefined) → mã QR mặc định của chủ trang (public/donate/qr.png); "" = quản trị đã xóa → ẩn mã
  const qr = d.qr === undefined && !d.qrv ? SITE_DEFAULTS.donate.qr
    : typeof d.qr === "string" && (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(d.qr) && d.qr.length <= QR_MAX || /^https:\/\/[^\s"'<>]{4,500}$/.test(d.qr) || /^\/donate\/[a-z0-9_-]+\.(png|jpe?g|webp)$/.test(d.qr)) ? d.qr : "";
  return {
    on: d.on !== false,
    cost: Number.isFinite(cost) ? Math.min(9999, Math.max(0, Math.round(cost * 100) / 100)) : 35,
    expire: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(d.expire) ? d.expire : "09-01",
    note: str(d.note, 300).trim(),
    qr,
    // trình duyệt nhận bản rút gọn (publicSite) có qrv thay cho ảnh
    ...(typeof d.qrv === "string" && !qr ? { qrv: d.qrv.slice(0, 40), qrSrc: typeof d.qrSrc === "string" && /^(\/api\/site\/qr\?v=[a-z0-9]{1,40}|\/donate\/[a-z0-9_-]+\.(png|jpe?g|webp)|https:\/\/[^\s"<>]{4,500})$/.test(d.qrSrc) ? d.qrSrc : "" } : {}),
  };
}
