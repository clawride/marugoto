// Biểu tượng PWA 192×192 — vẽ từ logo la bàn của trang (lib/iconImage.js)
import { iconPng } from "@/lib/iconImage";

export const dynamic = "force-static";
export function GET() { return iconPng(192, 40); }
