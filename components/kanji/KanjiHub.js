"use client";
// Trang tổng Chữ Hán: chọn cấp độ → lộ trình bài (mỗi bài ~10 chữ) · kiểm tra cấp · tra chữ · mẹo đọc
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGame } from "@/components/Game";
import { KazuhaHero } from "@/components/Kazuha";
import { kanjiHref } from "@/components/kanji/KanjiCard";
import { KLEVELS, KIDX, K_TOTAL, SCORED, lessonKey, stripTone } from "@/lib/kanjiProg";
import { sfx } from "@/lib/sfx";

export default function KanjiHub() {
  const { S, update } = useGame();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const lv = sp.get("lv") || S?.kjLv || "a1";
  const L = KLEVELS.find((x) => x.id === lv) || KLEVELS[0];
  const found = useMemo(() => {
    const t = stripTone(q.trim());
    if (!t) return [];
    return Object.entries(KIDX).filter(([k, [vi]]) => k === q.trim() || stripTone(vi).includes(t)).slice(0, 40);
  }, [q]);
  if (!S) return null;
  const P = S.kanji?.p || {}, W = S.kanji?.w || {};
  const starsOf = (n) => SCORED.reduce((a, k) => a + (P[`${lessonKey(L.id, n)}:${k}`]?.stars || 0), 0);
  const lvStars = (X) => X.lessons.reduce((a, les) => a + SCORED.reduce((b, k) => b + (P[`${lessonKey(X.id, les.n)}:${k}`]?.stars || 0), 0), 0);
  const pick = (id) => { update((s) => { s.kjLv = id; }); sfx.click(); history.replaceState(null, "", `/kanji?lv=${id}`); };
  const test = P[`${L.id}:test`];
  return (
    <div className="th-kanji">
      <KazuhaHero />
      <p className="hint" style={{ textAlign: "center" }}>
        {K_TOTAL.toLocaleString("vi-VN")} chữ Hán gom từ toàn bộ từ vựng Marugoto A1 → B1-2, xếp theo cấp mà chữ <b>xuất hiện lần đầu</b>.
        Mỗi bài có 6 phần: <b>học chữ</b> (giải thích cấu tạo, mẹo nhớ), <b>tập viết</b> có sửa nét, <b>ghi nhớ</b>, <b>tập đọc</b>, <b>đặt câu</b> và <b>đoán chữ</b>.
      </p>
      <div className="kjtools">
        <Link href="/kanji/meo" className="panel kjtool" onClick={() => sfx.page()}>
          <b>🔮 Mẹo đoán chữ Hán</b>
          <span>Bộ chỉ nghĩa, phần chỉ âm (cùng phần thì đọc giống nhau), âm On hay Kun: nhớ một phần vẫn đoán được cả chữ</span>
        </Link>
        <div className="panel kjtool kjsearch">
          <b>🔎 Tra chữ</b>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nhập chữ Hán hoặc nghĩa tiếng Việt (vd: mặt trời, nuoc)…" />
          {found.length > 0 && <div className="kjfound">{found.map(([k, [vi]]) => <Link key={k} href={kanjiHref(k)} className="chip sm"><b className="jpt">{k}</b> {vi}</Link>)}</div>}
          {q.trim() && !found.length && <small>Không tìm thấy chữ nào.</small>}
        </div>
      </div>

      <div className="chips nbbooks">
        {KLEVELS.map((X) => <button key={X.id} className={`chip dk ${X.id === L.id ? "on" : ""}`} onClick={() => pick(X.id)}>{X.ico} {X.name} <small>{X.count} chữ · ★{lvStars(X)}</small></button>)}
      </div>

      <section className="b1group">
        <h2 className="a22th"><span>{L.ico} {L.name}</span> <b>{L.full}</b> <small>{L.count} chữ mới · {L.lessons.length} bài</small></h2>
        <div className="b1topics">
          {L.lessons.map((les) => {
            const st = starsOf(les.n), max = SCORED.length * 3;
            const written = [...les.k].filter((k) => W[k] >= 60).length;
            return (
              <Link key={les.n} href={`/kanji/${L.id}/${les.n}`} className="panel b1card a22card" onClick={() => sfx.page()}>
                <div className="num">Bài {les.n} · Topic {les.t.join(", ")}</div>
                <h3 className="jpt kjprev">{les.k}</h3>
                <div className="vi">{[...les.k].slice(0, 3).map((k) => KIDX[k][0].split(/[,;]/)[0]).join(" · ")}{les.k.length > 3 ? " …" : ""}</div>
                <div className="a22meter"><i style={{ width: `${(st / max) * 100}%` }} /></div>
                <div className="b1gp">★ {st}/{max} · ✍️ {written}/{les.k.length}</div>
              </Link>
            );
          })}
        </div>
        <Link href={`/kanji/${L.id}/test`} className={`panel b1exam a22exam ${test?.stars ? "passed" : ""}`}>
          <div className="seal">試</div>
          <div><div className="tag">KIỂM TRA CẤP ĐỘ</div><h3>Kiểm tra chữ Hán {L.name}</h3><p>Khoảng 30 câu trộn đủ dạng trên {L.count} chữ của cấp{test ? ` · kết quả tốt nhất ${test.pct}%` : ""}</p></div>
        </Link>
      </section>
      <p className="hint" style={{ textAlign: "center" }}>
        Âm đọc, số nét: KANJIDIC2 (EDRDG, CC BY-SA 4.0). Nét chữ và cấu tạo: KanjiVG (kanjivg.tagaini.net) © Ulrich Apel, CC BY-SA 3.0.
      </p>
    </div>
  );
}
