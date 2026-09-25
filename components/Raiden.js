"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const RAIDEN = CHARS.find((c) => c.en === "Raiden Shogun");

export const RD = {
  hub: [
    "Vĩnh hằng được xây từ những điều nhỏ bé lặp lại mỗi ngày. Học tiếng Nhật cũng vậy — hôm nay một bài, ngày mai một bài.",
    "Ta sẽ dẫn ngươi qua 18 bài của A2-1. Không vội, không bỏ sót — đó là con đường của sự bất biến.",
    "Inazuma trọng kỷ luật. Mỗi phần ngươi hoàn thành đều là một bước tiến không thể đảo ngược.",
  ],
  vocab: "Từ vựng là nền móng. Ghi nhớ chắc chắn rồi mới bước tiếp.",
  listen: "Hãy lắng nghe thật tập trung. Mỗi âm thanh đều mang một thông tin quan trọng.",
  kanji: "Chữ Hán như nét kiếm — đúng từng nét thì mới đẹp, mới mạnh.",
  read: "Đọc chậm, hiểu kỹ. Vội vàng là kẻ thù của sự chính xác.",
  grammar: "Ngữ pháp là trật tự của câu. Không có trật tự, lời nói sẽ hỗn loạn.",
  fill: "Một chỗ trống. Hãy chọn đáp án duy nhất đúng.",
  order: "Các mảnh câu đang hỗn loạn. Hãy đặt chúng về đúng trật tự.",
  ok: ["Chính xác. Ta ghi nhận.", "Tốt. Cứ giữ vững như vậy.", "Không sai. Ngươi đang tiến bộ."],
  bad: ["Chưa đúng. Hãy xem lại giải thích.", "Sai rồi — nhưng sai lầm cũng là một phần của con đường.", "Không đúng. Tập trung hơn nữa."],
  examIntro: "Kỳ thi gồm ba phần, mỗi phần có thời gian và điểm sàn riêng. Trượt một phần là chưa đạt. Hãy dùng toàn bộ năng lực của ngươi.",
  pass: "Ngươi đã đỗ. Ta, Raiden Shogun, công nhận thành quả này.",
  excellent: "Xuất sắc. Đây là sự hoàn mỹ mà vĩnh hằng hằng mong muốn.",
  fail: "Chưa đạt. Hãy rèn luyện thêm rồi quay lại — ta sẽ chờ.",
};

export function RaidenHost({ line, big = false }) {
  if (!RAIDEN) return null;
  return (
    <div className={`zlhost rdhost ${big ? "big" : ""}`}>
      <img src={charIcon(RAIDEN)} alt="Raiden Shogun" />
      <div className="bubble"><b>Raiden Shogun</b>{line}</div>
    </div>
  );
}

export function RaidenHero({ line }) {
  return (
    <div className="zlhero rdhero">
      {RAIDEN && <img src={charSplash(RAIDEN)} alt="" />}
      <div className="zlcopy">
        <div className="tag">THIÊN THỦ CÁC · 初級1</div>
        <h1>Marugoto A2-1</h1>
        <p className="t2">Người dẫn: Raiden Shogun · Lôi Thần Inazuma</p>
        <p>“{line || pickRand(RD.hub)}”</p>
      </div>
    </div>
  );
}
