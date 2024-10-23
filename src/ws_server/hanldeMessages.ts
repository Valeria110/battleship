import {
  IAddShipsMessage,
  IAddUserToRoomMessage,
  IRegMessage,
  IUpdateRoomData,
  IWebsocket,
  MessageType,
  RoomUser,
} from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { convertRoomsMapToArr, createResponse, hasUserCreatedRoom, isPlayerExist } from '../utils';
import { gameDb, players, rooms } from '../db/db';
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

      const roomsArr = convertRoomsMapToArr();

      const wsResponse = createResponse(MessageType.Create_room, roomsArr);
      ws.send(JSON.stringify(wsResponse));

      wss.clients.forEach((client) => handleUpdateRoom(client as IWebsocket, roomsArr));
    }
  }
};

const handleUpdateRoom = (ws: IWebsocket, roomsArr: IUpdateRoomData[]) => {
  const filteredRoomsArr = roomsArr.filter((room) => room.roomUsers.length === 1);
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

        const roomsArr = convertRoomsMapToArr();
        wss.clients.forEach((client) => handleUpdateRoom(client as IWebsocket, roomsArr));

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

const handleAddShips = (ws: IWebsocket, parsedMessage: IAddShipsMessage) => {
  const gameId = parsedMessage.data.gameId;
  const gamePlayerData = {
    ...parsedMessage.data,
    ws,
  };
  const game = gameDb.get(gameId);

  if (!game) {
    gameDb.set(gameId, { players: [gamePlayerData] });
  } else {
    game.players.push(gamePlayerData);
    startGame(gameId);
  }
};

const startGame = (gameId: string) => {
  const game = gameDb.get(gameId);

  if (game) {
    game.players.forEach((player) => {
      const playerGameData = {
        ships: player.ships,
        currentPlayerIndex: player.indexPlayer,
      };

      const res = createResponse(MessageType.Start_game, playerGameData);
      player.ws.send(JSON.stringify(res));
    });
  } else {
    console.error(`Game with id ${gameId} does not exist`);
  }
};

export { handleRegMessage, handleCreateRoomMessage, handleAddUserToRoom, handleAddShips };
