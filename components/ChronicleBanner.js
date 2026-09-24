"use client";
import { ELEM } from "@/lib/data";
import { charSplash, charIcon, weaponIcon, elemIcon } from "@/lib/genshin";

// Banner Ước Nguyện Sử Ký — thẻ treo nhân vật (bố cục theo ảnh Chronicled Wish)
export default function ChronicleBanner({ pool, path, fp, onPick }) {
  const pathItem = path
    ? [...pool.chars5.map((x) => ({ k: `c:${x.id}`, x })), ...pool.weapons5.map((x) => ({ k: `w:${x.id}`, x }))].find((p) => p.k === path)
    : null;
  return (
    <div className="chron" key="chron">
      <i className="petal p1" /><i className="petal p2" /><i className="petal p3" /><i className="petal p4" />
      <div className="chron-title"><span>✿</span><h2>Ước Nguyện Sử Ký</h2><span>✿</span></div>
      <div className="tags">
        {pool.chars5.map((c, i) => {
          const k = `c:${c.id}`, el = ELEM[c.el];
          return (
            <button key={c.id} className={`tag ${path === k ? "on" : ""}`} style={{ "--ec": el.c, animationDelay: `${i * 0.06}s` }} onClick={() => onPick(k)} title={`Chọn ${c.vi} làm nhân vật chỉ định`}>
              <span className="hook" />
              <div className="card">
                <div className="pic"><img src={charSplash(c)} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = charIcon(c); }} /></div>
                <div className="foot">
                  <img className="elic" src={elemIcon(c.el)} alt={el.vi} />
                  <b>{c.vi}</b>
                  <i>★★★★★</i>
                </div>
              </div>
              <span className="knot" /><span className="tassel" />
              {path === k && <span className="chosen">Chỉ định</span>}
            </button>
          );
        })}
      </div>
      <p className="chron-sub">Có thể chọn bất kỳ nhân vật nào ở trên làm nhân vật 5★ chỉ định</p>
      <div className="chron-weap">
        <span>Hoặc chọn vũ khí 5★:</span>
        {pool.weapons5.map((w) => {
          const k = `w:${w.id}`;
          return <img key={w.id} className={path === k ? "on" : ""} src={weaponIcon(w)} alt={w.vi} title={`Chọn ${w.vi}`} onClick={() => onPick(k)} />;
        })}
      </div>
      <div className="chron-path">
        {pathItem ? <>Sử Ký chỉ định: <b>{pathItem.x.vi}</b> · Điểm Định Mệnh <b>{fp}/1</b></> : "Chưa chọn vật phẩm chỉ định — bấm vào một thẻ để chọn"}
      </div>
    </div>
  );
}
