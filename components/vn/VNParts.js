"use client";
// Thành phần dùng chung của truyện nhân vật: dòng thoại (Nhật · romaji · dịch), ngữ pháp kèm chỗ tham khảo trong Marugoto, cài đặt
import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/components/Game";
import { TIERS, tierFromCerts, certsText, vnSettings, activeTier, loadGrammar, grammarHref } from "@/lib/vn";
import { playVoice, stopVoice, onVoiceStatus, checkLocal, localUrl, setLocalUrl, apiKey, setApiKey, castOf, voiceCredit, groupLabel } from "@/lib/voicevox";
import { sfx } from "@/lib/sfx";

const BOOK_LABEL = { a1: "A1", a21: "A2-1", a22: "A2-2", ab1: "A2/B1", b1: "B1-1", b12: "B1-2" };

export function useVN() {
  const { S, update } = useGame();
  const set = vnSettings(S);
  const tier = activeTier(S);
  const change = (patch) => update((s) => { s.vnSet = { ...vnSettings(s), ...patch }; });
  return { S, update, set, tier, maxTier: tierFromCerts(S), change };
}

export function useGrammar() {
  const [G, setG] = useState(null);
  useEffect(() => { let on = true; loadGrammar().then((g) => on && setG(g)); return () => { on = false; }; }, []);
  return G;
}

export const pick = (t, tier) => t?.[tier] || t?.[String(tier)] || t?.["1"] || t?.[1] || null;
// Đọc một câu bằng giọng lồng tiếng của người nói (sp: "char" | "trav" | "paimon" | "narr" | tên NPC · mood: cảm xúc)
export const say = (jp, { sp = "char", mood, D, set } = {}) => playVoice({ text: jp, sp, mood }, { D, set });

export function useVoiceStatus() {
  const [st, setSt] = useState({ busy: 0, err: "" });
  useEffect(() => onVoiceStatus(setSt), []);
  return st;
}

// Dòng ghi công giọng đọc (bắt buộc theo điều khoản VOICEVOX) + trạng thái đang tạo giọng / lỗi
export function VoiceNote({ D, set, sps = ["char", "trav"] }) {
  const st = useVoiceStatus();
  if (set.voice === "web") return null;
  const credits = [...new Set(sps.map((sp) => voiceCredit(castOf(sp, D, set.trav))))];
  return (
    <p className="hint vnvoice">
      {st.busy > 0 && <span className="vnbusy">⏳ Đang tạo giọng… </span>}
      {st.err && <span className="vnerr">{st.err} </span>}
      Lồng tiếng: {credits.join(", ")}{set.voice === "online" ? " · qua api.tts.quest" : ""}
    </p>
  );
}

// Danh sách lồng tiếng của một truyện: người nói → giọng VOICEVOX (bấm ▶ để nghe thử)
export function CastList({ D, set, cast }) {
  const names = { char: D?.name, trav: "旅人 (Lữ Khách)", paimon: "パイモン", narr: "Dẫn truyện" };
  return (
    <ul className="vncast">
      {Object.entries(cast).filter(([sp]) => sp !== "me").map(([sp, c]) => (
        <li key={sp}>
          <button className="vnspk sm" onClick={() => say(SAMPLE[c.grp] || SAMPLE.yf, { sp, D, set })} aria-label="Nghe thử">▶</button>
          <b className="jpt">{names[sp] || sp}</b>
          <span>{groupLabel(c)}</span>
          <small>{voiceCredit(c)}</small>
        </li>
      ))}
    </ul>
  );
}
const SAMPLE = { narr: "これは、ある旅の物語です。", cf: "ねえねえ、一緒にあそぼうよ！", cm: "ぼく、もっと強くなりたいんだ！", robot: "ご用件をお伺いします。", beast: "我の眠りを妨げるのは誰だ。", yf: "はじめまして。よろしくお願いします。" };

// Một dòng thoại theo mức đang chọn; bật/tắt romaji và dịch theo cài đặt
export function Line({ t, g, tier, set, onGrammar, big = false }) {
  const x = pick(t, tier);
  if (!x) return null;
  const gs = (g?.[tier] || g?.[String(tier)] || []);
  return (
    <div className={`vnline ${big ? "big" : ""}`}>
      <div className="jp jpt">{x.jp}</div>
      {set.ro && <div className="ro">{x.ro}</div>}
      {set.vi && <div className="vi">{x.vi}</div>}
      {gs.length > 0 && onGrammar && (
        <div className="vngchips">{gs.map((id) => <button key={id} className="chip sm" onClick={(e) => { e.stopPropagation(); onGrammar(id); sfx.click(); }}>📘 {BOOK_LABEL[id.split("-")[0]] || id}</button>)}</div>
      )}
    </div>
  );
}

// Bảng giải thích một điểm ngữ pháp + chỗ học trong Marugoto
export function GrammarCard({ id, G, onClose }) {
  const g = G?.[id];
  if (!id) return null;
  return (
    <div className="vngpop" role="dialog" aria-label="Ngữ pháp" onClick={(e) => e.stopPropagation()}>
      <button className="vnx" onClick={onClose} aria-label="Đóng">✕</button>
      {!g ? <p>Đang tải…</p> : (
        <>
          <div className="vngpt jpt">{g[4]}</div>
          <div className="vngvi">{g[5]}</div>
          <p>{g[6]}</p>
          <Link href={grammarHref(g)} className="vngref" onClick={() => stopVoice()}>📚 Học kỹ trong <b>{g[2]}</b>{g[3] ? ` — ${g[3]}` : ""} · phần Ngữ pháp ›</Link>
        </>
      )}
    </div>
  );
}

// Danh sách ngữ pháp của cả một đoạn (dùng cho Script)
export function GrammarList({ ids, G }) {
  if (!ids.length) return null;
  return (
    <ul className="vnglist">
      {ids.map((id) => { const g = G?.[id]; return g ? <li key={id}><b className="jpt">{g[4]}</b> — {g[5]} <Link href={grammarHref(g)}>{g[2]}</Link></li> : null; })}
    </ul>
  );
}

// Cài đặt: phiên âm, phụ đề, giọng đọc, mức ngôn ngữ (không vượt quá chứng chỉ)
export function VNSettings({ compact = false }) {
  const { S, set, tier, maxTier, change } = useVN();
  return (
    <div className={`panel vnset ${compact ? "compact" : ""}`}>
      <label className="vntog"><input type="checkbox" checked={set.ro} onChange={(e) => change({ ro: e.target.checked })} /> Phiên âm latinh</label>
      <label className="vntog"><input type="checkbox" checked={set.vi} onChange={(e) => change({ vi: e.target.checked })} /> Phụ đề tiếng Việt</label>
      <label className="vntog"><input type="checkbox" checked={set.tts} onChange={(e) => change({ tts: e.target.checked })} /> Tự đọc lồng tiếng</label>
      <div className="vntier">
        <span>🎙 Lồng tiếng:</span>
        {[["online", "VOICEVOX online"], ["local", "VOICEVOX trên máy"], ["web", "Giọng trình duyệt"]].map(([k, l]) => (
          <button key={k} className={`chip sm ${set.voice === k ? "on" : ""}`} onClick={() => { stopVoice(); change({ voice: k }); }}>{l}</button>
        ))}
      </div>
      <div className="vntier">
        <span>Lữ Khách:</span>
        {[["m", "Nam (空)"], ["f", "Nữ (蛍)"]].map(([k, l]) => <button key={k} className={`chip sm ${set.trav === k ? "on" : ""}`} onClick={() => change({ trav: k })}>{l}</button>)}
        <span style={{ marginLeft: 6 }}>Tốc độ:</span>
        {[[0.85, "Chậm"], [1, "Vừa"], [1.15, "Nhanh"]].map(([k, l]) => <button key={k} className={`chip sm ${+set.vspeed === k ? "on" : ""}`} onClick={() => change({ vspeed: k })}>{l}</button>)}
      </div>
      {set.voice !== "web" && <VoiceSetup engine={set.voice} />}
      <div className="vntier">
        <span>Mức ngôn ngữ:</span>
        {[1, 2, 3].map((t) => (
          <button key={t} className={`chip sm ${tier === t ? "on" : ""}`} disabled={t > maxTier} title={t > maxTier ? `Cần ${TIERS[t].need}` : ""} onClick={() => change({ tier: t === maxTier ? 0 : t })}>
            {t > maxTier ? "🔒 " : ""}{TIERS[t].name} ({TIERS[t].short})
          </button>
        ))}
      </div>
      {!compact && <small className="vnhint">Nhân vật nói theo mức chứng chỉ cao nhất bạn đã đạt ({certsText(S)}). Muốn nghe mức khó hơn, hãy thi đỗ chứng chỉ ở các khóa học.</small>}
      {!compact && set.voice !== "web" && <small className="vnhint">Mỗi nhân vật được lồng một giọng VOICEVOX hợp với tuổi và tính cách (bé gái, thiếu nữ, thanh niên, người trưởng thành, ông lão…), giọng đổi theo cảm xúc của câu thoại. Xem danh sách giọng ở nút 🎭 trong truyện.</small>}
    </div>
  );
}

// Thiết lập nguồn giọng: VOICEVOX trên máy (địa chỉ + kiểm tra kết nối) hoặc online (API key tùy chọn)
function VoiceSetup({ engine }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [st, setSt] = useState(null); // null | "…" | {ok, alive, version}
  useEffect(() => { setUrl(localUrl()); setKey(apiKey()); }, []);
  const test = async () => { setSt("…"); setSt(await checkLocal()); };
  useEffect(() => { if (open && engine === "local") test(); }, [open, engine]); // eslint-disable-line react-hooks/exhaustive-deps
  const origin = typeof location !== "undefined" ? location.origin : "";
  return (
    <div className="vnvsetup">
      <button className="chip sm" onClick={() => setOpen(!open)}>{open ? "▾" : "▸"} Thiết lập {engine === "local" ? "VOICEVOX trên máy" : "VOICEVOX online"}</button>
      {open && engine === "online" && (
        <div className="vnvbox">
          <p>Không cần cài gì. Giọng được tạo qua dịch vụ miễn phí <b>api.tts.quest</b> (khoảng 1 câu mỗi 2 giây). Câu đã nghe được lưu lại trên máy nên lần sau phát ngay. Nếu thường bị báo quá tải, bạn có thể dùng API key riêng lấy từ <a href="https://su-shiki.com/api/" target="_blank" rel="noopener">su-shiki.com/api</a>.</p>
          <label className="vnfld">API key (không bắt buộc)
            <input value={key} onChange={(e) => { setKey(e.target.value); setApiKey(e.target.value); }} placeholder="để trống vẫn dùng được" spellCheck={false} />
          </label>
        </div>
      )}
      {open && engine === "local" && (
        <div className="vnvbox">
          <p>Cài và mở ứng dụng <a href="https://voicevox.hiroshiba.jp/" target="_blank" rel="noopener">VOICEVOX</a> trên máy tính: giọng tạo gần như tức thì, không giới hạn, và được chỉnh cao độ, ngữ điệu riêng cho từng độ tuổi.</p>
          <label className="vnfld">Địa chỉ VOICEVOX Engine
            <input value={url} onChange={(e) => { setUrl(e.target.value); setLocalUrl(e.target.value); }} onBlur={test} spellCheck={false} />
          </label>
          <div className={`vnvst ${st?.ok ? "ok" : st && st !== "…" ? "bad" : ""}`}>
            {st === "…" && "Đang kết nối…"}
            {st?.ok && `✓ Đã kết nối VOICEVOX ${st.version}`}
            {st && st !== "…" && !st.ok && (
              <>
                {st.alive ? "✕ VOICEVOX đang chạy nhưng chặn trang này." : "✕ Chưa kết nối được. Hãy mở ứng dụng VOICEVOX rồi bấm Kiểm tra lại."}
                <ol>
                  <li>Mở <a href={`${localUrl()}/setting`} target="_blank" rel="noopener">{localUrl()}/setting</a></li>
                  <li>Ở mục <b>Allow Origin</b>, nhập <code>{origin}</code> rồi bấm <b>Save</b></li>
                  <li>Tắt hẳn VOICEVOX rồi mở lại, sau đó bấm Kiểm tra lại. Nếu trình duyệt hỏi quyền truy cập mạng cục bộ, hãy bấm Cho phép.</li>
                </ol>
              </>
            )}
          </div>
          <button className="chip sm" onClick={test}>🔄 Kiểm tra lại</button>
        </div>
      )}
    </div>
  );
}
