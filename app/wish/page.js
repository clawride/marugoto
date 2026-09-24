"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import WishFx from "@/components/WishFx";
import Portal from "@/components/Portal";
import ChronicleBanner from "@/components/ChronicleBanner";
import { Ico, itemIconUrl } from "@/components/Icons";
import { ELEM } from "@/lib/data";
import { charIcon, charSplash, weaponArt, weaponIcon } from "@/lib/genshin";
import { BANNER_INFO, POOL, currentBanners, phaseEnds, phaseIndex, rollOnce, extraReward, keyOf } from "@/lib/gacha";
import { sfx } from "@/lib/sfx";

const FATE_COST = 160;
const FATE_NAME = { i: "Mối Duyên Vương Vấn", a: "Mối Duyên Tương Ngộ" };

function useCountdown(to) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, to - now), d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return d > 0 ? `${d} ngày ${h} giờ` : `${h} giờ ${m} phút`;
}

export default function WishPage() {
  const { S, update, toast } = useGame();
  const [bid, setBid] = useState("char");
  const [fx, setFx] = useState(null);
  const [buy, setBuy] = useState(null);
  const [shop, setShop] = useState(false);
  const banners = useMemo(() => currentBanners(), []);
  const ends = useCountdown(phaseEnds());
  const B = BANNER_INFO[bid];

  // Xem thử hoạt cảnh: /wish?fx=5 (hoặc 4, 3) — không cộng vật phẩm
  useEffect(() => {
    const fxr = +new URLSearchParams(location.search).get("fx");
    if (![3, 4, 5].includes(fxr)) return;
    const x = fxr === 5 ? banners.char.featured5 : fxr === 4 ? banners.char.featured4[0] : POOL.std3w[0];
    setFx([{ rank: fxr, kind: fxr === 3 ? "w" : "c", x, flags: {}, isNew: true, count: 1, reward: { glitter: 0, dust: 0 }, pity: 1 }]);
  }, [banners]);

  // Định Quỹ Đạo reset khi sang giai đoạn banner mới (giống game)
  useEffect(() => {
    if (!S) return;
    const p = phaseIndex();
    if (S.banners.weapon.pathPhase !== undefined && S.banners.weapon.pathPhase !== p) update((s) => { s.banners.weapon.path = null; s.banners.weapon.fp = 0; s.banners.weapon.pathPhase = p; });
  }, [S, update]);

  if (!S) return null;
  const st = S.banners[bid];
  const fk = B.fate;

  const doWish = (n) => {
    if (S.fates[fk] < n) {
      const need = n - S.fates[fk];
      if (S.primo >= need * FATE_COST) { setBuy({ n, need }); sfx.open(); }
      else toast(`Không đủ ${FATE_NAME[fk]} và Nguyên Thạch (cần ${need * FATE_COST})`);
      return;
    }
    const results = update((s) => {
      s.fates[fk] -= n;
      const out = [];
      for (let k = 0; k < n; k++) {
        const r = rollOnce(bid, s.banners[bid], banners);
        const key = keyOf(r.kind, r.x);
        const before = s.inv[key] || 0;
        s.inv[key] = before + 1;
        const reward = extraReward(r.kind, r.rank, before);
        s.glitter += reward.glitter; s.dust += reward.dust; s.wishes += 1;
        s.history.unshift({ b: bid, k: key, r: r.rank, t: Date.now(), p: r.pity, f: Object.keys(r.flags).join(",") });
        out.push({ ...r, key, isNew: before === 0, count: before + 1, reward });
      }
      return out;
    });
    setFx(results);
  };

  const confirmBuy = () => {
    const { n, need } = buy;
    update((s) => { s.primo -= need * FATE_COST; s.fates[fk] += need; });
    sfx.primo(); setBuy(null);
    setTimeout(() => doWishAfterBuy(n), 50);
  };
  // gọi lại sau khi state đã cập nhật
  const doWishAfterBuy = (n) => document.getElementById(`wish${n}`)?.click();

  const setPath = (w) => update((s) => { const W = s.banners.weapon; if (W.path !== w.id) { W.path = w.id; W.fp = 0; W.pathPhase = phaseIndex(); } sfx.click(); });

  const F = banners.char.featured5;
  const el = ELEM[F.el];
  const stdHero = POOL.std5c[phaseIndex() % POOL.std5c.length];

  return (
    <>
      <div className="pagehead" style={{ marginBottom: 6 }}>
        <h1>Cầu Nguyện</h1>
        <p>Trả lời đúng để nhận Nguyên Thạch — 160 Nguyên Thạch = 1 Mối Duyên</p>
      </div>
      <div className="btabs">
        <button className={`btab ${bid === "char" ? "on" : ""}`} onClick={() => { setBid("char"); sfx.click(); }}><img src={charIcon(F)} alt="" /><span>Nhân Vật Sự Kiện</span></button>
        <button className={`btab ${bid === "weapon" ? "on" : ""}`} onClick={() => { setBid("weapon"); sfx.click(); }}><img src={weaponIcon(banners.weapon.featured5[0])} alt="" style={{ objectFit: "contain", background: "linear-gradient(160deg,#8f6232,#e0a93c)" }} /><span>Vũ Khí Sự Kiện</span></button>
        <button className={`btab ${bid === "chronicled" ? "on" : ""}`} onClick={() => { setBid("chronicled"); sfx.click(); }}><img src={charIcon(banners.chronicled.chars5[0])} alt="" /><span>Sử Ký</span></button>
        <button className={`btab ${bid === "standard" ? "on" : ""}`} onClick={() => { setBid("standard"); sfx.click(); }}><img src={charIcon(stdHero)} alt="" /><span>Thường Trú</span></button>
      </div>

      {bid === "char" && (
        <div className="bnr" key="char">
          <div className="bg" style={{ backgroundImage: `url('${charSplash(F)}')` }} />
          <div className="ct">
            <div className="tag">{B.name.toUpperCase()}</div>
            <h2>{F.vi}</h2>
            <span className="el" style={{ background: el.c }}>Hệ {el.vi}</span>
            <p>Tăng tỉ lệ nhận nhân vật 5★ <b>{F.vi}</b> và 4★ {banners.char.featured4.map((c) => c.vi).join(", ")}. 5★ cơ bản 0,6% · tổng hợp ~1,6% · bảo hiểm 90 lần. Thua 50/50 → lần 5★ sau chắc chắn ra nhân vật sự kiện; thua liên tiếp có thể kích hoạt <b>Ánh Sáng Bắt Giữ</b>.</p>
            <div className="feat">
              <img className="r5" src={charIcon(F)} alt={F.vi} title={F.vi} />
              {banners.char.featured4.map((c) => <img key={c.id} src={charIcon(c)} alt={c.vi} title={`${c.vi} (4★)`} />)}
            </div>
          </div>
          <div className="ends">Kết thúc sau {ends}</div>
        </div>
      )}
      {bid === "weapon" && (
        <div className="bnr" key="weapon">
          <div className="bg weap">{banners.weapon.featured5.map((w) => <img key={w.id} src={weaponArt(w)} alt="" />)}</div>
          <div className="ct">
            <div className="tag">{B.name.toUpperCase()}</div>
            <h2>{banners.weapon.featured5.map((w) => w.vi).join(" & ")}</h2>
            <p>Tăng tỉ lệ vũ khí 5★ (75% khi ra 5★) và 5 vũ khí 4★. 5★ cơ bản 0,7% · bảo hiểm 80 lần. Chọn <b>Định Quỹ Đạo</b> để chắc chắn nhận vũ khí mong muốn sau khi đủ 1 điểm Định Mệnh.</p>
            <div className="feat">
              {banners.weapon.featured5.map((w) => <img key={w.id} className="r5" src={weaponIcon(w)} alt={w.vi} title={w.vi} style={{ objectFit: "contain" }} />)}
              {banners.weapon.featured4.map((w) => <img key={w.id} src={weaponIcon(w)} alt={w.vi} title={`${w.vi} (4★)`} style={{ objectFit: "contain" }} />)}
            </div>
          </div>
          <div className="ends">Kết thúc sau {ends}</div>
        </div>
      )}
      {bid === "chronicled" && (
        <ChronicleBanner pool={banners.chronicled} path={S.banners.chronicled?.path} fp={S.banners.chronicled?.fp || 0}
          onPick={(k) => { update((s) => { const C = s.banners.chronicled; if (C.path !== k) { C.path = k; C.fp = 0; } }); sfx.click(); }} />
      )}
      {bid === "standard" && (
        <div className="bnr" key="standard">
          <div className="bg" style={{ backgroundImage: `url('${charSplash(stdHero)}')` }} />
          <div className="ct">
            <div className="tag">{B.name.toUpperCase()}</div>
            <h2>Bôn Ba Bất Tận</h2>
            <p>Banner thường trú dùng <b>Mối Duyên Tương Ngộ</b>. 5★ gồm {POOL.std5c.map((c) => c.vi).join(", ")} và 10 vũ khí 5★ thường trú. 5★ cơ bản 0,6% · bảo hiểm 90 lần.</p>
            <div className="feat">{POOL.std5c.map((c) => <img key={c.id} className="r5" src={charIcon(c)} alt={c.vi} title={c.vi} />)}</div>
          </div>
        </div>
      )}

      {bid === "weapon" && (
        <div className="panel path">
          <b style={{ color: "var(--gold2)" }}>Định Quỹ Đạo:</b>
          {banners.weapon.featured5.map((w) => <img key={w.id} className={S.banners.weapon.path === w.id ? "on" : ""} src={weaponIcon(w)} alt={w.vi} title={`Chọn ${w.vi}`} onClick={() => setPath(w)} />)}
          <span>{S.banners.weapon.path ? <>Điểm Định Mệnh: <b style={{ color: "var(--gold2)" }}>{S.banners.weapon.fp}/1</b></> : "Chưa chọn — bấm vào vũ khí để chọn"}</span>
        </div>
      )}

      <div className="wishbar">
        <div className="pity">
          Bảo hiểm 5★: <b>{st.p5}</b>/{B.hard5} · Bảo hiểm 4★: <b>{st.p4}</b>/{B.hard4}
          {bid === "chronicled" && <><br />5★ tiếp theo: <b>{!st.path ? "Ngẫu nhiên trong danh sách Sử Ký" : st.fp >= 1 ? "Chắc chắn ra vật phẩm chỉ định" : "50% ra vật phẩm chỉ định"}</b></>}
          {st.g5 !== undefined && <><br />5★ tiếp theo: <b>{st.g5 ? "Chắc chắn ra vật phẩm sự kiện" : bid === "weapon" ? "75/25" : "50/50"}</b></>}
          <br /><Ico id="fateI" /> {S.fates.i} · <Ico id="fateA" /> {S.fates.a} · <Ico id="glit" /> {S.glitter} Tinh Huy · <Ico id="dust" /> {S.dust} Tinh Trần
          <div className="links">
            <Link href="/wish/history" className="chip dk">📜 Lịch sử</Link>
            <button className="chip dk" onClick={() => { setShop(true); sfx.open(); }}>🛒 Cửa hàng</button>
            <Link href="/inventory" className="chip dk">🎒 Túi đồ</Link>
          </div>
        </div>
        <div className="wishbtns">
          <button id="wish1" className="wishbtn" onClick={() => doWish(1)}><b>Cầu Nguyện ×1</b><small><Ico id={fk === "i" ? "fateI" : "fateA"} /> × 1</small></button>
          <button id="wish10" className="wishbtn" onClick={() => doWish(10)}><b>Cầu Nguyện ×10</b><small><Ico id={fk === "i" ? "fateI" : "fateA"} /> × 10</small></button>
        </div>
      </div>

      {buy && (<Portal>
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setBuy(null)}>
          <div className="parch dialog">
            <h2>Không đủ {FATE_NAME[fk]}</h2>
            <hr />
            <p>Dùng <b>{buy.need * FATE_COST}</b> Nguyên Thạch để đổi <b>{buy.need}</b> {FATE_NAME[fk]}?<br />(Hiện có {S.primo.toLocaleString("vi-VN")} Nguyên Thạch)</p>
            <div className="btnrow">
              <button className="gbtn x dark" onClick={() => setBuy(null)}><span className="c" />Hủy</button>
              <button className="gbtn" onClick={confirmBuy}><span className="c" />Đổi & Cầu Nguyện</button>
            </div>
          </div>
        </div>
      </Portal>)}
      {shop && <Shop onClose={() => setShop(false)} />}
      {fx && <WishFx results={fx} onClose={() => setFx(null)} />}
    </>
  );
}

// Cửa Hàng — bố cục giống "Đổi Bụi Ánh Sáng" trong game
const SHOP_TABS = [
  { k: "glit", label: "Đổi Tinh Huy", cur: "glit", price: 5 },
  { k: "dust", label: "Đổi Tinh Trần", cur: "dust", price: 75, limit: 5 },
  { k: "pgm", label: "Mua bằng Nguyên Thạch", cur: "pgm", price: FATE_COST },
];
const balance = (S, cur) => (cur === "glit" ? S.glitter : cur === "dust" ? S.dust : S.primo);

function Shop({ onClose }) {
  const { S, update, toast } = useGame();
  const [tab, setTab] = useState("pgm");
  const [sel, setSel] = useState(null);
  const month = new Date().toISOString().slice(0, 7);
  const dustUsed = S.dustShop.m === month ? S.dustShop.n : 0;
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const refresh = useCountdown(monthEnd);
  const T = SHOP_TABS.find((t) => t.k === tab);
  const left = T.limit ? T.limit - dustUsed : Infinity;

  const buy = (f, qty) => {
    const cost = T.price * qty;
    if (balance(S, T.cur) < cost) return toast("Không đủ " + (T.cur === "glit" ? "Tinh Huy" : T.cur === "dust" ? "Tinh Trần" : "Nguyên Thạch"));
    update((s) => {
      if (T.cur === "glit") s.glitter -= cost; else if (T.cur === "dust") s.dust -= cost; else s.primo -= cost;
      s.fates[f] += qty;
      if (T.limit) { if (s.dustShop.m !== month) s.dustShop = { m: month, n: 0 }; s.dustShop.n += qty; }
    });
    sfx.primo(); setSel(null); toast(`Đã nhận ${qty} ${FATE_NAME[f]}`);
  };

  return (
    <Portal><div className="shop">
      <div className="shop-top">
        <h2>Cửa Hàng</h2>
        <span className="refresh">{T.limit ? `Làm mới sau: ${refresh}` : ""}</span>
        <span className="curr"><Ico id="glit" />{S.glitter}</span>
        <span className="curr"><Ico id="dust" />{S.dust}</span>
        <span className="curr"><Ico id="pgm" />{S.primo.toLocaleString("vi-VN")}</span>
        <button className="shop-x" onClick={onClose} aria-label="Đóng">✕</button>
      </div>
      <div className="shop-tabs">
        {SHOP_TABS.map((t) => <button key={t.k} className={tab === t.k ? "on" : ""} onClick={() => { setTab(t.k); sfx.click(); }}>{t.label}</button>)}
      </div>
      <div className="goods">
        {["i", "a"].map((f) => (
          <button key={f} className="good" onClick={() => { if (left <= 0) return toast("Đã hết lượt đổi tháng này"); setSel(f); sfx.open(); }}>
            <div className="art">
              <img src={itemIconUrl(f === "i" ? "fateI" : "fateA")} alt="" />
              {T.limit && <span className="left">{Math.max(left, 0)}/{T.limit}</span>}
              <div className="nm">{FATE_NAME[f]}</div>
            </div>
            <div className="price"><Ico id={T.cur} />{T.price}</div>
          </button>
        ))}
      </div>
      {sel && <BuyDialog f={sel} T={T} max={Math.min(left, Math.floor(balance(S, T.cur) / T.price), 99)} onBuy={buy} onClose={() => setSel(null)} />}
    </div></Portal>
  );
}

function BuyDialog({ f, T, max, onBuy, onClose }) {
  const [qty, setQty] = useState(1);
  const q = Math.max(1, Math.min(qty, Math.max(max, 1)));
  return (
    <Portal><div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="parch dialog">
        <h2>{FATE_NAME[f]}</h2>
        <img src={itemIconUrl(f === "i" ? "fateI" : "fateA")} alt="" className="buy-art" />
        <p>{f === "i" ? "Dùng cho Ước Nguyện Nhân Vật Sự Kiện và Vũ Khí Sự Kiện." : "Dùng cho Ước Nguyện Thường Trú."}</p>
        <div className="qty">
          <button className="chip" onClick={() => setQty(q - 1)} disabled={q <= 1}>−</button>
          <input type="range" min={1} max={Math.max(max, 1)} value={q} onChange={(e) => setQty(+e.target.value)} disabled={max <= 1} />
          <button className="chip" onClick={() => setQty(q + 1)} disabled={q >= max}>+</button>
        </div>
        <div className="qn">×{q}</div>
        <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>Tổng: <Ico id={T.cur} /> <b>{(T.price * q).toLocaleString("vi-VN")}</b></p>
        <div className="btnrow">
          <button className="gbtn x dark" onClick={onClose}><span className="c" />Hủy</button>
          <button className="gbtn" disabled={max < 1} onClick={() => onBuy(f, q)}><span className="c" />Đổi</button>
        </div>
      </div>
    </div></Portal>
  );
}
