// Biểu tượng PWA "maskable" 512×512: nền tràn kín ô, la bàn thu nhỏ vào vùng an toàn (Android tự cắt tròn / bo góc)
import { iconPng } from "@/lib/iconImage";

export const dynamic = "force-static";
export function GET() { return iconPng(512, 0, 0.66); }
