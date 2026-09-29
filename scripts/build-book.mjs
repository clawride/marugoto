// 📖 Học theo sách: data/book/<khóa>-*.json (mỗi file { lessons: [...] }, chép từ sách) → public/book/<khóa>/<bài>.json
// + dữ liệu 2 buổi "テストとふりかえり" (A1: Topic 1–5 và 6–9): public/book/<khóa>/test1.json, test2.json
//   node scripts/build-book.mjs
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SRC = path.join(ROOT, "data", "book");

// Buổi kiểm tra theo sách (p71–72, p114–115): Can-do, もじテスト (đọc 5 thẻ), かいわテスト (5 câu hỏi)
const TESTS = {
  a1: [
    { n: 1, page: 71, topics: [1, 5], lessons: [1, 10], moji: "word", write: ["だい2か「なふだ」", "だい7か「Eメール」", "だい10か「バースデーカード」"],
      examples: [["おめでとう", "omedetoo", "chúc mừng"], ["あね", "ane", "chị gái (của mình)"], ["コーヒー", "koohii", "cà phê"], ["ベッド", "beddo", "giường"], ["かいしゃ", "kaisha", "công ty"]] },
    { n: 2, page: 114, topics: [6, 9], lessons: [11, 18], moji: "sentence", write: ["だい17か「ブログ」"],
      examples: [["やすみの ひは しゃしんを とります。", "Yasumi no hi wa shashin o torimasu.", "Ngày nghỉ tôi chụp ảnh."], ["かわいい ハンカチが ほしいです。", "Kawaii hankachi ga hoshii desu.", "Tôi muốn một chiếc khăn tay dễ thương."], ["1000えんです", "Sen-en desu", "1000 yên."], ["かぶきを みました。", "Kabuki o mimashita.", "Tôi đã xem kabuki."], ["すばらしかったです。", "Subarashikatta desu.", "Tuyệt vời lắm."]] },
  ],
  // A2-1 かつどう p86–87, p140–141: もじテスト đọc câu (đọc được 80% là đạt), かいわテスト có thẻ tình huống
  a21: [
    { n: 1, page: 86, topics: [1, 5], lessons: [1, 10], moji: "sentence", pass: 4, candoPages: "178–181",
      write: ["だい2か ③[3] ウェブサイトの じこしょうかいへの コメント", "だい9か ③ がいこくごがくしゅうの きろく"],
      examples: [["しゅみは クラシックを 聞くことです。", "Shumi wa kurashikku o kiku koto desu.", "Sở thích của tôi là nghe nhạc cổ điển.", "しゅみは クラシックを きくことです。"], ["9月ごろ すずしく なります。", "Kugatsu goro suzushiku narimasu.", "Khoảng tháng 9 trời trở nên mát mẻ.", "くがつごろ すずしく なります。"], ["1つめじゃなくて、2つめです。", "Hitotsume ja nakute, futatsume desu.", "Không phải cái thứ nhất mà là cái thứ hai.", "ひとつめじゃなくて、ふたつめです。"], ["いつか 日本に 行きたいです。", "Itsuka Nihon ni ikitai desu.", "Một ngày nào đó tôi muốn đến Nhật.", "いつか にほんに いきたいです。"]],
      kaiwaEx: { jp: "いままでに どんな がいこくごを べんきょうしましたか。", ro: "Imamade ni donna gaikokugo o benkyoo shimashita ka.", vi: "Từ trước đến giờ bạn đã học những ngoại ngữ nào?" },
      card: { jp: "日本の ともだちが あなたの まちに 来ました。いま、ホテルに とまっています。日よう日に、まちを あんないします。なんじに どこで あいますか。そうだん して ください。", kana: "にほんの ともだちが あなたの まちに きました。いま、ホテルに とまっています。にちようびに、まちを あんないします。なんじに どこで あいますか。そうだん して ください。", vi: "Một người bạn Nhật đến thành phố của bạn và đang ở khách sạn. Chủ nhật bạn sẽ dẫn bạn ấy đi tham quan. Hãy bàn xem gặp nhau lúc mấy giờ, ở đâu." } },
    { n: 2, page: 140, topics: [6, 9], lessons: [11, 18], moji: "sentence", pass: 4, candoPages: "178–181",
      write: ["だい11か ②[3] ピクニックの メモ", "だい18か ③[2] けっこんの おいわいの カード"],
      examples: [["マレーシアの クロッポと ちょっと にています。", "Mareeshia no kuroppo to chotto nite imasu.", "Hơi giống món bánh phồng kroppok của Malaysia."], ["たなかさんに 東京で 会ったことが あります。", "Tanaka-san ni Tookyoo de atta koto ga arimasu.", "Tôi đã từng gặp anh Tanaka ở Tokyo.", "たなかさんに とうきょうで あったことが あります。"], ["ときどき スポーツを する ひとは 4にんです。", "Tokidoki supootsu o suru hito wa yonin desu.", "Số người thỉnh thoảng chơi thể thao là 4 người."], ["カーラさんは きっと よろこぶと おもいます。", "Kaara-san wa kitto yorokobu to omoimasu.", "Tôi nghĩ chắc chắn chị Carla sẽ vui."]],
      card: { jp: "きょう、せんせいは すこし ぐあいが わるそうです。せんせいと 話して ください。", kana: "きょう、せんせいは すこし ぐあいが わるそうです。せんせいと はなして ください。", vi: "Hôm nay thầy/cô giáo có vẻ không được khỏe. Hãy nói chuyện với thầy/cô." } },
  ],
  // 初中級 A2/B1 p74–75, p116–117: Can-do チェック + 会話テスト (không có もじテスト); 読解・文法テスト ở rtest (p160–161)
  ab1: [
    { n: 1, page: 74, topics: [1, 5], lessons: [1, 5], moji: "none", candoPages: "162–166", write: [], examples: [],
      kaiwaEx: { jp: "あなたは今、どんなところに住んでいますか。まとめて話してください。", kana: "あなたは いま、どんな ところに すんでいますか。まとめて はなして ください。", ro: "Anata wa ima, donna tokoro ni sunde imasu ka. Matomete hanashite kudasai.", vi: "Bây giờ bạn đang sống ở nơi như thế nào? Hãy nói tổng hợp lại. (Can-do 9/13/18/22)" },
      card: { jp: "あなたは日本人の友だちがいます。その人はあなたの国に来てまだ1か月です。食事になれたかどうか、好きなものはあるかなど、聞いてください。", kana: "あなたは にほんじんの ともだちが います。その ひとは あなたの くにに きて まだ いっかげつです。しょくじに なれたか どうか、すきな ものは あるか など、きいて ください。", vi: "Bạn có một người bạn Nhật mới đến nước bạn được 1 tháng. Hãy hỏi xem bạn ấy đã quen với đồ ăn chưa, có món nào thích không, v.v." } },
    { n: 2, page: 116, topics: [6, 9], lessons: [6, 9], moji: "none", candoPages: "162–166", write: [], examples: [],
      kaiwaEx: { jp: "あなたはどんなところで働いていますか。／どんな仕事をしていますか。まとめて話してください。", kana: "あなたは どんな ところで はたらいていますか。／どんな しごとを していますか。まとめて はなして ください。", ro: "Anata wa donna tokoro de hataraite imasu ka. / Donna shigoto o shite imasu ka. Matomete hanashite kudasai.", vi: "Bạn làm việc ở nơi như thế nào? / Bạn làm công việc gì? Hãy nói tổng hợp lại. (Can-do 32/42)" },
      card: { jp: "あなたは日本の空港にいます。アナウンスが聞こえてきましたが、わかりません。そばにいる日本人に聞いてください。", kana: "あなたは にほんの くうこうに います。アナウンスが きこえて きましたが、わかりません。そばに いる にほんじんに きいて ください。", vi: "Bạn đang ở sân bay Nhật. Có thông báo nhưng bạn không hiểu. Hãy hỏi người Nhật đứng cạnh." } },
  ],
  // A2-2 かつどう p87–88, p138–139: もじテスト "cố gắng đọc được tất cả", かいわテスト có 2 câu hỏi ví dụ + thẻ tình huống
  a22: [
    { n: 1, page: 87, topics: [1, 5], lessons: [1, 10], moji: "sentence", pass: 5, passNote: "sách: cố gắng đọc được tất cả", candoPages: "180–183",
      write: ["だい7か ④ 日本まつりボランティアカード", "だい9か ④ ねんがじょう"],
      examples: [["3にんきょうだいの いちばんめですから、いちろうと いう なまえです。", "Sannin kyoodai no ichibanme desu kara, Ichiroo to iu namae desu.", "Vì là con cả trong 3 anh em nên tên là Ichirō."], ["ピアノが じょうずに なりますように。", "Piano ga joozu ni narimasu yoo ni.", "Mong sao chơi piano giỏi lên."], ["みなさん、本日は おいそがしい中、日本まつりに おいでくださって、ありがとうございます。", "Minasan, honjitsu wa oisogashii naka, Nihon matsuri ni oide kudasatte, arigatoo gozaimasu.", "Thưa mọi người, xin cảm ơn đã đến lễ hội Nhật Bản hôm nay dù rất bận rộn.", "みなさん、ほんじつは おいそがしいなか、にほんまつりに おいでくださって、ありがとうございます。"]],
      kaiwaEx: { jp: "（あなたの 国の かんこうち）に 行きたいんですが、7月は どうですか。／今年の 休み（正月など とくべつな 休み）は どう してましたか。", ro: "(Anata no kuni no kankoochi) ni ikitai n desu ga, shichigatsu wa doo desu ka. / Kotoshi no yasumi (shoogatsu nado tokubetsu na yasumi) wa doo shite mashita ka.", vi: "Tôi muốn đi (điểm du lịch ở nước bạn), tháng 7 thì thế nào? / Kỳ nghỉ năm nay (Tết hay kỳ nghỉ đặc biệt) bạn đã làm gì?" },
      card: { jp: "日本の 友だちを あなたの おすすめの レストランに つれてきました。友だちと そうだんして 料理を ちゅうもんして ください。", kana: "にほんの ともだちを あなたの おすすめの レストランに つれてきました。ともだちと そうだんして りょうりを ちゅうもんして ください。", vi: "Bạn đưa một người bạn Nhật đến nhà hàng bạn giới thiệu. Hãy bàn với bạn ấy rồi gọi món." } },
    { n: 2, page: 138, topics: [6, 9], lessons: [11, 18], moji: "sentence", pass: 5, passNote: "sách: cố gắng đọc được tất cả", candoPages: "180–183",
      write: ["だい13か ⑤ かんこうちの コメントノート"],
      examples: [["できるだけ スーパーの ふくろを もらわないように しています。", "Dekiru dake suupaa no fukuro o morawanai yoo ni shite imasu.", "Tôi cố gắng hết mức để không nhận túi ni-lông ở siêu thị."], ["Aモデルの ほうが デザインが いいです。", "Ee moderu no hoo ga dezain ga ii desu.", "Mẫu A có thiết kế đẹp hơn."], ["ここは 金閣寺です。金閣は 14せいきの おわりに、しょうぐんによって たてられました。", "Koko wa Kinkakuji desu. Kinkaku wa juuyon-seeki no owari ni, shoogun ni yotte tateraremashita.", "Đây là chùa Kinkakuji. Kinkaku được tướng quân cho xây vào cuối thế kỷ 14.", "ここは きんかくじです。きんかくは 14せいきの おわりに、しょうぐんによって たてられました。"]],
      kaiwaEx: { jp: "どんな エコかつどうを していますか。／どんな 子どもでしたか。", kana: "どんな エコかつどうを していますか。／どんな こどもでしたか。", ro: "Donna eko katsudoo o shite imasu ka. / Donna kodomo deshita ka.", vi: "Bạn đang làm những hoạt động bảo vệ môi trường nào? / Hồi nhỏ bạn là đứa trẻ thế nào?" },
      card: { jp: "日本の 友だちを はくぶつかんに つれてきました。てんじひんの せつめいを 読んで、友だちに 話しましょう。", kana: "にほんの ともだちを はくぶつかんに つれてきました。てんじひんの せつめいを よんで、ともだちに はなしましょう。", vi: "Bạn đưa một người bạn Nhật đến bảo tàng. Hãy đọc phần giải thích hiện vật (bằng tiếng nước bạn) rồi kể lại cho bạn ấy." } },
  ],
};
// Thang đánh giá かいわテスト của sách A2 (khác A1)
const FLOWERS_A2 = [
  ["もっと すごい", "Tuyệt vời! Được hỏi rõ ràng về chuyện quen thuộc thì trả lời ngay được tất cả, và nói liền được từ 2 câu trở lên.", "fl-a"],
  ["ごうかく", "Đạt! Được hỏi rõ ràng về chuyện quen thuộc thì trả lời được hầu hết.", "fl-b"],
  ["もう すこし", "Cố thêm chút nữa! Được hỏi rõ ràng và thật chậm thì trả lời được một phần.", "fl-c"],
];
const KANA = /^[぀-ヿ　\sー、。？！0-9０-９]+$/;

// pics.tsv: "pic<TAB>mô tả<TAB>emoji" hoặc "word<TAB>từ<TAB>nghĩa<TAB>emoji"
const PICS = new Map();
const picsFile = path.join(SRC, "pics.tsv");
if (fs.existsSync(picsFile)) for (const line of fs.readFileSync(picsFile, "utf8").replace(/\r/g, "").split("\n")) {
  const c = line.split("\t"); const em = c.pop(); if (em?.trim()) PICS.set(c.join("\t"), em.trim());
}
// pics-img.tsv: cùng khóa + url ảnh いらすとや + tên tranh (chỉ lưu đường dẫn, ảnh hiển thị trực tiếp từ irasutoya.com)
const IMGS = new Map();
const imgFile = path.join(SRC, "pics-img.tsv");
if (fs.existsSync(imgFile)) for (const line of fs.readFileSync(imgFile, "utf8").replace(/\r/g, "").split("\n")) {
  if (line.startsWith("#")) continue;
  const c = line.split("\t"); c.pop(); const u = c.pop(); if (u?.startsWith("https://")) IMGS.set(c.join("\t"), u);
}

// ——— Sách Rikai: テストとふりかえり 1–2 (p99–100, p165–166) và にほんごチェック (p194–197) ———
// data/book/extra/<sách>-extra.json (chép tay từ sách) + kho câu luyện thêm lấy từ chính các bài Rikai và phiếu Kanji A1
const HAS_KANJI = /[一-鿿々]/;
const KANA_WORD = /^[ぁ-ゖァ-ヺー]{2,8}$/;
function buildRikaiExtra(D, out, course) {
  const xf = path.join(SRC, "extra", `${course}-extra.json`);
  if (!fs.existsSync(xf)) return;
  const X = JSON.parse(fs.readFileSync(xf, "utf8"));
  const base = course.replace(/-rikai$/, ""); // a1-rikai → a1, a21-rikai → a21
  const sheets = JSON.parse(fs.readFileSync(path.join(ROOT, "data", `kanji-sheets-${base}.json`), "utf8")).sheets;
  fs.writeFileSync(path.join(out, "check.json"), JSON.stringify(X.check));
  for (const T of X.tests) {
    const Ls = D.lessons.filter((L) => L.lesson >= T.lessons[0] && L.lesson <= T.lessons[1]);
    const acts = Ls.flatMap((L) => L.sections.flatMap((S) => S.acts.map((A) => ({ A, L }))));
    const uniq = (arr, key) => { const s = new Set(); return arr.filter((x) => { const k = key(x); if (s.has(k)) return false; s.add(k); return true; }); };
    // ① nghe và viết: từ viết bằng kana trong bài
    const K = JSON.parse(fs.readFileSync(path.join(SRC, `${base}-katsudou.json`), "utf8")).lessons.filter((L) => L.lesson >= T.lessons[0] && L.lesson <= T.lessons[1]);
    const kacts = K.flatMap((L) => L.sections.flatMap((S) => S.acts.map((A) => ({ A, L }))));
    const listen = uniq([...acts, ...kacts].flatMap(({ A, L }) => ((Array.isArray(A.words) ? A.words : A.words?.items) || [])
      .map((w) => ({ ...w, jp: KANA_WORD.test(w.jp) ? w.jp : w.kana || "" })).filter((w) => KANA_WORD.test(w.jp) && w.vi).map((w) => ({ say: w.jp, a: [w.jp], vi: w.vi, l: L.lesson }))), (x) => x.say);
    // ② đọc kanji: câu ví dụ của phiếu Kanji A1 theo Topic 〔chữ|cách đọc〕 + từ Kanji
    const kanji = [];
    for (const sh of sheets.filter((s) => s.t >= T.topics[0] && s.t <= T.topics[1])) {
      const vi = Object.fromEntries(sh.words.map((w) => [w.w, w.vi]));
      for (const w of sh.words) kanji.push({ k: w.w, a: [w.r], vi: w.vi, t: sh.t });
      for (const ex of sh.ex) {
        const parts = [...ex.matchAll(/〔([^|〕]+)\|([^〕]+)〕/g)];
        parts.forEach((m, i) => {
          const [kj, rd] = HAS_KANJI.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
          let pre = "", post = "";
          const plain = (s) => s.replace(/〔([^|〕]+)\|([^〕]+)〕/g, (_, a, b) => (HAS_KANJI.test(a) ? b : a));
          pre = plain(ex.slice(0, m.index)); post = plain(ex.slice(m.index + m[0].length));
          kanji.push({ pre, k: kj, post, a: [rd], vi: vi[kj] || "", t: sh.t });
        });
      }
    }
    // ③ chọn trợ từ / từ: bài điền có sẵn lựa chọn
    const fill = [];
    for (const { A, L } of acts) if (A.kind === "fill" && A.opts?.length >= 2) for (const it of A.items || []) {
      const bl = it.blanks || []; let j = -1;
      bl.forEach((ans, bi) => {
        if ((it.example || []).includes(bi) || !A.opts.includes(ans)) return;
        j = -1;
        const jp = it.jp.replace(/（([①-⑳])）/g, () => { j++; return j === bi ? "（　）" : bl[j]; });
        fill.push({ sp: it.sp || "", jp, opts: A.opts, a: ans, vi: it.vi, l: L.lesson });
      });
    }
    // ④ sắp xếp câu
    const order = acts.flatMap(({ A, L }) => (A.kind === "order" ? A.items || [] : []).filter((it) => !it.example && it.chunks?.length >= 3 && it.chunks.length <= 6 && it.chunks.some((c) => [...c].length > 1))
      .map((it) => ({ pre: it.pre || "", chunks: it.chunks, post: it.post || "", vi: it.vi, l: L.lesson })));
    // ⑤ đọc hiểu: bài đọc có câu hỏi chọn (kèm toàn văn)
    const read = [];
    for (const [i, { A, L }] of acts.entries()) {
      if (A.kind !== "read" || !A.text?.length) continue;
      const qs = [A, acts[i + 1]?.A].filter((x) => x && x.items?.length && (x === A || x.kind !== "read"))
        .flatMap((x) => x.items.filter((it) => !it.example && it.q?.jp && it.opts?.length >= 2 && it.opts.includes(it.a))
          .map((it) => ({ q: it.q, opts: it.opts, a: it.a })));
      if (qs.length) read.push({ title: A.title || null, text: A.text.map((t) => ({ jp: t.jp, vi: t.vi })), qs, l: L.lesson });
    }
    // ⑥ nghe ○/×: câu tiêu biểu của bài (quiz) — đúng nghĩa hay không
    const ox = uniq(Ls.flatMap((L) => L.quiz.filter((q) => [...q.jp].length <= 30).map((q) => ({ jp: q.jp, vi: q.vi, l: L.lesson }))), (x) => x.jp);
    // ④ さくぶん: bài viết của các bài được nêu trong sách
    const sakubun = T.sakubun.map((n) => {
      const L = D.lessons.find((x) => x.lesson === n);
      const W = L?.sections.flatMap((S) => S.acts).filter((A) => A.kind === "write") || [];
      return { l: n, title: L?.title || null, acts: W.map((A) => ({ title: A.title || null, ask: A.ask || null, task: A.task || "", model: [...(A.model || []), ...(A.text || [])].map((m) => ({ jp: m.jp, ro: m.ro || "", vi: m.vi })) })) };
    });
    const data = { ...T, pools: { listen, kanji, fill, order, read, ox }, sakubun };
    fs.writeFileSync(path.join(out, `rtest${T.n}.json`), JSON.stringify(data));
    console.log(`  rtest${T.n}: nghe ${listen.length} · kanji ${kanji.length} · chọn ${fill.length} · xếp ${order.length} · đọc ${read.length} · ○× ${ox.length} · さくぶん ${sakubun.map((s) => s.acts.length).join("/")}`);
  }
  console.log(`  にほんごチェック: ${X.check.reduce((s, t) => s + t.lessons.reduce((a, l) => a + l.kb.length, 0), 0)} câu cơ bản`);
}

for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith(".json"))) {
  // a1-katsudou.json → public/book/a1/ (kèm buổi kiểm tra) · a1-rikai.json → public/book/a1-rikai/
  const main = f.endsWith("-katsudou.json");
  const course = main ? f.split("-")[0] : f.replace(/\.json$/, "");
  const D = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
  const out = path.join(ROOT, "public", "book", course);
  fs.mkdirSync(out, { recursive: true });
  // câu cơ bản (きほんぶん) của bài Rikai: các trợ lý chép sách ghi ở kihonbun/kihon/key hoặc cando có số → gom về notes
  for (const L of D.lessons) {
    if (!main && L.cando?.[0]?.no) { L.notes = L.notes || L.cando; L.cando = []; }
    for (const k of ["kihonbun", "kihon", "key"]) if (L[k]) { if (!L.notes) L.notes = L[k]; delete L[k]; }
  }
  // tranh minh họa bằng emoji (không dùng tranh của sách): data/book/pics.tsv → it.em (câu có tranh), w.em (thẻ từ)
  for (const L of D.lessons) for (const S of L.sections) for (const A of S.acts) {
    for (const it of A.items || []) if (it.pic) { const k = `pic\t${it.pic}`; if (PICS.get(k)) it.em = PICS.get(k); if (IMGS.get(k)) it.img = IMGS.get(k); }
    for (const w of (Array.isArray(A.words) ? A.words : A.words?.items) || []) { const k = `word\t${w.jp}\t${w.vi}`; if (PICS.get(k)) w.em = PICS.get(k); if (IMGS.get(k)) w.img = IMGS.get(k); }
    // chuẩn hóa vài cách ghi khác của trợ lý chép sách (中級1): q chuỗi → {jp}, full → form (câu đầy đủ hiện sau khi chấm),
    // group → gợi ý nhóm, track → audio (lời thoại), sec/para → nhãn đoạn (A, B…) của bài đọc, pic của bài tập → vào đề bài
    for (const it of A.items || []) {
      if (typeof it.q === "string") it.q = { jp: it.q };
      if (it.full && !it.form) { it.form = it.full; delete it.full; }
      if (it.group && !it.hint) { it.hint = it.group; delete it.group; }
    }
    for (const sc of A.scripts || []) {
      if (sc.track && !sc.audio) { sc.audio = sc.track; delete sc.track; }
      if (Array.isArray(sc.audio)) sc.audio = sc.audio[0]; // ["8_08"] → "8_08"
    }
    for (const t of A.text || []) if ((t.sec || t.para) && !t.sp) { t.sp = t.sec || t.para; delete t.sec; delete t.para; }
    if (typeof A.pic === "string") { A.task = `${A.task ? A.task + " · " : ""}🖼 ${A.pic}`; delete A.pic; }
    // số câu trùng trong một bài tập (vd. nhiều câu "例") → 例1, 例2… để mỗi câu có ô trả lời riêng
    const seenNo = new Map();
    for (const it of A.items || []) {
      const k = String(it.no ?? ""); const c = (seenNo.get(k) || 0) + 1; seenNo.set(k, c);
      if (c > 1 || (A.items.filter((x) => String(x.no ?? "") === k).length > 1)) it.no = `${k}${c}`;
    }
  }
  for (const L of D.lessons) fs.writeFileSync(path.join(out, `${L.lesson}.json`), JSON.stringify(L));
  console.log(`${f}: ${D.lessons.length} bài → public/book/${course}/`);
  if (!main) buildRikaiExtra(D, out, course);
  // sách một cuốn (A2/B1): phần 読解・文法テスト dùng khung của Rikai → public/book/<khóa>-rikai/rtest<n>.json
  else if (!fs.existsSync(path.join(SRC, `${course}-rikai.json`)) && fs.existsSync(path.join(SRC, "extra", `${course}-rikai-extra.json`))) {
    const out2 = path.join(ROOT, "public", "book", `${course}-rikai`);
    fs.mkdirSync(out2, { recursive: true });
    buildRikaiExtra(D, out2, `${course}-rikai`);
  }

  for (const T of (main && TESTS[course]) || []) {
    const Ls = D.lessons.filter((L) => L.lesson >= T.lessons[0] && L.lesson <= T.lessons[1]);
    const cando = Ls.flatMap((L) => L.cando.map((c) => ({ ...c, lesson: L.lesson, title: L.title.jp })));
    const seen = new Set(), moji = [];
    const add = (x, lesson) => { const jp = x.jp.trim(); if (seen.has(jp)) return; seen.add(jp); moji.push({ jp, kana: x.kana, ro: x.ro || "", vi: x.vi, lesson }); };
    for (const L of Ls) {
      if (T.moji === "word") {
        for (const S of L.sections) for (const A of S.acts) for (const w of A.words?.items || []) if (KANA.test(w.jp) && [...w.jp].length >= 2 && [...w.jp].length <= 8) add(w, L.lesson);
      } else {
        for (const q of L.quiz) if ((KANA.test(q.jp) || course !== "a1") && [...q.jp].length <= 26) add(q, L.lesson); // A2: đọc cả câu có kanji
      }
    }
    // câu hỏi hội thoại: câu hỏi trong hội thoại mẫu + câu trả lời ngay sau đó
    const qseen = new Set(), kaiwa = [];
    for (const L of Ls) for (const S of L.sections) for (const A of S.acts) {
      const m = A.model || [];
      for (let i = 0; i < m.length - 1; i++) {
        const q = m[i], a = m[i + 1];
        if (!/[か？?]。?$/.test(q.jp.trim()) || /^そうですか/.test(q.jp.trim()) || qseen.has(q.jp) || /[か？?]。?$/.test(a.jp.trim())) continue;
        qseen.add(q.jp); kaiwa.push({ q: { jp: q.jp, kana: q.kana, ro: q.ro || "", vi: q.vi }, a: { jp: a.jp, kana: a.kana, ro: a.ro || "", vi: a.vi }, lesson: L.lesson });
      }
    }
    const data = { n: T.n, page: T.page, topics: T.topics, lessons: T.lessons, moji: T.moji, write: T.write,
      examples: T.examples.map(([jp, ro, vi, kana]) => ({ jp, kana, ro, vi })), cando, mojiPool: moji, kaiwa,
      pass: T.pass || 3, passNote: T.passNote || "", candoPages: T.candoPages || "", kaiwaEx: T.kaiwaEx || null, card: T.card || null, flowers: course === "a1" ? null : FLOWERS_A2 };
    fs.writeFileSync(path.join(out, `test${T.n}.json`), JSON.stringify(data));
    console.log(`  test${T.n}: ${cando.length} Can-do · ${moji.length} thẻ もじ · ${kaiwa.length} câu hỏi かいわ`);
  }
}
