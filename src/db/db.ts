import { WebSocket } from 'ws';

interface playerData {
  password: string;
  index: string;
  socket: WebSocket;
}

const players = new Map<string, playerData>();

export { players };
