"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/components/Game";
import Portal from "@/components/Portal";
import { CHARS, charIcon } from "@/lib/genshin";
import { entriesOf, overallOf } from "@/lib/boards";
import { sfx } from "@/lib/sfx";

const AVATAR_PICKS = ["Qin", "Venti", "Zhongli", "Shougun", "Nahida", "Furina", "Ayaka", "Yae", "Hutao", "Ganyu", "Kazuha", "Klee", "Paimon", "Xiao", "Nilou", "Keqing", "Diluc", "Mona", "Raiden", "Neuvillette", "Arlecchino", "Mavuika", "Kokomi", "Yoimiya"];

export const avatarUrl = (icon) => `https://gi.yatta.moe/assets/UI/UI_AvatarIcon_${icon || "Qin"}.png`;

async function api(path, method, body) {
  const r = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, ...j };
}
export const registerProfile = (name, avatar) => api("/api/profile", "POST", { name, avatar });
export const patchProfile = (p, upd) => api("/api/profile", "PATCH", { id: p.id, token: p.token, ...upd });

function AvatarPicker({ value, onChange }) {
  const list = useMemo(() => {
    const icons = new Set(CHARS.map((c) => c.icon));
    const picks = AVATAR_PICKS.filter((x) => icons.has(x));
    return CHARS.filter((c) => picks.includes(c.icon)).concat(CHARS.filter((c) => !picks.includes(c.icon) && c.rank === 5).slice(0, 24 - picks.length));
  }, []);
  return (
    <div className="avpick">
      {list.map((c) => (
        <button key={c.id} type="button" className={value === c.icon ? "on" : ""} onClick={() => { onChange(c.icon); sfx.click(); }} title={c.vi}>
          <img src={charIcon(c)} alt={c.vi} loading="lazy" />
        </button>
      ))}
    </div>
  );
}

// Hộp đăng ký / sửa hồ sơ
export function ProfileDialog({ mode = "new", onClose }) {
  const { S, update } = useGame();
  const [name, setName] = useState(S?.profile?.name || "");
  const [avatar, setAvatar] = useState(S?.profile?.avatar || "Qin");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e?.preventDefault();
    const n = name.trim();
    if (n.length < 2 || n.length > 20) return setErr("Tên cần 2–20 ký tự");
    setBusy(true); setErr("");
    const p = S.profile;
    const r = p?.id ? await patchProfile(p, { name: n, avatar }) : await registerProfile(n, avatar);
    setBusy(false);
    if (r.status === 503) {
      // Server chưa bật bảng xếp hạng: vẫn lưu hồ sơ trên máy, sẽ đăng ký khi server sẵn sàng
      update((s) => { s.profile = { ...(s.profile || {}), name: n, avatar, pending: true }; });
      sfx.open(); onClose?.(); return;
    }
    if (!r.ok) return setErr(r.error || "Có lỗi, thử lại sau");
    update((s) => { s.profile = p?.id ? { ...p, name: r.name, avatar: r.avatar } : { id: r.id, token: r.token, name: r.name, avatar: r.avatar }; s.profileSkip = false; s.syncSig = ""; });
    sfx.win(); onClose?.();
  };
  return (
    <Portal>
      <div className="modal">
        <form className="parch dialog profdlg" onSubmit={submit}>
          <img className="profav" src={avatarUrl(avatar)} alt="" />
          <h2>{mode === "new" ? "Chào mừng, Nhà Lữ Hành!" : "Hồ Sơ Của Bạn"}</h2>
          <div className="jp">{mode === "new" ? "Chỉ cần một cái tên để lưu kỷ lục và lên bảng xếp hạng" : "Đổi tên hoặc ảnh đại diện"}</div>
          <hr />
          <input className="nameinp" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Tên hoặc nickname…" autoFocus />
          <div className="lab2">Chọn ảnh đại diện</div>
          <AvatarPicker value={avatar} onChange={setAvatar} />
          {err && <div className="err">{err}</div>}
          <div className="btnrow">
            {mode === "new"
              ? <button type="button" className="gbtn x dark" onClick={() => { update((s) => { s.profileSkip = true; }); onClose?.(); }}><span className="c" />Để sau</button>
              : <button type="button" className="gbtn x dark" onClick={onClose}><span className="c" />Hủy</button>}
            <button type="submit" className="gbtn tri" disabled={busy}><span className="c" />{busy ? "Đang lưu…" : mode === "new" ? "Bắt đầu" : "Lưu"}</button>
          </div>
        </form>
      </div>
    </Portal>
  );
}

// Hiện hộp đăng ký cho người lần đầu vào + tự đồng bộ kỷ lục lên bảng xếp hạng
export function ProfileGate() {
  const { S, update } = useGame();
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  useEffect(() => { if (S && !S.profile && !S.profileSkip) setOpen(true); }, [S]);

  useEffect(() => {
    if (!S?.profile || busy.current) return;
    const p = S.profile;
    const entries = entriesOf(S), overall = overallOf(S);
    const sig = JSON.stringify([entries, overall, p.id]);
    if (sig === S.syncSig) return;
    const t = setTimeout(async () => {
      busy.current = true;
      try {
        let prof = p;
        if (!prof.id) { // hồ sơ tạo lúc server chưa sẵn sàng → thử đăng ký lại
          const r = await registerProfile(prof.name, prof.avatar);
          if (!r.ok) return;
          prof = { id: r.id, token: r.token, name: r.name, avatar: r.avatar };
          update((s) => { s.profile = prof; });
        }
        const r = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: prof.id, token: prof.token, entries, overall }) });
        if (r.ok) update((s) => { s.syncSig = JSON.stringify([entries, overall, prof.id]); });
      } catch {} finally { busy.current = false; }
    }, 1500);
    return () => clearTimeout(t);
  }, [S, update]);

  return open ? <ProfileDialog mode="new" onClose={() => setOpen(false)} /> : null;
}
