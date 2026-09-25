"use client";
// Cấu hình kỳ thi & chứng chỉ cho từng khóa học (dùng với ExamRunner / CertView)
import { ZhongliHost, ZL } from "@/components/Zhongli";
import { NahidaHost, ND } from "@/components/Nahida";
import { FurinaHost, FU } from "@/components/Furina";
import { VentiHost, VT } from "@/components/Venti";
import ScriptPlayer from "@/components/ScriptPlayer";
import { Player, AudioSetup } from "@/components/Listen";
import { A22_AUDIO, AB1_AUDIO, A1_AUDIO } from "@/lib/audioLib";
import { SECTIONS, buildExam, PASS_TOTAL, PASS_SECTION, EXCELLENT, MAX, REWARD_PASS, REWARD_EXCELLENT, certId } from "@/lib/b1";
import { EXAM_SECTIONS } from "@/lib/course";
import { A22 } from "@/lib/a22";
import { AB1 } from "@/lib/ab1";
import { A1C } from "@/lib/a1";

export const B1_EXAM = {
  store: "b1",
  sections: SECTIONS,
  build: buildExam,
  pass: { total: PASS_TOTAL, section: PASS_SECTION, excellent: EXCELLENT, max: MAX },
  reward: { pass: REWARD_PASS, excellent: REWARD_EXCELLENT },
  certId,
  home: "/b1", homeLabel: "Học Viện B1-1", homeShort: "Học Viện",
  certHref: (n) => `/b1/cert/${n}`, examHref: (n) => `/b1/exam/${n}`,
  Host: ZhongliHost, lines: ZL, hostName: "Zhongli",
  rows: [["言語知識", "12 câu từ vựng + 13 câu ngữ pháp"], ["読解", "3 bài đọc dài · 15 câu"], ["聴解", "5 bài nghe · 15 câu · mỗi bài nghe tối đa 2 lần"]],
  langHint: "Câu 1–12: chọn nghĩa đúng của từ. Câu 13–25: chọn đáp án đúng điền vào （　）.",
  renderListen: (b, submitted) => <ScriptPlayer lines={b.lines} maxPlays={submitted ? 99 : 2} showScript={submitted} />,
  cert: { course: "Marugoto 中級1 (B1-1)", signer: "Zhongli", signerTitle: "Giám khảo · Nham Vương Đế Quân", seal: ["往生堂", "鍾離"], emblem: "geo", filePrefix: "chung-chi-B1-1" },
};

const courseCertId = (tag) => (n, name, date) => {
  let h = 2166136261;
  for (const ch of `${tag}|${n}|${name}|${date}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `${tag.toUpperCase()}-${n}-${(h >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
};

// Phần nghe trong đề: audio sách trên máy (nếu đã chọn thư mục) hoặc giọng máy
const courseListen = (lib) => (b, submitted) => (
  <>
    <Player key={`${b.file}-${submitted}`} file={b.file} tts={b.tts} lib={lib} autoPlay={false} maxPlays={submitted ? 99 : 2} />
    {submitted && b.tts?.length > 0 && <div className="scriptlines">{b.tts.map((l, i) => <p key={i}><b>{l.sp}:</b> <span className="jpt">{l.t}</span></p>)}</div>}
  </>
);
const COURSE_ROWS = [["言語知識", "10 câu từ vựng + 8 câu kanji + 12 câu điền từ"], ["読解", "3 bài đọc · câu hỏi đọc hiểu"], ["聴解", "6 bài nghe hội thoại · mỗi bài nghe tối đa 2 lần"]];
const COURSE_LANG_HINT = "Câu 1–10: từ vựng (chọn nghĩa / chọn từ). Câu 11–18: kanji (chọn cách đọc / cách viết). Câu 19–30: chọn từ điền vào （　）.";

export const A22_EXAM = {
  store: "a22",
  sections: EXAM_SECTIONS,
  build: A22.buildExam,
  pass: { total: 95, section: 19, excellent: 150, max: 180 },
  reward: { pass: 1200, excellent: 600 },
  certId: courseCertId("a22"),
  home: "/a22", homeLabel: "Marugoto A2-2", homeShort: "Về A2-2",
  certHref: (n) => `/a22/cert/${n}`, examHref: (n) => `/a22/exam/${n}`,
  Host: NahidaHost, lines: ND, hostName: "Nahida",
  rows: COURSE_ROWS,
  langHint: COURSE_LANG_HINT,
  introExtra: <AudioSetup lib={A22_AUDIO} folder="New Marugoto A2-2 audio" />,
  renderListen: courseListen(A22_AUDIO),
  cert: { course: "Marugoto 初級2 (A2-2)", signer: "Nahida", signerTitle: "Giám khảo · Tiểu Cát Tường Thảo Vương", seal: ["知恵", "草神"], emblem: "dendro", tint: "#9be07a", emblemColor: "#3f7a2e", cornerColor: "#7fbf5a", sealColor: "#2f7a3a", filePrefix: "chung-chi-A2-2", line: "đã hoàn thành kỳ khảo hạch năng lực tiếng Nhật kiểu JLPT của khóa Marugoto A2-2 với kết quả:" },
};

export const AB1_EXAM = {
  store: "ab1",
  sections: EXAM_SECTIONS,
  build: AB1.buildExam,
  pass: { total: 95, section: 19, excellent: 150, max: 180 },
  reward: { pass: 1400, excellent: 700 },
  certId: courseCertId("ab1"),
  home: "/ab1", homeLabel: "Marugoto A2/B1", homeShort: "Về A2/B1",
  certHref: (n) => `/ab1/cert/${n}`, examHref: (n) => `/ab1/exam/${n}`,
  Host: FurinaHost, lines: FU, hostName: "Furina",
  rows: COURSE_ROWS,
  langHint: COURSE_LANG_HINT,
  introExtra: <AudioSetup lib={AB1_AUDIO} folder="Marugoto A2B1 Audio" />,
  renderListen: courseListen(AB1_AUDIO),
  cert: { course: "Marugoto 初中級 (A2/B1)", signer: "Furina", signerTitle: "Giám khảo · Thủy Thần Fontaine", seal: ["歌劇", "水神"], emblem: "hydro", tint: "#8fd0ff", emblemColor: "#2d5f9a", cornerColor: "#6aa8e0", sealColor: "#2553a0", filePrefix: "chung-chi-A2B1", line: "đã hoàn thành kỳ khảo hạch năng lực tiếng Nhật kiểu JLPT của khóa Marugoto A2/B1 với kết quả:" },
};

export const A1_EXAM = {
  store: "a1",
  sections: EXAM_SECTIONS,
  build: A1C.buildExam,
  pass: { total: 95, section: 19, excellent: 150, max: 180 },
  reward: { pass: 1000, excellent: 500 },
  certId: courseCertId("a1"),
  home: "/a1", homeLabel: "Marugoto A1", homeShort: "Về A1",
  certHref: (n) => `/a1/cert/${n}`, examHref: (n) => `/a1/exam/${n}`,
  Host: VentiHost, lines: VT, hostName: "Venti",
  rows: COURSE_ROWS,
  langHint: "Câu 1–10: từ vựng (chọn nghĩa / chọn từ). Câu 11–18: chữ (chọn cách đọc / cách viết). Câu 19–30: chọn từ điền vào （　）.",
  introExtra: <AudioSetup lib={A1_AUDIO} folder="new marugoto A1 (Audio Katsudou + Audio Rikai)" />,
  renderListen: courseListen(A1_AUDIO),
  cert: { course: "Marugoto 入門 (A1)", signer: "Venti", signerTitle: "Giám khảo · Phong Thần Barbatos", seal: ["風神", "詩人"], emblem: "anemo", tint: "#8ff0d4", emblemColor: "#2a8a74", cornerColor: "#6fd4b8", sealColor: "#1f7a66", filePrefix: "chung-chi-A1", line: "đã hoàn thành kỳ khảo hạch năng lực tiếng Nhật kiểu JLPT của khóa Marugoto A1 với kết quả:" },
};
