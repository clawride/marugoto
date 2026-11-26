import readingsRo from "@/data/readings/kaigo-romaji-source.json";
import { readingBlocks } from "@/lib/kaigoText";
import KaigoText from "./KaigoText";
import Link from "next/link";
import readings from "@/data/readings/kaigo-jiko.json";
import notes from "@/data/readings/kaigo-jiko-notes.json";
import { bookById } from "@/lib/library";

const book = bookById("kaigo-jiko");
const illustratedPages = new Set([64, 67, 69, 70, 71, 72, 73, 81]);
export const readingIds = Object.keys(readings);
export const endMatter = { "loi-mo-dau": "Bìa, mục lục và lời mở đầu", "loi-ket": "Lời kết và thông tin tác giả" };

function TextBlocks({ text }) {
  return readingBlocks(text).map((block, i) => {
    if (block.type === "table") return <div key={i} className="gvscroll"><table className="vnvocab lbtable"><tbody>
      {block.rows.map((row, j) => <tr key={j}>{row.map((cell,k) => <td key={k}><KaigoText text={cell} readings={readingsRo} /></td>)}</tr>)}
    </tbody></table></div>;
    const Tag = block.type;
    return <Tag key={i}><KaigoText text={block.text} readings={readingsRo} /></Tag>;
  });
}

export function SourceReading({ id }) {
  const parts = Object.hasOwn(readings, id) ? readings[id] : null;
  if (!parts) return null;
  return <section id="noi-dung-sach" className="lbreading" aria-label="Nội dung sách theo trang">
    <header className="panel lbsec">
      <h2>Nội dung sách · Tài Kaigo</h2>
      <nav className="lbsourceactions" aria-label="Chọn trang trong phần này">
        {parts.map(({page, label}) => <a key={page} className="chip sm" href={`#trang-${page}`}>Tr. {page} · {label}</a>)}
        {!Object.hasOwn(endMatter, id) && <a className="chip sm" href="#luyen-tap">Đến phần luyện tiếng Nhật</a>}
      </nav>
    </header>
    {parts.map(({page, text}) => <article key={page} id={`trang-${page}`} className="panel lbsec lbsourcepage">
      <header><h3>Trang {page}</h3><a href={`${book.source.pdf}#page=${page}`}>Đối chiếu PDF</a></header>
      {notes.filter(note => note.pages.includes(page)).map(note => <aside className="lbsourcenote" key={note.title}>
        <strong>Chú thích đối chiếu · {note.title}</strong><p>{note.body}</p>
        {note.url && <a href={note.url}>{note.label}</a>}
      </aside>)}
      <div className="lbsourcebody"><TextBlocks text={text} /></div>
      {illustratedPages.has(page) && <details className="lbsourcescan">
        <summary>Xem hình và bố cục nguyên bản của trang {page}</summary>
        <img loading="lazy" src={`/books/kaigo-jiko/page-${page}.webp`} width="1309" height="1852" alt={`Trang ${page} trong bản in của Tài Kaigo`} />
      </details>}
    </article>)}
  </section>;
}

export function BookMatter({ id }) {
  return <>
    <Link href={`/thu-vien/${book.id}`} className="back">‹ {book.vi}</Link>
    <div className="pagehead"><h1>{endMatter[id]}</h1><p>{book.vi} · {book.authors}</p></div>
    {id === "loi-mo-dau" && <figure className="panel lbsec lbsourcecover">
      <a href={`${book.source.pdf}#page=1`}><img src={book.source.cover} alt="Phản xạ nhanh, xử lý chuẩn trong Kaigo. Tác giả Tài Kaigo." width="240" height="340" /></a>
      <figcaption>Trang 1 · <a href={book.source.pdf}>Mở sách nguyên bản ({book.source.pages} trang)</a></figcaption>
    </figure>}
    <SourceReading id={id} />
    <Link href={id === "loi-mo-dau" ? `/thu-vien/${book.id}/1` : `/thu-vien/${book.id}`} className="chip">{id === "loi-mo-dau" ? "Đọc chương 1" : "Về mục lục"}</Link>
  </>;
}
