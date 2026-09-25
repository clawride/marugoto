"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const MAVUIKA = CHARS.find((c) => c.en === "Mavuika");

export const MV = {
  hub: [
    "Chào mừng đến Natlan! Ta là Mavuika. Từ đây, ngươi sẽ cùng ta vượt qua 18 bài của Marugoto B1-2.",
    "Ngọn lửa không cháy mãi nếu không có củi. Mỗi bài học hôm nay chính là củi cho ngọn lửa tiếng Nhật của ngươi.",
    "Chín Topic, chín thử thách. Chiến binh Natlan không bỏ cuộc giữa chừng. Ta tin ngươi làm được!",
  ],
  vocab: "Ở trình độ trung cấp, vốn từ quyết định tất cả. Nhớ cả nghĩa lẫn sắc thái nhé!",
  listen: "Nghe kỹ giọng điệu nữa. Người nói vui, bực hay ngập ngừng đều là manh mối cả đấy.",
  kanji: "Chữ Hán như những viên đá của kim tự tháp Natlan, xếp đúng thì mới vững.",
  read: "Bài đọc dài hơn rồi. Đọc lướt để nắm ý chính trước, sau đó mới đi vào chi tiết.",
  grammar: "Mẫu ngữ pháp trung cấp tinh tế lắm, hãy để ý khi nào dùng và dùng với ai.",
  fill: "Một chỗ trống! Chọn đúng thì ngọn lửa bùng lên, chọn sai thì… thử lại thôi!",
  order: "Các mảnh câu văng tứ tung rồi. Ghép lại cho trôi chảy nào, chiến binh!",
  ok: ["Tuyệt lắm! Ngọn lửa của ngươi đang cháy rực!", "Chính xác! Đúng là chiến binh của Natlan!", "Hay lắm! Cứ giữ nhịp như thế!"],
  bad: ["Chưa đúng rồi. Đọc giải thích, lấy lại hơi rồi đi tiếp!", "Vấp ngã một chút thôi, chiến binh thật sự sẽ đứng dậy ngay.", "Sai mất rồi. Không sao, lửa vẫn còn đó!"],
  examIntro: "Đây là cuộc thử thách của Natlan! Ba phần, mỗi phần có thời gian và điểm sàn riêng. Trượt một phần là chưa đạt. Dốc hết sức nhé!",
  pass: "Ngươi đã vượt qua thử thách! Ta, Mavuika, trao cho ngươi chứng chỉ này!",
  excellent: "Xuất sắc! Ngọn lửa của ngươi rực sáng cả bầu trời Natlan!",
  fail: "Lần này chưa đạt… Nhưng lửa tàn thì lại nhóm lên. Ôn lại rồi quay lại thử thách nhé!",
};

export function MavuikaHost({ line, big = false }) {
  if (!MAVUIKA) return null;
  return (
    <div className={`zlhost mvhost ${big ? "big" : ""}`}>
      <img src={charIcon(MAVUIKA)} alt="Mavuika" />
      <div className="bubble"><b>Mavuika</b>{line}</div>
    </div>
  );
}

export function MavuikaHero({ line }) {
  return (
    <div className="zlhero mvhero">
      {MAVUIKA && <img src={charSplash(MAVUIKA)} alt="" />}
      <div className="zlcopy">
        <div className="tag">ĐẤU TRƯỜNG NATLAN · 中級2</div>
        <h1>Marugoto B1-2</h1>
        <p className="t2">Người dẫn: Mavuika · Hỏa Thần Natlan</p>
        <p>“{line || pickRand(MV.hub)}”</p>
      </div>
    </div>
  );
}
