import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const socket = io(URL, {
  autoConnect: true,
});

export function getRoomId(idA, idB) {
  return [String(idA), String(idB)].sort().join("_");
}

export default socket;
