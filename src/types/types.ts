import { WebSocket } from 'ws';

interface IWebsocket extends WebSocket {
  id: string;
  playerName: string;
}

enum MessageType {
  Reg = 'reg',
  Update_winners = 'update_winners',
  Create_game = 'create_game',
  Create_room = 'create_room',
  Update_room = 'update_room',
  Start_game = 'start_game',
  Attack = 'attack',
  Turn = 'turn',
  Finish = 'finish',
}

interface IMessage {
  type: MessageType;
  id: number;
}

interface IRegMessage extends IMessage {
  data: IRegData;
}

interface ICreateRoomMessage extends IMessage {
  data: string;
}

interface IRegData {
  name: string;
  password: string;
}

interface RoomUser {
  name: string;
  index: string;
}

interface IUpdateRoomData {
  roomId: string;
  roomUsers: RoomUser[];
}
interface IWsResponse {
  type: string;
  data: string;
  id: number;
}

export {
  IMessage,
  IRegData,
  IRegMessage,
  MessageType,
  IWebsocket,
  ICreateRoomMessage,
  RoomUser,
  IUpdateRoomData,
  IWsResponse,
};
