"use client";
// Chứng chỉ vẽ bằng SVG (không dùng ảnh ngoài để tải được PNG) — dùng chung cho B1-1, A2-2…
import { useRef } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { sfx } from "@/lib/sfx";

const EMBLEM = {
  // Nham (Zhongli): lục giác lồng nhau
  geo: (
    <>
      <path d="M0-260 225-130 225 130 0 260-225 130-225-130Z" fill="none" stroke="currentColor" strokeWidth="14" />
      <path d="M0-150 130-75 130 75 0 150-130 75-130-75Z" />
    </>
  ),
  // Thảo (Nahida): chiếc lá ba cánh
  dendro: (
    <>
      <circle r="250" fill="none" stroke="currentColor" strokeWidth="12" />
      {[0, 120, 240].map((a) => <path key={a} transform={`rotate(${a})`} d="M0 0C-70-60-80-150 0-220 80-150 70-60 0 0Z" />)}
      <circle r="38" />
    </>
  ),
  // Thủy (Furina): giọt nước giữa các vòng sóng
  hydro: (
    <>
      <circle r="250" fill="none" stroke="currentColor" strokeWidth="12" />
      <circle r="190" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M0-170C60-80 110-20 110 45A110 110 0 0 1-110 45C-110-20-60-80 0-170Z" />
    </>
  ),
};

// cert: { course, signer, signerTitle, seal:[line1,line2], emblem:"geo"|"dendro", tint, filePrefix }
function CertSvg({ name, ex, rec, sections, max, cert, svgRef }) {
  const W = 1200, H = 850;
  const s = rec.certScores || rec.scores || {};
  const grade = rec.excellent ? "XUẤT SẮC · 優" : "ĐỖ · 合格";
  const serif = "'Noto Serif','Noto Serif JP','Times New Roman',serif";
  const tint = cert.tint || "#f6d27a";
  const n = sections.length, gap = 200, x0 = W / 2 - (n * gap) / 2; // n ô điểm phần + 1 ô tổng, căn giữa
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className="certsvg" role="img" aria-label={`${ex.name} của ${name}`}>
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbf5e6" /><stop offset=".5" stopColor="#f3e8cf" /><stop offset="1" stopColor="#ecdcb8" /></linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6a2e" /><stop offset=".5" stopColor="#e8c66e" /><stop offset="1" stopColor="#8a6a2e" /></linearGradient>
        <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={tint} stopOpacity=".35" /><stop offset="1" stopColor={tint} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#paper)" />
      <circle cx={W / 2} cy={H / 2 + 20} r="330" fill="url(#glow)" />
      <g transform={`translate(${W / 2} ${H / 2 + 20})`} opacity=".08" fill={cert.emblemColor || "#8a6a2e"} color={cert.emblemColor || "#8a6a2e"}>{EMBLEM[cert.emblem || "geo"]}</g>
      <rect x="24" y="24" width={W - 48} height={H - 48} fill="none" stroke="url(#gold)" strokeWidth="6" />
      <rect x="40" y="40" width={W - 80} height={H - 80} fill="none" stroke="#b08a45" strokeWidth="1.5" strokeDasharray="2 6" />
      {[[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(45)`}><rect x="-14" y="-14" width="28" height="28" fill="#f3e8cf" stroke="url(#gold)" strokeWidth="3" /><rect x="-6" y="-6" width="12" height="12" fill={cert.cornerColor || "#c9a24e"} /></g>
      ))}
      <text x={W / 2} y="120" textAnchor="middle" fontFamily={serif} fontSize="22" letterSpacing="10" fill="#8a6a2e">証 明 書 · CERTIFICATE</text>
      <text x={W / 2} y="185" textAnchor="middle" fontFamily={serif} fontSize="50" fontWeight="700" fill="#3a2a10">CHỨNG CHỈ TIẾNG NHẬT</text>
      <text x={W / 2} y="232" textAnchor="middle" fontFamily={serif} fontSize="26" fill="#6a5020">{cert.course} · {ex.short} · {ex.sub}</text>
      <line x1="360" y1="262" x2="840" y2="262" stroke="url(#gold)" strokeWidth="2" />
      <text x={W / 2} y="320" textAnchor="middle" fontFamily={serif} fontSize="24" fill="#5a4a30">Chứng nhận</text>
      <text x={W / 2} y="395" textAnchor="middle" fontFamily={serif} fontSize="64" fontWeight="700" fill="#2f2310">{name}</text>
      <line x1="300" y1="418" x2="900" y2="418" stroke="#b08a45" strokeWidth="1.5" />
      <text x={W / 2} y="462" textAnchor="middle" fontFamily={serif} fontSize="22" fill="#5a4a30">{cert.line || "đã hoàn thành kỳ khảo hạch năng lực tiếng Nhật kiểu JLPT tại Học Viện Teyvat với kết quả:"}</text>
      {sections.map((sec, i) => (
        <g key={sec.key} transform={`translate(${x0 + i * gap} 500)`}>
          <rect x="-85" y="0" width="170" height="92" rx="10" fill="#fffaf0" stroke="#c9a24e" />
          <text x="0" y="30" textAnchor="middle" fontFamily={serif} fontSize="17" fill="#6a5020">{sec.vi}</text>
          <text x="0" y="72" textAnchor="middle" fontFamily={serif} fontSize="34" fontWeight="700" fill="#2f2310">{s[sec.key] ?? "—"}<tspan fontSize="18" fill="#8a7a60">/60</tspan></text>
        </g>
      ))}
      <g transform={`translate(${x0 + n * gap} 500)`}>
        <rect x="-85" y="0" width="170" height="92" rx="10" fill="#3a2a10" />
        <text x="0" y="30" textAnchor="middle" fontFamily={serif} fontSize="17" fill="#e8c66e">Tổng điểm</text>
        <text x="0" y="72" textAnchor="middle" fontFamily={serif} fontSize="34" fontWeight="700" fill="#fff4d0">{rec.certTotal ?? rec.best}<tspan fontSize="18" fill="#c9b080">/{max}</tspan></text>
      </g>
      <text x={W / 2} y="650" textAnchor="middle" fontFamily={serif} fontSize="34" fontWeight="700" fill={rec.excellent ? "#a0741a" : "#3a6a2e"} letterSpacing="4">{grade}</text>
      <text x="120" y="730" fontFamily={serif} fontSize="18" fill="#5a4a30">Ngày cấp: {rec.date}</text>
      <text x="120" y="760" fontFamily={serif} fontSize="18" fill="#5a4a30">Số hiệu: {rec.id}</text>
      {/* chữ ký & con dấu của giám khảo */}
      <text x="900" y="715" textAnchor="middle" fontFamily={serif} fontSize="30" fontStyle="italic" fill="#3a2a10">{cert.signer}</text>
      <line x1="800" y1="728" x2="1000" y2="728" stroke="#8a6a2e" />
      <text x="900" y="755" textAnchor="middle" fontFamily={serif} fontSize="16" fill="#6a5020">{cert.signerTitle}</text>
      <g transform="translate(1040 690) rotate(-12)" opacity=".88">
        <circle r="58" fill="none" stroke={cert.sealColor || "#b3261e"} strokeWidth="6" />
        <circle r="46" fill="none" stroke={cert.sealColor || "#b3261e"} strokeWidth="2" />
        <text y="-8" textAnchor="middle" fontFamily="'Noto Serif JP','Yu Mincho',serif" fontSize="26" fontWeight="700" fill={cert.sealColor || "#b3261e"}>{cert.seal[0]}</text>
        <text y="26" textAnchor="middle" fontFamily="'Noto Serif JP','Yu Mincho',serif" fontSize="26" fontWeight="700" fill={cert.sealColor || "#b3261e"}>{cert.seal[1]}</text>
      </g>
    </svg>
  );
}

// cfg: { store, home, homeLabel, examHref(n), sections, pass:{max}, cert }
export default function CertView({ cfg, ex }) {
  const { S } = useGame();
  const ref = useRef(null);
  if (!S) return null;
  const rec = S[cfg.store]?.ex?.[ex.n];
  if (!rec?.passed) return <p style={{ marginTop: 40 }}>Bạn chưa đỗ kỳ thi này. <Link href={cfg.examHref(ex.n)} style={{ color: "var(--gold2)" }}>Đi thi</Link></p>;
  const name = S.profile?.name || "Nhà Lữ Hành";

  const download = () => {
    const svg = new XMLSerializer().serializeToString(ref.current);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 2400; c.height = 1700;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `${cfg.cert.filePrefix}-cap-${ex.n}-${name.replace(/\s+/g, "_")}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    sfx.primo();
  };

  return (
    <>
      <Link href={cfg.home} className="back">‹ {cfg.homeLabel}</Link>
      <div className="certwrap"><CertSvg name={name} ex={ex} rec={rec} sections={cfg.sections} max={cfg.pass.max} cert={cfg.cert} svgRef={ref} /></div>
      <div className="btnrow">
        <button className="gbtn tri" onClick={download}><span className="c" />Tải ảnh PNG</button>
        <Link href="/rank" className="gbtn"><span className="c" />Bảng xếp hạng</Link>
      </div>
      {!S.profile && <p className="hint" style={{ textAlign: "center" }}>Chứng chỉ đang ghi tên mặc định — <Link href="/rank" style={{ color: "var(--gold2)" }}>đăng ký tên</Link> để chứng chỉ có tên của bạn.</p>}
    </>
  );
}
