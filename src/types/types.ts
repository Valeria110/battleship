import { WebSocket } from 'ws';

enum MessageType {
  Reg = 'reg',
  Update_winners = 'update_winners',
  Create_game = 'create_game',
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

interface IRegData {
  name: string;
  password: string;
}

interface IWebsocket extends WebSocket {
  id: string;
  playerName: string;
}

export { IMessage, IRegData, IRegMessage, MessageType, IWebsocket };
