"use client";
// Mẹo đoán chữ Hán: bộ chỉ nghĩa · phần chỉ âm (thanh phù) · On hay Kun · từ ghép — chỉ dựa vào nghĩa tiếng Việt, không dùng âm Hán Việt
import Link from "next/link";
import META from "@/data/kanji/meta.json";
import { KazuhaHost } from "@/components/Kazuha";
import { kanjiHref } from "@/components/kanji/KanjiCard";
import { KIDX, COMPS, compLabel } from "@/lib/kanjiProg";

export default function KanjiGuide() {
  return (
    <div className="th-kanji kjguide">
      <Link href="/kanji" className="back">‹ Chữ Hán</Link>
      <div className="pagehead a22head">
        <div className="tag">漢字のヒント · MẸO ĐOÁN CHỮ</div>
        <h1>Nhớ một phần, đoán cả chữ</h1>
        <p>Phần lớn chữ Hán được ghép từ một phần gợi <b>nghĩa</b> và một phần gợi <b>cách đọc</b>. Nhận ra hai phần đó là đoán được chữ lạ.</p>
      </div>
      <KazuhaHost line="Gặp chữ lạ, đừng vội bỏ qua. Hỏi ba câu: phần nào chỉ nghĩa, phần nào chỉ âm, chữ đứng một mình hay nằm trong từ ghép. Ba câu đó thường đủ để đoán." />

      <section className="panel kjg">
        <h2>① Bốn bước đoán một chữ lạ</h2>
        <ol>
          <li><b>Tìm bộ chỉ nghĩa</b> (thường ở bên trái hoặc phía trên): 氵 → nước, 扌 → tay, 言 → lời nói, 糸 → sợi chỉ… → đoán được <i>nhóm nghĩa</i>.</li>
          <li><b>Tìm phần chỉ âm</b> (thường ở bên phải hoặc phía dưới): nếu đã biết chữ đó, âm On của chữ lạ thường <i>giống hoặc gần giống</i>: 反 ハン → 飯・坂・板・販 đều đọc ハン.</li>
          <li><b>Xem chữ đứng thế nào</b>: có kana đi kèm (話す, 高い) → thường đọc âm Kun; ghép với chữ Hán khác (会話, 高校) → thường đọc âm On.</li>
          <li><b>Với từ ghép</b>: ghép nghĩa từng chữ lại: 電 (điện) + 車 (xe) → 電車 xe điện; 図 (bản đồ, sơ đồ) + 書 (sách) + 館 (tòa nhà) → 図書館 thư viện.</li>
        </ol>
      </section>

      <section className="panel kjg">
        <h2>② Phần chỉ âm: cùng phần, cùng cách đọc</h2>
        <p>Học một chữ gốc là mở khóa cả một “họ” chữ đọc giống nhau. Dưới đây là các họ có trong chương trình, kèm âm On chung của cả họ.</p>
        <div className="kjfams">
          {META.fams.map((f) => (
            <div key={f.phon} className="kjfamrow">
              <b className="jpt big">{f.phon}</b><span className="jpt on">{f.on}</span>
              <span className="mem">{f.ks.map(([k, on]) => (KIDX[k] ? <Link key={k} href={kanjiHref(k)} className={`chip sm ${on === f.on ? "" : "odd"}`}><b className="jpt">{k}</b> <span className="jpt">{on}</span></Link> : null))}</span>
            </div>
          ))}
        </div>
        <p className="hint">Chữ viền mờ là ngoại lệ (đọc khác cả họ). Ngoại lệ luôn có, nhưng đoán theo họ vẫn đúng trong phần lớn trường hợp.</p>
      </section>

      <section className="panel kjg">
        <h2>③ Bộ chỉ nghĩa hay gặp</h2>
        <div className="kjrads">
          {META.rads.map((r) => (
            <div key={r.el} className="kjrad">
              <b className="jpt">{r.el}</b>
              <div><span>{compLabel(r.el)}</span><small>{COMPS[r.el]?.hint}</small>
                <span className="jpt ks">{[...r.ks].map((k) => <Link key={k} href={kanjiHref(k)}>{k}</Link>)}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel kjg">
        <h2>④ Âm On hay âm Kun?</h2>
        <ul>
          <li>Từ gồm <b>2 chữ Hán trở lên, không có kana</b> thường đọc bằng <b>âm On</b> (viết bằng katakana trong thẻ chữ): 学生 がく+せい, 電話 でん+わ.</li>
          <li>Chữ đứng một mình hoặc có <b>kana đi kèm</b> (okurigana) thường đọc bằng <b>âm Kun</b> (viết bằng hiragana): 生きる い+きる, 話す はな+す, 山 やま.</li>
          <li>Âm có thể biến đổi khi ghép: thành âm đục (紙 かみ → 手紙 て<b>が</b>み, 棚 たな → 本棚 ほん<b>だ</b>な), thành âm ngắt (学 がく → 学校 が<b>っ</b>こう).</li>
          <li>Có ngoại lệ đọc theo cả từ, không tách được từng chữ: 大人 おとな, 今日 きょう, 田舎 いなか. Loại này chỉ cần học thuộc như một từ.</li>
        </ul>
      </section>

      <section className="panel kjg">
        <h2>⑤ Đoán nghĩa từ ghép</h2>
        <ul>
          <li>Chữ đầu thường bổ nghĩa cho chữ sau: 外 (ngoài) + 国 (nước) → 外国 nước ngoài; 花 (hoa) + 火 (lửa) → 花火 pháo hoa.</li>
          <li>Hai chữ gần nghĩa ghép lại để nhấn mạnh: 道 (đường) + 路 (đường) → 道路 đường sá; 森 (rừng) + 林 (rừng cây) → 森林 rừng.</li>
          <li>Động từ + tân ngữ: 読 (đọc) + 書 (sách) → 読書 đọc sách; 登 (leo) + 山 (núi) → 登山 leo núi.</li>
          <li>Hậu tố quen thuộc: 〜者 (người): 学者, 作者 · 〜所/〜場 (nơi): 事務所, 会場 · 〜的 (mang tính): 伝統的 · 〜化 (hóa thành): 国際化.</li>
        </ul>
        <p className="hint">Luyện các mẹo này trong phần <b>🔮 Đoán chữ</b> của mỗi bài.</p>
      </section>
    </div>
  );
}
