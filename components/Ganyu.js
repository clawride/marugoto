"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const GANYU = CHARS.find((c) => c.en === "Ganyu");

export const GY = {
  hub: [
    "Xin chào, ta là Ganyu. Từ đây ta sẽ đồng hành cùng ngươi qua các bài Minna no Nihongo Sơ cấp 2.",
    "Học từng bước một, như hoa Cát Tường nở trên sườn núi tuyết. Mỗi bài học là một cánh hoa mới.",
    "Năm Topic, mỗi Topic năm bài. Cứ đi đều, ngươi sẽ tới đích thôi.",
  ],
  vocab: "Từ vựng mới của bài đây. Nhớ cả nghĩa lẫn cách dùng trong câu nhé.",
  listen: "Hội thoại ở đây đọc bằng giọng máy. Nghe kỹ, đoán ý rồi hãy chọn đáp án.",
  kanji: "Chữ Hán khó nhưng đáng công. Mỗi lần nhớ thêm một chữ, vốn đọc của ngươi lại dày thêm.",
  read: "Bài đọc ngắn dùng đúng mẫu câu vừa học. Đọc chậm, hiểu chắc.",
  grammar: "Mẫu câu mới là phần quan trọng nhất của mỗi bài. Đọc kỹ cách chia trước khi làm bài.",
  fill: "Chọn từ điền vào chỗ trống. Nhớ xem động từ đang ở thể nào nhé.",
  order: "Sắp xếp các cụm thành một câu trọn vẹn. Đây là cách luyện viết mà không cần gõ chữ Nhật.",
  ok: ["Đúng rồi, ngươi làm tốt lắm.", "Chính xác. Cứ giữ nhịp như vậy.", "Rất tốt, ta thấy ngươi tiến bộ rõ."],
  bad: ["Chưa đúng, nhưng đừng nản. Đọc giải thích rồi thử lại.", "Hơi nhầm một chút thôi. Lần sau sẽ ổn.", "Sai rồi, không sao. Ôn lại mẫu câu rồi đi tiếp."],
  examIntro: "Đây là kỳ thi chứng chỉ. Ba phần, mỗi phần có thời gian và điểm sàn riêng. Trượt một phần là chưa đạt. Bình tĩnh làm bài nhé.",
  pass: "Ngươi đã đạt. Ta, Ganyu, xin trao chứng chỉ này.",
  excellent: "Xuất sắc. Kết quả này thật đáng khen.",
  fail: "Lần này chưa đạt. Ôn lại rồi thử lần nữa, ta tin ngươi làm được.",
};

export function GanyuHost({ line, big = false }) {
  if (!GANYU) return null;
  return (
    <div className={`zlhost gyhost ${big ? "big" : ""}`}>
      <img src={charIcon(GANYU)} alt="Ganyu" />
      <div className="bubble"><b>Ganyu</b>{line}</div>
    </div>
  );
}

export function GanyuHero({ line }) {
  return (
    <div className="zlhero gyhero">
      {GANYU && <img src={charSplash(GANYU)} alt="" />}
      <div className="zlcopy">
        <div className="tag">LIÊN NGUYỆT CÁC · みんなの日本語</div>
        <h1>Minna no Nihongo · Sơ cấp 2</h1>
        <p className="t2">Người dẫn: Ganyu · Thư ký Liên Nguyệt Các</p>
        <p>“{line || pickRand(GY.hub)}”</p>
      </div>
    </div>
  );
}
