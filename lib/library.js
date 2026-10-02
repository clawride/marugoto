// 📚 Thư viện sách: danh sách sách và các bài. Nội dung từng bài: public/library/<sách>/<bài>.json
// (tạo bởi scripts/build-library.mjs từ data/library/<sách>/*.json — sổ tay học tự biên soạn, không chép nguyên văn sách)
export const LIBRARY = [
  {
    id: "it-b2",
    title: "ITの日本語 B2 会話編",
    titleRo: "IT no Nihongo B2 Kaiwa-hen",
    vi: "Tiếng Nhật Công nghệ Thông tin – Hội thoại trong dự án phần mềm",
    sub: "ソフトウェア開発プロジェクト",
    level: "B2 · ~N3",
    authors: "Komaki Michiko, Nguyễn Thị Khánh, Đặng Khải Hoàn, Đinh Thị Hằng Nga, Nguyễn Thị Cẩm Lý, Nguyễn Anh Vũ",
    publisher: "NXB Thế Giới · Thaihabooks",
    color: "64,160,90",
    desc: "15 tình huống hội thoại trong một dự án phần mềm Nhật – Việt, từ buổi gặp đầu tiên đến khi kết thúc onsite.",
    lessons: [
      { n: 1, page: 31, jp: "初回訪問のあいさつ", ro: "Shokai hoomon no aisatsu", vi: "Chào hỏi trong lần gặp đầu tiên" },
      { n: 2, page: 41, jp: "キックオフミーティング プロジェクトの目的と概要", ro: "Kikkuofu miitingu: purojekuto no mokuteki to gaiyoo", vi: "Họp khởi động: mục đích và tổng quan dự án" },
      { n: 3, page: 51, jp: "キックオフミーティング スケジュールと進め方", ro: "Kikkuofu miitingu: sukejuuru to susumekata", vi: "Họp khởi động: lịch trình và cách triển khai" },
      { n: 4, page: 61, jp: "キックオフミーティング プロジェクト体制の説明", ro: "Kikkuofu miitingu: purojekuto taisei no setsumei", vi: "Họp khởi động: giới thiệu cơ cấu nhân sự dự án" },
      { n: 5, page: 71, jp: "オンサイト初日のあいさつ", ro: "Onsaito shonichi no aisatsu", vi: "Chào hỏi ngày đầu onsite" },
      { n: 6, page: 81, jp: "お客様の会社のルール", ro: "Okyakusama no kaisha no ruuru", vi: "Quy định ở công ty khách hàng" },
      { n: 7, page: 91, jp: "要件の説明", ro: "Yooken no setsumei", vi: "Giải thích yêu cầu" },
      { n: 8, page: 101, jp: "定例会議 進捗の報告", ro: "Teirei kaigi: shinchoku no hookoku", vi: "Họp định kỳ: báo cáo tiến độ" },
      { n: 9, page: 111, jp: "定例会議 課題の報告", ro: "Teirei kaigi: kadai no hookoku", vi: "Họp định kỳ: báo cáo vấn đề" },
      { n: 10, page: 121, jp: "定例会議 Q&Aの確認", ro: "Teirei kaigi: Q&A no kakunin", vi: "Họp định kỳ: xác nhận Q&A" },
      { n: 11, page: 131, jp: "製品デモ", ro: "Seihin demo", vi: "Demo sản phẩm" },
      { n: 12, page: 141, jp: "課題解決の相談", ro: "Kadai kaiketsu no soodan", vi: "Bàn cách giải quyết vấn đề" },
      { n: 13, page: 151, jp: "納品とリリースノート", ro: "Noohin toririisu nooto", vi: "Bàn giao sản phẩm và release note" },
      { n: 14, page: 161, jp: "UATサポートタスクの確認", ro: "UAT sapooto tasuku no kakunin", vi: "Xác nhận công việc hỗ trợ UAT" },
      { n: 15, page: 171, jp: "オンサイト終了のあいさつ", ro: "Onsaito shuuryoo no aisatsu", vi: "Chào hỏi khi kết thúc onsite" },
    ],
    // phần tra cứu thêm (không theo bài)
    extras: [
      { id: "nhan-vat", ico: "👥", jp: "主な登場人物", vi: "Nhân vật trong sách" },
      { id: "kinh-ngu", ico: "🙇", jp: "敬語のまとめ", vi: "Tóm tắt kính ngữ" },
      { id: "viet-tat", ico: "🔤", jp: "略語一覧", vi: "Từ viết tắt IT" },
      { id: "tu-vung", ico: "🔎", jp: "用語索引", vi: "Tra cứu toàn bộ từ vựng" },
    ],
  },
];

export const bookById = (id) => LIBRARY.find((b) => b.id === id);
export const lessonUrl = (book, n) => `/library/${book}/${n}.json`;
