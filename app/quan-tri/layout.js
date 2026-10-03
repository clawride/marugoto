// Trang quản trị: không lập chỉ mục, không theo liên kết
export const metadata = { title: "Trang quản trị", robots: { index: false, follow: false, nocache: true } };
export default function AdminLayout({ children }) { return children; }
