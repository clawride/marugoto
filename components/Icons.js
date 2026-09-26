// Biểu tượng vẽ lại (không dùng tài nguyên gốc của game)
import { ASSET } from "@/lib/genshin";
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="pgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".45" stopColor="#c9ecff" /><stop offset="1" stopColor="#6e9cff" /></linearGradient>
        <linearGradient id="pgB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff6d8" /><stop offset="1" stopColor="#d9a64a" /></linearGradient>
        <radialGradient id="fI" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#ffe3f1" /><stop offset=".55" stopColor="#f08cc0" /><stop offset="1" stopColor="#8c3a6c" /></radialGradient>
        <radialGradient id="fA" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#e3f3ff" /><stop offset=".55" stopColor="#7ab8f0" /><stop offset="1" stopColor="#2c5d8c" /></radialGradient>
      </defs>
      <symbol id="pgm" viewBox="0 0 24 24">
        <path d="M12 .8 14.6 9.4 23.2 12 14.6 14.6 12 23.2 9.4 14.6.8 12 9.4 9.4Z" fill="url(#pgB)" stroke="#7a5a26" strokeWidth=".7" strokeLinejoin="round" />
        <path d="M12 2.8 14 10 21.2 12 14 14 12 21.2 10 14 2.8 12 10 10Z" fill="url(#pgA)" />
        <path d="M12 2.8 14 10 12 12ZM21.2 12 14 14 12 12ZM2.8 12 10 10 12 12Z" fill="#fff" opacity=".75" />
      </symbol>
      <symbol id="fateI" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" fill="url(#fI)" stroke="#fff" strokeOpacity=".5" />
        <path d="M4 10.5c4 3 12 3 16 0M5 15c4-2 10-2 14 0" stroke="#fff" strokeWidth="1.1" fill="none" opacity=".8" />
      </symbol>
      <symbol id="fateA" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" fill="url(#fA)" stroke="#fff" strokeOpacity=".5" />
        <path d="M4 10.5c4 3 12 3 16 0M5 15c4-2 10-2 14 0" stroke="#fff" strokeWidth="1.1" fill="none" opacity=".8" />
      </symbol>
      <symbol id="glit" viewBox="0 0 24 24"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z" fill="#f7c948" stroke="#8a5a10" strokeWidth=".6" /></symbol>
      <symbol id="dust" viewBox="0 0 24 24"><path d="M12 3 13.5 10.5 21 12 13.5 13.5 12 21 10.5 13.5 3 12 10.5 10.5Z" fill="#b4d6ff" stroke="#3d6a9e" strokeWidth=".6" /></symbol>
      <symbol id="emb" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#d3bc8e" strokeWidth="1.2" />
        <circle cx="20" cy="20" r="14" fill="none" stroke="#d3bc8e" strokeWidth=".6" strokeDasharray="2 2" />
        <path d="M20 4 23 17 36 20 23 23 20 36 17 23 4 20 17 17Z" fill="#f3d38a" />
        <circle cx="20" cy="20" r="3.2" fill="#131a36" stroke="#f3d38a" />
      </symbol>
    </svg>
  );
}

// Biểu tượng vật phẩm gốc trong game (qua gi.yatta.moe)
export const ITEM_ICON = {
  pgm: { id: 201, name: "Nguyên Thạch" },
  glit: { id: 221, name: "Tinh Huy" },
  dust: { id: 222, name: "Tinh Trần" },
  fateI: { id: 223, name: "Mối Duyên Vương Vấn" },
  fateA: { id: 224, name: "Mối Duyên Tương Ngộ" },
};
export const itemIconUrl = (id) => `${ASSET}UI_ItemIcon_${ITEM_ICON[id].id}.png`;

export const Ico = ({ id, className = "ic" }) =>
  ITEM_ICON[id]
    ? <img className={className} src={itemIconUrl(id)} alt={ITEM_ICON[id].name} title={ITEM_ICON[id].name} draggable={false} />
    : <svg className={className}><use href={`#${id}`} /></svg>;
