import { io } from "socket.io-client";
import { SOCKET_URL } from "../../config/api";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL || undefined, { autoConnect: false });
  }
  return socket;
}

export function connectSocket() {
  const client = getSocket();
  if (!client.connected) client.connect();
  return client;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

export function subscribeToSocketEvent(event, handler) {
  const client = connectSocket();
  client.on(event, handler);
  return () => client.off(event, handler);
}

export function watchBus(busId) {
  getSocket().emit("watchBus", busId);
}
