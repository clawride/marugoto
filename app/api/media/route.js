import PHOTO_KW from "@/data/photo-keywords.json";
import GLOSS from "@/data/gloss.json";

// GET /api/media?w=<từ tiếng Nhật>&type=photo|meme|anime&ok=1|0
// Ảnh thật: Pexels (cần PEXELS_API_KEY) → dự phòng Wikipedia/Openverse/Commons
// Meme/Anime: GIPHY (cần GIPHY_API_KEY) → dự phòng nekos.best
const DAY = 86400;

async function getJSON(url, init = {}) {
  try {
    const r = await fetch(url, { ...init, next: { revalidate: DAY }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

const words = (s) => s.toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length > 2);
// Ưu tiên kết quả có tiêu đề chứa từ khóa, giữ thứ tự gốc khi bằng điểm
function rerank(items, q) {
  const ws = words(q);
  return items
    .map((it, i) => ({ it, i, s: ws.reduce((a, w) => a + ((it.title || "").toLowerCase().includes(w) ? 1 : 0), 0) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.it);
}

async function pexels(q) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const j = await getJSON(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12&orientation=landscape`, { headers: { Authorization: key } });
  return (j?.photos || []).map((p) => ({ url: p.src.large, src: `Pexels · ${p.photographer}`, title: p.alt || "" }));
}
async function wiki(q) {
  const j = await getJSON(`https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=640&titles=${encodeURIComponent(q)}`);
  return Object.values(j?.query?.pages || {}).filter((p) => p.thumbnail && !/\.svg/i.test(p.thumbnail.source)).map((p) => ({ url: p.thumbnail.source, src: "Wikipedia", title: p.title }));
}
async function openverse(q) {
  const j = await getJSON(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=10&mature=false`);
  return (j?.results || []).map((x) => ({ url: x.thumbnail || x.url, src: "Openverse" + (x.creator ? " · " + x.creator : ""), title: x.title || "" }));
}
async function commons(q) {
  const j = await getJSON(`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&prop=imageinfo&iiprop=url|mime&iiurlwidth=640`);
  return Object.values(j?.query?.pages || {}).sort((a, b) => a.index - b.index)
    .filter((p) => p.imageinfo && /jpeg|png|webp/.test(p.imageinfo[0].mime))
    .map((p) => ({ url: p.imageinfo[0].thumburl, src: "Wikimedia Commons", title: p.title }));
}
async function giphy(q) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) return [];
  const j = await getJSON(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=16&rating=g&lang=en`);
  return (j?.data || []).map((g) => ({ url: g.images?.downsized_medium?.url || g.images?.fixed_height?.url, src: "GIPHY" + (g.username ? " · " + g.username : ""), title: g.title || "", contain: true })).filter((x) => x.url);
}

const NEKO = [
  ["nom", "eat|food|meal|dish|lunch|dinner|breakfast|cook|snack|restaurant|delicious|taste|tasty|bento|ramen|sushi|hungry"],
  ["sleep", "sleep|bed|nap|asleep|lazy"], ["yawn", "tired|yawn|exhausted"], ["bored", "bored|boring|dull"],
  ["run", "run|jog|marathon|hurry|rush"], ["laugh", "laugh|funny|joke|comedy|humor"], ["smile", "smile|cheerful|friendly|kind|gentle"],
  ["happy", "happy|joy|glad|fun|enjoy|excited|celebrate|festival|party"], ["cry", "cry|sad|tears|lonely|sorrow"], ["angry", "angry|anger|mad|annoyed|scold"],
  ["dance", "dance|dancing"], ["think", "think|idea|consider|question|wonder|guess|decide|plan|thought|hmm"], ["wave", "wave|greet|hello|goodbye|farewell|welcome|bye|meet"],
  ["clap", "clap|applause|praise|cheer|audience"], ["sip", "drink|tea|coffee|sake|beer|juice|cup"], ["shocked", "surprise|shock|amazed|startled|scared|wow"],
  ["confused", "confused|lost|mystery|strange"], ["blush", "shy|embarrassed|blush|love|crush"], ["stare", "look|watch|stare|see|observe|view"],
  ["nod", "nod|agree|yes|understand|accept|approve"], ["nope", "refuse|reject|deny|forbidden|no"], ["handshake", "handshake|business|deal|contract|introduce"],
  ["hug", "hug|embrace|comfort|family"], ["carry", "carry|bring|deliver|luggage"], ["kick", "kick|karate"], ["punch", "punch|boxing|fight|martial|judo|kendo|sumo"],
  ["salute", "salute|respect|bow|polite|honor"], ["highfive", "teamwork|together|team|success|win|victory"], ["pout", "pout|sulk|complain|jealous"],
  ["shrug", "shrug|whatever|unsure|maybe|perhaps"], ["facepalm", "mistake|fail|failure|oops|error"], ["wink", "wink|secret|hint"],
].map(([c, w]) => [c, new RegExp(`\\b(?:${w})(?:s|es|ing|ed)?\\b`, "i")]);

async function nekos(q, ok) {
  let cat = NEKO.find(([, re]) => re.test(q))?.[0];
  const rel = !!cat;
  if (!cat) { const pool = ok ? ["thumbsup", "happy", "smile", "dance", "clap", "highfive"] : ["cry", "facepalm", "shocked", "confused", "pout", "shrug"]; cat = pool[(Math.random() * pool.length) | 0]; }
  const j = await getJSON(`https://nekos.best/api/v2/${cat}?amount=10`);
  return (j?.results || []).map((x) => ({ url: x.url, src: (rel ? "Anime gợi ý nghĩa" : ok ? "Meme ăn mừng" : "Meme an ủi") + " · " + (x.anime_name || "nekos.best"), title: cat, contain: true }));
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const w = searchParams.get("w") || "";
  const type = searchParams.get("type") || "photo";
  const ok = searchParams.get("ok") !== "0";
  const clean = w.replace(/[～~『』「」（）()]/g, " ").trim();
  const kw = PHOTO_KW[w] || clean;
  const gloss = GLOSS[w] || kw;

  let items = [];
  let query = kw;
  if (type === "photo") {
    items = await pexels(kw);
    if (items.length < 4) {
      const more = await Promise.all([wiki(kw), openverse(kw), commons(kw)]);
      items = items.concat(...more);
    }
  } else {
    query = type === "anime" ? `anime ${gloss}` : gloss;
    items = rerank(await giphy(query), gloss);
    if (type === "anime" && items.length < 4) items = items.concat(rerank(await giphy(gloss), gloss));
    if (!items.length) items = await nekos(gloss, ok);
  }
  const seen = new Set();
  items = items.filter((x) => x.url && !seen.has(x.url) && seen.add(x.url)).slice(0, 16);

  return Response.json(
    { items, query, keys: { giphy: !!process.env.GIPHY_API_KEY, pexels: !!process.env.PEXELS_API_KEY } },
    { headers: { "Cache-Control": `public, s-maxage=${DAY}, stale-while-revalidate=${DAY * 7}` } },
  );
}
