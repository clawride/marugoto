// 🔒 Chính sách quyền riêng tư (Google yêu cầu khi bật "Đăng nhập bằng Google")
import Link from "next/link";

export const metadata = { title: "Chính sách quyền riêng tư · Sổ Tay Teyvat", description: "Sổ Tay Từ Vựng Teyvat thu thập dữ liệu gì, dùng vào việc gì và cách xóa dữ liệu." };

const S = ({ h, children }) => (<section className="panel lbsec legal"><h2>{h}</h2>{children}</section>);

export default function Privacy() {
  return (
    <>
      <Link href="/" className="back">‹ Trang chủ</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>PRIVACY POLICY</p>
        <h1>🔒 Chính sách quyền riêng tư</h1>
        <p>Áp dụng cho trang học tiếng Nhật Sổ Tay Từ Vựng Teyvat (tiengnhat.online). Cập nhật: 03/10/2026.</p>
        <div className="orn"><span /></div>
      </div>
      <S h="1. Dữ liệu chúng tôi lưu">
        <ul>
          <li><b>Khi chưa đăng nhập:</b> tiến độ học, điểm, cài đặt chỉ lưu trong trình duyệt của bạn (localStorage), không gửi lên máy chủ.</li>
          <li><b>Tài khoản:</b> tên hiển thị, ảnh đại diện (chọn từ bộ có sẵn), tên đăng nhập và mật khẩu đã được băm một chiều (không ai đọc được mật khẩu gốc).</li>
          <li><b>Đăng nhập bằng Google:</b> chỉ nhận mã định danh tài khoản Google, địa chỉ email và tên hiển thị mà Google cung cấp. Chúng tôi không nhận mật khẩu Google, không đọc Gmail, danh bạ hay bất kỳ dữ liệu nào khác.</li>
          <li><b>Tiến độ học trên đám mây:</b> khi đã đăng nhập, tiến độ học, điểm và kết quả luyện đề được lưu để dùng trên nhiều thiết bị.</li>
          <li><b>Bảng xếp hạng & phòng chat:</b> tên hiển thị, ảnh đại diện, điểm; tin nhắn trong phòng chat chỉ giữ trong ngày rồi tự xóa.</li>
        </ul>
      </S>
      <S h="2. Mục đích sử dụng">
        <p>Dữ liệu chỉ dùng để: đăng nhập, lưu và đồng bộ tiến độ học, hiển thị bảng xếp hạng, phòng chat và giấy chứng nhận luyện thi. Chúng tôi không bán, không chia sẻ dữ liệu cho bên thứ ba để quảng cáo, và không gửi email quảng cáo.</p>
      </S>
      <S h="3. Dịch vụ bên thứ ba">
        <ul>
          <li><b>Supabase</b> — lưu tài khoản và tiến độ học (máy chủ cơ sở dữ liệu).</li>
          <li><b>Vercel</b> — lưu trữ và vận hành trang web.</li>
          <li><b>Google Identity Services</b> — chỉ khi bạn chọn "Đăng nhập bằng Google".</li>
          <li><b>Google Gemini</b> — chỉ khi bạn dùng công cụ Đọc & Phân tích: đoạn văn bạn dán vào được gửi đi để phân tích, không gắn với tài khoản.</li>
        </ul>
      </S>
      <S h="4. Bảo mật">
        <p>Mật khẩu được băm bằng scrypt; phiên đăng nhập dùng mã ngẫu nhiên lưu dạng băm; kết nối luôn qua HTTPS. Dữ liệu tài khoản chỉ máy chủ của trang đọc được.</p>
      </S>
      <S h="5. Quyền của bạn — xem, sửa, xóa dữ liệu">
        <ul>
          <li>Đổi tên, ảnh đại diện trong mục Hồ sơ.</li>
          <li>Đăng xuất bất cứ lúc nào; xóa dữ liệu trên máy bằng cách xóa dữ liệu trang web trong trình duyệt.</li>
          <li>Muốn xóa hẳn tài khoản và toàn bộ dữ liệu trên máy chủ: nhắn yêu cầu trong phòng chat của trang (ghi rõ tên đăng nhập) hoặc liên hệ email hỗ trợ hiển thị trên màn hình đăng nhập Google của trang. Chúng tôi xóa trong vòng 7 ngày.</li>
          <li>Có thể gỡ quyền truy cập của trang trong tài khoản Google tại myaccount.google.com → Bảo mật → Ứng dụng bên thứ ba.</li>
        </ul>
      </S>
      <S h="6. Trẻ em">
        <p>Trang dành cho người học tiếng Nhật ở mọi lứa tuổi. Người dưới 13 tuổi nên có sự đồng ý của phụ huynh trước khi tạo tài khoản.</p>
      </S>
      <S h="7. Thay đổi chính sách">
        <p>Khi chính sách thay đổi, ngày cập nhật ở đầu trang sẽ được sửa. Xem thêm <Link href="/dieu-khoan">Điều khoản sử dụng</Link>.</p>
      </S>
    </>
  );
}
