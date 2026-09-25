"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { ELEM } from "@/lib/data";
import { CHARS, WTYPE_VI, charIcon, elemIcon, keyOf } from "@/lib/genshin";
import { consActive, stellaLeft } from "@/lib/gacha";
import { sfx } from "@/lib/sfx";

const EL_ORDER = ["pyro", "hydro", "anemo", "electro", "dendro", "cryo", "geo"];

export default function CharactersPage() {
  const { S } = useGame();
  const [el, setEl] = useState("");
  const [wt, setWt] = useState(-1);
  const [rank, setRank] = useState(0);
  const [own, setOwn] = useState("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    if (!S) return [];
    return CHARS
      .map((c) => { const key = keyOf("c", c); return { c, key, owned: (S.inv[key] || 0) > 0, act: consActive(S, key), left: stellaLeft(S, key) }; })
      .filter((x) => (!el || x.c.el === el) && (wt < 0 || x.c.wt === wt) && (!rank || x.c.rank === rank) && (own === "all" || (own === "own" ? x.owned : !x.owned)))
      .filter((x) => !q || x.c.vi.toLowerCase().includes(q.toLowerCase()) || x.c.en.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.owned - a.owned || b.c.rank - a.c.rank || b.c.release - a.c.release);
  }, [S, el, wt, rank, own, q]);
  if (!S) return null;
  const ownedN = CHARS.filter((c) => (S.inv[keyOf("c", c)] || 0) > 0).length;
  const pending = CHARS.reduce((a, c) => a + stellaLeft(S, keyOf("c", c)), 0);

  return (
    <>
      <div className="pagehead">
        <h1>Nhân Vật</h1>
        <p>Đã sở hữu {ownedN}/{CHARS.length} nhân vật{pending ? ` · ${pending} Chòm Sao Mệnh Định chưa kích hoạt` : ""}</p>
        <div className="orn"><span /></div>
      </div>
      <div className="panel cfilter">
        <div className="frow">
          <button className={`elbtn ${!el ? "on" : ""}`} onClick={() => setEl("")}>Tất cả</button>
          {EL_ORDER.map((k) => <button key={k} className={`elbtn ${el === k ? "on" : ""}`} onClick={() => { setEl(el === k ? "" : k); sfx.click(); }} title={ELEM[k].vi}><img src={elemIcon(k)} alt={ELEM[k].vi} /></button>)}
        </div>
        <div className="frow">
          <select value={wt} onChange={(e) => setWt(+e.target.value)}><option value={-1}>Mọi vũ khí</option>{WTYPE_VI.map((w, i) => <option key={i} value={i}>{w}</option>)}</select>
          <select value={rank} onChange={(e) => setRank(+e.target.value)}><option value={0}>Mọi độ hiếm</option><option value={5}>5★</option><option value={4}>4★</option></select>
          <select value={own} onChange={(e) => setOwn(e.target.value)}><option value="all">Tất cả</option><option value="own">Đã có</option><option value="not">Chưa có</option></select>
          <input className="cq" placeholder="Tìm tên…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="cgrid">
        {list.map(({ c, owned, act, left }) => (
          <Link key={c.id} href={`/characters/${c.id}`} className={`ccard r${c.rank} ${owned ? "" : "lock"}`} onClick={() => sfx.page()}>
            <div className="cimg"><img src={charIcon(c)} alt={c.vi} loading="lazy" /></div>
            <img className="cel" src={elemIcon(c.el)} alt="" />
            {owned && <span className="ccons">C{act}</span>}
            {left > 0 && <span className="cnew" title="Có Chòm Sao Mệnh Định chưa kích hoạt">+{left}</span>}
            {c.rank === 5 && <span className={`cvn ${owned ? "" : "off"}`} title={owned ? "Có truyện nhân vật" : "Truyện nhân vật — cần sở hữu"}>📖</span>}
            <div className="cname">{c.vi}</div>
          </Link>
        ))}
      </div>
      {!list.length && <div className="panel" style={{ padding: 18, textAlign: "center", color: "#c9cbd6" }}>Không có nhân vật phù hợp.</div>}
    </>
  );
}
