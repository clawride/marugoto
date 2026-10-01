import { iconPng } from "@/lib/iconImage";

// Biểu tượng khi thêm trang vào màn hình chính iPhone / iPad
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() { return iconPng(180, 0); }
