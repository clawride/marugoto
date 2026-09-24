// template.js được mount lại mỗi lần chuyển trang → dùng làm hiệu ứng chuyển cảnh
export default function Template({ children }) {
  return <div className="page">{children}</div>;
}
