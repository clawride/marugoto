import { ASSET } from "@/lib/genshin";
import { iconOf, colorsFor } from "@/lib/avatars";

// Avatar tròn: icon emoji trên nền màu, hoặc ảnh nhân vật Genshin (cũ).
// Giao diện trắng ẩn ảnh Genshin (plain.css) → hiện chữ cái đầu của tên trên nền màu thay vào đó (.avf).
export default function Avatar({ avatar, name, size = 40, className = "", lazy = false }) {
  const ic = iconOf(avatar);
  const [c1, c2] = ic ? ic.c : colorsFor(name || avatar);
  const style = { "--s": `${size}px`, "--c1": c1, "--c2": c2 };
  if (ic) return <span className={`av ${className}`} style={style} title={ic.vi} aria-hidden="true"><span className="avi">{ic.e}</span></span>;
  const initial = [...String(name || "?").trim()][0]?.toUpperCase() || "?";
  return (
    <span className={`av g ${className}`} style={style} aria-hidden="true">
      <img src={`${ASSET}UI_AvatarIcon_${avatar || "Qin"}.png`} alt="" loading={lazy ? "lazy" : undefined} />
      <span className="avf">{initial}</span>
    </span>
  );
}
