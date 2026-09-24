"use client";
import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGame } from "@/components/Game";
import ListenRun, { prepListen, dictationsFrom, TsaritsaHost } from "@/components/ListenRun";
import { TsaritsaPortrait } from "@/components/Listen";
import { listenBossOf, listenOf, TSARITSA, LISTEN_BOSSES } from "@/lib/listenBosses";
import { lessonOf, rewardFor } from "@/lib/bosses";
import { pickRand } from "@/lib/data";

export default function ListenBattle() {
  const { l } = useParams();
  const lesson = +l;
  const boss = listenBossOf(lesson), data = listenOf(lesson), L = lessonOf(lesson);
  const { S } = useGame();
  const intro = useMemo(() => pickRand(TSARITSA.intro), []);
  // Thứ tự như sách (theo số track), sau đó 2 câu nghe lại những gì đã học ở boss sách
  const makeQueue = useCallback(() => {
    const items = [...(data?.items || [])].sort((a, b) => a.file.localeCompare(b.file)).map((x) => ({ ...prepListen(x), kind: "listen" }));
    return [...items, ...dictationsFrom([L], 2)];
  }, [data, L]);
  const host = useCallback((i, last) => <TsaritsaHost line={i === 0 && last === null ? intro : last === null ? "Câu tiếp theo. Hãy tập trung." : pickRand(last ? TSARITSA.ok : TSARITSA.bad)} />, [intro]);

  if (!boss || !data || !L) return <p style={{ marginTop: 40 }}>Không tìm thấy bài nghe. <Link href="/nghe">Quay lại</Link></p>;
  if (!S) return null;
  if (lesson > 1 && !S.listen?.[lesson - 1]?.cleared) return <p style={{ marginTop: 40 }}>Bài nghe này chưa mở. Hãy vượt qua bài {lesson - 1} trước. <Link href="/nghe" style={{ color: "var(--gold2)" }}>Danh sách</Link></p>;

  return (
    <ListenRun
      boss={{ ...boss, sub: `だい ${lesson} か · ${L.title}` }}
      makeQueue={makeQueue}
      saveKey={lesson}
      reward={rewardFor}
      host={host}
      backHref="/nghe"
      backLabel="Danh sách bài nghe"
      nextHref={lesson < LISTEN_BOSSES.length ? `/nghe/${lesson + 1}` : "/nghe/final"}
      winLine={<><b>Băng Thần:</b> Đôi tai của ngươi đã tiến bộ. Ta chờ ngươi ở thử thách tiếp theo.</>}
      loseLine={<><b>Băng Thần:</b> Gió tuyết vẫn còn che lấp tai ngươi. Nghe lại và quay lại đây.</>}
      heroWin={<TsaritsaPortrait className="wide" />}
      heroLose={<TsaritsaPortrait className="wide" />}
    />
  );
}
