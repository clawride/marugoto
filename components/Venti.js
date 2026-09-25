"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const VENTI = CHARS.find((c) => c.en === "Venti");

export const VT = {
  hub: [
    "Ehe~ Chào mừng đến Mondstadt! Mọi hành trình đều bắt đầu từ một lời chào — こんにちは!",
    "Ta là một thi sĩ lang thang. Hôm nay ta sẽ dạy ngươi những câu tiếng Nhật đầu tiên, như những nốt nhạc đầu tiên của một bài ca~",
    "Đừng vội! Gió cũng phải thổi từng chút một. Học mỗi ngày một bài là đủ rồi.",
  ],
  vocab: "Mỗi từ mới là một nốt nhạc. Ghép đủ nốt, ngươi sẽ hát được cả bài ca tiếng Nhật!",
  listen: "Nào, nghe gió kể chuyện đi… Người trong đoạn hội thoại đang nói gì vậy?",
  kanji: "Chữ viết tiếng Nhật giống như giai điệu — nhìn kỹ từng nét, đọc thành tiếng, rồi ngươi sẽ nhớ thôi.",
  read: "Đọc chậm rãi, như ngâm một bài thơ. Không cần vội đâu~",
  grammar: "Ngữ pháp là nhịp điệu của câu. Nắm được nhịp, câu văn sẽ tự trôi chảy.",
  fill: "Bài ca này thiếu một nốt! Chọn nốt đúng để hoàn thành câu nào.",
  order: "Gió thổi bay các chữ lung tung rồi! Sắp xếp lại giúp ta nhé~",
  ok: ["Ehe~ Đúng rồi! Ngươi có năng khiếu đấy!", "Tuyệt quá! Ta sẽ sáng tác một bài ca về ngươi~", "Chính xác! Gió đang reo vui cùng ngươi kìa."],
  bad: ["Ối, chưa đúng rồi. Không sao, ai cũng từng lạc nhịp mà~", "Hừm, câu này hơi khó nhỉ. Đọc giải thích rồi thử lại nhé.", "Sai một chút thôi! Lần sau chắc chắn ngươi làm được."],
  examIntro: "Đây là bài kiểm tra đầu tiên trên hành trình của ngươi! Ba phần, mỗi phần có thời gian và điểm sàn riêng. Thả lỏng nào, gió sẽ tiếp sức cho ngươi~",
  pass: "Ehe~ Ngươi đỗ rồi! Ta, Venti, sẽ hát vang tin vui này khắp Mondstadt!",
  excellent: "Xuất sắc! Đến cả các Tinh Linh Gió cũng phải ngưỡng mộ ngươi đấy~",
  fail: "Lần này chưa đạt rồi… Nhưng hành trình còn dài mà. Ôn lại rồi quay lại, ta sẽ chờ!",
};

export function VentiHost({ line, big = false }) {
  if (!VENTI) return null;
  return (
    <div className={`zlhost vthost ${big ? "big" : ""}`}>
      <img src={charIcon(VENTI)} alt="Venti" />
      <div className="bubble"><b>Venti</b>{line}</div>
    </div>
  );
}

export function VentiHero({ line }) {
  return (
    <div className="zlhero vthero">
      {VENTI && <img src={charSplash(VENTI)} alt="" />}
      <div className="zlcopy">
        <div className="tag">THÀNH MONDSTADT · 入門</div>
        <h1>Marugoto A1</h1>
        <p className="t2">Người dẫn: Venti · Phong Thần Barbatos</p>
        <p>“{line || pickRand(VT.hub)}”</p>
      </div>
    </div>
  );
}
