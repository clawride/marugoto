"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const NEUVILLETTE = CHARS.find((c) => c.en === "Neuvillette");

export const NV = {
  hub: [
    "Ta là Neuvillette, Thẩm phán tối cao của Fontaine. Ta sẽ đồng hành cùng ngươi qua Minna - Genshin Trung cấp 2.",
    "Ở trình độ trung cấp, đọc dài và nói mạch lạc quan trọng hơn thuộc lòng từng từ. Hãy đọc kỹ như đọc một bản án.",
    "Mười hai bài, mỗi bài có đọc – viết, nói – nghe, ngữ pháp và bài kiểm tra cuối bài. Cứ đi đều từng bước.",
  ],
  vocab: "Từ vựng trung cấp thường có nhiều nghĩa. Hãy nhớ từ trong ngữ cảnh của câu.",
  listen: "Hội thoại ở đây đọc bằng giọng máy. Chú ý cách người nói nối ý và thể hiện cảm xúc.",
  kanji: "Chữ Hán ở trình độ này là chìa khóa để đọc báo, đọc văn bản dài. Đừng bỏ qua.",
  read: "Bài đọc dài: đọc một lượt để nắm ý chính, rồi đọc lại để tìm chi tiết và quan điểm của người viết.",
  grammar: "Mỗi mẫu ngữ pháp trung cấp có sắc thái riêng. Đọc kỹ phần giải thích và cách nối.",
  fill: "Chọn cách nói đúng cho chỗ trống. Hãy xét cả nghĩa lẫn văn phong của câu.",
  order: "Sắp xếp các cụm thành câu hoàn chỉnh. Câu dài hơn, nhưng quy tắc vẫn vậy: động từ chính đứng cuối.",
  ok: ["Chính xác. Phán quyết của ngươi rất hợp lý.", "Đúng rồi. Ta ghi nhận sự tiến bộ này.", "Rất tốt. Cứ giữ sự cẩn trọng như vậy."],
  bad: ["Chưa đúng. Hãy xem lại lập luận trong phần giải thích.", "Nhầm một chút. Ở trình độ này, sắc thái rất quan trọng.", "Sai rồi, nhưng đó là một phần của việc học. Thử lại nhé."],
  examIntro: "Đây là kỳ thi chứng chỉ. Ba phần, mỗi phần có thời gian và điểm sàn riêng. Trượt một phần là chưa đạt. Hãy làm bài công tâm và bình tĩnh.",
  pass: "Ngươi đã đạt. Ta, Neuvillette, công nhận kết quả này.",
  excellent: "Xuất sắc. Một kết quả không có gì để bàn cãi.",
  fail: "Lần này chưa đạt. Ôn lại rồi quay lại — phiên xét xử luôn mở cửa cho người cố gắng.",
};

export function NeuvilletteHost({ line, big = false }) {
  if (!NEUVILLETTE) return null;
  return (
    <div className={`zlhost nvhost ${big ? "big" : ""}`}>
      <img src={charIcon(NEUVILLETTE)} alt="Neuvillette" />
      <div className="bubble"><b>Neuvillette</b>{line}</div>
    </div>
  );
}

export function NeuvilletteHero({ line }) {
  return (
    <div className="zlhero nvhero">
      {NEUVILLETTE && <img src={charSplash(NEUVILLETTE)} alt="" />}
      <div className="zlcopy">
        <div className="tag">PALAIS MERMONIA · MINNA - GENSHIN</div>
        <h1>Minna - Genshin · Trung cấp 2</h1>
        <p className="t2">Người dẫn: Neuvillette · Thẩm phán tối cao Fontaine</p>
        <p>“{line || pickRand(NV.hub)}”</p>
      </div>
    </div>
  );
}
