"use client";
// 📚 Trang tra cứu thêm của một cuốn sách (kính ngữ, từ viết tắt, nhân vật…) và bảng tra cứu toàn bộ từ vựng
import { useMemo, useState } from "react";
import Link from "next/link";
import GenshinVocabTable from "@/components/GenshinVocab";
import Sentence, { ViewBar, say } from "@/components/library/Sentence";
import { useLibJson, meaning } from "@/components/library/LessonView";
import { bookById } from "@/lib/library";
import { sfx } from "@/lib/sfx";

export function Block({ b }) {
  if (b.t === "text") return (
    <section className="panel lbsec">
      {b.h && <h2>{b.h}</h2>}
      {b.p.map((x, i) => <p key={i}>{x}</p>)}
    </section>
  );
  if (b.t === "table") {
    const jp = new Set(b.jp || []);
    return (
      <section className="panel lbsec">
        {b.h && <h2>{b.h}</h2>}
        <div className="gvscroll">
          <table className="vnvocab lbtable">
            <thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => (
                <td key={j}>{jp.has(j) && c && c !== "—"
                  ? <button className="lbcell jpt" onClick={() => say(c.split(/[・／/、]/)[0])} title="Bấm để nghe">{c}</button>
                  : c}</td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    );
  }
  if (b.t === "sent") return (
    <section className="panel lbsec">
      {b.h && <h2>{b.h}</h2>}
      {b.items.map((s, i) => <Sentence key={i} s={s} no={i + 1} />)}
    </section>
  );
  if (b.t === "people") return (
    <section className="panel lbsec">
      {b.h && <h2>{b.h}</h2>}
      <div className="lbcast">
        {b.items.map((p, i) => (
          <div key={i} className="lbcastp">
            <b className="jpt">{p.name}</b> {p.ro && <i>{p.ro}</i>}
            {p.org && <small className="jpt">{p.org}</small>}
            <p>{p.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
  return null;
}

export default function ExtraView({ bookId, id }) {
  const B = bookById(bookId);
  const meta = B?.extras.find((x) => x.id === id);
  const X = useLibJson(`/library/${bookId}/${id === "tu-vung" ? "vocab" : id}.json`);
  if (!B || !meta) return <p style={{ marginTop: 40 }}>Không tìm thấy trang. <Link href="/thu-vien">Về Thư viện</Link></p>;
  return (
    <>
      <Link href={`/thu-vien/${bookId}`} className="back" onClick={() => sfx.page()}>‹ {B.title}</Link>
      <div className="pagehead" style={{ marginTop: 10 }}>
        <p style={{ letterSpacing: 2, margin: "0 0 6px" }} className="jpt">{meta.jp}</p>
        <h1>{meta.ico} {meta.vi}</h1>
        {!!X?.intro && <p>{X.intro}</p>}
        <div className="orn"><span /></div>
      </div>
      {id === "tu-vung" ? <VocabIndex B={B} list={X} /> : <>
        <div className="lbbar"><ViewBar /></div>
        {X === undefined && <p className="hint" style={{ textAlign: "center" }}>Đang tải…</p>}
        {X === null && <p className="panel lbsec" style={{ textAlign: "center" }}>Không tải được trang này. Hãy kiểm tra mạng rồi tải lại trang.</p>}
        {X?.blocks?.map((b, i) => <Block key={i} b={b} />)}
      </>}
    </>
  );
}

// bảng tra cứu mọi từ vựng của sách (public/library/<sách>/vocab.json), lọc theo bài
function VocabIndex({ B, list }) {
  const [ls, setLs] = useState(0);
  const rows = useMemo(() => (Array.isArray(list) ? list : [])
    .filter((v) => !ls || v.ls.includes(ls))
    .map((v) => ({ w: v.w, r: v.r || v.w, ro: v.ro, m: meaning(v), tags: v.ls.map((n) => ({ label: `Bài ${n}`, href: `/thu-vien/${B.id}/${n}#tu-vung` })) })), [list, ls, B.id]);
  if (list === undefined) return <p className="hint" style={{ textAlign: "center" }}>Đang tải bảng từ vựng…</p>;
  if (!Array.isArray(list)) return <p className="panel lbsec" style={{ textAlign: "center" }}>Không tải được bảng từ vựng. Hãy kiểm tra mạng rồi tải lại trang.</p>;
  return (
    <>
      <p className="hint" style={{ textAlign: "center" }}>{list.length.toLocaleString("vi-VN")} từ vựng của {B.lessons.length} bài, xếp theo thứ tự あいうえお. Gõ chữ Nhật, cách đọc, chữ Latinh hoặc nghĩa tiếng Việt để tìm.</p>
      <GenshinVocabTable rows={rows} tagHead="Có trong"
        extra={<select className="gvsel" value={ls} onChange={(e) => setLs(+e.target.value)}>
          <option value={0}>Tất cả các bài</option>
          {B.lessons.map((l) => <option key={l.n} value={l.n}>Bài {l.n} · {l.vi}</option>)}
        </select>} />
    </>
  );
}
