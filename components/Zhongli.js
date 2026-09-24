"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const ZHONGLI = CHARS.find((c) => c.en === "Zhongli");

export const ZL = {
  hub: [
    "Ngôn ngữ cũng như khế ước — hiểu rõ từng điều khoản thì mới vận dụng được. Nào, bắt đầu thôi.",
    "Học vấn không thể mua bằng Mora. Nhưng thời gian bỏ ra sẽ không phụ lòng ngươi.",
    "Mỗi Topic là một viên đá nền. Đủ ba viên, ta sẽ cho ngươi dự kỳ khảo hạch.",
  ],
  grammar: "Ngữ pháp là xương sống của câu văn. Đọc kỹ giải thích, rồi thử sức với phần luyện tập.",
  reading: "Bài đọc dài đòi hỏi sự kiên nhẫn. Hãy đọc hết một lượt rồi mới xem câu hỏi.",
  listening: "Lắng nghe như nghe tiếng mưa trên đá — chậm rãi, chú tâm. Có thể nghe lại, nhưng đừng vội.",
  ok: ["Chính xác. Ngươi đã nắm được điều cốt lõi.", "Tốt lắm. Không sai một ly.", "Đúng vậy. Cứ giữ nhịp như thế."],
  bad: ["Chưa đúng. Đọc lại giải thích rồi thử lần nữa.", "Hừm… nhầm lẫn là chuyện thường. Quan trọng là hiểu vì sao.", "Sai rồi. Hãy xem kỹ ngữ cảnh của câu."],
  examIntro: "Kỳ khảo hạch này có ba phần, mỗi phần có thời hạn và điểm sàn riêng — như một khế ước. Trượt một phần là không đạt. Ngươi sẵn sàng chứ?",
  pass: "Khế ước đã hoàn thành. Ta, Zhongli, xác nhận năng lực của ngươi.",
  excellent: "Xuất sắc. Hiếm ai đạt được mức này — ta ghi nhận thành tích của ngươi.",
  fail: "Chưa đạt lần này. Đá phải mài mới sáng; hãy ôn lại rồi quay về đây.",
};

export function ZhongliHost({ line, big = false }) {
  if (!ZHONGLI) return null;
  return (
    <div className={`zlhost ${big ? "big" : ""}`}>
      <img src={charIcon(ZHONGLI)} alt="Zhongli" />
      <div className="bubble"><b>Zhongli</b>{typeof line === "string" ? line : line}</div>
    </div>
  );
}

export function ZhongliHero({ line }) {
  return (
    <div className="zlhero">
      {ZHONGLI && <img src={charSplash(ZHONGLI)} alt="" />}
      <div className="zlcopy">
        <div className="tag">HỌC VIỆN · 往生堂</div>
        <h1>Học Viện B1-1</h1>
        <p className="t2">Giám khảo: Zhongli · Nham Vương Đế Quân</p>
        <p>“{line || pickRand(ZL.hub)}”</p>
      </div>
    </div>
  );
}
