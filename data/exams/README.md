# Đề thi — khuôn dữ liệu (data/exams/<id>.json)

Build: `node scripts/build-exams.mjs` (tự chạy trong prebuild) · Kiểm tra: `node scripts/build-exams.mjs --check`
Hiển thị: /de-thi (tất cả) · /de-thi/jlpt · /de-thi/kyu · làm bài: /de-thi/bai/<id>

```jsonc
{
  "id": "n4-mau-1",                 // trùng tên file, chỉ chữ thường/số/gạch
  "kind": "jlpt",                   // "jlpt" (JLPT mới N1–N5) | "kyu" (JLPT cũ 1級–4級)
  "level": "N4",                    // N1–N5 hoặc 1級–4級 → dùng thang điểm chuẩn trong lib/exams.js
  "order": 1,                       // thứ tự trong danh sách (tùy chọn)
  "title": "JLPT N4 – Đề mẫu rút gọn",
  "jp": "日本語能力試験 N4 模擬試験",
  "source": "Nguồn đề / ghi chú bản quyền",
  "scoring": {                      // TÙY CHỌN: bỏ trống = thang chuẩn theo level (chỉ khai khi là kỳ thi khác)
    "groups": [{ "id": "all", "jp": "合計", "vi": "Tổng", "max": 1000, "min": 0 }],
    "pass": 600,
    "cefr": [[800, "B2"], [600, "B1"]],   // tùy chọn: [điểm tối thiểu, mức CEFR] từ cao xuống thấp
    "grades": [[900, "特A級"], [700, "A級"]] // tùy chọn: xếp 級 theo điểm
  },
  "sections": [
    {
      "jp": "言語知識（文字・語彙）", "vi": "Chữ – Từ vựng",
      "minutes": 25,                // giờ làm phần này (chế độ thi thật)
      "group": "gengo",             // nhóm điểm: N1–N3: gengo | dokkai | choukai · N4–N5: gengo | choukai
                                    // JLPT cũ 1級–4級: moji (文字・語彙 100) | choukai (聴解 100) | dokkai (読解・文法 200)
                                    // thứ tự phần thi JLPT cũ: 文字・語彙 → 聴解 → 読解・文法
      "parts": [
        {
          "jp": "問題1", "title": "漢字読み",
          "instr": "＿＿＿のことばはひらがなでどうかきますか。",   // đề dẫn (tiếng Nhật, như đề thi)
          "instrVi": "Từ được gạch chân đọc bằng hiragana thế nào?",
          "group": "dokkai",          // (tùy chọn) ghi đè nhóm điểm cho riêng 問題 này
          "passage": {                // (bài đọc) hiển thị trước các câu hỏi
            "title": "…", "text": "Văn bản, xuống dòng bằng \n, gạch chân bằng [[…]]",
            "sentences": [ SENTENCE ] // phân tích từng câu (hiện sau khi làm xong các câu của bài đọc)
          },
          "questions": [
            {
              "q": "この[[店]]はやすいです。",          // [[…]] = gạch chân; （　）, ★, ＿＿ viết thẳng
              "choices": ["みせ", "いえ", "へや", "えき"],   // chuỗi; ảnh: "img:/exams/img/x.png"
              "answer": 0,                               // chỉ số đáp án đúng (0 = lựa chọn 1)
              "pt": 1,                                   // (tùy chọn) trọng số điểm
              "img": "/exams/img/…png",                  // (tùy chọn) tranh của câu hỏi
              "audio": [ { "sp": "女", "g": "f", ...SENTENCE } ],  // bài nghe: đọc lần lượt bằng giọng Nhật (nữ f / nam m)
              "audioUrl": "/exams/audio/…mp3",           // (tùy chọn) file nghe thật, ưu tiên hơn "audio"
              "hideChoices": true,                       // (nghe) lựa chọn chỉ đọc trong audio — ẩn chữ đến khi trả lời
              "ex": {                                    // lời giải hiện ngay sau khi chọn
                "s": SENTENCE,                           // câu hoàn chỉnh (có đáp án), tách từ đầy đủ
                "vi": "Giải thích vì sao đúng, các lựa chọn khác sai ở đâu",
                "choices": [ { "jp": "みせ", "r": "", "ro": "mise", "vi": "cửa hàng" }, … ]  // nghĩa từng lựa chọn
              }
            }
          ]
        }
      ]
    }
  ]
}
```

SENTENCE = khuôn câu của Thư viện sách (jp, ro, vi, words[{w,r,ro,pos,base,vi}], pt) — xem quy tắc tách từ / romaji trong
scripts/check-library.mjs (nối các w phải ra đúng jp).
