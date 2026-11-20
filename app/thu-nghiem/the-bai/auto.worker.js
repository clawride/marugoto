import { autoDuel } from "@/lib/shikiDuel";

self.onmessage = ({ data }) => {
  try { self.postMessage(autoDuel(data.match)); }
  catch (error) { self.postMessage({ error: error.message }); }
};
