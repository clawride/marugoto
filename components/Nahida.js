"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const NAHIDA = CHARS.find((c) => c.en === "Nahida");

export const ND = {
  hub: [
    "Tri thức giống như hạt giống — gieo mỗi ngày một chút, rồi sẽ thành cả khu rừng. Cùng học A2-2 nhé!",
    "Ta đã chuẩn bị sẵn 18 bài học như 18 nhánh của Cây Thế Giới. Ngươi muốn bắt đầu từ đâu?",
    "Đừng lo nếu sai. Mỗi lần sai là một chiếc lá mới — ta sẽ giải thích cho ngươi hiểu.",
  ],
  vocab: "Từ vựng là những chiếc lá của ngôn ngữ. Hãy nhớ cả cách đọc lẫn ý nghĩa nhé.",
  listen: "Nhắm mắt lại và lắng nghe… người trong đoạn hội thoại đang muốn nói điều gì?",
  kanji: "Mỗi chữ Hán là một bức tranh nhỏ. Nhìn kỹ từng nét, ngươi sẽ đọc được câu chuyện của nó.",
  read: "Đọc chậm thôi, không ai giục ngươi đâu. Hiểu ý chính trước, rồi mới xem câu hỏi.",
  grammar: "Ngữ pháp là rễ cây — không nhìn thấy nhưng giữ cho câu văn đứng vững.",
  fill: "Một chỗ trống, bốn lựa chọn. Hãy nghĩ xem từ nào làm câu văn trọn vẹn.",
  order: "Các mảnh câu đang bị xáo trộn như giấc mơ lộn xộn. Sắp xếp lại giúp ta nhé.",
  ok: ["Đúng rồi! Ngươi học nhanh thật đấy.", "Tuyệt lắm~ Hạt giống tri thức đang nảy mầm rồi.", "Chính xác! Ta rất vui khi thấy ngươi tiến bộ."],
  bad: ["Chưa đúng rồi… nhưng không sao, đọc giải thích nhé.", "Hừm, câu này hơi khó. Lần sau ngươi sẽ làm được thôi.", "Sai một chút thôi. Hiểu vì sao sai mới là quan trọng."],
  examIntro: "Kỳ thi này có ba phần, mỗi phần có thời gian và điểm sàn riêng. Trượt một phần là chưa đạt đâu nhé. Bình tĩnh, ta tin ngươi.",
  pass: "Ngươi đã đỗ rồi! Ta, Nahida, xin chứng nhận tri thức của ngươi.",
  excellent: "Xuất sắc quá! Ngay cả các học giả Sumeru cũng phải ngưỡng mộ đấy.",
  fail: "Lần này chưa đạt… Cây cũng cần thời gian để lớn. Ôn lại rồi quay lại nhé.",
};

export function NahidaHost({ line, big = false }) {
  if (!NAHIDA) return null;
  return (
    <div className={`zlhost ndhost ${big ? "big" : ""}`}>
      <img src={charIcon(NAHIDA)} alt="Nahida" />
      <div className="bubble"><b>Nahida</b>{line}</div>
    </div>
  );
}

export function NahidaHero({ line }) {
  return (
    <div className="zlhero ndhero">
      {NAHIDA && <img src={charSplash(NAHIDA)} alt="" />}
      <div className="zlcopy">
        <div className="tag">GIÁO VIỆN SUMERU · 初級2</div>
        <h1>Marugoto A2-2</h1>
        <p className="t2">Người dẫn: Nahida · Tiểu Cát Tường Thảo Vương</p>
        <p>“{line || pickRand(ND.hub)}”</p>
      </div>
    </div>
  );
}
