"use client";
// Bảng xếp hạng: một nút "Bộ lọc" gom mọi bảng · bục top 3 có pháo giấy · các hạng còn lại chạy đua trên đường đua
import { useEffect, useMemo, useState } from "react";
import Portal from "@/components/Portal";
import { useGame } from "@/components/Game";
import { ProfileDialog } from "@/components/Profile";
import Avatar from "@/components/Avatar";
import { BOARD_GROUPS, decode, boardLabel } from "@/lib/boards";
import { sfx } from "@/lib/sfx";

const ROMAN = ["", "I", "II", "III"];
// Huy hiệu chứng chỉ bên cạnh tên: "1".."3" = B1-1, "A1"/"A2" = A2-2, "C1"/"C2" = A2/B1, "E" = A1, "D" = A2-1, "F" = B1-2; "*" = Xuất sắc
const CERT_KIND = { A: { cls: "a22", name: "A2-2", ico: "🌱A2-2·" }, C: { cls: "ab1", name: "A2/B1", ico: "🌊A2/B1·" }, E: { cls: "a1", name: "A1", ico: "🍃A1·" }, D: { cls: "a21", name: "A2-1", ico: "⚡A2-1·" }, F: { cls: "b12", name: "B1-2", ico: "🔥B1-2·" } };
function Certs({ c }) {
  if (!c) return null;
  return <span className="certbadges">{c.split(",").filter(Boolean).map((x) => {
    const k = CERT_KIND[x[0]], lv = ROMAN[parseInt(k ? x.slice(1) : x)], ex = x.endsWith("*");
    return <i key={x} className={`${ex ? "ex" : ""} ${k?.cls || ""}`} title={`Chứng chỉ ${k?.name || "B1-1"} Cấp ${lv}${ex ? " · Xuất sắc" : ""}`}>{k?.ico || "📜"}{lv}</i>;
  })}</span>;
}

// Câu nói bựa của từng hạng — bấm vào avatar trên bục để đổi câu
const QUOTES = [
  ["Đại ca đây rồi 😎", "Ngai vàng êm lắm, ngồi mãi không muốn dậy 👑", "Đừng ai đụng vào ngôi vua nhé!", "Ngủ đi, mai tôi vẫn #1 😴"],
  ["Chỉ cách ngôi vua một hơi thở 😤", "Lần sau tôi sẽ vượt mặt, hứa đấy!", "Bạc cũng là kim loại quý mà 🥈"],
  ["Có huy chương là vui rồi 🥉", "Tối nay ăn mừng trà sữa 🧋", "Đồng đội cũng ngầu chứ bộ!"],
];
// Dòng trạng thái của các hạng còn lại (chọn theo hạng + id, cố định để không nhảy lung tung)
const STATUS = [
  [10, ["Đang bám đuổi top 3 🏃", "Hơi thở đã dồn dập 💨", "Sắp chạm bục rồi!"]],
  [20, ["Chạy bộ buổi sáng 🚶", "Vừa chạy vừa ăn bánh mì 🥖", "Đang tìm lối tắt…"]],
  [Infinity, ["Chạy chậm mà chắc 🐢", "Vừa học vừa ngủ gật 😴", "Dừng lại uống trà một chút 🍵", "Cố lên, chưa muộn đâu! 💪"]],
];
const statusOf = (rank, id) => { const g = STATUS.find(([n]) => rank <= n)[1]; let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return g[h % g.length]; };

// Số nhảy từ 0 lên giá trị thật
function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
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

// Pháo giấy rơi một lần (vị trí cố định theo chỉ số → không nhấp nháy giữa các lần vẽ)
const CONFETTI = Array.from({ length: 34 }, (_, i) => ({ x: (i * 37) % 100, d: 0.2 + ((i * 53) % 100) / 70, r: (i * 97) % 360, c: ["#f7c948", "#ff7aa8", "#5bc0ff", "#7be07b", "#b794f4", "#ff9a4d"][i % 6], w: 6 + (i % 4) * 2 }));
function Confetti() {
  return <div className="rk-confetti" aria-hidden="true">{CONFETTI.map((p, i) => <i key={i} style={{ left: `${p.x}%`, background: p.c, width: p.w, height: p.w * 1.6, animationDelay: `${(1.5 + p.d).toFixed(2)}s`, "--r": `${p.r}deg`, "--sx": `${(i % 2 ? 1 : -1) * (10 + (i % 5) * 8)}px` }} />)}</div>;
}

function Podium({ rows, board, me }) {
  const [q, setQ] = useState([0, 0, 0]);
  const [boing, setBoing] = useState(-1);
  const order = [1, 0, 2].filter((i) => rows[i]); // 2 – 1 – 3
  const poke = (i) => { setQ((a) => a.map((v, k) => (k === i ? (v + 1) % QUOTES[i].length : v))); setBoing(i); sfx.click(); setTimeout(() => setBoing(-1), 600); };
  return (
    <div className="rk-podium" data-n={rows.length}>
      <Confetti />
      {order.map((i) => {
        const r = rows[i];
        return (
          <div key={r.id} className={`rk-pl p${i + 1} ${r.id === me ? "me" : ""}`} style={{ "--i": i }}>
            <div className="rk-say" key={q[i]}>{QUOTES[i][q[i]]}</div>
            <button type="button" className={`rk-av ${boing === i ? "boing" : ""}`} onClick={() => poke(i)} aria-label={`${r.name} — bấm để nghe lời nhắn`}>
              {i === 0 && <span className="rk-crown" aria-hidden="true">👑</span>}
              {i === 0 && <><span className="rk-sp s1" aria-hidden="true">✨</span><span className="rk-sp s2" aria-hidden="true">✨</span><span className="rk-sp s3" aria-hidden="true">⭐</span></>}
              <Avatar avatar={r.avatar} name={r.name} size={i === 0 ? 84 : 68} />
            </button>
            <div className="rk-nm" title={r.name}>{r.name}{r.id === me && <em>Bạn</em>}</div>
            <Certs c={r.certs} />
            <div className="rk-pil"><span className="rk-rank">{i + 1}</span><div className="rk-sc"><Score board={board} score={r.score} /></div></div>
          </div>
        );
      })}
    </div>
  );
}

function Runner({ r, top, board, me, i, go }) {
  const pct = top > 0 ? Math.max(0.04, Math.min(1, r.score / top)) : 0.04;
  return (
    <div className={`rk-row ${r.id === me ? "me" : ""}`} style={{ "--n": Math.min(i, 18) }}>
      <span className="rk-pos">{r.rank}</span>
      <div className="rk-body">
        <div className="rk-line">
          <span className="rk-name" title={r.name}>{r.name}{r.id === me && <em>Bạn</em>}</span>
          <Certs c={r.certs} />
          <span className="rk-score"><Score board={board} score={r.score} /></span>
        </div>
        <div className="rk-lane" style={{ "--p": go ? pct : 0, "--d": `${0.5 + Math.min(i, 18) * 0.045}s` }}>
          <span className="rk-track" />
          <span className="rk-run">
            <Avatar avatar={r.avatar} name={r.name} size={26} /><i className="rk-dust" aria-hidden="true">💨</i>
          </span>
          <span className="rk-flag" aria-hidden="true">🏁</span>
        </div>
        <div className="rk-status">{r.id === me ? "Bạn ở đây 👇" : statusOf(r.rank, r.id)}</div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="rk-loading" role="status">
      <div className="rk-road"><span className="a">🐢</span><span className="b">🐇</span><span className="c">🦊</span><span className="fin">🏁</span></div>
      <p>Đang gọi các cao thủ ra sân…</p>
    </div>
  );
}
function Empty() {
  return (
    <div className="rk-empty">
      <div className="rk-weed" aria-hidden="true">🌾</div>
      <div className="rk-cricket" aria-hidden="true">🦗</div>
      <p><b>Chưa có ai ở đây…</b><br />Hãy là người đầu tiên đặt chân lên bục vinh quang!</p>
    </div>
  );
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
  const [go, setGo] = useState(false);

  const me = S?.profile?.id;
  // /rank?board=jl:N3 → mở thẳng bảng đó (từ trang kết quả thi thử)
  useEffect(() => {
    const b = new URLSearchParams(location.search).get("board");
    const g = b && BOARD_GROUPS.find((x) => x.boards.some((y) => y.id === b));
    if (g) { setGroup(g.key); setBoard(b); }
  }, []);
  useEffect(() => {
    let alive = true;
    setData(null); setGo(false);
    fetch(`/api/rank?board=${encodeURIComponent(board)}${me ? `&me=${me}` : ""}`).then((r) => r.json()).then((j) => { if (alive) { setData(j); setTimeout(() => alive && setGo(true), 80); } }).catch(() => alive && setData({ error: true }));
    return () => { alive = false; };
  }, [board, me, S?.syncSig]);

  const rows = data?.rows || [];
  const top = rows[0]?.score || 0;
  const podium = rows.slice(0, 3), rest = rows.slice(3);
  const inTop = useMemo(() => rows.some((r) => r.id === me), [rows, me]);
  const mine = data?.me;
  const gLabel = BOARD_GROUPS.find((g) => g.key === group)?.label || "";
  if (!S) return null;

  return (
    <div className="rk">
      <div className="pagehead">
        <div className="rk-cup" aria-hidden="true">🏆</div>
        <h1>Bảng Xếp Hạng</h1>
        <p>Ai chạy nhanh nhất, ai còn đang ngủ gật? Xem ngay!</p>
        <div className="orn"><span /></div>
      </div>

      <div className="rk-bar">
        <button type="button" className="rk-filterbtn" onClick={() => { setFilter(true); sfx.open?.(); }} aria-haspopup="dialog">
          <span className="rk-fi" aria-hidden="true">🎛️</span>
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
            {mine?.rank === 1 && <div className="rk-king">👑 Bạn đang giữ ngôi vua! Đừng để ai giật mất nhé!</div>}
            <Podium key={board} rows={podium} board={board} me={me} />
            {rest.length > 0 && (
              <div className="panel rk-list">
                <div className="rk-listhead"><span>🏃 Đường đua</span><small>Càng gần cờ đích càng giỏi</small></div>
                {rest.map((r, i) => <Runner key={r.id} r={r} top={top} board={board} me={me} i={i} go={go} />)}
              </div>
            )}
            {mine && !inTop && (
              <div className="panel rk-list rk-outside">
                <div className="rk-gap">⋯ còn {Math.max(0, mine.rank - 1 - rows.length)} người nữa ⋯</div>
                <Runner r={mine} top={top} board={board} me={me} i={0} go={go} />
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
