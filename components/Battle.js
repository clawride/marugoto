"use client";
// Thành phần chiến đấu dùng chung cho boss sách, boss nghe và boss cuối
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ELEM, shuffle } from "@/lib/data";
import { CHARS, charIcon, elemIcon } from "@/lib/genshin";
import { sfx } from "@/lib/sfx";

export function useBattle(boss, total, { exclude = [] } = {}) {
  const party = useMemo(() => shuffle(CHARS.filter((c) => !exclude.includes(c.en))).slice(0, 4), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [hp, setHp] = useState(boss.hp);
  const [fx, setFx] = useState(null);
  const [attacker, setAttacker] = useState(-1);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const fxId = useRef(0);
  const dmgBase = boss.hp / Math.max(1, Math.ceil(total * 0.6));

  const score = useCallback((ok) => {
    setAnswered((a) => a + 1);
    if (ok) {
      setCorrect((c) => c + 1);
      const crit = Math.random() < 0.25;
      const dmg = Math.round(dmgBase * (0.85 + Math.random() * 0.3) * (crit ? 1.5 : 1));
      const who = (Math.random() * 4) | 0;
      setAttacker(who); setTimeout(() => setAttacker(-1), 500);
      setHp((h) => Math.max(0, h - dmg));
      setFx({ id: ++fxId.current, dmg, crit, el: party[who].el });
      sfx.hit(crit); sfx.correct();
    } else {
      setFx({ id: ++fxId.current, miss: true });
      sfx.miss(); sfx.wrong();
    }
  }, [dmgBase, party]);

  const reset = useCallback(() => { setHp(boss.hp); setCorrect(0); setAnswered(0); setFx(null); }, [boss]);
  return { party, hp, setHp, fx, attacker, correct, answered, score, reset };
}

// boss: { name, el, hp, img?, emblem?, lv, sub? }
export function Arena({ boss, hp, fx, attacker, party, phase }) {
  const el = ELEM[boss.el];
  const pct = (hp / boss.hp) * 100;
  return (
    <div className={`arena ${boss.theme || ""}`} style={{ "--ec": el.c }}>
      <div className="bossbar">
        <div className="bname">{!boss.noEl && <img src={elemIcon(boss.el)} alt="" />} {boss.name} <small>Lv.{boss.lv}</small></div>
        {boss.sub && <div className="bsub">{boss.sub}{phase ? ` · ${phase}` : ""}</div>}
        <div className="hpbar"><i style={{ width: `${pct}%` }} /><em style={{ width: `${pct}%` }} /></div>
        <div className="hpnum">{hp.toLocaleString("vi-VN")} / {boss.hp.toLocaleString("vi-VN")}</div>
      </div>
      <div className={`bossfig ${fx && !fx.miss ? "hit" : ""} ${hp === 0 ? "dead" : ""}`} key={fx?.id}>
        <div className="aura" />
        {boss.emblem ? <div className="emblemwrap">{boss.emblem}</div> : <img src={boss.img} alt={boss.name} />}
        {fx && (fx.miss
          ? <span className="dmg miss">Né!</span>
          : <span className={`dmg ${fx.crit ? "crit" : ""}`} style={{ color: ELEM[fx.el].c }}>{fx.crit && <small>BẠO KÍCH</small>}{fx.dmg.toLocaleString("vi-VN")}</span>)}
      </div>
      <div className="party">
        {party.map((c, i) => (
          <div key={c.id} className={`pm ${attacker === i ? "atk" : ""}`} style={{ "--pc": ELEM[c.el].c }} title={c.vi}>
            <img src={charIcon(c)} alt={c.vi} /><span>{c.vi.split(" ").slice(-1)[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NextBtn({ onNext, label = "Tiếp tục" }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Enter") { e.preventDefault(); onNext(); } };
    addEventListener("keydown", h); return () => removeEventListener("keydown", h);
  }, [onNext]);
  return <div className="qnext"><button className="gbtn tri" onClick={onNext}><span className="c" />{label}</button></div>;
}

export const BLANK_RE = /（\s*）|\(\s*\)|（　）/;
export function Blank({ text, fill, state }) {
  const parts = text.split(BLANK_RE);
  return <span className="bsent">{parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <span className={`blank ${state || ""}`}>{fill || "　　"}</span>}</span>)}</span>;
}

export function MCQ({ q, onScore, onNext, top }) {
  const [pick, setPick] = useState(null);
  const choose = (o) => { if (pick !== null) return; setPick(o); onScore(o === q.answer); };
  return (
    <div className="parch bq">
      {top}
      <div className="lab">{q.sub}</div>
      {q.prompt && <div className={`bprompt ${q.jpPrompt ? "jp" : ""}`}>{q.prompt}</div>}
      <div className="opts">
        {q.opts.map((o, i) => (
          <button key={o} className={`opt ${pick === null ? "" : o === q.answer ? "ok" : o === pick ? "bad" : "dim"} ${q.jpOpts ? "jpopt" : ""}`} disabled={pick !== null} onClick={() => choose(o)}>
            <span className="k"><span>{i + 1}</span></span><span>{o}</span>
          </button>
        ))}
      </div>
      {pick !== null && <>{q.explain && <div className="bexp">{pick === q.answer ? "✦ Chính xác! " : "✕ "}{q.explain}</div>}{q.after}<NextBtn onNext={onNext} /></>}
    </div>
  );
}

export function FillQ({ q, onScore, onNext, top }) {
  const [pick, setPick] = useState(null);
  const choose = (o) => { if (pick !== null) return; setPick(o); onScore(o === q.answer); };
  const ok = pick === q.answer;
  return (
    <div className="parch bq">
      {top}
      <div className="lab">{q.sub || "Điền vào chỗ trống"}</div>
      <div className="bprompt jp"><Blank text={q.q} fill={pick !== null ? q.answer : null} state={pick === null ? "" : ok ? "ok" : "bad"} /></div>
      {q.vi && <div className="bvi">{q.vi}</div>}
      <div className="chipsopt">
        {q.opts.map((o) => <button key={o} className={`chipo ${pick === null ? "" : o === q.answer ? "ok" : o === pick ? "bad" : "dim"}`} disabled={pick !== null} onClick={() => choose(o)}>{o}</button>)}
      </div>
      {pick !== null && <><div className="bexp">{ok ? "✦ Chính xác! " : `✕ Đáp án: ${q.answer}. `}{q.explain}</div>{q.after}<NextBtn onNext={onNext} /></>}
    </div>
  );
}

export function starsOf(pct) { return pct >= 95 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0; }
