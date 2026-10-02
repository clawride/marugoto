"use client";
// 📝 Danh sách đề thi: tất cả (/de-thi) hoặc một loại (/de-thi/jlpt, /de-thi/kyu)
// Bố cục gọn: hàng nút chọn cấp → lưới thẻ đề nhỏ của cấp đó → lối tắt Ôn thi đúng cấp.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { EXAM_KINDS, EXAM_INDEX, kindById } from "@/lib/exams";
import { sfx } from "@/lib/sfx";
import { REVIEW_INDEX } from "@/components/exam/ReviewList";

const LEVELS = { jlpt: ["N5", "N4", "N3", "N2", "N1"], kyu: ["4級", "3級", "2級", "1級"] };
const EQ = { "4級": "N5", "3級": "N4", "2級": "N2", "1級": "N1" }; // ôn thi tương đương cho đề cũ
const LV_KEY = "exam_level";
const getLv = () => { try { return localStorage.getItem(LV_KEY) || ""; } catch { return ""; } };
const setLvStore = (v) => { try { localStorage.setItem(LV_KEY, v); } catch {} };

function runBusy(id) {
  try { const r = JSON.parse(localStorage.getItem(`exam_run_${id}`) || "null"); return !!r && r.phase !== "done"; } catch { return false; }
}

function ExamCard({ x, S }) {
  const me = S?.exam?.[x.id];
  const busy = runBusy(x.id);
  const name = x.mini ? "Đề mẫu" : `Đề ${String(x.order || 1).padStart(2, "0")}`;
  const muc = (x.note || "").replace(/^Mức\s*/i, "").split(/\s*[·(]/)[0];
  const tag = x.mini ? "Rút gọn" : x.era === "2010" ? "Khuôn 2010–2020" : x.kind === "kyu" ? "Khuôn 2003–2009" : "Hiện hành";
  const state = busy ? ["run", "▶ Đang làm dở"] : me ? [me.passed ? "pass" : "done", `${me.passed ? "Đỗ · " : ""}Cao nhất ${me.best}`] : ["new", "Chưa làm"];
  return (
    <Link href={`/de-thi/bai/${x.id}`} className="panel excard2" title={x.title} onClick={() => sfx.page()}>
      <div className="ectop">
        <span className="eclv">{x.level}</span>
        <b>{name}</b>
        {muc && <span className="ecmuc">{muc}</span>}
      </div>
      <div className="ecmeta">{x.n} câu · {x.minutes ? `${x.minutes} phút` : "không giới hạn giờ"}</div>
      <div className="ecfoot"><span className="ectag">{tag}</span><span className={`ecst ${state[0]}`}>{state[1]}</span></div>
    </Link>
  );
}

// tên ngắn cho nút Ôn thi
export const reviewShort = (r) => (/ngu-phap$/.test(r.id) ? "Ngữ pháp" : /chu-han/.test(r.id) ? "Chữ Hán & từ vựng" : /meo-lam-bai$/.test(r.id) ? "Mẹo làm bài" : /cau-truc/.test(r.id) ? "Cấu trúc & cách tính điểm" : r.vi.replace(/^N\d\s*[–-]\s*/, ""));

function ReviewLinks({ lv, reviews }) {
  if (!reviews) return null;
  const want = EQ[lv] || lv;
  const mine = reviews.filter((r) => r.level === want);
  const general = reviews.filter((r) => !r.level);
  if (!mine.length && !general.length) return null;
  return (
    <div className="exrevbar">
      <span className="exrevh">📘 Ôn thi {want}{EQ[lv] ? ` (tương đương ${lv})` : ""}</span>
      {mine.map((r) => <Link key={r.id} href={`/de-thi/on-thi/${r.id}`} className="exrevchip" title={r.vi} onClick={() => sfx.page()}>{r.ico} {reviewShort(r)}</Link>)}
      {general.map((r) => <Link key={r.id} href={`/de-thi/on-thi/${r.id}`} className="exrevchip sub" title={r.vi} onClick={() => sfx.page()}>{r.ico} {reviewShort(r)}</Link>)}
    </div>
  );
}

export default function ExamList({ kind }) {
  const { S } = useGame();
  const [list, setList] = useState(undefined);
  const [reviews, setReviews] = useState(null);
  const [lv, setLv] = useState("");
  useEffect(() => {
    fetch(EXAM_INDEX).then((r) => (r.ok ? r.json() : [])).catch(() => null).then(setList);
    fetch(REVIEW_INDEX).then((r) => (r.ok ? r.json() : [])).catch(() => []).then(setReviews);
  }, []);
  const K = kind && kindById(kind);
  const kinds = kind ? [K] : EXAM_KINDS;
  // các cấp có đề, theo thứ tự dễ → khó
  const tabs = useMemo(() => {
    if (!Array.isArray(list)) return [];
    return kinds.flatMap((k) => (LEVELS[k.id] || []).filter((l) => list.some((x) => x.kind === k.id && x.level === l))
      .map((l) => ({ kind: k.id, lv: l, n: list.filter((x) => x.kind === k.id && x.level === l).length })));
  }, [list, kind]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!tabs.length) return;
    const q = new URLSearchParams(location.search).get("cap");
    const want = [q, getLv()].find((v) => v && tabs.some((t) => t.lv === v));
    setLv(want || tabs[0].lv);
  }, [tabs]);
  const pick = (v) => { setLv(v); setLvStore(v); sfx.click?.(); };
  const cur = tabs.find((t) => t.lv === lv);
  const shown = Array.isArray(list) && cur ? list.filter((x) => x.kind === cur.kind && x.level === lv).sort((a, b) => (a.mini - b.mini) || (a.order - b.order)) : [];

  return (
    <>
      <Link href={kind ? "/de-thi" : "/"} className="back" onClick={() => sfx.page()}>‹ {kind ? "Luyện đề thi" : "Trang chủ"}</Link>
      <div className="pagehead exlisthd" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 3, margin: "0 0 6px" }} className="jpt">{K ? K.jp : "模擬試験 · LUYỆN ĐỀ THI"}</p>
        <h1>{K ? `${K.ico} ${K.name}` : "📝 Luyện Đề Thi"}</h1>
        <p>Chọn cấp độ rồi chọn đề. Làm câu nào biết đúng sai ngay, hết bài chấm theo thang JLPT và CEFR.</p>
      </div>

      {list === undefined && <p className="hint" style={{ textAlign: "center" }}>Đang tải danh sách đề…</p>}
      {list === null && <p className="panel lbsec" style={{ textAlign: "center" }}>Không tải được danh sách đề. Hãy kiểm tra mạng rồi tải lại trang.</p>}

      {tabs.length > 0 && (
        <nav className="exlvtabs" aria-label="Chọn cấp độ">
          {kinds.map((k) => {
            const ts = tabs.filter((t) => t.kind === k.id);
            if (!ts.length) return null;
            return (
              <div key={k.id} className="exlvgrp">
                {!kind && <span className="exlvlab">{k.id === "jlpt" ? "JLPT" : "Đề cũ"}</span>}
                {ts.map((t) => (
                  <button key={t.lv} type="button" className={t.lv === lv ? "on" : ""} aria-pressed={t.lv === lv} onClick={() => pick(t.lv)}>
                    {t.lv}<small>{t.n}</small>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      )}

      {cur && (
        <section className="exlvsec">
          <div className="exgrid">{shown.map((x) => <ExamCard key={x.id} x={x} S={S} />)}</div>
          <ReviewLinks lv={lv} reviews={reviews} />
        </section>
      )}
      {Array.isArray(list) && !tabs.length && <p className="panel lbsec exempty">Chưa có đề nào.</p>}

      {!kind && (
        <p className="exmore">
          <Link href="/de-thi/on-thi" onClick={() => sfx.page()}>📘 Tất cả bài Ôn thi ›</Link>
        </p>
      )}
    </>
  );
}
