"use client";
import { useEffect, useMemo, useState } from "react";
import Portal from "@/components/Portal";
import { useGame } from "@/components/Game";
import { ProfileDialog } from "@/components/Profile";
import Avatar from "@/components/Avatar";
import { BOARD_GROUPS, decode, boardLabel } from "@/lib/boards";
import { sfx } from "@/lib/sfx";

const ROMAN = ["", "I", "II", "III"];
// Huy hiệu chứng chỉ bên cạnh tên: "1".."3" = B1-1, "A1"/"A2" = A2-2, "C1"/"C2" = A2/B1, "E" = A1, "D" = A2-1, "F" = B1-2; "*" = Xuất sắc
const CERT_KIND = { A: { cls: "a22", name: "A2-2", ico: "🌱A2-2·" }, C: { cls: "ab1", name: "A2/B1", ico: "🌊A2/B1·" }, E: { cls: "a1", name: "A1", ico: "🍃A1·" }, D: { cls: "a21", name: "A2-1", ico: "⚡A2-1·" }, F: { cls: "b12", name: "B1-2", ico: "🔥B1-2·" }, H: { cls: "mn1", name: "Minna-Genshin 1", ico: "🔥Minna-GI1·" }, I: { cls: "mnc2", name: "Minna-Genshin TC2", ico: "⚖️Minna-TC2·" }, J: { cls: "mnc1", name: "Minna-Genshin TC1", ico: "🌹Minna-TC1·" }, G: { cls: "mn2", name: "Minna-Genshin 2", ico: "❄️Minna-GI·" } };
function Certs({ c }) {
  if (!c) return null;
  return <span className="certbadges">{c.split(",").filter(Boolean).map((x) => {
    const k = CERT_KIND[x[0]], lv = ROMAN[parseInt(k ? x.slice(1) : x)], ex = x.endsWith("*");
    return <i key={x} className={`${ex ? "ex" : ""} ${k?.cls || ""}`} title={`Chứng chỉ ${k?.name || "B1-1"} Cấp ${lv}${ex ? " · Xuất sắc" : ""}`}>{k?.ico || "📜"}{lv}</i>;
  })}</span>;
}

// Số nhảy từ 0 lên giá trị thật
function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    let raf, t0;
    const step = (t) => { t0 ??= t; const p = Math.min(1, (t - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
function Score({ board, score }) {
  const overall = board === "overall";
  const exam = /^(ex|x22|xb1|x01|x21|x12|jl):/.test(board);
  const d = overall ? null : decode(score);
  const n = useCountUp(overall ? score : d.pct);
  if (overall) return <><b>{n.toLocaleString("vi-VN")}</b><small>điểm</small></>;
  return exam ? <><b>{d.total}/180</b><small>{n}%</small></> : <><b>{n}%</b><small>{d.total} câu</small></>;
}

function Podium({ rows, board, me }) {
  return <div className="hall-podium" aria-label="Ba hạng dẫn đầu">
    {rows.map((r, i) => <article key={r.id} className={`hall-champion place-${i + 1}`} aria-label={`Hạng ${i + 1}, ${r.name}`}>
      <div className="hall-medal" aria-hidden="true">{ROMAN[i + 1]}</div>
      <div className="hall-portrait"><Avatar avatar={r.avatar} name={r.name} size={72} /></div>
      <h2>{r.name}{r.id === me && <em>Bạn</em>}</h2>
      <span className="hall-score"><Score board={board} score={r.score} /></span>
      <Certs c={r.certs} />
    </article>)}
  </div>;
}

function Runner({ r, board, me }) {
  return <div className={`hall-row ${r.id === me ? "mine" : ""}`}>
    <span className="hall-position">#{r.rank}</span><Avatar avatar={r.avatar} name={r.name} size={34} />
    <div className="hall-person"><b>{r.name}{r.id === me && <em>Bạn</em>}</b><Certs c={r.certs} /></div>
    <span className="hall-score"><Score board={board} score={r.score} /></span>
  </div>;
}

function Loading() {
  return <div className="hall-message" role="status"><i aria-hidden="true">✦</i> Đang tải bảng xếp hạng…</div>;
}
function Empty() {
  return <div className="hall-message"><i aria-hidden="true">◇</i> Chưa có người học ghi điểm ở bảng này.</div>;
}

// Một nút gom mọi bộ lọc: ô tìm kiếm + các nhóm bảng (mở/thu gọn)
function FilterSheet({ group, board, onPick, onClose }) {
  const [q, setQ] = useState("");
  const all = useMemo(() => BOARD_GROUPS.flatMap((g) => g.boards.map((b) => ({ ...b, g: g.key, gl: g.label }))), []);
  const kw = q.trim().toLowerCase();
  const hits = kw ? all.filter((b) => `${b.label} ${b.gl}`.toLowerCase().includes(kw)).slice(0, 60) : null;
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <Portal>
      <div className="modal rk-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="parch dialog rk-sheet" role="dialog" aria-label="Chọn bảng xếp hạng">
          <div className="rk-sheethead"><h2>🎛️ Chọn bảng xếp hạng</h2><button type="button" className="rk-x" onClick={onClose} aria-label="Đóng">✕</button></div>
          <input className="nameinp rk-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm bảng… (vd: Boss, A2-1, Kanji)" autoFocus />
          <div className="rk-sheetbody">
            {hits ? (hits.length
              ? <div className="rk-opts">{hits.map((b) => <button key={b.id} type="button" className={`rk-opt ${b.id === board ? "on" : ""}`} onClick={() => onPick(b.g, b.id)}><small>{b.gl}</small>{b.label}</button>)}</div>
              : <p className="hint">Không có bảng nào khớp “{q}”.</p>)
              : BOARD_GROUPS.map((g) => (
                <details key={g.key} open={g.key === group} className="rk-grp">
                  <summary>{g.label}<small>{g.boards.length > 1 ? `${g.boards.length} bảng` : ""}</small></summary>
                  <div className="rk-opts">{g.boards.map((b) => <button key={b.id} type="button" className={`rk-opt ${b.id === board ? "on" : ""}`} onClick={() => onPick(g.key, b.id)}>{b.label}</button>)}</div>
                </details>
              ))}
          </div>
        </div>
      </div>
    </Portal>
  );
}

export default function RankPage() {
  const { S } = useGame();
  const [group, setGroup] = useState("overall");
  const [board, setBoard] = useState("overall");
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(false);
  const [filter, setFilter] = useState(false);

  const me = S?.profile?.id;
  // /rank?board=jl:N3 → mở thẳng bảng đó (từ trang kết quả thi thử)
  useEffect(() => {
    const b = new URLSearchParams(location.search).get("board");
    const g = b && BOARD_GROUPS.find((x) => x.boards.some((y) => y.id === b));
    if (g) { setGroup(g.key); setBoard(b); }
  }, []);
  useEffect(() => {
    let alive = true;
    setData(null);
    fetch(`/api/rank?board=${encodeURIComponent(board)}${me ? `&me=${me}` : ""}`).then((r) => r.json()).then((j) => { if (alive) setData(j); }).catch(() => alive && setData({ error: true }));
    return () => { alive = false; };
  }, [board, me, S?.syncSig]);

  const rows = data?.rows || [];
  const podium = rows.slice(0, 3), rest = rows.slice(3);
  const inTop = useMemo(() => rows.some((r) => r.id === me), [rows, me]);
  const mine = data?.me;
  const gLabel = BOARD_GROUPS.find((g) => g.key === group)?.label || "";
  if (!S) return null;

  return (
    <div className="rk">
      <div className="hall-hero">
        <div className="hall-seal" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#emb" /></svg></div>
        <h1>Bảng xếp hạng Teyvat</h1>
        <div className="hall-ornament" aria-hidden="true">✦</div>
      </div>

      <div className="rk-bar">
        <button type="button" className="rk-filterbtn" onClick={() => { setFilter(true); sfx.open?.(); }} aria-haspopup="dialog">
          <span className="rk-fi" aria-hidden="true">☷</span>
          <span className="rk-ft"><small>{gLabel}</small><b>{boardLabel(board)}</b></span>
          <span className="rk-fc" aria-hidden="true">▾</span>
        </button>
        {data?.count ? <span className="rk-count">👥 {data.count} người chơi</span> : null}
      </div>

      {S.profile && (
        <div className="panel rk-me">
          <Avatar avatar={S.profile.avatar} name={S.profile.name} size={48} className="myav" />
          <div className="rk-mi"><b>{S.profile.name}</b><span>{mine ? <>Hạng <strong>#{mine.rank}</strong>{data?.count ? ` / ${data.count}` : ""} ở bảng này</> : "Chưa có điểm ở bảng này — vào học thôi!"}</span></div>
          <button className="gbtn sm" onClick={() => { setEdit(true); sfx.open?.(); }}><span className="c" />Sửa hồ sơ</button>
        </div>
      )}

      <div className="rk-stage">
        {!data && <Loading />}
        {data?.error && <p className="rk-empty">Không tải được bảng xếp hạng. Thử lại sau nhé.</p>}
        {data && data.configured === false && <p className="rk-empty">Bảng xếp hạng chưa được bật trên server.</p>}
        {data && !data.error && rows.length === 0 && data.configured !== false && <Empty />}
        {rows.length > 0 && (
          <>
            {mine?.rank === 1 && <div className="rk-king">✦ Bạn đang dẫn đầu bảng xếp hạng này.</div>}
            <Podium key={board} rows={podium} board={board} me={me} />
            {rest.length > 0 && (
              <div className="panel rk-list">
                <div className="rk-listhead"><span>Xếp hạng tiếp theo</span><small>Thành tích</small></div>
                {rest.map((r) => <Runner key={r.id} r={r} board={board} me={me} />)}
              </div>
            )}
            {mine && !inTop && (
              <div className="panel rk-list rk-outside">
                <div className="rk-gap">⋯ còn {Math.max(0, mine.rank - 1 - rows.length)} người nữa ⋯</div>
                <Runner r={mine} board={board} me={me} />
              </div>
            )}
          </>
        )}
      </div>

      <p className="hint rk-note">Điểm Mạo Hiểm = 100 × tổng số sao (từ vựng, boss, bài nghe; Ronova ×3; mỗi phần của bài A2-2 và boss A2-2 tối đa 3 sao; mỗi chứng chỉ B1-1/A2-2 = 5 sao, Xuất sắc = 10 sao) + số câu trả lời đúng. Mỗi thử thách xếp theo tỉ lệ đúng, bằng nhau thì ai làm nhiều câu hơn xếp trên.</p>

      {filter && <FilterSheet group={group} board={board} onClose={() => setFilter(false)} onPick={(g, b) => { if (g) setGroup(g); setBoard(b); setFilter(false); sfx.click(); }} />}
      {edit && <ProfileDialog mode={S.profile ? "edit" : "gate"} onClose={() => setEdit(false)} />}
    </div>
  );
}
