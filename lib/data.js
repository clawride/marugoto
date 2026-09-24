import VOCAB from "@/data/vocab.json";

export const TOPICS = VOCAB;

export const TOPIC_VI = {
  1: "Với người mới quen", 2: "Món ăn đề xuất", 3: "Âm nhạc tôi yêu thích", 4: "Cùng đi suối nước nóng",
  5: "Dạo này thế nào?", 6: "Cùng đọc manga", 7: "Thử sức với võ thuật!", 8: "Đồ dùng tiện lợi", 9: "Lễ hội truyền thống",
};

export const ELEM = {
  anemo: { vi: "Phong", c: "#4fd1b0" },
  pyro: { vi: "Hỏa", c: "#ff8a5c" },
  electro: { vi: "Lôi", c: "#c79cff" },
  hydro: { vi: "Thủy", c: "#4fa8ff" },
  dendro: { vi: "Thảo", c: "#8fd14f" },
  cryo: { vi: "Băng", c: "#9fe6ff" },
  geo: { vi: "Nham", c: "#f0b93c" },
};

export const TOPIC_EL = { 1: "anemo", 2: "pyro", 3: "electro", 4: "hydro", 5: "dendro", 6: "cryo", 7: "geo", 8: "electro", 9: "pyro" };

export const SEC = {
  all: { ico: "全", vi: "Toàn bộ Topic", jp: "総合" },
  prep: { ico: "準備", vi: "Chuẩn bị", jp: "準備" },
  p1: { ico: "PART 1", vi: "Part 1 · Nghe hiểu", jp: "聞いてわかる" },
  p2: { ico: "PART 2", vi: "Part 2 · Hội thoại", jp: "会話する" },
  p3: { ico: "PART 3", vi: "Part 3 · Nói dài", jp: "長く話す" },
  p4: { ico: "PART 4", vi: "Part 4 · Đọc hiểu", jp: "読んでわかる" },
  p5: { ico: "PART 5", vi: "Part 5 · Viết", jp: "書く" },
  out: { ico: "外へ", vi: "Ra ngoài lớp học", jp: "教室の外へ" },
};

export const topicOf = (n) => TOPICS.find((t) => t.n === n);

export function wordsOf(n, key) {
  const T = topicOf(n);
  if (!T) return [];
  if (key !== "all") {
    const s = T.sections.find((x) => x.key === key);
    return s ? s.words.map(([w, r, m]) => ({ w, r, m, t: n })) : [];
  }
  const seen = new Set();
  const out = [];
  T.sections.forEach((s) => s.words.forEach(([w, r, m]) => {
    if (!seen.has(w)) { seen.add(w); out.push({ w, r, m, t: n }); }
  }));
  return out;
}

export const TOTAL_WORDS = new Set(TOPICS.flatMap((t) => t.sections.flatMap((s) => s.words.map((w) => w[0])))).size;

export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const pickRand = (a) => a[(Math.random() * a.length) | 0];
export const starsFor = (pct) => (pct >= 95 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0);
