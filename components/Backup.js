"use client";
// Sao lưu / khôi phục tiến độ học ra file .json — để chuyển tiến độ giữa trang online và bản offline (hoặc sang máy khác).
// Tiến độ nằm trong localStorage của trình duyệt, mỗi địa chỉ trang một bản riêng, nên cần chuyển bằng file.
import { useRef } from "react";
import { useGame } from "@/components/Game";
import { sfx } from "@/lib/sfx";

const KEY = "teyvat_b11_v2"; // cùng khóa với components/Game.js

export function BackupItems() {
  const { S, toast } = useGame();
  const file = useRef(null);

  const save = async () => {
    // ưu tiên tiến độ đang dùng trên trang (đã gộp giá trị mặc định); chưa tải xong thì lấy bản trong localStorage
    const raw = S ? JSON.stringify(S) : (() => { try { return localStorage.getItem(KEY); } catch { return null; } })() || "{}";
    const d = new Date(), pad = (n) => String(n).padStart(2, "0");
    const name = `tien-do-teyvat-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
    const blob = new Blob([JSON.stringify({ app: "teyvat", v: 1, at: d.toISOString(), data: JSON.parse(raw) })], { type: "application/json" });
    sfx.click();
    // điện thoại: mở bảng Chia sẻ của máy (gửi thẳng qua Zalo, Gmail, Google Drive… sang máy tính)
    const file = new File([blob], name, { type: "application/json" });
    const touch = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
    if (touch && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Tiến độ Sổ Tay Teyvat" }); toast?.("Đã gửi file tiến độ: " + name); return; }
      catch (e) { if (e?.name === "AbortError") return; } // người dùng đóng bảng chia sẻ; lỗi khác → tải file như thường
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast?.("Đã lưu file tiến độ vào thư mục Tải về: " + name);
  };

  const load = async (f) => {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const data = j?.app === "teyvat" ? j.data : j;
      if (!data || typeof data !== "object" || !("primo" in data)) throw new Error("không phải file tiến độ");
      const inv = Object.keys(data.inv || {}).length;
      if (!confirm(`Khôi phục tiến độ từ file này?\n\n• ${Number(data.primo || 0).toLocaleString("vi-VN")} Nguyên Thạch · ${inv} nhân vật/vũ khí\n• Lưu lúc: ${j?.at ? new Date(j.at).toLocaleString("vi-VN") : "không rõ"}\n\nTiến độ hiện tại trên trang này sẽ bị THAY THẾ hoàn toàn.`)) return;
      localStorage.setItem(KEY, JSON.stringify(data));
      location.reload();
    } catch (e) {
      alert("Không đọc được file tiến độ: " + e.message);
    } finally { if (file.current) file.current.value = ""; }
  };

  return (
    <>
      <button type="button" className="mnitem" style={{ "--c": "159,227,210" }} onClick={save}>
        <span className="mnico" aria-hidden="true">💾</span>
        <span className="mntxt"><b>Sao lưu tiến độ</b><small>Tải file tiến độ về máy · để chuyển sang bản offline hoặc máy khác</small></span>
      </button>
      <button type="button" className="mnitem" style={{ "--c": "243,211,138" }} onClick={() => file.current?.click()}>
        <span className="mnico" aria-hidden="true">📂</span>
        <span className="mntxt"><b>Khôi phục tiến độ</b><small>Mở file tiến độ đã sao lưu · thay thế tiến độ hiện tại</small></span>
      </button>
      {/* không lọc loại file: trên một số điện thoại, file nhận qua Zalo/Drive không được nhận là JSON và bị làm mờ — load() tự kiểm tra */}
      <input ref={file} type="file" hidden onChange={(e) => load(e.target.files?.[0])} />
    </>
  );
}
