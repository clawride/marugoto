"use client";

// A single audio element follows the learner between the book and the course hub.
const idle = Object.freeze({ track: null, status: "idle", hasNext: false });
const listeners = new Set();
let snapshot = idle;
let session = null;

export const bookSnapshot = () => snapshot;
export const serverBookSnapshot = () => idle;
export function subscribeBook(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function publish(value) {
  snapshot = value;
  listeners.forEach((listener) => listener());
}
function update(current, status) {
  if (current === session) publish({ lib: current.lib, track: current.track, status, hasNext: current.index + 1 < current.queue.length });
}
function release() {
  if (!session) return;
  const audio = session.audio;
  session.unsubscribe?.();
  session = null;
  audio.onended = audio.onpause = audio.onplaying = audio.onerror = null;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}
export function stopBook() {
  if (!session) return;
  release();
  publish(idle);
}
async function start(lib, queue, index) {
  release();
  const audio = new Audio();
  const current = { lib, queue, index, track: queue[index], audio };
  session = current;
  current.unsubscribe = lib.onAudioChange(stopBook);
  update(current, "loading");
  audio.onplaying = () => update(current, "playing");
  audio.onpause = () => update(current, "paused");
  audio.onerror = () => update(current, "error");
  audio.onended = () => {
    if (current !== session) return;
    if (index + 1 < queue.length) nextBook();
    else update(current, "ended");
  };
  try {
    const url = await lib.audioUrl(current.track.key);
    if (current !== session) return;
    if (!url) throw Error("missing file");
    audio.src = url;
    await audio.play();
  } catch { update(current, "error"); }
}
export function playBook(lib, key) {
  const track = lib.trackOf(key);
  if (!track) return;
  const queue = lib.tracks();
  const index = queue.findIndex((entry) => entry.key === track.key);
  if (index >= 0) return start(lib, queue, index);
}
export function nextBook() {
  if (session && snapshot.hasNext) return start(session.lib, session.queue, session.index + 1);
}
export async function toggleBook() {
  const current = session;
  if (!current || snapshot.status === "loading") return;
  if (snapshot.status === "error") return start(current.lib, current.queue, current.index);
  if (snapshot.status === "playing") current.audio.pause();
  else {
    if (snapshot.status === "ended") current.audio.currentTime = 0;
    try { await current.audio.play(); } catch { update(current, "error"); }
  }
}
