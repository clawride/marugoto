import { iconPng } from "@/lib/iconImage";

// Favicon PNG 48×48 (cho trình duyệt / công cụ tìm kiếm không dùng được SVG)
export const size = { width: 48, height: 48 };
export const contentType = "image/png";
export default function Icon() { return iconPng(48, 10); }
