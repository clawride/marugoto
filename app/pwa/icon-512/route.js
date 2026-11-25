// Biểu tượng PWA 512×512 — vẽ từ logo la bàn của trang (lib/iconImage.js)
import { iconPng } from "@/lib/iconImage";

export const dynamic = "force-static";
export function GET() { return iconPng(512, 110); }
