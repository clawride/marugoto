"use client";
// Bảng "Từ vựng thêm có trong Genshin Impact": từ | cách đọc · Latinh | nghĩa | nơi gặp — có ô tìm kiếm, hiện dần từng trang
import { useMemo, useState } from "react";
import Link from "next/link";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
const PAGE = 150;

function speak(r) {
  try { const u = new SpeechSynthesisUtterance(r); u.lang = "ja-JP"; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
}

// rows: [{ w, r, m, ro, tags: [{ label, href }] }]
export default function GenshinVocabTable({ rows, tagHead = "Gặp ở", extra }) {
  const [q, setQ] = useState("");
  const [n, setN] = useState(PAGE);
  const list = useMemo(() => {
    const k = norm(q.trim());
    if (!k) return rows;
    return rows.filter((x) => x.w.includes(q.trim()) || x.r.includes(q.trim()) || norm(x.ro).replace(/\s/g, "").includes(k.replace(/\s/g, "")) || norm(x.m).includes(k));
  }, [rows, q]);
  return (
    <div className="gvwrap">
      <div className="gvbar">
        <input className="gvsearch" value={q} onChange={(e) => { setQ(e.target.value); setN(PAGE); }} placeholder="🔎 Tìm theo chữ Nhật, cách đọc, Latinh hoặc nghĩa tiếng Việt…" />
        {extra}
        <small>{list.length.toLocaleString("vi-VN")} từ</small>
      </div>
      <div className="gvscroll">
        <table className="vnvocab">
          <thead><tr><th>Từ</th><th>Cách đọc · Latinh</th><th>Nghĩa</th>{tagHead && <th>{tagHead}</th>}</tr></thead>
          <tbody>
            {list.slice(0, n).map((x, i) => (
              <tr key={`${x.w}-${x.r}-${i}`}>
                <td><span className="vw jpt">{x.w}</span></td>
                <td><button className="gvspk" onClick={() => speak(x.r)} aria-label="Nghe">🔊</button> <span className="jpt">{x.r}</span><span className="vro">{x.ro}</span></td>
                <td>{x.m}</td>
                {tagHead && <td className="gvtags">{x.tags.slice(0, 3).map((t, j) => (t.href ? <Link key={j} href={t.href}>{t.label}</Link> : <span key={j}>{t.label}</span>))}{x.tags.length > 3 && <span className="more">+{x.tags.length - 3}</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length && <p className="hint" style={{ textAlign: "center" }}>Không tìm thấy từ nào.</p>}
      {n < list.length && <div style={{ textAlign: "center", marginTop: 10 }}><button className="chip dk" onClick={() => setN(n + PAGE * 2)}>Hiện thêm ({(list.length - n).toLocaleString("vi-VN")} từ nữa)</button></div>}
    </div>
  );
}
