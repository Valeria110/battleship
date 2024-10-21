import { WebSocket } from 'ws';
import { RoomUser } from '../types/types';

interface PlayerData {
  password: string;
  index: string;
  socket: WebSocket;
}

interface RoomData {
  roomUsers: RoomUser[];
}

const players = new Map<string, PlayerData>(); //<playerName, PlayerData>
const rooms = new Map<string, RoomData>(); //<roomId, RoomData

export { players, rooms, PlayerData };
