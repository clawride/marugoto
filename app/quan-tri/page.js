"use client";
// Trang quản trị (ẨN): không có trong menu/sitemap, không được lập chỉ mục; người không phải quản trị thấy trang 404.
// Quyền được máy chủ kiểm ở /api/admin trên MỌI thao tác — ẩn giao diện chỉ là lớp phụ.
import { useCallback, useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { useGame } from "@/components/Game";
import { useAdmin, adminCall, dropSiteCache } from "@/lib/useSite";
import { BOARD_GROUPS } from "@/lib/boards";
import { SITE_DEFAULTS } from "@/lib/siteCfg";
import "./admin.css";

const TABS = [["ov", "📊 Tổng quan"], ["us", "👥 Người dùng"], ["rk", "🏆 Xếp hạng"], ["ch", "💬 Chat"], ["st", "⚙️ Cấu hình trang"], ["ex", "📝 Đề thi"], ["lg", "📜 Nhật ký"]];
const fmt = (t) => (t ? new Date(t).toLocaleString("vi-VN") : "—");

export default function AdminPage() {
  const { S, toast } = useGame();
  const admin = useAdmin(S);
  const [tab, setTab] = useState("ov");
  useEffect(() => { document.title = "Trang quản trị"; }, []);
  if (S && admin === false) notFound();
  if (!S || admin !== true) return <p className="hint" style={{ marginTop: 40, textAlign: "center" }}>Đang tải…</p>;
  const P = S.profile;
  const call = (a, b) => adminCall(P, a, b);
  const say = (m) => toast(m);
  return (
    <div className="adm">
      <h1>⚙️ Trang quản trị <small>({P.name})</small></h1>
      <p className="hint">Trang này ẩn với người dùng thường. Mọi thao tác được máy chủ kiểm quyền và ghi vào nhật ký.</p>
      <div className="admtabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "ov" && <Overview call={call} say={say} />}
      {tab === "us" && <Users call={call} say={say} />}
      {tab === "rk" && <Boards call={call} say={say} />}
      {tab === "ch" && <Chat call={call} say={say} />}
      {tab === "st" && <Settings call={call} say={say} />}
      {tab === "ex" && <Exams call={call} say={say} />}
      {tab === "lg" && <Logs call={call} />}
    </div>
  );
}

function useLoad(fn, deps) {
  const [d, setD] = useState(null), [err, setErr] = useState("");
  const run = useCallback(() => { setErr(""); fn().then(setD).catch((e) => setErr(e.message)); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return [d, err, run];
}
const Err = ({ e }) => (e ? <p className="admerr">⚠ {e}</p> : null);

function Overview({ call, say }) {
  const [d, err, reload] = useLoad(() => call("overview"), []);
  if (err) return <Err e={err} />;
  if (!d) return <p className="hint">Đang tải…</p>;
  const s = d.stats, site = d.site;
  const toggle = async (patch) => { try { await call("setSite", { site: { ...site, ...patch } }); dropSiteCache(); say("Đã lưu"); reload(); } catch (e) { say(e.message); } };
  return (
    <>
      <div className="admcards">
        {[["Hồ sơ", s.users], ["Có tài khoản", s.accounts], ["Bị khóa", s.banned], ["Có lưu tiến độ", s.saves], ["Điểm xếp hạng", s.scores], ["Tin chat hôm nay", s.chatToday], ["Nhật ký quản trị", s.logs]].map(([l, v]) => <div key={l} className="panel admcard"><b>{Number(v).toLocaleString("vi-VN")}</b><small>{l}</small></div>)}
      </div>
      <div className="panel admbox">
        <h3>Công tắc nhanh</h3>
        <label className="admsw"><input type="checkbox" checked={site.maintenance.on} onChange={(e) => toggle({ maintenance: { ...site.maintenance, on: e.target.checked } })} /> 🛠 Chế độ bảo trì (người dùng thường thấy màn hình bảo trì)</label>
        <label className="admsw"><input type="checkbox" checked={site.chatEnabled} onChange={(e) => toggle({ chatEnabled: e.target.checked })} /> 💬 Phòng chat đang mở</label>
        <label className="admsw"><input type="checkbox" checked={site.signupEnabled} onChange={(e) => toggle({ signupEnabled: e.target.checked })} /> 🆕 Cho phép đăng ký tài khoản mới</label>
        <p className="hint">Lưu trữ: <b>{d.storage}</b> · môi trường: {d.env}. Chỉnh banner, hệ số thưởng, đề ẩn ở các tab bên cạnh.</p>
      </div>
    </>
  );
}

function Users({ call, say }) {
  const [q, setQ] = useState(""), [qq, setQq] = useState(""), [off, setOff] = useState(0), [sel, setSel] = useState(null);
  const [d, err, reload] = useLoad(() => call("users", { q: qq, offset: off }), [qq, off]);
  return (
    <div className="admgrid">
      <div className="panel admbox">
        <form className="admsearch" onSubmit={(e) => { e.preventDefault(); setOff(0); setQq(q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, tên đăng nhập, email Google, id…" />
          <button className="chip dk">Tìm</button>
        </form>
        <Err e={err} />
        {d && <p className="hint">{d.count.toLocaleString("vi-VN")} hồ sơ</p>}
        <ul className="admlist">
          {d?.rows.map((u) => (
            <li key={u.id} className={sel === u.id ? "on" : ""}>
              <button onClick={() => setSel(u.id)}>
                <b>{u.name}</b> {u.admin && <span className="admtag">quản trị</span>}{u.banned && <span className="admtag bad">khóa</span>}{u.locked && <span className="admtag warn">tạm khóa đăng nhập</span>}
                <small>{u.username ? `@${u.username}` : "chưa có tài khoản"}{u.google ? ` · ${u.google}` : ""} · {fmt(u.createdAt)}</small>
              </button>
            </li>
          ))}
        </ul>
        {d && (
          <div className="admpager">
            <button className="chip" disabled={off === 0} onClick={() => setOff(Math.max(0, off - 40))}>‹ Trước</button>
            <button className="chip" disabled={off + 40 >= d.count} onClick={() => setOff(off + 40)}>Sau ›</button>
          </div>
        )}
      </div>
      <div>{sel ? <UserPanel key={sel} uid={sel} call={call} say={say} onChanged={() => { reload(); }} onGone={() => { setSel(null); reload(); }} /> : <div className="panel admbox"><p className="hint">Chọn một người dùng để xem chi tiết và thao tác.</p></div>}</div>
    </div>
  );
}

function UserPanel({ uid, call, say, onChanged, onGone }) {
  const [d, err, reload] = useLoad(() => call("user", { uid }), [uid]);
  const [name, setName] = useState(""), [pw, setPw] = useState("");
  const u = d?.user;
  useEffect(() => { if (u) setName(u.name); }, [u?.name]); // eslint-disable-line react-hooks/exhaustive-deps
  const op = async (o, extra = {}, okMsg = "Đã thực hiện") => {
    try { const r = await call("userOp", { uid, op: o, ...extra }); if (r.password) setPw(r.password); say(okMsg); reload(); onChanged(); return r; } catch (e) { say(e.message); }
  };
  if (err) return <div className="panel admbox"><Err e={err} /></div>;
  if (!u) return <div className="panel admbox"><p className="hint">Đang tải…</p></div>;
  return (
    <div className="panel admbox">
      <h3>{u.name} {u.admin && <span className="admtag">quản trị</span>}{u.banned && <span className="admtag bad">đang bị khóa</span>}</h3>
      <table className="admkv"><tbody>
        <tr><th>Id</th><td><code>{u.id}</code></td></tr>
        <tr><th>Tên đăng nhập</th><td>{u.username || "—"}</td></tr>
        <tr><th>Google</th><td>{u.google || "—"}</td></tr>
        <tr><th>Tạo lúc</th><td>{fmt(u.createdAt)}</td></tr>
        <tr><th>Sai mật khẩu</th><td>{u.failed || 0} lần{u.locked ? " — đang bị khóa đăng nhập tạm" : ""}</td></tr>
        {u.bannedReason && <tr><th>Lý do khóa</th><td>{u.bannedReason}</td></tr>}
        <tr><th>Tiến độ</th><td>{u.save ? `${Number(u.save.primo).toLocaleString("vi-VN")} Nguyên Thạch · ${Number(u.save.total).toLocaleString("vi-VN")} câu đúng · ${u.save.exams} đề đã làm (${u.save.examsPassed} đỗ) · lưu ${fmt(u.save.updatedAt)}` : "chưa lưu"}</td></tr>
      </tbody></table>
      {u.scores?.length > 0 && <details><summary>{u.scores.length} điểm xếp hạng</summary><ul className="admmini">{u.scores.map((s) => <li key={s.board}><code>{s.board}</code> {Number(s.score).toLocaleString("vi-VN")}</li>)}</ul></details>}
      <div className="admops">
        <div className="admrow"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} /><button className="chip dk" onClick={() => name.trim() && name !== u.name && op("rename", { name }, "Đã đổi tên")}>Đổi tên hiển thị</button></div>
        <div className="admrow">
          {u.banned ? <button className="chip dk" onClick={() => op("unban", {}, "Đã mở khóa tài khoản")}>Mở khóa tài khoản</button>
            : !u.admin && <button className="chip dk bad" onClick={() => { const r = prompt("Lý do khóa (tùy chọn):", ""); if (r !== null) op("ban", { reason: r }, "Đã khóa tài khoản và đăng xuất mọi thiết bị"); }}>Khóa tài khoản</button>}
          <button className="chip dk" onClick={() => op("unlock", {}, "Đã xóa đếm sai mật khẩu")}>Mở khóa đăng nhập tạm</button>
          <button className="chip dk" onClick={() => confirm("Đăng xuất người này khỏi mọi thiết bị?") && op("revoke", {}, "Đã đăng xuất mọi thiết bị")}>Đăng xuất mọi thiết bị</button>
        </div>
        <div className="admrow">
          {u.username && <button className="chip dk" onClick={() => confirm(`Đặt lại mật khẩu cho ${u.name}? Mật khẩu mới được hiện MỘT lần dưới đây, mọi thiết bị bị đăng xuất.`) && op("resetPassword", {}, "Đã đặt lại mật khẩu")}>Đặt lại mật khẩu</button>}
          <button className="chip dk bad" onClick={() => confirm(`Xóa TOÀN BỘ điểm xếp hạng của ${u.name}?`) && op("clearScores", {}, "Đã xóa điểm xếp hạng")}>Xóa điểm xếp hạng</button>
          {!u.admin && <button className="chip dk bad" onClick={async () => { const c = prompt(`Xóa vĩnh viễn tài khoản này (cả tiến độ, điểm, tin chat)?\nGõ đúng tên hiển thị "${u.name}" để xác nhận:`); if (c !== null && (await op("delete", { confirm: c }, "Đã xóa tài khoản"))) onGone(); }}>Xóa tài khoản</button>}
        </div>
        {pw && <p className="admpw">Mật khẩu mới: <code>{pw}</code> <button className="chip" onClick={() => navigator.clipboard?.writeText(pw)}>Chép</button><small> — chỉ hiện một lần, hãy gửi cho người dùng rồi nhờ họ đổi.</small></p>}
      </div>
    </div>
  );
}

function Boards({ call, say }) {
  const groups = useMemo(() => BOARD_GROUPS.filter((g) => g.boards.length), []);
  const [g, setG] = useState(groups[0].key), [board, setBoard] = useState(groups[0].boards[0].id);
  const grp = groups.find((x) => x.key === g);
  const [d, err, reload] = useLoad(() => call("board", { board }), [board]);
  const del = async (r) => { if (!confirm(`Xóa điểm của ${r.name} ở bảng này?`)) return; try { await call("boardOp", { op: "delete", board, uid: r.id }); say("Đã xóa"); reload(); } catch (e) { say(e.message); } };
  const clear = async () => { const c = prompt(`Xóa TOÀN BỘ bảng "${d?.label}"?\nGõ đúng mã bảng: ${board}`); if (c === null) return; try { await call("boardOp", { op: "clear", board, confirm: c }); say("Đã xóa cả bảng"); reload(); } catch (e) { say(e.message); } };
  return (
    <div className="panel admbox">
      <div className="admrow">
        <select value={g} onChange={(e) => { setG(e.target.value); setBoard(groups.find((x) => x.key === e.target.value).boards[0].id); }}>{groups.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
        <select value={board} onChange={(e) => setBoard(e.target.value)}>{grp.boards.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select>
      </div>
      <Err e={err} />
      {d && <><p className="hint">{d.label} · {d.count} người · hiện top {d.rows.length}</p>
        <table className="admtable"><thead><tr><th>#</th><th>Tên</th><th>Điểm</th><th></th></tr></thead><tbody>
          {d.rows.map((r) => <tr key={r.id}><td>{r.rank}</td><td>{r.name}</td><td>{r.score.toLocaleString("vi-VN")}</td><td><button className="chip bad" onClick={() => del(r)}>Xóa</button></td></tr>)}
        </tbody></table>
        {d.count > 0 && <p><button className="chip dk bad" onClick={clear}>Xóa cả bảng này</button></p>}</>}
    </div>
  );
}

function Chat({ call, say }) {
  const [d, err, reload] = useLoad(() => call("chat"), []);
  const del = async (m) => { try { await call("chatOp", { op: "delete", mid: m.id }); say("Đã xóa tin"); reload(); } catch (e) { say(e.message); } };
  const clear = async () => { const c = prompt("Xóa TẤT CẢ tin chat hôm nay? Gõ XOA để xác nhận:"); if (c === null) return; try { await call("chatOp", { op: "clear", confirm: c }); say("Đã xóa"); reload(); } catch (e) { say(e.message); } };
  return (
    <div className="panel admbox">
      <div className="admrow"><button className="chip" onClick={reload}>↻ Làm mới</button><button className="chip dk bad" onClick={clear}>Xóa tất cả tin hôm nay</button></div>
      <Err e={err} />
      <ul className="admchat">{d?.messages.map((m) => <li key={m.id}><div><b>{m.name}</b> <small>{fmt(m.created_at)}</small><p>{m.body}</p></div><button className="chip bad" onClick={() => del(m)}>Xóa</button></li>)}</ul>
      {d && !d.messages.length && <p className="hint">Hôm nay chưa có tin nào.</p>}
    </div>
  );
}

function Settings({ call, say }) {
  const [d, err] = useLoad(() => call("overview"), []);
  const [f, setF] = useState(null);
  useEffect(() => { if (d) setF(structuredClone(d.site)); }, [d]);
  if (err) return <Err e={err} />;
  if (!f) return <p className="hint">Đang tải…</p>;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => { try { await call("setSite", { site: f }); dropSiteCache(); say("Đã lưu cấu hình (người dùng thấy trong ~20 giây)"); } catch (e) { say(e.message); } };
  return (
    <div className="panel admbox admform">
      <h3>📢 Thông báo toàn trang (banner)</h3>
      <textarea rows={2} maxLength={300} value={f.banner.text} onChange={(e) => set("banner", { ...f.banner, text: e.target.value })} placeholder="Để trống để ẩn banner. Ví dụ: 'Đã có thêm 38 đề luyện thi mới!'" />
      <select value={f.banner.level} onChange={(e) => set("banner", { ...f.banner, level: e.target.value })}><option value="info">Thông tin (xanh)</option><option value="ok">Tin vui (lục)</option><option value="warn">Cảnh báo (vàng)</option></select>
      <h3>🛠 Bảo trì</h3>
      <label className="admsw"><input type="checkbox" checked={f.maintenance.on} onChange={(e) => set("maintenance", { ...f.maintenance, on: e.target.checked })} /> Bật chế độ bảo trì</label>
      <textarea rows={2} maxLength={300} value={f.maintenance.message} onChange={(e) => set("maintenance", { ...f.maintenance, message: e.target.value })} placeholder="Lời nhắn cho người dùng (tùy chọn)" />
      <h3>💎 Hệ số Nguyên Thạch ở Luyện đề thi</h3>
      <div className="admrow"><input type="number" min="0" max="5" step="0.1" value={f.examMult} onChange={(e) => set("examMult", e.target.value)} /><span className="hint">1 = mức chuẩn · 2 = gấp đôi (sự kiện) · 0 = tắt thưởng. Từ 0 đến 5.</span></div>
      <h3>Công tắc</h3>
      <label className="admsw"><input type="checkbox" checked={f.chatEnabled} onChange={(e) => set("chatEnabled", e.target.checked)} /> Phòng chat đang mở</label>
      <label className="admsw"><input type="checkbox" checked={f.signupEnabled} onChange={(e) => set("signupEnabled", e.target.checked)} /> Cho phép đăng ký tài khoản mới</label>
      <p><button className="gbtn tri" onClick={save}><span className="c" />Lưu cấu hình</button> <button className="chip" onClick={() => setF(structuredClone(SITE_DEFAULTS))}>Đặt về mặc định (chưa lưu)</button></p>
    </div>
  );
}

function Exams({ call, say }) {
  const [site, serr, reload] = useLoad(async () => (await call("overview")).site, []);
  const [list, setList] = useState(null), [q, setQ] = useState("");
  useEffect(() => { fetch("/exams/index.json").then((r) => r.json()).then((j) => setList(j.exams || j)).catch(() => setList([])); }, []);
  if (serr) return <Err e={serr} />;
  if (!site || !list) return <p className="hint">Đang tải…</p>;
  const hidden = new Set(site.hiddenExams);
  const flip = async (id) => { const n = new Set(hidden); n.has(id) ? n.delete(id) : n.add(id); try { await call("setSite", { site: { ...site, hiddenExams: [...n] } }); dropSiteCache(); say(n.has(id) ? "Đã ẩn đề" : "Đã hiện đề"); reload(); } catch (e) { say(e.message); } };
  const rows = list.filter((e) => !q || `${e.id} ${e.title}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="panel admbox">
      <input className="admfull" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc đề…" />
      <p className="hint">{list.length} đề · {hidden.size} đề đang ẩn (người dùng thường không thấy trong danh sách và không làm được; quản trị vẫn thấy).</p>
      <table className="admtable"><thead><tr><th>Đề</th><th>Cấp</th><th>Câu</th><th></th></tr></thead><tbody>
        {rows.map((e) => <tr key={e.id} className={hidden.has(e.id) ? "off" : ""}><td><b>{e.title}</b><br /><small><code>{e.id}</code></small></td><td>{e.level}</td><td>{e.count ?? ""}</td><td><button className={`chip ${hidden.has(e.id) ? "" : "bad"}`} onClick={() => flip(e.id)}>{hidden.has(e.id) ? "Hiện lại" : "Ẩn"}</button></td></tr>)}
      </tbody></table>
    </div>
  );
}

function Logs({ call }) {
  const [d, err, reload] = useLoad(() => call("logs"), []);
  return (
    <div className="panel admbox">
      <p><button className="chip" onClick={reload}>↻ Làm mới</button></p>
      <Err e={err} />
      <table className="admtable"><thead><tr><th>Lúc</th><th>Quản trị</th><th>Thao tác</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>
        {d?.logs.map((l) => <tr key={l.id}><td>{fmt(l.at)}</td><td>{l.admin}</td><td><code>{l.action}</code></td><td><code>{l.target || ""}</code></td><td><small>{l.detail ? JSON.stringify(l.detail) : ""}</small></td></tr>)}
      </tbody></table>
      {d && !d.logs.length && <p className="hint">Chưa có thao tác nào.</p>}
    </div>
  );
}
