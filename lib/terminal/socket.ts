import { io, Socket } from 'socket.io-client';

export interface TerminalInfo {
  pid: number;
  cwd: string;
  shell: string;
}

export interface TerminalSocket extends Socket {
  createTerminal: (data: { cols: number; rows: number }) => void;
  sendInput: (data: string) => void;
  resize: (data: { cols: number; rows: number }) => void;
}

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
