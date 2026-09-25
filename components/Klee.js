"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const KLEE = CHARS.find((c) => c.en === "Klee");

export const KL = {
  hub: [
    "Klee cũng đang học chữ nè! Mình cùng học từng hàng một nha, viết xong rồi mới đọc thuộc lòng!",
    "Chị Jean nói: muốn viết chữ đẹp thì phải viết đúng thứ tự nét. Klee sẽ canh giùm bạn đó!",
    "Học chữ mềm trước, chữ cứng sau. Mỗi ngày một hàng thôi là giỏi lắm rồi~",
  ],
  write: "Nhìn thứ tự nét trước, rồi tô theo nét mờ, cuối cùng tự viết một mình nha! Sai nét nào Klee chỉ liền!",
  read: "Giờ tới phần đọc và học thuộc! Nghe âm, nhìn mẹo nhớ, rồi chơi trò đoán chữ với Klee!",
  rule: "Phần này có luật đặc biệt đó! Đọc kỹ rồi nghe xem hai từ khác nhau ở đâu nha.",
  ok: ["Đúng rồi! Bùm bùm~ giỏi quá!", "Yay! Klee thưởng bạn một ngôi sao nè!", "Chính xác! Bạn học nhanh hơn cả Klee luôn!"],
  bad: ["Ơ… chưa đúng rồi. Không sao, thử lại nha!", "Hơi nhầm một chút thôi, nhìn kỹ lại mẹo nhớ nè.", "Sai mất rồi… nhưng lần sau chắc chắn đúng!"],
  good: ["Nét chữ đẹp quá! Chị Jean mà thấy chắc khen lắm!", "Oa, viết đẹp như chữ in luôn!"],
  fix: ["Có vài nét cần sửa nè — bấm “xem nét” để Klee vẽ mẫu nha.", "Gần đẹp rồi! Sửa mấy nét màu đỏ là hoàn hảo luôn."],
};

export function KleeHost({ line, big = false }) {
  if (!KLEE) return null;
  return (
    <div className={`zlhost klhost ${big ? "big" : ""}`}>
      <img src={charIcon(KLEE)} alt="Klee" />
      <div className="bubble"><b>Klee</b>{line}</div>
    </div>
  );
}

export function KleeHero({ line }) {
  return (
    <div className="zlhero klhero">
      {KLEE && <img src={charSplash(KLEE)} alt="" />}
      <div className="zlcopy">
        <div className="tag">LỚP HỌC CHỮ · ひらがな・カタカナ</div>
        <h1>Bảng Chữ Cái</h1>
        <p className="t2">Người dẫn: Klee · Tia Lửa Nhỏ Mondstadt</p>
        <p>“{line || pickRand(KL.hub)}”</p>
      </div>
    </div>
  );
}
