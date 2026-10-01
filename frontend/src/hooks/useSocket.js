"use client";

import { useEffect } from "react";
import { getSocket, connectSocket, disconnectSocket } from "../lib/socket/socket";

export function useSocket() {
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);
  return getSocket();
}
