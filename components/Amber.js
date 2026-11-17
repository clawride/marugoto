"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const AMBER = CHARS.find((c) => c.en === "Amber");

export const AMB = {
  hub: [
    "Chào bạn, mình là Amber, Kỵ Sĩ Tiên Phong của Mondstadt! Bắt đầu học Minna - Genshin Sơ cấp 1 thôi nào.",
    "Mỗi bài là một chuyến thám hiểm nhỏ. Cứ đi từng bước, đừng vội, rồi bạn sẽ nói được tiếng Nhật.",
    "Năm Topic, mỗi Topic năm bài. Mình sẽ đồng hành với bạn suốt chặng đường!",
  ],
  vocab: "Từ mới của bài đây! Nhớ cả nghĩa lẫn cách dùng trong câu nhé.",
  listen: "Hội thoại ở đây do giọng máy đọc. Nghe kỹ rồi hãy chọn đáp án, đừng vội!",
  kanji: "Chữ Hán ở sơ cấp không nhiều đâu. Nhớ từng chữ một là được.",
  read: "Bài đọc ngắn dùng đúng mẫu câu vừa học. Đọc chậm và hiểu chắc nhé.",
  grammar: "Mẫu câu là xương sống của mỗi bài. Đọc kỹ cách chia trước khi làm bài.",
  fill: "Chọn từ điền vào chỗ trống. Nhớ nhìn xem trợ từ hoặc thể của động từ nhé.",
  order: "Sắp xếp các cụm thành một câu trọn vẹn. Đây là cách luyện viết mà không cần gõ chữ Nhật!",
  ok: ["Đúng rồi, giỏi quá!", "Chính xác! Cứ thế phát huy nhé.", "Tuyệt vời, bạn tiến bộ thấy rõ!"],
  bad: ["Chưa đúng rồi, nhưng không sao! Đọc giải thích rồi thử lại nhé.", "Hơi nhầm một chút thôi. Lần sau sẽ ổn mà.", "Sai rồi, đừng nản. Ôn lại mẫu câu rồi đi tiếp nào!"],
  examIntro: "Đây là kỳ thi chứng chỉ! Ba phần, mỗi phần có thời gian và điểm sàn riêng. Trượt một phần là chưa đạt. Bình tĩnh làm bài nhé!",
  pass: "Bạn đã đạt! Mình, Amber, xin trao chứng chỉ này cho bạn!",
  excellent: "Xuất sắc luôn! Kết quả này thật đáng khen!",
  fail: "Lần này chưa đạt, nhưng đừng buồn. Ôn lại rồi thử lần nữa, mình tin bạn làm được!",
};

export function AmberHost({ line, big = false }) {
  if (!AMBER) return null;
  return (
    <div className={`zlhost ambhost ${big ? "big" : ""}`}>
      <img src={charIcon(AMBER)} alt="Amber" />
      <div className="bubble"><b>Amber</b>{line}</div>
    </div>
  );
}

export function AmberHero({ line }) {
  return (
    <div className="zlhero ambhero">
      {AMBER && <img src={charSplash(AMBER)} alt="" />}
      <div className="zlcopy">
        <div className="tag">KỴ SĨ TIÊN PHONG · MINNA - GENSHIN</div>
        <h1>Minna - Genshin · Sơ cấp 1</h1>
        <p className="t2">Người dẫn: Amber · Kỵ Sĩ Tiên Phong Mondstadt</p>
        <p>“{line || pickRand(AMB.hub)}”</p>
      </div>
    </div>
  );
}
