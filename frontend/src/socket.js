import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const socket = io(URL, {
  autoConnect: true,
});

/** phone -> E.164 (+84...), email -> lowercase */
export function normalizeId(id) {
  const s = String(id || "").trim();
  if (!s) return s;
  if (s.includes("@")) return s.toLowerCase();

  let p = s.replace(/\s+/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("0")) return "+84" + p.slice(1);
  if (p.startsWith("84")) return "+" + p;
  return "+" + p;
}

export function getRoomId(idA, idB) {
  return [normalizeId(idA), normalizeId(idB)].sort().join("_");
}

export default socket;
