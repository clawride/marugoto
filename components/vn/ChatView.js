"use client";
// Trò chuyện với nhân vật: chọn chủ đề → nhân vật nói → chọn câu trả lời (câu mẫu dùng ngữ pháp Marugoto) → nhân vật đáp
// Nhân vật dùng mức ngôn ngữ theo chứng chỉ của người học.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHARS, charIcon } from "@/lib/genshin";
import { ownedOf, vnOf, CHAT_REWARD, TIERS } from "@/lib/vn";
import { useVN, useGrammar, Line, GrammarCard, VNSettings, VoiceNote, pick, say } from "@/components/vn/VNParts";
import { useStory, LockedNote } from "@/components/vn/StoryHub";
import { Ico } from "@/components/Icons";
import { stopVoice } from "@/lib/voicevox";
import { sfx } from "@/lib/sfx";

export default function ChatView({ id }) {
  const c = CHARS.find((x) => x.id === +id);
  const { S, update, set, tier } = useVN();
  const D = useStory(id);
  const G = useGrammar();
  const [topic, setTopic] = useState(null);
  const [log, setLog] = useState([]); // [{who: "char"|"me", t, g}]
  const [turn, setTurn] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [gram, setGram] = useState(null);
  const [done, setDone] = useState(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [log.length]);
  useEffect(() => () => stopVoice(), []);
  const sayMsg = (t, who = "char") => { const x = pick(t, tier); x && say(x.jp, { sp: who === "me" ? "trav" : "char", D, set }); };
  const speak = (t) => { if (set.tts) sayMsg(t); };

  if (!c) return <p style={{ marginTop: 40 }}>Không tìm thấy nhân vật.</p>;
  if (!S || D === undefined) return <p className="hint" style={{ marginTop: 40 }}>Đang tải…</p>;
  const owned = ownedOf(S, c);
  const P = vnOf(S, c.id);

  const start = (T) => { setTopic(T); setTurn(0); setDone(null); setLog([{ who: "char", t: T.turns[0].t, g: T.turns[0].g }]); setWaiting(false); speak(T.turns[0].t); sfx.open?.(); };
  const answer = (o) => {
    if (waiting) return;
    setWaiting(true); sfx.click();
    setLog((l) => [...l, { who: "me", t: o.t, g: o.g }]);
    setTimeout(() => {
      setLog((l) => [...l, { who: "char", t: o.r, g: o.rg }]); speak(o.r);
      const nt = turn + 1;
      setTimeout(() => {
        if (nt < topic.turns.length) { setTurn(nt); setLog((l) => [...l, { who: "char", t: topic.turns[nt].t, g: topic.turns[nt].g }]); setWaiting(false); speak(topic.turns[nt].t); }
        else {
          let reward = 0;
          update((s) => { s.vn = s.vn || {}; const v = (s.vn[id] ||= { done: {}, chat: {}, seen: {} }); if (!v.chat?.[topic.id]) { v.chat = { ...(v.chat || {}), [topic.id]: true }; reward = CHAT_REWARD; s.primo += reward; } });
          setDone({ reward }); setWaiting(false);
        }
      }, 900);
    }, 500);
  };

  return (
    <div className="vnchat">
      <Link href={`/characters/${c.id}/story`} className="back">‹ Truyện {c.vi}</Link>
      <div className="pagehead a22head"><div className="tag">TRÒ CHUYỆN · 会話</div><h1>💬 {c.vi}</h1><p>Mức ngôn ngữ: <b>{TIERS[tier].name} ({TIERS[tier].short})</b> — nhân vật nói vừa với trình độ chứng chỉ của bạn</p></div>
      <LockedNote c={c} owned={owned} />
      {!D && <p className="panel vnlock">Phần trò chuyện của {c.vi} đang được viết.</p>}
      {D && owned && (
        <>
          <VNSettings compact />
          {!topic && (
            <div className="vntopics">
              {D.chat.map((T) => <button key={T.id} className={`panel vntopic ${P.chat?.[T.id] ? "done" : ""}`} onClick={() => start(T)}><b>{T.title}</b><small>{T.turns.length} lượt{P.chat?.[T.id] ? " · ✓" : ""}</small></button>)}
            </div>
          )}
          {topic && (
            <div className="panel vnconv">
              <div className="vnconvh"><b>{topic.title}</b><button className="chip sm" onClick={() => { setTopic(null); stopVoice(); }}>‹ Chủ đề khác</button></div>
              <div className="vnmsgs">
                {log.map((m, i) => (
                  <div key={i} className={`vnmsg ${m.who}`}>
                    {m.who === "char" && <img src={charIcon(c)} alt="" />}
                    <div className="bub">
                      <Line t={m.t} g={m.g} tier={tier} set={set} onGrammar={setGram} />
                      <button className="vnspk sm" onClick={() => sayMsg(m.t, m.who)} aria-label="Nghe">🔊</button>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              {!done && !waiting && (
                <div className="vnopts">
                  <small>Chọn câu bạn muốn nói:</small>
                  {topic.turns[turn].opts.map((o, i) => { const x = pick(o.t, tier); return (
                    <button key={i} className="vnchoice" onClick={() => answer(o)}>
                      <span className="k">{i + 1}</span><span><span className="jpt">{x?.jp}</span>{set.ro && <small className="ro">{x?.ro}</small>}{set.vi && <small>{x?.vi}</small>}</span>
                    </button>
                  ); })}
                </div>
              )}
              {D && <VoiceNote D={D} set={set} />}
              {done && <div className="vnfin"><b>✦ Hết chủ đề “{topic.title}”</b>{done.reward > 0 && <span> · <Ico id="pgm" /> +{done.reward}</span>}<div className="btnrow"><button className="gbtn" onClick={() => start(topic)}><span className="c" />Trò chuyện lại</button><button className="gbtn x dark" onClick={() => setTopic(null)}><span className="c" />Chủ đề khác</button></div></div>}
            </div>
          )}
        </>
      )}
      {gram && <div className="vnoverlay" onClick={() => setGram(null)}><GrammarCard id={gram} G={G} onClose={() => setGram(null)} /></div>}
    </div>
  );
}
