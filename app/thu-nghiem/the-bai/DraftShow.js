"use client";
// Ván đầu với một boss: màn xáo bài → lộ ra 5 lá máy rút cho bạn (theo cấp bài của boss) → chọn Đấu hoặc Không đấu.
import { useEffect, useState } from "react";
import { rankIdx } from "@/lib/shikiCards";
import { ELEM } from "@/lib/data";
import { sfx } from "@/lib/sfx";
import { Card } from "./Card";

export default function DraftShow({ op, ids, bossRanks, byId, busy, onPlay, onCancel }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    sfx.whoosh(); sfx.shuffle();
    const a = setTimeout(() => sfx.shuffle(), 700), b = setTimeout(() => { setShown(true); sfx.boom(); for (let i = 0; i < 5; i++) sfx.deal(i); }, 2050);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const mine = ids.map((id) => byId[id]).filter(Boolean).sort((x, y) => rankIdx(y.rank) - rankIdx(x.rank));
  const boss = [...bossRanks].sort((x, y) => rankIdx(y) - rankIdx(x));
  const weaker = mine.filter((c, i) => boss[i] && rankIdx(c.rank) < rankIdx(boss[i])).length;
  return (
    <div className={`ttshow ttdraft ${shown ? "pick" : ""}`} role="dialog" aria-label={`Ván đầu với ${op.char.vi}`}>
      <div className="circle" /><div className="flash" />
      {!shown && <div className="deck">{Array.from({ length: 18 }, (_, j) => <Card key={j} back className={j % 2 ? "r" : "l"} style={{ "--i": j, "--a": j * 20 + "deg", "--sx": ((j * 73) % 200) - 100, "--sy": ((j * 41) % 120) - 60 }} />)}</div>}
      {shown && <div className="picked">{mine.map((c, k) => <div key={c.id} className="pk" style={{ "--k": k, "--o": k - 2, "--ec": ELEM[c.el]?.c }}><Card c={c} owner="me" named /></div>)}</div>}
      <b className="title" lang="ja">{shown ? "運命の五枚" : "シャッフル"}</b>
      {shown && (
        <div className="ttdraftbar">
          <p>Ván đầu với <b>{op.char.vi}</b>: máy đã xáo Hộp bài và rút cho bạn 5 lá theo cấp bài của boss.</p>
          <div className="ttdraftcmp">
            <span>Bạn:</span>{mine.map((c) => <span key={c.id} className={`ttrk r-${c.rank}`}>{c.rank}</span>)}
            <span style={{ marginLeft: 10 }}>Boss:</span>{boss.map((r, i) => <span key={i} className={`ttrk r-${r}`}>{r}</span>)}
          </div>
          {weaker > 0 && <p className="warn">⚠ {weaker} lá của bạn thấp cấp hơn bài boss — bạn có thể không đấu và quay lại sau.</p>}
          <div className="btns">
            <button className="sm-play" disabled={busy} onClick={onPlay}>⚔️ ĐẤU VỚI BỘ NÀY</button>
            <button className="chip dk" disabled={busy} onClick={onCancel}>🏳️ Không đấu (bài chưa đủ mạnh)</button>
          </div>
          <small>Bộ bài này được giữ nguyên cho tới khi bạn vào trận. Từ ván thứ 2 với boss này bạn được tự chọn bài.</small>
        </div>
      )}
    </div>
  );
}
