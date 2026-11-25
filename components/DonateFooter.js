"use client";
// Chân trang: đếm ngược ngày hết hạn tên miền tiengnhat.online (lặp lại mỗi năm vào ngày donate.expire "MM-DD", giờ Việt Nam)
// + lời kêu gọi ủng hộ; bấm "Đồng ý ủng hộ" thì hiện mã QR (quản trị đặt ảnh, bật/tắt ở trang quản trị).
import { useEffect, useState } from "react";
import { useSite } from "@/lib/useSite";

const VN = 7 * 3600e3;
// lần hết hạn kế tiếp: 00:00 giờ Việt Nam ngày MM-DD của năm nay, đã qua thì sang năm sau
function nextExpiry(mmdd, now = Date.now()) {
  const [m, d] = mmdd.split("-").map(Number);
  const y = new Date(now + VN).getUTCFullYear();
  let t = Date.UTC(y, m - 1, d) - VN;
  if (t <= now) t = Date.UTC(y + 1, m - 1, d) - VN;
  return t;
}
const two = (n) => String(n).padStart(2, "0");

export default function DonateFooter() {
  const site = useSite();
  const D = site.donate || {};
  const [now, setNow] = useState(null);
  const [open, setOpen] = useState(false);
  const [qrBad, setQrBad] = useState(false);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!D.on || now == null) return null;

  const end = nextExpiry(D.expire || "09-01", now);
  const left = Math.max(0, end - now);
  const days = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5), mi = Math.floor((left % 36e5) / 6e4), s = Math.floor((left % 6e4) / 1e3);
  const ed = new Date(end + VN), dateStr = `${two(ed.getUTCDate())}/${two(ed.getUTCMonth() + 1)}/${ed.getUTCFullYear()}`;
  const level = days <= 30 ? "danger" : days <= 90 ? "warn" : "calm";
  const cost = D.cost ?? 35;

  return (
    <footer className={`donatebar ${level}`} aria-label="Ủng hộ duy trì tên miền">
      <div className="dn-in">
        <div className="dn-head">
          <span className="dn-ico" aria-hidden="true">{level === "danger" ? "⏰" : level === "warn" ? "⚠️" : "🌐"}</span>
          <div>
            <b>Tên miền tiengnhat.online hết hạn ngày {dateStr}</b>
            <small>{level === "danger" ? "Sắp hết hạn — cần gia hạn gấp!" : level === "warn" ? "Sắp đến hạn gia hạn tên miền" : "Gia hạn mỗi năm vào ngày này"}</small>
          </div>
        </div>
        <div className="dn-count" role="timer" aria-live="off">
          {[[days, "ngày"], [h, "giờ"], [mi, "phút"], [s, "giây"]].map(([v, l]) => <div key={l}><b>{l === "ngày" ? v : two(v)}</b><small>{l}</small></div>)}
        </div>
        <p className="dn-msg">
          Phí duy trì tên miền là <b>{cost}$ mỗi năm</b>. Trang học miễn phí cho tất cả mọi người — mong một trong số các bạn ủng hộ <b>1$ hoặc dưới 1$</b> để có tiền duy trì tên miền. Cảm ơn bạn rất nhiều! 💖
          {D.note ? <><br /><span className="dn-note">{D.note}</span></> : null}
        </p>
        {!open ? (
          <button type="button" className="dn-btn" onClick={() => setOpen(true)}>💖 Đồng ý ủng hộ</button>
        ) : (
          <div className="dn-qr">
            {D.qrSrc && !qrBad
              ? <img src={D.qrSrc} alt="Mã QR ủng hộ duy trì tên miền" width={220} height={220} onError={() => setQrBad(true)} />
              : <p className="hint">Quản trị chưa cài mã QR — bạn quay lại sau nhé. Cảm ơn tấm lòng của bạn!</p>}
            <p className="hint">Quét mã bằng ứng dụng ngân hàng / ví điện tử. Mọi khoản ủng hộ đều dùng để gia hạn tên miền.</p>
            <button type="button" className="dn-close" onClick={() => setOpen(false)}>Đóng</button>
          </div>
        )}
      </div>
    </footer>
  );
}
