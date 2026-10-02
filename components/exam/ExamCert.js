"use client";
// 🎓 Giấy chứng nhận đỗ đề luyện thi (JLPT mới / cũ) — bố cục kiểu phiếu điểm (得点区分別得点 · 総合得点 · 合格 · CEFR).
// Mang thương hiệu Sổ Tay Teyvat, ghi rõ KHÔNG phải chứng chỉ JLPT chính thức (không bắt chước mẫu, con dấu của JF/JEES).
// Vẽ bằng SVG để tải ảnh PNG.
import { useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { sfx } from "@/lib/sfx";

const W = 1200, H = 1600;
const SERIF = "'Noto Serif','Noto Serif JP','Times New Roman',serif";
const JP = "'Noto Serif JP','Yu Mincho','MS Mincho',serif";

function CertSvg({ c, name, svgRef }) {
  const gs = c.groups || [];
  const colW = Math.min(260, 860 / (gs.length + 1));
  const x0 = (W - colW * (gs.length + 1)) / 2;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className="certsvg" role="img" aria-label={`Giấy chứng nhận luyện thi của ${name}`}>
      <defs>
        <linearGradient id="xpaper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fdfbf5" /><stop offset="1" stopColor="#f1ead9" /></linearGradient>
        <pattern id="xguil" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 12Q6 0 12 12T24 12" fill="none" stroke="#c9b98f" strokeWidth=".7" opacity=".55" /></pattern>
      </defs>
      <rect width={W} height={H} fill="url(#xpaper)" />
      <rect x="30" y="30" width={W - 60} height={H - 60} fill="none" stroke="#1f3b6e" strokeWidth="5" />
      <rect x="46" y="46" width={W - 92} height={H - 92} fill="url(#xguil)" stroke="#1f3b6e" strokeWidth="1.5" />
      <rect x="70" y="70" width={W - 140} height={H - 140} fill="#fdfbf5" stroke="#b9a46e" strokeWidth="1" />

      <text x={W / 2} y="160" textAnchor="middle" fontFamily={JP} fontSize="30" letterSpacing="6" fill="#1f3b6e">JLPT形式 模擬試験</text>
      <text x={W / 2} y="235" textAnchor="middle" fontFamily={JP} fontSize="64" fontWeight="700" letterSpacing="12" fill="#14274a">合格証明書</text>
      <text x={W / 2} y="285" textAnchor="middle" fontFamily={SERIF} fontSize="26" letterSpacing="3" fill="#33496f">GIẤY CHỨNG NHẬN ĐỖ ĐỀ LUYỆN THI</text>
      <line x1="300" y1="312" x2="900" y2="312" stroke="#b9a46e" strokeWidth="2" />

      {/* thông tin người học */}
      {[["氏名 · Họ tên", name], ["レベル · Cấp độ", c.levelLabel], ["試験 · Đề thi", c.title], ["受験日 · Ngày thi", c.date], ["証明番号 · Số hiệu", c.no]].map(([k, v], i) => (
        <g key={k} transform={`translate(160 ${390 + i * 62})`}>
          <text fontFamily={JP} fontSize="22" fill="#5a6a85">{k}</text>
          <text x="300" fontFamily={i === 0 ? JP : SERIF} fontSize={i === 0 ? 36 : 24} fontWeight={i === 0 ? 700 : 400} fill="#14274a">{v}</text>
          <line x1="300" y1="14" x2="880" y2="14" stroke="#d8ccaa" />
        </g>
      ))}

      {/* bảng điểm kiểu phiếu điểm */}
      <text x={W / 2} y="745" textAnchor="middle" fontFamily={JP} fontSize="24" fill="#1f3b6e">得点区分別得点 · Điểm từng phần{c.eq ? `（JLPT ${c.eq} 換算）` : ""}</text>
      {gs.map((g, i) => (
        <g key={g.jp} transform={`translate(${x0 + i * colW} 770)`}>
          <rect width={colW - 10} height="150" fill="#fff" stroke="#1f3b6e" strokeWidth="1.5" />
          <rect width={colW - 10} height="58" fill="#e8eef8" stroke="#1f3b6e" strokeWidth="1.5" />
          {g.jp.length > 8 && g.jp.includes("（") ? (
            <text x={(colW - 10) / 2} textAnchor="middle" fontFamily={JP} fill="#14274a">
              <tspan x={(colW - 10) / 2} y="25" fontSize="19">{g.jp.slice(0, g.jp.indexOf("（"))}</tspan>
              <tspan x={(colW - 10) / 2} y="48" fontSize="15">{g.jp.slice(g.jp.indexOf("（"))}</tspan>
            </text>
          ) : <text x={(colW - 10) / 2} y="36" textAnchor="middle" fontFamily={JP} fontSize={g.jp.length > 10 ? 15 : 19} fill="#14274a">{g.jp}</text>}
          <text x={(colW - 10) / 2} y="122" textAnchor="middle" fontFamily={SERIF} fontSize="44" fontWeight="700" fill="#14274a">{g.score}<tspan fontSize="22" fill="#6a7890">/{g.max}</tspan></text>
        </g>
      ))}
      <g transform={`translate(${x0 + gs.length * colW} 770)`}>
        <rect width={colW - 10} height="150" fill="#14274a" />
        <text x={(colW - 10) / 2} y="36" textAnchor="middle" fontFamily={JP} fontSize="19" fill="#e9dcb4">総合得点</text>
        <text x={(colW - 10) / 2} y="122" textAnchor="middle" fontFamily={SERIF} fontSize="44" fontWeight="700" fill="#fff">{c.total}<tspan fontSize="22" fill="#b9c4d8">/{c.max}</tspan></text>
      </g>
      {c.old && <text x={W / 2} y="960" textAnchor="middle" fontFamily={SERIF} fontSize="20" fill="#5a6a85">Thang JLPT cũ {c.level}: {c.old.total}/{c.old.max} điểm</text>}

      {/* kết quả */}
      <g transform={`translate(${W / 2} 1060)`}>
        <rect x="-330" y="-62" width="300" height="110" fill="none" stroke="#1f3b6e" strokeWidth="2" />
        <text x="-180" y="-22" textAnchor="middle" fontFamily={JP} fontSize="20" fill="#5a6a85">判定 · Kết quả</text>
        <text x="-180" y="30" textAnchor="middle" fontFamily={JP} fontSize="44" fontWeight="700" fill="#b3261e" letterSpacing="8">合格</text>
        <rect x="30" y="-62" width="300" height="110" fill="none" stroke="#1f3b6e" strokeWidth="2" />
        <text x="180" y="-22" textAnchor="middle" fontFamily={SERIF} fontSize="20" fill="#5a6a85">CEFR (khung châu Âu)</text>
        <text x="180" y="30" textAnchor="middle" fontFamily={SERIF} fontSize="44" fontWeight="700" fill="#14274a">{c.cefr || "—"}</text>
      </g>
      <text x={W / 2} y="1170" textAnchor="middle" fontFamily={SERIF} fontSize="21" fill="#33496f">Đạt mức đỗ {c.pass}/{c.max} điểm và đủ điểm sàn từng phần theo thang JLPT {c.eq || c.level}.</text>

      {/* đơn vị cấp */}
      <text x="160" y="1290" fontFamily={SERIF} fontSize="22" fill="#14274a">Sổ Tay Từ Vựng Teyvat</text>
      <text x="160" y="1322" fontFamily={SERIF} fontSize="18" fill="#5a6a85">tiengnhat.online · Phòng luyện đề thi</text>
      <g transform="translate(960 1290) rotate(-8)" opacity=".9">
        <rect x="-62" y="-62" width="124" height="124" rx="10" fill="none" stroke="#b3261e" strokeWidth="5" />
        <text y="-6" textAnchor="middle" fontFamily={JP} fontSize="30" fontWeight="700" fill="#b3261e">練習</text>
        <text y="36" textAnchor="middle" fontFamily={JP} fontSize="30" fontWeight="700" fill="#b3261e">合格</text>
      </g>
      <line x1="120" y1="1400" x2={W - 120} y2="1400" stroke="#d8ccaa" />
      <text x={W / 2} y="1440" textAnchor="middle" fontFamily={SERIF} fontSize="17" fill="#6a7890">Giấy chứng nhận kết quả đề LUYỆN THI tự biên soạn trên trang học tập. Đây KHÔNG phải chứng chỉ JLPT chính thức</text>
      <text x={W / 2} y="1466" textAnchor="middle" fontFamily={SERIF} fontSize="17" fill="#6a7890">và không do Japan Foundation hay JEES cấp. Điểm được ước tính theo tỉ lệ câu đúng.</text>
    </svg>
  );
}

export default function ExamCertView() {
  const { id } = useParams();
  const { S } = useGame();
  const ref = useRef(null);
  if (!S) return null;
  const c = S.exam?.[id]?.cert;
  const back = <Link href={`/de-thi/bai/${id}`} className="back">‹ Về đề thi</Link>;
  if (!c) return <>{back}<p className="panel lbsec" style={{ textAlign: "center", marginTop: 20 }}>Bạn chưa đỗ đề này nên chưa có giấy chứng nhận. Làm bài và đạt mức đỗ để nhận nhé!</p></>;
  const name = S.profile?.name || "Nhà Lữ Hành";
  const download = () => {
    const svg = new XMLSerializer().serializeToString(ref.current);
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = 1800; cv.height = 2400;
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `chung-nhan-luyen-thi-${id}-${name.replace(/\s+/g, "_")}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    sfx.primo();
  };
  return (
    <>
      {back}
      <div className="certwrap excertwrap"><CertSvg c={c} name={name} svgRef={ref} /></div>
      <div className="btnrow">
        <button className="gbtn tri" onClick={download}><span className="c" />Tải ảnh PNG</button>
        <Link href="/de-thi" className="gbtn"><span className="c" />Luyện đề khác</Link>
      </div>
      {!S.profile && <p className="hint" style={{ textAlign: "center" }}>Giấy đang ghi tên mặc định — <Link href="/rank" style={{ color: "var(--gold2)" }}>đăng ký tên</Link> để giấy có tên của bạn.</p>}
    </>
  );
}
