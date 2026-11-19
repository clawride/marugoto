"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const NAVIA = CHARS.find((c) => c.en === "Navia");

export const NA = {
  hub: [
    "Chào cậu! Tớ là Navia, chủ tịch Hội Spina di Rosula. Từ giờ tớ sẽ cùng cậu đi qua Minna - Genshin Trung cấp 1!",
    "Lên trung cấp rồi, mỗi bài đều có ngữ pháp, nói – nghe, đọc – viết và bài kiểm tra. Cứ từ từ, tớ ở ngay đây.",
    "Mười hai bài thôi mà. Làm xong một bài thì tự thưởng cho mình một chiếc bánh macaron nhé!",
  ],
  vocab: "Từ vựng trung cấp nhiều từ Hán lắm. Nhớ cả cách đọc lẫn cách dùng trong câu nha.",
  listen: "Hội thoại ở đây đọc bằng giọng máy. Để ý cách người nói nối ý và thay đổi giọng điệu nhé.",
  kanji: "Chữ Hán là chìa khóa để đọc văn bản dài. Mỗi ngày thêm vài chữ là đủ!",
  read: "Đọc một lượt để nắm ý chính, rồi đọc lại tìm chi tiết. Cậu làm được mà!",
  grammar: "Mỗi mẫu ngữ pháp trung cấp có sắc thái riêng. Đọc kỹ phần giải thích trước khi làm nhé.",
  fill: "Chọn cách nói đúng cho chỗ trống. Xem kỹ cả nghĩa lẫn cách nối nha.",
  order: "Sắp xếp các cụm thành câu hoàn chỉnh. Động từ chính đứng cuối, nhớ nhé!",
  ok: ["Tuyệt lắm! Đúng rồi đó!", "Chính xác! Cậu giỏi quá!", "Hoàn hảo! Tiếp tục nào!"],
  bad: ["Hơi tiếc một chút, xem lại giải thích nha.", "Chưa đúng rồi, nhưng không sao đâu!", "Nhầm một chút thôi, câu sau sẽ ổn mà."],
  examIntro: "Đây là kỳ thi chứng chỉ. Ba phần, mỗi phần có thời gian và điểm sàn riêng. Bình tĩnh làm bài nhé, tớ cổ vũ cậu!",
  pass: "Đạt rồi! Tớ, Navia, trao chứng chỉ này cho cậu!",
  excellent: "Xuất sắc quá! Phải ăn mừng mới được!",
  fail: "Lần này chưa đạt. Ôn lại rồi thử lần nữa nhé, tớ tin cậu!",
};

export function NaviaHost({ line, big = false }) {
  if (!NAVIA) return null;
  return (
    <div className={`zlhost nahost ${big ? "big" : ""}`}>
      <img src={charIcon(NAVIA)} alt="Navia" />
      <div className="bubble"><b>Navia</b>{line}</div>
    </div>
  );
}

export function NaviaHero({ line }) {
  return (
    <div className="zlhero nahero">
      {NAVIA && <img src={charSplash(NAVIA)} alt="" />}
      <div className="zlcopy">
        <div className="tag">SPINA DI ROSULA · MINNA - GENSHIN</div>
        <h1>Minna - Genshin · Trung cấp 1</h1>
        <p className="t2">Người dẫn: Navia · Chủ tịch Spina di Rosula</p>
        <p>“{line || pickRand(NA.hub)}”</p>
      </div>
    </div>
  );
}
