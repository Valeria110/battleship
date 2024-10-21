import { IRegMessage, IUpdateRoomData, IWebsocket, IWsResponse, MessageType, RoomUser } from '../types/types';
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

export { handleRegMessage, handleCreateRoomMessage };
