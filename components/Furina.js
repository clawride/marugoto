"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const FURINA = CHARS.find((c) => c.en === "Furina");

export const FU = {
  hub: [
    "Chào mừng đến Nhà Hát Epiclese! Hôm nay vở diễn mang tên “Marugoto A2/B1” — và ngươi là nhân vật chính!",
    "Khán giả đang chờ đấy! Chín màn diễn, chín Topic — đừng để ta phải thất vọng nhé~",
    "Ta, Furina, sẽ phán xét màn trình diễn tiếng Nhật của ngươi. Công bằng và… đầy kịch tính!",
  ],
  vocab: "Diễn viên giỏi phải thuộc lời thoại! Từ vựng chính là kịch bản của ngươi đấy.",
  listen: "Suỵt! Tấm màn đã kéo lên… Hãy lắng nghe thật kỹ các nhân vật đang nói gì.",
  kanji: "Chữ Hán giống như trang phục sân khấu — nhìn qua thì phức tạp, nhưng mỗi chi tiết đều có ý nghĩa.",
  read: "Một bài đọc hay như một kịch bản hay. Đọc hết rồi hẵng trả lời, đừng vội vàng!",
  grammar: "Ngữ pháp là đạo diễn phía sau hậu trường — không có nó, vở diễn sẽ loạn mất!",
  fill: "Một chỗ trống trên sân khấu! Chọn đúng diễn viên để lấp vào nào.",
  order: "Các cảnh diễn bị xáo trộn rồi! Sắp xếp lại cho đúng trình tự giúp ta.",
  ok: ["Bravo! Khán giả đang vỗ tay kìa!", "Tuyệt vời! Đúng là ngôi sao của Fontaine!", "Chính xác! Ta biết mà, ngươi có tài năng thiên bẩm~"],
  bad: ["Ôi không, diễn hỏng một cảnh rồi… Xem lại giải thích đi nhé.", "Hừm, chưa đúng. Nhưng một diễn viên thật sự sẽ đứng dậy sau vấp ngã!", "Sai mất rồi! Không sao, vở diễn vẫn tiếp tục."],
  examIntro: "Đây là buổi xét xử cuối cùng! Ba phần, mỗi phần có thời gian và điểm sàn riêng — trượt một phần là thua kiện đấy. Sẵn sàng chưa?",
  pass: "Phán quyết: ĐỖ! Ta, Furina, tuyên bố ngươi xứng đáng nhận chứng chỉ này!",
  excellent: "Một màn trình diễn hoàn hảo! Cả Fontaine đứng dậy vỗ tay cho ngươi!",
  fail: "Phán quyết: chưa đạt… Nhưng vở diễn nào cũng có lần tổng duyệt. Ôn lại rồi quay lại nhé!",
};

export function FurinaHost({ line, big = false }) {
  if (!FURINA) return null;
  return (
    <div className={`zlhost fuhost ${big ? "big" : ""}`}>
      <img src={charIcon(FURINA)} alt="Furina" />
      <div className="bubble"><b>Furina</b>{line}</div>
    </div>
  );
}

export function FurinaHero({ line }) {
  return (
    <div className="zlhero fuhero">
      {FURINA && <img src={charSplash(FURINA)} alt="" />}
      <div className="zlcopy">
        <div className="tag">NHÀ HÁT EPICLESE · 初中級</div>
        <h1>Marugoto A2/B1</h1>
        <p className="t2">Người dẫn: Furina · Thủy Thần Fontaine</p>
        <p>“{line || pickRand(FU.hub)}”</p>
      </div>
    </div>
  );
}
