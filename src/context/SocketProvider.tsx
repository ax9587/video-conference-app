"use client";
import React, { createContext, useMemo, useContext, ReactNode } from "react";
import { Socket, io } from "socket.io-client";

interface SocketProviderProps {
  children: ReactNode;
}

// Create context with proper typing, null as default value
const SocketContext = createContext<Socket | null>(null);

export const useSocket = (): Socket => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socket = useMemo(() => io("localhost:8000"), []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};