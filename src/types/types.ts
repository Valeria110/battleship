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
  Add_user_to_room = 'add_user_to_room',
  Add_ships = 'add_ships',
  Start_game = 'start_game',
  Attack = 'attack',
  RandomAttack = 'randomAttack',
  Turn = 'turn',
  Finish = 'finish',
}

enum AttackStatus {
  Killed = 'killed',
  Miss = 'miss',
  Shot = 'shot',
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

interface IAddUserToRoomMessage extends IMessage {
  data: {
    indexRoom: string;
  };
}

interface IAddShipsMessage extends IMessage {
  data: IGamePlayerData;
}

interface IAttackMessage extends IMessage {
  data: {
    gameId: string;
    x: number;
    y: number;
    indexPlayer: string;
  };
}

interface IRandomAttackMessage extends IMessage {
  data: {
    gameId: string;
    indexPlayer: string;
  };
}

interface IRegData {
  name: string;
  password: string;
}

interface RoomUser {
  name: string;
  index: string;
  ws: IWebsocket;
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

interface IGameData {
  players: IGamePlayersData[];
}

interface IGamePlayerData {
  gameId: string;
  ships: [
    {
      position: {
        x: number;
        y: number;
      };
      direction: boolean;
      length: number;
      type: ShipType;
    },
  ];
  indexPlayer: string;
}

interface IGamePlayersData extends IGamePlayerData {
  ws: IWebsocket;
}

type ShipType = 'small' | 'medium' | 'large' | 'huge';

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
  IAddUserToRoomMessage,
  IGameData,
  IAddShipsMessage,
  IGamePlayersData,
  IAttackMessage,
  AttackStatus,
  IRandomAttackMessage,
};
