"use client";
// Cấu hình kỳ thi & chứng chỉ cho từng khóa học (dùng với ExamRunner / CertView)
import { ZhongliHost, ZL } from "@/components/Zhongli";
import { NahidaHost, ND } from "@/components/Nahida";
import ScriptPlayer from "@/components/ScriptPlayer";
import { Player, AudioSetup } from "@/components/Listen";
import { A22_AUDIO } from "@/lib/audioLib";
import { SECTIONS, buildExam, PASS_TOTAL, PASS_SECTION, EXCELLENT, MAX, REWARD_PASS, REWARD_EXCELLENT, certId } from "@/lib/b1";
import { A22_SECTIONS, buildA22Exam } from "@/lib/a22";

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

const a22CertId = (n, name, date) => {
  let h = 2166136261;
  for (const ch of `a22|${n}|${name}|${date}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `A22-${n}-${(h >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
};

export const A22_EXAM = {
  store: "a22",
  sections: A22_SECTIONS,
  build: buildA22Exam,
  pass: { total: 95, section: 19, excellent: 150, max: 180 },
  reward: { pass: 1200, excellent: 600 },
  certId: a22CertId,
  home: "/a22", homeLabel: "Marugoto A2-2", homeShort: "Về A2-2",
  certHref: (n) => `/a22/cert/${n}`, examHref: (n) => `/a22/exam/${n}`,
  Host: NahidaHost, lines: ND, hostName: "Nahida",
  rows: [["言語知識", "10 câu từ vựng + 8 câu kanji + 12 câu điền từ"], ["読解", "3 bài đọc · 12 câu"], ["聴解", "6 bài nghe hội thoại · mỗi bài nghe tối đa 2 lần"]],
  langHint: "Câu 1–10: từ vựng (chọn nghĩa / chọn từ). Câu 11–18: kanji (chọn cách đọc / cách viết). Câu 19–30: chọn từ điền vào （　）.",
  introExtra: <AudioSetup lib={A22_AUDIO} folder="New Marugoto A2-2 audio" />,
  renderListen: (b, submitted) => (
    <>
      <Player key={`${b.file}-${submitted}`} file={b.file} tts={b.tts} lib={A22_AUDIO} autoPlay={false} maxPlays={submitted ? 99 : 2} />
      {submitted && b.tts?.length > 0 && <div className="scriptlines">{b.tts.map((l, i) => <p key={i}><b>{l.sp}:</b> <span className="jpt">{l.t}</span></p>)}</div>}
    </>
  ),
  cert: { course: "Marugoto 初級2 (A2-2)", signer: "Nahida", signerTitle: "Giám khảo · Tiểu Cát Tường Thảo Vương", seal: ["知恵", "草神"], emblem: "dendro", tint: "#9be07a", emblemColor: "#3f7a2e", cornerColor: "#7fbf5a", sealColor: "#2f7a3a", filePrefix: "chung-chi-A2-2", line: "đã hoàn thành kỳ khảo hạch năng lực tiếng Nhật kiểu JLPT của khóa Marugoto A2-2 với kết quả:" },
};
