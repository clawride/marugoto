"use client";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/components/Game";
import { ProfileDialog, avatarUrl } from "@/components/Profile";
import { BOARD_GROUPS, decode, boardLabel } from "@/lib/boards";
import { sfx } from "@/lib/sfx";

const MEDAL = ["🥇", "🥈", "🥉"];
const ROMAN = ["", "I", "II", "III"];
// Huy hiệu chứng chỉ B1-1 bên cạnh tên
// "1".."3" = B1-1, "A1"/"A2" = A2-2, "C1"/"C2" = A2/B1; "*" = Xuất sắc
const CERT_KIND = { A: { cls: "a22", name: "A2-2", ico: "🌱A2-2·" }, C: { cls: "ab1", name: "A2/B1", ico: "🌊A2/B1·" }, E: { cls: "a1", name: "A1", ico: "🍃A1·" }, D: { cls: "a21", name: "A2-1", ico: "⚡A2-1·" } };
function Certs({ c }) {
  if (!c) return null;
  return <span className="certbadges">{c.split(",").filter(Boolean).map((x) => {
    const k = CERT_KIND[x[0]], lv = ROMAN[parseInt(k ? x.slice(1) : x)], ex = x.endsWith("*");
    return <i key={x} className={`${ex ? "ex" : ""} ${k?.cls || ""}`} title={`Chứng chỉ ${k?.name || "B1-1"} Cấp ${lv}${ex ? " · Xuất sắc" : ""}`}>{k?.ico || "📜"}{lv}</i>;
  })}</span>;
}

export default function RankPage() {
  const { S } = useGame();
  const [group, setGroup] = useState("overall");
  const G = BOARD_GROUPS.find((g) => g.key === group);
  const [board, setBoard] = useState("overall");
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(false);
  useEffect(() => { setBoard(G.boards[0].id); }, [group]); // eslint-disable-line react-hooks/exhaustive-deps

  const me = S?.profile?.id;
  useEffect(() => {
    let alive = true;
    setData(null);
    fetch(`/api/rank?board=${encodeURIComponent(board)}${me ? `&me=${me}` : ""}`).then((r) => r.json()).then((j) => alive && setData(j)).catch(() => alive && setData({ error: true }));
    return () => { alive = false; };
  }, [board, me, S?.syncSig]);

  const fmt = (score) => {
    if (board === "overall") return <><b>{score.toLocaleString("vi-VN")}</b><small>điểm</small></>;
    if (/^(ex|x22|xb1|x01|x21):/.test(board)) { const { pct, total } = decode(score); return <><b>{total}/180</b><small>{pct}%</small></>; }
    const { pct, total } = decode(score);
    return <><b>{pct}%</b><small>{total} câu</small></>;
  };
  const inTop = useMemo(() => data?.rows?.some((r) => r.id === me), [data, me]);
  if (!S) return null;

  return (
    <>
      <div className="pagehead">
        <h1>Bảng Xếp Hạng</h1>
        <p>Kỷ lục của các Nhà Lữ Hành ở từng thử thách</p>
        <div className="orn"><span /></div>
      </div>

      <div className="panel myprof">
        {S.profile ? (
          <>
            <img src={avatarUrl(S.profile.avatar)} alt="" />
            <div><b>{S.profile.name}</b><span>{S.profile.id ? "Kỷ lục tự động được gửi lên bảng xếp hạng" : "Đang chờ server bảng xếp hạng…"}</span></div>
            <button className="gbtn sm" onClick={() => { setEdit(true); sfx.open(); }}><span className="c" />Sửa hồ sơ</button>
          </>
        ) : (
          <>
            <div className="noprof">?</div>
            <div><b>Chưa có hồ sơ</b><span>Đăng ký tên để lên bảng xếp hạng</span></div>
            <button className="gbtn sm tri" onClick={() => setEdit(true)}><span className="c" />Đăng ký</button>
          </>
        )}
      </div>

      <div className="chips rtabs">
        {BOARD_GROUPS.map((g) => <button key={g.key} className={`chip dk ${group === g.key ? "on" : ""}`} onClick={() => { setGroup(g.key); sfx.click(); }}>{g.label}</button>)}
      </div>
      {G.boards.length > 1 && (
        <select className="boardsel" value={board} onChange={(e) => setBoard(e.target.value)}>
          {G.boards.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      )}

      <div className="panel ranklist">
        <div className="rlhead"><span>{boardLabel(board)}</span>{data?.count ? <small>{data.count} người chơi</small> : null}</div>
        {!data && <div className="rlempty">Đang tải…</div>}
        {data?.error && <div className="rlempty">Không tải được bảng xếp hạng.</div>}
        {data && data.configured === false && <div className="rlempty">Bảng xếp hạng chưa được bật trên server (cần kết nối Upstash Redis trong Vercel).</div>}
        {data?.rows?.length === 0 && <div className="rlempty">Chưa có ai — hãy là người đầu tiên!</div>}
        {data?.rows?.map((r) => (
          <div key={r.id} className={`rrow ${r.id === me ? "me" : ""} ${r.rank <= 3 ? "top" + r.rank : ""}`}>
            <span className="rk">{MEDAL[r.rank - 1] || r.rank}</span>
            <img src={avatarUrl(r.avatar)} alt="" loading="lazy" />
            <span className="nm">{r.name}{r.id === me && <em>Bạn</em>}<Certs c={r.certs} /></span>
            <span className="sc">{fmt(r.score)}</span>
          </div>
        ))}
        {data?.me && !inTop && (
          <div className="rrow me sep">
            <span className="rk">{data.me.rank}</span>
            <img src={avatarUrl(data.me.avatar)} alt="" />
            <span className="nm">{data.me.name}<em>Bạn</em><Certs c={data.me.certs} /></span>
            <span className="sc">{fmt(data.me.score)}</span>
          </div>
        )}
      </div>
      <p className="hint" style={{ textAlign: "center" }}>Điểm Mạo Hiểm = 100 × tổng số sao (từ vựng, boss, bài nghe; Ronova ×3; mỗi phần của bài A2-2 và boss A2-2 tối đa 3 sao; mỗi chứng chỉ B1-1/A2-2 = 5 sao, Xuất sắc = 10 sao) + số câu trả lời đúng. Mỗi thử thách xếp theo tỉ lệ đúng, bằng nhau thì ai làm nhiều câu hơn xếp trên.</p>
      {edit && <ProfileDialog mode={S.profile ? "edit" : "new"} onClose={() => setEdit(false)} />}
    </>
  );
}
