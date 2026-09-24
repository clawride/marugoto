"use client";
import { useCallback } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import ListenRun, { prepListen, dictationsFrom } from "@/components/ListenRun";
import { RonovaEmblem } from "@/components/Listen";
import { LISTEN_FINAL, LISTEN_LESSONS, LISTEN_BOSSES, RONOVA, RONOVA_LINES } from "@/lib/listenBosses";
import { LESSON_LIST } from "@/lib/bosses";
import { shuffle } from "@/lib/data";

// 3 giai đoạn: Ký Ức (10 câu hội thoại ôn tập) · Phán Quyết (8 câu từ bài nghe 18 bài) · Tử Vong (6 câu nghe câu đã học)
const P1 = 10, P2 = 8, P3 = 6;

function RonovaHost({ i, last }) {
  const ph = i < P1 ? 0 : i < P1 + P2 ? 1 : 2;
  const first = i === 0 || i === P1 || i === P1 + P2;
  const line = i === 0 && last === null ? RONOVA_LINES.intro
    : first && last === null ? RONOVA_LINES.phaseLines[ph]
    : last === true ? "…Ngươi vẫn còn đứng vững. Được." : last === false ? "Một sai lầm. Cái chết ghi nhớ mọi sai lầm." : RONOVA_LINES.phaseLines[ph];
  return (
    <div className="hosthead ronova">
      <div className="rv-mini"><RonovaEmblem /></div>
      <div className="bubble"><b>Ronova</b>{line}</div>
    </div>
  );
}

export default function FinalBattle() {
  const { S } = useGame();
  const makeQueue = useCallback(() => {
    const p1 = shuffle(LISTEN_FINAL).slice(0, P1).map((x) => ({ ...prepListen(x), kind: "listen" }));
    const p2 = shuffle(LISTEN_LESSONS.flatMap((L) => L.items)).slice(0, P2).map((x) => ({ ...prepListen(x), kind: "listen" }));
    const p3 = dictationsFrom(LESSON_LIST, P3);
    return [...p1, ...p2, ...p3];
  }, []);
  const host = useCallback((i, last) => <RonovaHost i={i} last={last} />, []);
  const phaseOf = useCallback((i) => RONOVA_LINES.phases[i < P1 ? 0 : i < P1 + P2 ? 1 : 2], []);

  if (!S) return null;
  const nDone = LISTEN_BOSSES.filter((b) => S.listen?.[b.lesson]?.cleared).length;
  if (nDone < LISTEN_BOSSES.length) return <p style={{ marginTop: 40 }}>Ronova chỉ xuất hiện khi bạn vượt qua cả 18 boss nghe ({nDone}/18). <Link href="/nghe" style={{ color: "var(--gold2)" }}>Danh sách</Link></p>;

  return (
    <ListenRun
      boss={{ ...RONOVA, emblem: <RonovaEmblem /> }}
      makeQueue={makeQueue}
      saveKey="final"
      reward={(stars) => 160 + stars * 160}
      host={host}
      phaseOf={phaseOf}
      backHref="/nghe"
      backLabel="Danh sách bài nghe"
      winLine={<><b>Ronova:</b> …Kiến thức của ngươi đã vượt qua cái chết. Hãy mang nó theo, Nhà Lữ Hành.</>}
      loseLine={<><b>Ronova:</b> Chưa phải lúc. Khi ngươi quay lại, ta vẫn sẽ ở đây.</>}
      heroWin={<div className="rv-hero"><RonovaEmblem /></div>}
      heroLose={<div className="rv-hero"><RonovaEmblem /></div>}
    />
  );
}
