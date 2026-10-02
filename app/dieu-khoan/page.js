// 📜 Điều khoản sử dụng
import Link from "next/link";

export const metadata = { title: "Điều khoản sử dụng · Sổ Tay Teyvat", description: "Điều khoản sử dụng trang học tiếng Nhật Sổ Tay Từ Vựng Teyvat." };

const S = ({ h, children }) => (<section className="panel lbsec legal"><h2>{h}</h2>{children}</section>);

export default function Terms() {
  return (
    <>
      <Link href="/" className="back">‹ Trang chủ</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }}>TERMS OF SERVICE</p>
        <h1>📜 Điều khoản sử dụng</h1>
        <p>Áp dụng cho trang học tiếng Nhật Sổ Tay Từ Vựng Teyvat (tiengnhat.online). Cập nhật: 03/10/2026.</p>
        <div className="orn"><span /></div>
      </div>
      <S h="1. Dịch vụ">
        <p>Trang cung cấp miễn phí công cụ học tiếng Nhật: từ vựng, chữ Hán, nghe, thư viện sách, luyện đề thi theo cấu trúc JLPT và các trò chơi ôn tập. Trang có thể thay đổi, thêm hoặc bớt tính năng mà không cần báo trước.</p>
      </S>
      <S h="2. Tài khoản">
        <ul>
          <li>Bạn chịu trách nhiệm giữ bí mật mật khẩu và tài khoản Google dùng để đăng nhập.</li>
          <li>Không dùng tên hiển thị hoặc tin nhắn xúc phạm, lừa đảo, quảng cáo, vi phạm pháp luật. Tài khoản vi phạm có thể bị khóa hoặc xóa.</li>
          <li>Không gian lận điểm trên bảng xếp hạng hay tấn công, làm quá tải hệ thống.</li>
        </ul>
      </S>
      <S h="3. Nội dung học tập">
        <ul>
          <li>Đề luyện thi trên trang do Sổ Tay Teyvat tự biên soạn theo cấu trúc JLPT; đây không phải đề thi chính thức và không do Japan Foundation hay JEES phát hành.</li>
          <li>Điểm và giấy chứng nhận luyện thi chỉ là ước tính để tự đánh giá, không có giá trị như chứng chỉ JLPT.</li>
          <li>Chúng tôi cố gắng bảo đảm nội dung chính xác nhưng không bảo đảm tuyệt đối; nếu thấy lỗi, hãy báo trong phòng chat.</li>
        </ul>
      </S>
      <S h="4. Giới hạn trách nhiệm">
        <p>Trang được cung cấp "như hiện có". Chúng tôi không chịu trách nhiệm cho thiệt hại phát sinh từ việc sử dụng hoặc không thể sử dụng trang, kể cả mất dữ liệu tiến độ học.</p>
      </S>
      <S h="5. Quyền riêng tư">
        <p>Cách chúng tôi thu thập và dùng dữ liệu được mô tả trong <Link href="/chinh-sach">Chính sách quyền riêng tư</Link>.</p>
      </S>
    </>
  );
}
