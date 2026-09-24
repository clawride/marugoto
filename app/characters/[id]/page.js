"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { CHARS, WTYPE_VI, charSplash, charIcon, elemIcon, keyOf } from "@/lib/genshin";
import { consActive, consPotential, stellaLeft } from "@/lib/gacha";
import { consOf, talentIcon, parseDesc } from "@/lib/constellations";
import { sfx } from "@/lib/sfx";

// Vị trí 6 nút chòm sao — sinh ổn định theo id nhân vật (mỗi người một hình chòm sao)
function layout(id) {
  let s = id % 2147483647;
  const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  const pts = [];
  for (let i = 0; i < 6; i++) pts.push({ x: 70 + rnd() * 220, y: 60 + i * 82 + (rnd() - 0.5) * 30 });
  const deco = Array.from({ length: 26 }, () => ({ x: rnd() * 360, y: rnd() * 540, r: 0.6 + rnd() * 1.6 }));
  return { pts, deco };
}

function Desc({ text }) {
  return <p className="cdesc">{parseDesc(text).map((p, i) => p.c ? <span key={i} style={{ color: p.c }}>{p.t}</span> : <span key={i}>{p.t}</span>)}</p>;
}

export default function CharacterPage() {
  const { id } = useParams();
  const c = CHARS.find((x) => x.id === +id);
  const cons = c ? consOf(c.id) : null;
  const { S, update, toast } = useGame();
  const [sel, setSel] = useState(null);
  const [burst, setBurst] = useState(-1);
  const L = useMemo(() => (c ? layout(c.id) : null), [c]);
  if (!c || !cons) return <p style={{ marginTop: 40 }}>Không tìm thấy nhân vật. <Link href="/characters">Danh sách nhân vật</Link></p>;
  if (!S) return null;
  const key = keyOf("c", c);
  const owned = (S.inv[key] || 0) > 0;
  const act = consActive(S, key), pot = consPotential(S, key), left = stellaLeft(S, key);
  const el = ELEM[c.el];
  const cur = sel ?? Math.min(act, 5);
  const node = cons.list[cur];

  const activate = (i) => {
    if (i !== act || left <= 0) return;
    update((s) => { s.cons = s.cons || {}; s.cons[key] = act + 1; });
    setBurst(i); setTimeout(() => setBurst(-1), 1200);
    sfx.reveal(c.rank); setTimeout(() => sfx.star(i), 300);
    toast(`Đã kích hoạt Cung Mệnh Lv.${i + 1}: ${cons.list[i].name}`);
  };

  const status = (i) => i < act ? "on" : i === act && left > 0 ? "ready" : "off";

  return (
    <>
      <Link href="/characters" className="back">‹ Danh sách nhân vật</Link>
      <div className="cstage" style={{ "--ec": el.c }}>
        <img className="csplash" src={charSplash(c)} alt="" onError={(e) => { e.currentTarget.src = charIcon(c); }} />
        <div className="cshade" />
        <div className="chead">
          <div className="ctitle"><img src={elemIcon(c.el)} alt={el.vi} /><div><h1>{c.vi}</h1><span>{cons.title}</span></div></div>
          <div className="cmeta">
            <span className="stars">{"★".repeat(c.rank)}</span>
            <span>Hệ {el.vi}</span><span>{WTYPE_VI[c.wt]}</span>{cons.native && <span>{cons.native}</span>}
          </div>
          <div className="cconsname">Chòm sao · <b>{cons.cname}</b></div>
          <div className="cstella">
            {owned ? <>Cung mệnh <b>C{act}</b> · Chòm Sao Mệnh Định chưa dùng: <b>{left}</b>{pot >= 6 && act >= 6 ? " · Đã mở tối đa" : ""}</> : <>Chưa sở hữu nhân vật này — <Link href="/wish">Cầu Nguyện</Link></>}
          </div>
        </div>

        <svg className="cchart" viewBox="0 0 360 540" aria-label={`Chòm sao ${cons.cname}`}>
          {L.deco.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} className="dstar" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />)}
          {L.pts.slice(1).map((p, i) => <line key={i} x1={L.pts[i].x} y1={L.pts[i].y} x2={p.x} y2={p.y} className={`cline ${i + 1 < act ? "on" : ""}`} />)}
          {L.pts.map((p, i) => (
            <g key={i} className={`cnode ${status(i)} ${cur === i ? "sel" : ""} ${burst === i ? "burst" : ""}`} transform={`translate(${p.x} ${p.y})`} onClick={() => { setSel(i); sfx.click(); }}>
              <circle r="34" className="halo" />
              <circle r="27" className="ring" />
              <clipPath id={`cp${i}`}><circle r="22" /></clipPath>
              <image href={talentIcon(cons.list[i].icon)} x="-22" y="-22" width="44" height="44" clipPath={`url(#cp${i})`} />
              {status(i) === "off" && <text className="lock" y="6" textAnchor="middle">🔒</text>}
              <text className="lv" y="50" textAnchor="middle">{i + 1}</text>
            </g>
          ))}
        </svg>

        <div className="cinfo">
          <div className="clv">Cung Mệnh Lv.{cur + 1}</div>
          <h2>{node.name}</h2>
          <Desc text={node.desc} />
          <div className="cact">
            {cur < act && <span className="done">✦ Đã kích hoạt</span>}
            {cur === act && left > 0 && <><button className="gbtn tri" onClick={() => activate(cur)}><span className="c" />Kích hoạt</button><small className="cost">Dùng 1 Chòm Sao Mệnh Định (còn {left})</small></>}
            {cur === act && left <= 0 && <span className="need">{owned ? "Cần thêm Chòm Sao Mệnh Định — cầu nguyện ra bản trùng của nhân vật này" : "Cần sở hữu nhân vật"}</span>}
            {cur > act && <span className="need">Cần kích hoạt Cung Mệnh Lv.{act + 1} trước</span>}
          </div>
        </div>
      </div>
    </>
  );
}
