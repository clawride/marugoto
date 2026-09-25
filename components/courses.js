"use client";
// Cấu hình giao diện cho từng khóa học dùng khung chung (Hub / bài / boss / thi)
import { NahidaHost, NahidaHero, ND, NAHIDA } from "@/components/Nahida";
import { FurinaHost, FurinaHero, FU, FURINA } from "@/components/Furina";
import { VentiHost, VentiHero, VT, VENTI } from "@/components/Venti";
import { RaidenHost, RaidenHero, RD, RAIDEN } from "@/components/Raiden";
import { A22_EXAM, AB1_EXAM, A1_EXAM, A21_EXAM } from "@/components/examConfigs";
import { A22_AUDIO, AB1_AUDIO, A1_AUDIO, A21_AUDIO, A21R_AUDIO, A21C_AUDIO } from "@/lib/audioLib";
import { A22 } from "@/lib/a22";
import { AB1 } from "@/lib/ab1";
import { A1C } from "@/lib/a1";
import { A21C } from "@/lib/a21";

export const A22_COURSE = {
  store: "a22", C: A22, base: "/a22", title: "Marugoto A2-2",
  unit: "Bài", unitTag: (L) => `TOPIC ${L.topic} · ${L.topicTitle} · だい${L.lesson}か`,
  audio: A22_AUDIO, folder: "New Marugoto A2-2 audio",
  Host: NahidaHost, Hero: NahidaHero, lines: ND, char: NAHIDA, hostName: "Nahida",
  exam: A22_EXAM,
};

export const AB1_COURSE = {
  store: "ab1", C: AB1, base: "/ab1", title: "Marugoto A2/B1",
  unit: "Topic", unitTag: (L) => `TOPIC ${L.topic} · 初中級 A2/B1`,
  audio: AB1_AUDIO, folder: "Marugoto A2B1 Audio",
  Host: FurinaHost, Hero: FurinaHero, lines: FU, char: FURINA, hostName: "Furina",
  exam: AB1_EXAM,
};

export const A1_COURSE = {
  store: "a1", C: A1C, base: "/a1", title: "Marugoto A1",
  unit: "Bài", unitTag: (L) => `TOPIC ${L.topic} · ${L.topicTitle} · だい${L.lesson}か`,
  audio: A1_AUDIO, folder: "new marugoto A1 (chứa Audio Katsudou và Audio Rikai)",
  partLabels: { kanji: "Chữ & Kanji" },
  Host: VentiHost, Hero: VentiHero, lines: VT, char: VENTI, hostName: "Venti",
  exam: A1_EXAM,
};

export const A21_COURSE = {
  store: "a21", C: A21C, base: "/a21", title: "Marugoto A2-1",
  unit: "Bài", unitTag: (L) => `TOPIC ${L.topic} · ${L.topicTitle} · だい${L.lesson}か`,
  audio: A21C_AUDIO,
  audioSetups: [{ lib: A21_AUDIO, folder: "New A2-1 Katsudou audio" }, { lib: A21R_AUDIO, folder: "New A2-1 Rikai audio" }],
  Host: RaidenHost, Hero: RaidenHero, lines: RD, char: RAIDEN, hostName: "Raiden Shogun",
  exam: A21_EXAM,
};
