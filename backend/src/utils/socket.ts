// src/utils/socket.ts
import { Server } from 'socket.io';

let io: Server;

export const initializeSocket = (serverIo: Server) => {
  io = serverIo;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
