"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/components/Game";
import Portal from "@/components/Portal";
import { CHARS, charIcon, ASSET } from "@/lib/genshin";
import { entriesOf, overallOf, certsOf } from "@/lib/boards";
import { sfx } from "@/lib/sfx";
import Avatar from "@/components/Avatar";
import { ICON_AVATARS, DEFAULT_ICON } from "@/lib/avatars";
import { useUITheme, getUITheme } from "@/lib/uiTheme";
import { cloud, getMeta, setMeta, strip, hashOf, hasProgress, summary, setCloudStatus, onCloudStatus } from "@/lib/cloud";

const AVATAR_PICKS = ["Qin", "Venti", "Zhongli", "Shougun", "Nahida", "Furina", "Ayaka", "Yae", "Hutao", "Ganyu", "Kazuha", "Klee", "Paimon", "Xiao", "Nilou", "Keqing", "Diluc", "Mona", "Raiden", "Neuvillette", "Arlecchino", "Mavuika", "Kokomi", "Yoimiya"];

export const avatarUrl = (icon) => `${ASSET}UI_AvatarIcon_${icon || "Qin"}.png`;

async function api(path, method, body) {
  try {
    const r = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, ...j };
  } catch {
    return { ok: false, status: 0, error: "Không kết nối được máy chủ, kiểm tra mạng rồi thử lại" };
  }
}
export const registerProfile = (name, avatar) => api("/api/profile", "POST", { name, avatar });
export const patchProfile = (p, upd) => api("/api/profile", "PATCH", { id: p.id, token: p.token, ...upd });

function AvatarPicker({ value, onChange }) {
  const ui = useUITheme();
  const list = useMemo(() => {
    const icons = new Set(CHARS.map((c) => c.icon));
    const picks = AVATAR_PICKS.filter((x) => icons.has(x));
    return CHARS.filter((c) => picks.includes(c.icon)).concat(CHARS.filter((c) => !picks.includes(c.icon) && c.rank === 5).slice(0, 24 - picks.length));
  }, []);
  return (
    <div className="avpick">
      {ICON_AVATARS.map((a, i) => (
        <button key={a.id} type="button" className={value === "i:" + a.id ? "on" : ""} style={{ "--i": i }} onClick={() => { onChange("i:" + a.id); sfx.click(); }} title={a.vi} aria-label={a.vi}>
          <Avatar avatar={"i:" + a.id} size={44} />
        </button>
      ))}
      {ui !== "plain" && list.map((c) => (
        <button key={c.id} type="button" className={value === c.icon ? "on" : ""} onClick={() => { onChange(c.icon); sfx.click(); }} title={c.vi}>
          <img src={charIcon(c)} alt={c.vi} loading="lazy" />
        </button>
      ))}
    </div>
  );
}

// Gắn thông tin hồ sơ mới vào state (đăng ký / đăng nhập thành công)
const profileOf = (r) => ({ id: r.id, token: r.token, name: r.name, avatar: r.avatar, ...(r.username ? { username: r.username } : {}) });

// Hộp đăng ký / đăng nhập (bắt buộc: mode "gate", không đóng được) và hộp sửa hồ sơ (mode "edit")
export function ProfileDialog({ mode = "gate", onClose }) {
  const { S, update } = useGame();
  const p0 = S?.profile;
  const edit = mode === "edit" && !!p0?.id;
  const legacy = !edit && !!p0?.id && !p0?.username; // hồ sơ nickname cũ chưa có tài khoản → gắn tài khoản, giữ nguyên điểm & thứ hạng
  const [tab, setTab] = useState("signup"); // "signup" | "login" (chế độ gate)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(S?.profile?.name || "");
  const [avatar, setAvatar] = useState(() => S?.profile?.avatar || (getUITheme() === "plain" ? DEFAULT_ICON : "Qin"));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [cs, setCs] = useState(null);
  useEffect(() => onCloudStatus(setCs), []);
  const fail = (r) => { setErr(r.error || "Có lỗi, thử lại sau"); sfx.wrong?.(); };
  const done = (r) => {
    update((s) => { s.profile = profileOf(r); s.profileSkip = false; s.syncSig = ""; });
    sfx.win(); onClose?.();
  };
  const checkName = (n) => (n.length < 2 || n.length > 20 ? "Tên cần 2–20 ký tự" : "");
  const checkAccount = () => {
    if (!/^[A-Za-z0-9_.]{3,20}$/.test(username.trim())) return "Tên đăng nhập cần 3–20 ký tự (chữ không dấu, số, _ hoặc .)";
    if (password.length < 6) return "Mật khẩu cần ít nhất 6 ký tự";
    return "";
  };

  // gắn tài khoản cho hồ sơ nickname cũ
  const link = async () => {
    const m = checkAccount();
    if (m) return setErr(m);
    setBusy(true);
    const r = await api("/api/auth/link", "POST", { id: p0.id, token: p0.token, username: username.trim(), password });
    setBusy(false);
    if (!r.ok) return fail(r);
    update((s) => { s.profile = { ...s.profile, username: r.username }; s.syncSig = ""; });
    sfx.win(); onClose?.();
  };

  const submit = async (e) => {
    e?.preventDefault();
    setErr("");
    if (edit) { // đổi tên / ảnh đại diện
      const n = name.trim(), m = checkName(n);
      if (m) return setErr(m);
      setBusy(true);
      const r = await patchProfile(p0, { name: n, avatar });
      setBusy(false);
      if (!r.ok) return fail(r);
      update((s) => { s.profile = { ...s.profile, name: r.name, avatar: r.avatar }; s.syncSig = ""; });
      sfx.win(); onClose?.(); return;
    }
    if (tab === "login") {
      if (!username.trim() || !password) return setErr("Nhập tên đăng nhập và mật khẩu");
      setBusy(true);
      const r = await api("/api/auth/login", "POST", { username: username.trim(), password });
      setBusy(false);
      return r.ok ? done(r) : fail(r);
    }
    if (legacy) return link();
    const m = checkAccount() || (name.trim() ? checkName(name.trim()) : "");
    if (m) return setErr(m);
    setBusy(true);
    const r = await api("/api/auth/signup", "POST", { username: username.trim(), password, name: name.trim(), avatar });
    setBusy(false);
    return r.ok ? done(r) : fail(r);
  };

  const logout = () => {
    update((s) => { s.profile = null; s.profileSkip = false; s.syncSig = ""; });
    sfx.click(); onClose?.();
  };
  const syncNow = () => window.dispatchEvent(new CustomEvent("cloud-sync-now"));

  const showAvatar = edit || (tab === "signup" && !legacy);
  const title = edit ? "Hồ Sơ Của Bạn" : tab === "login" ? "Đăng nhập" : legacy ? "Tạo tài khoản" : "Chào mừng, Nhà Lữ Hành!";
  const sub = edit ? "Đổi tên hoặc ảnh đại diện"
    : tab === "login" ? "Vào lại tài khoản để có tiến độ học ở mọi thiết bị"
    : legacy ? `Hồ sơ «${p0.name}» được giữ nguyên điểm và thứ hạng — từ giờ cần tài khoản để vào học`
    : "Tạo tài khoản để lưu tiến độ học và kỷ lục. Tiến độ đang có trên máy này sẽ tự động được lưu vào tài khoản mới";
  const cloudLabel = cs?.state === "saving" ? "Đang đồng bộ…" : cs?.state === "err" ? "Chưa đồng bộ được — sẽ thử lại" : cs?.at ? `Đã đồng bộ lúc ${new Date(cs.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : "Tiến độ tự động lưu lên tài khoản";

  return (
    <Portal>
      <div className="modal">
        <form className="parch dialog profdlg" onSubmit={submit}>
          {showAvatar
            ? <Avatar key={avatar} avatar={avatar} name={name || username} size={84} className="profav" />
            : legacy && tab === "signup"
              ? <Avatar avatar={p0.avatar} name={p0.name} size={84} className="profav" />
              : <div className="profav loginico" aria-hidden="true">🔑</div>}
          <h2>{title}</h2>
          <div className="jp">{sub}</div>
          {!edit && (
            <div className="proftabs" role="tablist">
              {[["signup", legacy ? "Tạo tài khoản" : "Đăng ký"], ["login", "Đăng nhập"]].map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => { setTab(k); setErr(""); sfx.click(); }}>{l}</button>
              ))}
            </div>
          )}
          <hr />
          {!edit && (
            <>
              <input className="nameinp acc" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} placeholder="Tên đăng nhập" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus />
              <input className="nameinp acc" type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} placeholder={tab === "signup" ? "Mật khẩu (ít nhất 6 ký tự)" : "Mật khẩu"} autoComplete={tab === "login" ? "current-password" : "new-password"} />
            </>
          )}
          {(edit || (tab === "signup" && !legacy)) && (
            <input className="nameinp acc" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={edit ? "Tên hoặc nickname…" : "Tên hiển thị trên bảng xếp hạng (không bắt buộc)"} autoFocus={edit} />
          )}
          {showAvatar && (<><div className="lab2">Chọn ảnh đại diện</div><AvatarPicker value={avatar} onChange={setAvatar} /></>)}
          {err && <div className="err" role="alert">{err}</div>}
          <div className="btnrow">
            {edit && <button type="button" className="gbtn x dark" onClick={onClose}><span className="c" />Hủy</button>}
            <button type="submit" className="gbtn tri" disabled={busy}><span className="c" />{busy ? "Đang xử lý…" : edit ? "Lưu" : tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}</button>
          </div>
          {!edit && <p className="hint reqnote">Cần đăng nhập để sử dụng trang.</p>}

          {edit && p0.username && (
            <div className="profacc">
              <hr />
              <div className="accrow"><span>Tài khoản</span><b>@{p0.username}</b></div>
              <div className="accrow"><span className="hint">{cloudLabel}</span></div>
              <div className="btnrow">
                <button type="button" className="gbtn sm x dark" onClick={syncNow}><span className="c" />Đồng bộ ngay</button>
                <button type="button" className="gbtn sm x dark" onClick={logout}><span className="c" />Đăng xuất</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Portal>
  );
}

// Hộp hỏi khi tiến độ trên máy và trên tài khoản khác nhau
function SyncChoice({ cloudSave, local, onCloud, onLocal, onLater }) {
  return (
    <Portal>
      <div className="modal">
        <div className="parch dialog syncdlg">
          <div className="profav loginico" aria-hidden="true">☁️</div>
          <h2>Chọn tiến độ muốn giữ</h2>
          <p className="hint">Tiến độ trên máy này khác với tiến độ đã lưu trong tài khoản.</p>
          <div className="syncopts">
            <button type="button" onClick={onCloud}>
              <b>☁️ Tiến độ trong tài khoản</b>
              <span>{summary(cloudSave.data)}</span>
              <small>Lưu lúc {new Date(cloudSave.updatedAt).toLocaleString("vi-VN")}</small>
            </button>
            <button type="button" onClick={onLocal}>
              <b>💻 Tiến độ trên máy này</b>
              <span>{summary(local)}</span>
              <small>Sẽ ghi đè lên tài khoản</small>
            </button>
          </div>
          <div className="btnrow"><button type="button" className="gbtn sm x dark" onClick={onLater}><span className="c" />Để sau</button></div>
        </div>
      </div>
    </Portal>
  );
}

// Tự đồng bộ tiến độ của tài khoản: mở trang → lấy bản mới hơn từ đám mây; có thay đổi → lưu lên sau vài giây.
// Tài khoản mới (chưa có gì trên đám mây) → tiến độ đang có trên máy được lưu lên ngay.
function CloudSync() {
  const { S, replaceAll, toast } = useGame();
  const p = S?.profile;
  const acc = !!(p?.id && p?.token && p?.username);
  const [choice, setChoice] = useState(null); // { cloudSave }
  const st = useRef({ ready: false, busy: false });
  const sRef = useRef(S); sRef.current = S;
  const pRef = useRef(p); pRef.current = p;
  const choiceOpen = !!choice;

  const markSynced = (profile, data, rev) => { setMeta(profile.id, { rev, hash: hashOf(data) }); setCloudStatus({ state: "ok", at: Date.now() }); };
  const applyCloud = (profile, save) => { replaceAll(save.data); markSynced(profile, save.data, save.rev); };

  // lưu bản trên máy lên đám mây (force = ghi đè bản đám mây)
  const push = async (force = false) => {
    const profile = pRef.current, cur = sRef.current;
    if (!profile?.username || !cur || st.current.busy) return;
    const data = strip(cur), h = hashOf(data), meta = getMeta(profile.id);
    if (!force && meta?.hash === h) return;
    st.current.busy = true; setCloudStatus({ state: "saving" });
    try {
      const r = await cloud(profile, "put", { data, baseRev: meta?.rev || 0, force });
      if (r.ok) {
        setMeta(profile.id, { rev: r.rev, hash: h }); setCloudStatus({ state: "ok", at: Date.now() });
        if (!meta && hasProgress(cur)) toast?.("Đã lưu tiến độ trên máy vào tài khoản");
      } else if (r.status === 409) { const g = await cloud(profile, "get"); if (g.ok && g.save) setChoice({ cloudSave: g.save }); }
      else setCloudStatus({ state: "err" });
    } catch { setCloudStatus({ state: "err" }); } finally { st.current.busy = false; }
  };

  // vào trang / vừa đăng nhập: so với bản đám mây
  useEffect(() => {
    st.current.ready = false;
    if (!acc) return;
    let alive = true;
    (async () => {
      try {
        const profile = pRef.current, meta = getMeta(profile.id);
        const h = await cloud(profile, "head");
        if (!alive) return;
        if (!h.ok) { setCloudStatus({ state: "err" }); return; }
        if (h.save && h.save.rev !== meta?.rev) {
          const cur = sRef.current;
          const unchangedHere = meta && meta.hash === hashOf(strip(cur));
          const g = await cloud(profile, "get");
          if (!alive || !g.ok || !g.save) return;
          if (unchangedHere || !hasProgress(cur)) { applyCloud(profile, g.save); toast?.("Đã tải tiến độ từ tài khoản"); }
          else { setChoice({ cloudSave: g.save }); return; } // chờ người dùng chọn rồi mới cho lưu tự động
        } else if (h.save) setCloudStatus({ state: "ok", at: Date.now() });
        st.current.ready = true;
        push();
      } catch { setCloudStatus({ state: "err" }); }
    })();
    return () => { alive = false; };
  }, [acc, p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // có thay đổi → lưu sau 4 giây
  useEffect(() => {
    if (!acc || !st.current.ready || choiceOpen) return;
    const t = setTimeout(() => push(), 4000);
    return () => clearTimeout(t);
  }, [S, acc, choiceOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const now = () => { if (st.current.ready) push(); };
    const vis = () => { if (document.visibilityState === "hidden") now(); };
    window.addEventListener("cloud-sync-now", now);
    document.addEventListener("visibilitychange", vis);
    return () => { window.removeEventListener("cloud-sync-now", now); document.removeEventListener("visibilitychange", vis); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!choice || !acc) return null;
  return (
    <SyncChoice cloudSave={choice.cloudSave} local={strip(S)}
      onCloud={() => { applyCloud(pRef.current, choice.cloudSave); st.current.ready = true; setChoice(null); toast?.("Đã dùng tiến độ trong tài khoản"); }}
      onLocal={async () => { setMeta(pRef.current.id, { rev: choice.cloudSave.rev, hash: "" }); st.current.ready = true; setChoice(null); await push(true); toast?.("Đã lưu tiến độ máy này lên tài khoản"); }}
      onLater={() => { setChoice(null); }} />
  );
}

// Bắt buộc đăng nhập: chưa có tài khoản (kể cả hồ sơ nickname cũ) thì không dùng được trang. Bản offline không có máy chủ nên bỏ qua.
// Đồng thời tự gửi kỷ lục lên bảng xếp hạng và đồng bộ tiến độ.
const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === "1";

export function ProfileGate() {
  const { S, update } = useGame();
  const busy = useRef(false);
  const need = !OFFLINE && !!S && !(S.profile?.id && S.profile?.token && S.profile?.username);

  // khóa phần còn lại của trang trong lúc chưa đăng nhập
  useEffect(() => {
    if (!need) return;
    const els = [document.querySelector("header.top"), document.querySelector("main.wrap")].filter(Boolean);
    els.forEach((e) => e.setAttribute("inert", ""));
    document.documentElement.dataset.gate = "1";
    return () => { els.forEach((e) => e.removeAttribute("inert")); delete document.documentElement.dataset.gate; };
  }, [need]);

  useEffect(() => {
    if (!S?.profile?.id || busy.current) return;
    const p = S.profile;
    const entries = entriesOf(S), overall = overallOf(S), certs = certsOf(S);
    const sig = JSON.stringify([entries, overall, p.id, certs]);
    if (sig === S.syncSig) return;
    const t = setTimeout(async () => {
      busy.current = true;
      try {
        const r = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, token: p.token, entries, overall, certs }) });
        if (r.ok) update((s) => { s.syncSig = JSON.stringify([entries, overall, p.id, certs]); });
      } catch {} finally { busy.current = false; }
    }, 1500);
    return () => clearTimeout(t);
  }, [S, update]);

  return (<>{need && <ProfileDialog key={S.profile?.id || "none"} mode="gate" />}<CloudSync /></>);
}
