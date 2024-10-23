import {
  IAddUserToRoomMessage,
  IRegMessage,
  IUpdateRoomData,
  IWebsocket,
  IWsResponse,
  MessageType,
  RoomUser,
} from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { createResponse, hasUserCreatedRoom, isPlayerExist } from '../utils';
import { players, rooms } from '../db/db';
import { wss } from '..';

const handleRegMessage = (ws: IWebsocket, parsedMessage: IRegMessage) => {
  const playerName = parsedMessage.data.name;
  const enteredPassword = parsedMessage.data.password;

  if (!isPlayerExist(playerName)) {
    const regData = {
      name: playerName,
      index: uuidv4(),
      error: false,
      errorText: '',
    };
    const wsResponse = createResponse(parsedMessage.type, regData);
    players.set(playerName, { password: enteredPassword, index: regData.index, socket: ws });
    ws.playerName = playerName;
    ws.send(JSON.stringify(wsResponse));
  } else {
    const regData = {
      error: true,
      errorText: `User with name ${playerName} already exists`,
    };
    const wsResponse = createResponse(MessageType.Reg, regData);

    ws.send(JSON.stringify(wsResponse));
  }
};

const handleCreateRoomMessage = (ws: IWebsocket) => {
  const player = players.get(ws.playerName);

  if (player) {
    if (!hasUserCreatedRoom(ws.playerName)) {
      const newRoom = {
        roomUsers: [
          {
            name: ws.playerName,
            index: player.index,
            ws,
          },
        ],
      };

      rooms.set(uuidv4(), newRoom);

      const roomsArr: IUpdateRoomData[] = [];
      rooms.forEach((value, key) => roomsArr.push({ roomId: key, roomUsers: value.roomUsers }));

      const wsResponse = createResponse(MessageType.Create_room, roomsArr);
      ws.send(JSON.stringify(wsResponse));

      const filteredRoomsArr = roomsArr.filter((room) => room.roomUsers.length === 1);
      wss.clients.forEach((client) => handleUpdateRoom(client as IWebsocket, filteredRoomsArr));
    }
  }
};

const handleUpdateRoom = (ws: IWebsocket, filteredRoomsArr: IUpdateRoomData[]) => {
  const wsResponse = createResponse(MessageType.Update_room, filteredRoomsArr);
  ws.send(JSON.stringify(wsResponse));
};

const handleAddUserToRoom = (ws: IWebsocket, parsedMessage: IAddUserToRoomMessage) => {
  const roomIndex = parsedMessage.data.indexRoom;
  rooms.forEach((_, key) => {
    if (key === roomIndex) {
      const roomUser = rooms.get(key)?.roomUsers[0];
      const playerIndex = players.get(ws.playerName)?.index;

      if (playerIndex && roomUser) {
        const userToBeAdded: RoomUser = { name: ws.playerName, index: playerIndex, ws };
        rooms.set(key, { roomUsers: [roomUser, userToBeAdded] });

        const roomsArr: IUpdateRoomData[] = [];
        rooms.forEach((value, key) => roomsArr.push({ roomId: key, roomUsers: value.roomUsers }));
        const filteredRoomsArr = roomsArr.filter((room) => room.roomUsers.length === 1);
        wss.clients.forEach((client) => handleUpdateRoom(client as IWebsocket, filteredRoomsArr));

        handleCreateGame([roomUser, userToBeAdded]);
      }
    }
  });
};

const handleCreateGame = (roomUsers: RoomUser[]) => {
  const idGame = uuidv4();

  roomUsers.forEach((roomUser) => {
    const gameData = {
      idGame,
      idPlayer: roomUser.index,
    };

    const res = createResponse(MessageType.Create_game, gameData);
    roomUser.ws.send(JSON.stringify(res));
  });
};

export { handleRegMessage, handleCreateRoomMessage, handleAddUserToRoom };
