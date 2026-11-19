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

export function opponentLineVi(name, mood, prev) {
  const sig = SIG[name];
  if (sig && (mood === "opening" || mood === "win") && Math.random() < 0.5) {
    const line = sig[mood === "opening" ? 0 : 1];
    if (line !== prev) return line;
  }
  const pool = POOL[mood] || POOL.tease;
  const options = pool.length > 1 ? pool.filter((l) => l !== prev) : pool;
  return options[Math.floor(Math.random() * options.length)];
}
