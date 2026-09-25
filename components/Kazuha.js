"use client";
import { CHARS, charIcon, charSplash } from "@/lib/genshin";
import { pickRand } from "@/lib/data";

export const KAZUHA = CHARS.find((c) => c.en === "Kaedehara Kazuha");

export const KZ = {
  hub: [
    "Mỗi chữ Hán là một bài thơ nhỏ. Nhìn kỹ từng nét, ngươi sẽ nghe được câu chuyện của nó.",
    "Gió mang lá phong đi khắp nơi, còn chữ Hán mang ý nghĩa qua từng bộ phận. Cùng ta đọc chúng nhé.",
    "Nhớ được nửa chữ thôi cũng đủ: bộ bên trái gợi nghĩa, phần bên phải gợi cách đọc. Ngươi vẫn đoán được cả chữ.",
  ],
  learn: "Đừng học thuộc lòng một cách khô khan. Hãy xem chữ được ghép từ những phần nào, rồi kể cho mình một câu chuyện.",
  write: "Viết chậm, đúng thứ tự nét. Chữ đẹp không đến từ tốc độ, mà đến từ sự tĩnh tâm.",
  memo: "Nhìn chữ, nhớ nghĩa, nhớ những từ có chữ ấy. Như lá phong nhớ mùa thu.",
  read: "Một chữ có thể có nhiều cách đọc. Hãy để ý nó đứng một mình hay ghép với chữ khác.",
  sentence: "Chữ chỉ thật sự sống khi nằm trong câu. Đặt nó vào đúng chỗ nào.",
  guess: "Chưa nhớ hết cũng không sao. Nhìn bộ chỉ nghĩa, nhìn phần chỉ âm, rồi đoán như một thi nhân.",
  test: "Bài kiểm tra này gồm đủ mọi dạng. Bình tĩnh như mặt hồ, ngươi sẽ làm tốt.",
  ok: ["Chuẩn xác, như một vần thơ trọn vẹn.", "Hay lắm! Gió cũng phải ngừng lại để khen ngươi.", "Đúng rồi. Ngươi đang cảm được chữ đấy."],
  bad: ["Chưa đúng. Đọc lời giải thích rồi thử lại nhé.", "Lá phong cũng có lúc bay chệch hướng. Không sao cả.", "Sai một chút thôi. Nhìn lại các bộ phận của chữ xem."],
};

export function KazuhaHost({ line, big = false }) {
  if (!KAZUHA) return null;
  return (
    <div className={`zlhost kzhost ${big ? "big" : ""}`}>
      <img src={charIcon(KAZUHA)} alt="Kazuha" />
      <div className="bubble"><b>Kazuha</b>{line}</div>
    </div>
  );
}

export function KazuhaHero({ line }) {
  return (
    <div className="zlhero kzhero">
      {KAZUHA && <img src={charSplash(KAZUHA)} alt="" />}
      <div className="zlcopy">
        <div className="tag">LÁ PHONG VIẾT CHỮ · 漢字</div>
        <h1>Chữ Hán A1 → B1-2</h1>
        <p className="t2">Người dẫn: Kaedehara Kazuha · Lãng khách Inazuma</p>
        <p>“{line || pickRand(KZ.hub)}”</p>
      </div>
    </div>
  );
}
