import { replayDuel } from "@/lib/shikiDuel";

self.onmessage = ({ data }) => {
  try { self.postMessage(replayDuel(data.match, data.moves)); }
  catch (error) { self.postMessage({ error: error.message }); }
};
