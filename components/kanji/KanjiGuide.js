"use client";
// Mẹo đọc chữ Hán cho người Việt: Hán Việt → âm On · phần chỉ âm (thanh phù) · bộ chỉ nghĩa · đoán từ ghép
import { useMemo } from "react";
import Link from "next/link";
import META from "@/data/kanji/meta.json";
import { KazuhaHost } from "@/components/Kazuha";
import { kanjiHref } from "@/components/kanji/KanjiCard";
import { KIDX, COMPS, compName, hvRule, stripTone } from "@/lib/kanjiProg";

const ENDS = [
  { key: "UI", hv: "-ng / -nh", on: "…ウ / …イ", ex: [["東", "ĐÔNG", "トウ"], ["生", "SINH", "セイ"], ["明", "MINH", "メイ"]] },
  { key: "N", hv: "-n / -m", on: "…ン", ex: [["安", "AN", "アン"], ["南", "NAM", "ナン"], ["三", "TAM", "サン"]] },
  { key: "K", hv: "-c / -ch", on: "…ク / …キ", ex: [["学", "HỌC", "ガク"], ["石", "THẠCH", "セキ"], ["国", "QUỐC", "コク"]] },
  { key: "T", hv: "-t", on: "…ツ / …チ", ex: [["日", "NHẬT", "ニチ"], ["発", "PHÁT", "ハツ"], ["一", "NHẤT", "イチ"]] },
];
const HEADS = [
  ["h · kh · c · k · qu · g", "か/が (カ・コ・ケ・ギ…)", "海 HẢI カイ · 考 KHẢO コウ · 高 CAO コウ · 国 QUỐC コク"],
  ["ng · ngh", "が/げ/ご", "月 NGUYỆT ゲツ · 語 NGỮ ゴ · 五 NGŨ ゴ"],
  ["ph · b · v", "は/ほ/ふ, ば/ぶ, ま/も", "方 PHƯƠNG ホウ · 北 BẮC ホク · 文 VĂN ブン/モン"],
  ["m", "ま/め/も, ば/ぼ", "明 MINH メイ · 木 MỘC モク/ボク · 毎 MỖI マイ"],
  ["n · nh", "な/に, じ", "南 NAM ナン · 人 NHÂN ジン/ニン · 日 NHẬT ニチ/ジツ"],
  ["t · th · s · x · tr · ch · đ · d", "さ/ざ, し/じ, た/だ, ち/ちょう", "三 TAM サン · 天 THIÊN テン · 長 TRƯỜNG チョウ · 大 ĐẠI ダイ"],
  ["l", "ら/り/る/れ/ろ", "料 LIỆU リョウ · 来 LAI ライ · 力 LỰC リョク"],
  ["không phụ âm đầu · d · gi", "あ/い/え, や/ゆ/よ", "安 AN アン · 用 DỤNG ヨウ · 英 ANH エイ"],
];

export default function KanjiGuide() {
  // thống kê trên chính các chữ của chương trình: bao nhiêu chữ khớp quy tắc vần
  const stats = useMemo(() => {
    const st = Object.fromEntries(ENDS.map((e) => [e.key, { n: 0, hit: 0, ex: [] }]));
    for (const [k, [, hv, , , on]] of Object.entries(KIDX)) {
      const R = hvRule(hv);
      if (!R || !on) continue;
      const s = st[R.cls]; s.n++;
      if (R.ends.includes(on.slice(-1))) { s.hit++; if (s.ex.length < 10) s.ex.push([k, hv, on]); }
    }
    return st;
  }, []);
  return (
    <div className="th-kanji kjguide">
      <Link href="/kanji" className="back">‹ Chữ Hán</Link>
      <div className="pagehead a22head">
        <div className="tag">漢字の読み方 · MẸO CHO NGƯỜI VIỆT</div>
        <h1>Nhớ một phần, đoán cả chữ</h1>
        <p>Người Việt có lợi thế lớn: phần lớn từ vựng học thuật, hành chính của tiếng Việt là từ Hán Việt, và âm Hán Việt tương ứng khá đều với âm On của tiếng Nhật.</p>
      </div>
      <KazuhaHost line="Gặp chữ lạ, đừng vội bỏ qua. Hỏi ba câu: phần nào chỉ nghĩa, phần nào chỉ âm, âm Hán Việt là gì. Ba câu đó thường đủ để đoán." />

      <section className="panel kjg">
        <h2>① Bốn bước đoán một chữ lạ</h2>
        <ol>
          <li><b>Tìm bộ chỉ nghĩa</b> (thường ở bên trái hoặc phía trên): 氵 → nước, 扌 → tay, 言 → lời nói, 糸 → sợi chỉ… → đoán được <i>nhóm nghĩa</i>.</li>
          <li><b>Tìm phần chỉ âm</b> (thường ở bên phải hoặc phía dưới): nếu đã biết chữ đó, âm On của chữ lạ thường <i>giống hoặc gần giống</i>: 反 ハン → 飯・坂・板・販 đều đọc ハン.</li>
          <li><b>Nghĩ đến âm Hán Việt</b> rồi đổi sang âm On theo quy tắc vần bên dưới: SINH → セイ, AN → アン, HỌC → ガク.</li>
          <li><b>Với từ ghép</b>: ghép âm Hán Việt của từng chữ, nhiều khi ra luôn từ tiếng Việt: 電車 ĐIỆN XA (xe điện), 注意 CHÚ Ý, 図書館 ĐỒ THƯ QUÁN (thư viện).</li>
        </ol>
      </section>

      <section className="panel kjg">
        <h2>② Vần Hán Việt → đuôi âm On</h2>
        <p>Phần cuối của âm Hán Việt cho biết khá chắc âm On kết thúc bằng gì. Con số là tỉ lệ khớp trên chính các chữ trong chương trình này.</p>
        <table className="kjtable">
          <thead><tr><th>Vần Hán Việt</th><th>Âm On kết thúc</th><th>Ví dụ</th><th>Khớp</th></tr></thead>
          <tbody>{ENDS.map((e) => {
            const s = stats[e.key];
            return (
              <tr key={e.key}>
                <td><b>{e.hv}</b></td><td className="jpt">{e.on}</td>
                <td>{e.ex.map(([k, hv, on]) => <span key={k} className="kjexs"><b className="jpt">{k}</b> {hv} → <span className="jpt">{on}</span></span>)}</td>
                <td>{s.n ? `${Math.round((s.hit / s.n) * 100)}%` : "–"}<small> ({s.hit}/{s.n} chữ)</small></td>
              </tr>
            );
          })}</tbody>
        </table>
        <p className="hint">Vần <b>-p</b> (THẬP, TẬP, HỢP) thường thành đuôi <span className="jpt">ウ</span> hoặc âm ngắt <span className="jpt">ッ</span>: 十 ジュウ/ジッ, 集 シュウ, 合 ゴウ/ガッ. Vần mở (a, o, ai, ao…) thường thành <span className="jpt">…ア/オ/イ/ウ</span>: 花 HOA カ, 海 HẢI カイ, 高 CAO コウ.</p>
        <details className="kjmore"><summary>Xem thêm các chữ khớp quy tắc</summary>
          {ENDS.map((e) => <p key={e.key}><b>{e.hv}:</b> {stats[e.key].ex.map(([k, hv, on]) => <Link key={k} href={kanjiHref(k)} className="chip sm"><b className="jpt">{k}</b> {hv} {on}</Link>)}</p>)}
        </details>
      </section>

      <section className="panel kjg">
        <h2>③ Phụ âm đầu Hán Việt → hàng âm On</h2>
        <table className="kjtable">
          <thead><tr><th>Phụ âm đầu</th><th>Thường thành hàng</th><th>Ví dụ</th></tr></thead>
          <tbody>{HEADS.map(([a, b, c]) => <tr key={a}><td><b>{a}</b></td><td className="jpt">{b}</td><td className="jpt">{c}</td></tr>)}</tbody>
        </table>
        <p className="hint">Đây là xu hướng, không phải luật tuyệt đối. Nhưng khi đã biết Hán Việt, bạn thường loại được 2–3 đáp án sai ngay lập tức.</p>
      </section>

      <section className="panel kjg">
        <h2>④ Phần chỉ âm (thanh phù): cùng phần, cùng âm</h2>
        <p>Phần lớn chữ Hán là <b>chữ hình thanh</b>: một phần chỉ nghĩa + một phần chỉ âm. Học một chữ gốc là mở khóa cả một “họ” chữ. Dưới đây là các họ có trong chương trình.</p>
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
        <h2>⑤ Bộ chỉ nghĩa hay gặp</h2>
        <div className="kjrads">
          {META.rads.map((r) => (
            <div key={r.el} className="kjrad">
              <b className="jpt">{r.el}</b>
              <div><span>{compName(r.el)} · <i>{COMPS[r.el]?.vi}</i></span><small>{COMPS[r.el]?.hint}</small>
                <span className="jpt ks">{[...r.ks].map((k) => <Link key={k} href={kanjiHref(k)}>{k}</Link>)}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel kjg">
        <h2>⑥ Từ ghép: đọc bằng âm On, hiểu bằng Hán Việt</h2>
        <ul>
          <li>Từ gồm <b>2 chữ Hán trở lên, không có kana</b> thường đọc bằng <b>âm On</b>: 学生 がく+せい, 電話 でん+わ.</li>
          <li>Chữ đứng một mình hoặc có <b>kana đi kèm</b> (okurigana) thường đọc bằng <b>âm Kun</b>: 生きる い+きる, 話す はな+す.</li>
          <li>Âm có thể biến đổi khi ghép: thành âm đục (紙 かみ → 手紙 て<b>が</b>み, 棚 たな → 本棚 ほん<b>だ</b>な), thành âm ngắt (学 がく → 学校 が<b>っ</b>こう).</li>
          <li>Ghép Hán Việt từng chữ để đoán nghĩa: 自然 TỰ NHIÊN, 経験 KINH NGHIỆM, 準備 CHUẨN BỊ, 世界 THẾ GIỚI — đúng y như từ tiếng Việt!</li>
        </ul>
        <p className="hint">Luyện các mẹo này trong phần <b>🔮 Đoán chữ</b> của mỗi bài.</p>
      </section>
    </div>
  );
}

export { stripTone };
