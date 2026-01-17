import { io, type Socket } from "socket.io-client";

export function connectStaffSocket(): Socket {
  const url = import.meta.env.VITE_STAFF_WS_URL || "http://localhost:3001/ws";

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN") ||
    "";

  return io(url, {
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
  });
}
