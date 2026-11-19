// Lời trêu chọc tiếng Việt của đối thủ ở bàn bài (tự viết): mặn, láo, khiêu khích — nhưng không tục tĩu, không xúc phạm.
// Tâm trạng tính theo phía ĐỐI THỦ: capture = vừa lật thẻ bạn · setback = bị bạn lật · tease = trêu khi bạn chần chừ.
const POOL = {
  opening: [
    "Ngồi xuống đi, hôm nay tui dạy bạn chơi bài miễn phí!",
    "Lại một con mồi tự dâng tới tận cửa à?",
    "Chuẩn bị khăn giấy chưa? Lát nữa cần lắm đấy.",
    "Chơi thì chơi, thua đừng có mếu máo nha!",
    "Ơ, bạn biết luật chưa đấy? Hay để tui đánh hộ luôn?",
  ],
  capture: [
    "Ơ kìa, lá bài của bạn về nhà mẹ đẻ rồi kìa!",
    "Cảm ơn nha, lá này giờ là của tui rồi nhé!",
    "Đánh kiểu này thì về tập thêm mười năm nữa đi bạn ơi.",
    "Ối dồi ôi, dâng tận miệng luôn hả? Ngại quá cơ!",
    "Gà quá là gà! Tui còn chưa nghiêm túc mà!",
    "Lật cái bụp! Đau không? Đau thì cứ khóc đi.",
    "Hehe, xin vía một lá nha, khỏi trả!",
    "Nước đi này để đời đấy… để đời người ta cười.",
    "Bài của bạn đổi màu rồi kìa, màu thua đẹp ghê!",
    "Mở hàng đầu ngày mà dễ vậy luôn hả trời?",
  ],
  setback: [
    "Á à, ăn may thôi nhé! Đừng có mà vênh mặt lên!",
    "Ơ… cái gì vừa xảy ra vậy? Không tính, không tính!",
    "Được lắm! Bạn vừa thành công chọc điên tui rồi đấy!",
    "Hừ, may mắn ăn nhiều cũng có ngày bội thực thôi.",
    "Lá đó tui cho mượn thôi, lát đòi lại cả vốn lẫn lãi!",
    "Cay! Cay thật sự! Nhưng tui nhất quyết không nói đâu!",
    "Trả đây! Ai cho lấy bài của người ta vậy hả?",
    "Ủa alo? Ai dạy bạn chơi mà chơi lầy vậy?",
    "Thôi xong, quê quá! Đừng ai quay video nha!",
  ],
  tease: [
    "Nghĩ gì lâu vậy? Đang tính nước hay đang ngủ gật?",
    "Nhanh lên nào, chờ bạn đánh tui già luôn rồi!",
    "Đặt đại đi, đằng nào mà chả thua!",
    "Tay run hả? Để tui đánh hộ cho nhé?",
    "Hít thở sâu nào… rồi thua cho đẹp đội hình.",
    "Định để bài mọc rễ trên tay luôn hả?",
    "Tui đi pha xong ấm trà mà bạn vẫn chưa đánh.",
    "Nhìn mặt là biết đang hoang mang tột độ rồi nha.",
    "Đánh đi chứ, đồng hồ đâu có chờ ai!",
  ],
  win: [
    "Thắng rồi! Xin một tràng pháo tay cho tui nào!",
    "Gà ơi là gà, về luyện thêm rồi hẵng quay lại nhé!",
    "Bài xịn mà đánh dở thì cũng như không thôi bạn ơi.",
    "Một lá bài của bạn giờ là của tui. Cảm ơn đã ủng hộ!",
    "Tâm phục khẩu phục chưa? Chưa hả? Thua thêm ván nữa nha!",
  ],
  lose: [
    "Không công bằng! Bài của bạn chắc chắn có hack!",
    "Hôm nay tui nhường thôi, đừng có mà tưởng bở!",
    "Được rồi, được rồi… ván sau bạn khóc tiếng Mán nhé!",
    "Tui thua là tại cái bàn nghiêng, chứ không phải tại tui!",
    "Nhớ kỹ khuôn mặt này. Tui sẽ quay lại báo thù!",
  ],
  draw: [
    "Hòa à? Coi như tui tha cho bạn lần này.",
    "Bất phân thắng bại… nhưng ai cũng biết tui hay hơn.",
  ],
};

// Câu đặc trưng của từng nhân vật (chen vào lúc mở ván và lúc thắng)
const SIG = {
  Amber: ["Kỵ sĩ Thám hiểm báo cáo: phát hiện một con gà!", "Bay lượn đẹp như tui mới gọi là thắng!"],
  Barbara: ["Để tui hát tặng bạn bài 'Thua là chuyện thường' nhé~", "Encore! Thêm một màn thua nữa đi nào~"],
  Kaeya: ["Uống ly rượu cho ấm người đi, lát thua đỡ lạnh.", "Đừng buồn, ít ra bạn thua đẹp trai… à không, thua thôi."],
  Lisa: ["Bé ngoan, thua thì cô cho viên kẹo nhé~", "Bài tập về nhà: chép phạt chữ 'thua' một trăm lần."],
  Xiangling: ["Thua thì ăn đĩa slime xào cay của tui nha!", "Món hôm nay: gà nướng… chính là bạn đó!"],
  Bennett: ["Tui xui vậy mà bạn còn thua tui thì hết cứu!", "Trời ơi, lần đầu tui hên, cảm ơn bạn đã quá gà!"],
  Fischl: ["Kẻ phàm nhân kia, quỳ xuống trước Hoàng Nữ!", "Oz, ghi lại: thêm một kẻ ngu muội gục ngã!"],
  Ningguang: ["Bạn tính trả nợ bằng bài hay bằng Mora đây?", "Giao dịch hời quá, cảm ơn khách hàng thân thiết!"],
  Diluc: ["Nói ít thôi. Thua nhanh còn về.", "Hết giờ. Ra quầy thanh toán đi."],
  Keqing: ["Hiệu suất của bạn thấp tới mức đáng báo động.", "Ba nước trước tui đã biết bạn thua rồi."],
  Zhongli: ["Khế ước đã lập: ai thua thì trả tiền trà. Là bạn đấy.", "Đá ngàn năm còn mềm hơn kỹ năng của bạn."],
  Ganyu: ["Xin lỗi trước nhé… vì sắp đánh bạn hơi đau.", "Báo cáo đã xong: bạn thua, chính thức."],
  "Raiden Shogun": ["Vĩnh hằng không có chỗ cho kẻ đánh bài như bạn.", "Một nhát chém. Hết phim."],
  Neuvillette: ["Tòa tuyên án: bị cáo thua, không được kháng cáo.", "Nước mắt của bạn… hơi mặn đấy."],
  Nahida: ["Mình đọc được suy nghĩ của bạn rồi… toàn là hoang mang.", "Trí tuệ thắng, còn bạn thì… học thêm nhé."],
};

// Câu gọi đích danh người chơi: {ten} được thay bằng tên hiển thị trong tài khoản
const NAMED = {
  opening: [
    "{ten} đấy hả? Nghe danh gà đã lâu, nay mới được gặp!",
    "Ồ, {ten} tới nộp bài à? Ngồi đi, tui nhận hết!",
    "{ten} ơi, hôm nay định thua mấy ván để tui còn chuẩn bị?",
    "Chào {ten}, mang theo khăn giấy chưa? Lát cần đấy.",
    "Lại là {ten}… thua hoài mà vẫn chưa chừa hả?",
  ],
  capture: [
    "{ten} gà quá! Lá này tui xin nha!",
    "Ơ {ten}, đánh vậy là tặng không cho tui đó hả?",
    "{ten} ơi là {ten}, đặt bài kiểu gì kỳ vậy?",
    "Cảm ơn {ten} nhé, đúng là người tốt hiếm có!",
    "{ten} đánh hay quá… hay cho tui ăn đó!",
    "Nhìn {ten} đánh mà tui muốn cười ra nước mắt.",
    "{ten} non và xanh lắm, về nhà luyện thêm đi!",
  ],
  setback: [
    "{ten} ăn may thôi! Đừng có mà vênh mặt lên!",
    "Ơ {ten}! Ai cho lấy bài của tui vậy hả?",
    "Được lắm {ten}, tui nhớ mặt rồi đấy!",
    "{ten} chơi lầy vậy? Trả bài đây!",
    "Hừ, {ten} hên một lần thôi, đừng tưởng bở!",
  ],
  tease: [
    "{ten} ơi, nghĩ gì lâu vậy? Ngủ gật rồi hả?",
    "Nhanh lên {ten}, tui chờ tới mọc râu rồi!",
    "{ten} run tay à? Để tui đánh hộ nhé?",
    "Nhìn mặt {ten} là biết đang hoang mang rồi.",
    "{ten} định để bài mọc rễ luôn hả?",
  ],
  win: [
    "{ten} gà quá đi! Về luyện thêm mười năm nữa nhé!",
    "Thắng {ten} dễ như ăn kẹo vậy đó!",
    "Cảm ơn {ten} đã tặng tui một lá bài nha!",
    "{ten} thua rồi kìa! Ai quay lại khoảnh khắc này đi!",
  ],
  lose: [
    "{ten} hack! Chắc chắn {ten} có hack!",
    "Hôm nay tui nhường {ten} thôi, đừng có mà tưởng bở!",
    "{ten} chờ đó, ván sau tui cho khóc tiếng Mán!",
    "Không chịu! {ten} đấu lại với tui ngay!",
  ],
  draw: [
    "Hòa với {ten} à? Coi như tui tha cho lần này.",
  ],
};
// câu chào lúc vào ván (được đọc thành tiếng)
NAMED.opening.push(
  "Chào đối thủ {ten}! Hôm nay chuẩn bị tinh thần ăn hành chưa?",
  "Chào con vợ {ten} nhé! Lại đây {toi} dạy cho mà đánh bài!",
  "Ê {ten}, chào nhé! Mang tiền trà theo chưa đấy?",
  "Á à, {ten} tới rồi kìa! Mọi người ơi, có biến!",
  "Chào {ten} nhé, lâu rồi không được thắng ai dễ thế này!",
  "Xin chào {ten}! Chơi vui nha, thua thì đừng khóc nha!",
);
POOL.opening.push(
  "Chào đối thủ! Ngồi xuống đi, đừng run!",
  "Chào con vợ nhé! Hôm nay đánh nhẹ tay thôi!",
  "Ồ, có khách! Chào bạn, chuẩn bị ăn hành chưa?",
  "Chào nhé! Ván này tui chấp bạn hai tay luôn!",
  "Ê chào! Tưởng ai, hóa ra là con mồi quen!",
  "Xin chào! Hôm nay ai thua thì rửa bát nhé!",
);
NAMED.capture.push(
  "{ten} ơi, tỉnh lại đi, thua tới nơi rồi!",
  "Toang rồi {ten} ơi! Toang thật rồi!",
  "{ten} đánh như đang ngủ mơ vậy đó!",
  "Ơ kìa {ten}, sắp hết bài để mà thua rồi đấy!",
);
NAMED.tease.push(
  "Còn mười giây đó {ten}! Run chưa? Run chưa?",
  "{ten} ơi, đồng hồ sắp kêu rồi kìa! Nhanh lên!",
  "Tích tắc, tích tắc… {ten} toang tới nơi rồi!",
);
NAMED.win.push(
  "Tạm biệt {ten} nhé! Về nhà nhớ tập luyện thêm!",
  "{ten} ơi, thua thì chịu khó rửa bát nha!",
);
NAMED.lose.push(
  "Ván này không tính! {ten} chơi lại ngay cho tui!",
  "Tui… tui chỉ đang khởi động thôi, {ten} đừng mừng vội!",
);
// lúc người chơi thua: câu "tiễn biệt" (máy thắng)
NAMED.win.push(
  "Xin vĩnh biệt cụ {ten}! Đi đường bình an nhé!",
  "Thắp nén nhang tiễn {ten} về nơi xa nào!",
  "{ten} ơi, an nghỉ nhé, ván sau tui lại đào lên đánh tiếp!",
  "Vĩnh biệt {ten}! Hẹn kiếp sau đánh bài hay hơn nha!",
  "Tiễn {ten} lên đường! Nhạc đâu, bật nhạc tiễn biệt đi!",
);
POOL.win.push(
  "Xin vĩnh biệt cụ! Đi đường bình an!",
  "Nhạc đâu? Bật nhạc tiễn đưa cho người ta đi!",
  "Thôi, an nghỉ nhé! Ván sau tui lại gọi dậy đánh tiếp!",
  "Vĩnh biệt nhé, hẹn kiếp sau gặp lại trên chiếu bạc!",
);
// lúc máy thua: cũng "tự tiễn" mình cho bi
NAMED.lose.push("Tui… tui đi đây {ten}. Xin vĩnh biệt cụ…");
POOL.lose.push("Thôi xong, tui xin vĩnh biệt cụ đây… nhớ thắp nhang cho tui!");
// thêm câu chung không gọi tên
POOL.capture.push("Ăn hành chưa? Còn nguyên một rổ nữa đây!", "Bài đẹp đấy, giờ là của tui rồi.", "Nhẹ nhàng thôi mà đã toang rồi à?");
POOL.setback.push("Lật bài tui à? Gan to quá ha!", "Đừng có cười! Tui chưa thua đâu!");
POOL.tease.push("Đánh thì đánh nhanh, thua thì thua gọn!", "Suy nghĩ kỹ vào, mà nghĩ kỹ cũng thua thôi.");
POOL.win.push("Ván này tui cho điểm mười, còn bạn điểm… gà.");
POOL.lose.push("Bàn này bị lệch! Đổi bàn! Đổi bàn ngay!");

// Thêm lõi câu mới cho mỗi tâm trạng
POOL.capture.push(
  "Lá này về đội tui rồi, cảm ơn nhiều nhé!", "Đánh thế này thì về quê chăn vịt cho lành!", "Tưởng gì, hóa ra cũng chỉ đến thế!",
  "Lật một phát thôi mà đã tái mặt rồi kìa!", "Bài đẹp thế này mà để tui lấy, tiếc nhỉ?", "Thêm một lá vào bộ sưu tập của tui!",
  "Trình độ này thì tui đánh bằng chân cũng thắng!", "Cứ đà này thì sắp hết bài để mà thua rồi!",
);
POOL.setback.push(
  "Láo! Dám lật bài của tui à?", "Từ từ, để tui xem lại băng ghi hình đã!", "Hôm nay tui đeo kính áp tròng nên nhìn nhầm thôi!",
  "Tạm thời thôi nhé, lát nữa tui lấy lại hết!", "Đã thế thì đừng trách tui ác!",
);
POOL.tease.push(
  "Đồng hồ chạy rồi kìa, chạy nhanh lắm đấy!", "Đánh hay không đánh thì bảo một câu!", "Định ngồi thiền đến sáng mai à?",
  "Bài trên tay sắp thiu rồi đấy!", "Còn chút xíu thời gian thôi, run chưa?",
);
POOL.win.push(
  "Về nhà nhớ kể là thua người đẹp nhất bàn nhé!", "Tui thắng nhẹ nhàng như lông hồng!", "Ván sau nhớ mang thêm can đảm!",
  "Bài của bạn giờ nằm gọn trong túi tui rồi!", "Đúng là trình độ chênh lệch quá!",
);
POOL.lose.push("Tui chỉ đánh có ba phần sức thôi đấy!", "Ăn may! Chắc chắn là ăn may!", "Hôm nay tui đói nên mới thua!");

// Câu cảm thán mở đầu và câu đuôi — ghép với lõi câu thành rất nhiều biến thể
const INTERJ = {
  opening: ["Ê!", "Ô hô!", "A lô!", "Ồ!", "Chà chà!", "Hế lô!", "Ối giời!"],
  capture: ["Ối giời ơi!", "Ha ha ha!", "Úi chà chà!", "Ơ kìa!", "Chậc chậc!", "Hí hí!", "Ầy dà!", "Ố ồ!", "Ê ê ê!", "Ô hay!", "Tuyệt cú mèo!"],
  setback: ["Ối dồi ôi!", "Trời đất ơi!", "Á á á!", "Ơ hay!", "Cái gì cơ?!", "Ôi không!", "Hừ hừ!", "Thôi chết!", "Ơ kìa!", "Ối giời đất ơi!"],
  tease: ["Ê!", "Alô alô!", "Ơ kìa!", "Này này!", "Hử?", "Tích tắc tích tắc!", "Ê ê!", "Ối giời!"],
  win: ["Ha ha ha!", "Ố là la!", "Ối giời ơi!", "Hô hô hô!", "Tuyệt vời ông mặt trời!", "Hế hế!", "Yeah!"],
  lose: ["Ối giời ơi!", "Không thể nào!", "Trời ơi là trời!", "Hu hu hu!", "Ôi thôi xong!", "Cay quá!", "Ối dồi ôi!"],
  draw: ["Ơ!", "Hừm!", "Chà!"],
};
const TAIL = {
  opening: ["", "", " Hê hê.", " Chơi thôi!"],
  capture: ["", "", " Hí hí.", " Ha ha!", " Cay chưa?", " Khóc đi!", " Đau không?", " Chậc chậc."],
  setback: ["", "", " Hừ!", " Nhớ mặt đấy!", " Cay thế!", " Không tha đâu!"],
  tease: ["", "", " Nhanh lên!", " Run à?", " Hê hê."],
  win: ["", " Hô hô!", " Bye bye nhé!", " Hẹn ván sau!"],
  lose: ["", " Hu hu!", " Cay quá đi mất!", " Ức chế!"],
  draw: [""],
};
const MALE = new Set(["Kaeya", "Bennett", "Diluc", "Zhongli", "Neuvillette"]);

// Đổi cách nói sang giọng miền Bắc: "tui" → "ông/bà" (ông đây, bà đây), "nha" → "nhé", "vậy" → "thế"…
const W = "(^|[\\s,.!?…\"'(])";
const E = "(?=[\\s,.!?…\"')]|$)";
const swap = (t, from, to) => t.replace(new RegExp(W + from + E, "g"), "$1" + to);
function northern(t, male) {
  const me = male ? "ông" : "bà";
  t = swap(t, "tui", me); t = swap(t, "Tui", me[0].toUpperCase() + me.slice(1));
  t = swap(t, "nha", "nhé"); t = swap(t, "vậy", "thế"); t = swap(t, "Vậy", "Thế");
  t = swap(t, "nè", "này"); t = swap(t, "ghê", "thế"); t = swap(t, "hông", "không");
  return t;
}

const recent = []; // các lõi câu vừa dùng — tránh lặp lại
const pickFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function opponentLineVi(name, mood, prev, player) {
  const male = MALE.has(name);
  const fill = (l) => l.replaceAll("{ten}", player || "bạn").replaceAll("{toi}", male ? "anh" : "chị");
  let core;
  const sig = SIG[name];
  if (sig && (mood === "opening" || mood === "win") && Math.random() < 0.25) core = sig[mood === "opening" ? 0 : 1];
  if (!core || recent.includes(core)) {
    // có tên người chơi → khoảng 55% câu sẽ gọi đích danh
    const pool = player && NAMED[mood] && Math.random() < 0.55 ? NAMED[mood] : POOL[mood] || POOL.tease;
    const fresh = pool.filter((l) => !recent.includes(l));
    core = pickFrom(fresh.length ? fresh : pool);
  }
  recent.push(core); if (recent.length > 14) recent.shift();
  let line = fill(core);
  if (INTERJ[mood] && Math.random() < 0.7) line = pickFrom(INTERJ[mood]) + " " + line;
  if (TAIL[mood] && !/[?]$/.test(line) && Math.random() < 0.5) line += pickFrom(TAIL[mood]);
  line = northern(line, male);
  return line === prev ? northern(fill(core), male) : line;
}

