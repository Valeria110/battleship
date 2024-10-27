import {
  AttackStatus,
  IAddShipsMessage,
  IAddUserToRoomMessage,
  IAttackMessage,
  IGameData,
  IGamePlayersData,
  IRandomAttackMessage,
  IRegMessage,
  IUpdateRoomData,
  IWebsocket,
  MessageType,
  RoomUser,
} from '../types/types';
import { randomUUID } from 'crypto';
import { convertRoomsMapToArr, createResponse, getCurGameId, hasUserCreatedRoom, isPlayerExist } from '../utils';
import { gameDb, players, rooms } from '../db/db';
import { wss } from '..';

const handleRegMessage = (ws: IWebsocket, parsedMessage: IRegMessage) => {
  const playerName = parsedMessage.data.name;
  const enteredPassword = parsedMessage.data.password;

  if (!isPlayerExist(playerName)) {
    const regData = {
      name: playerName,
      index: randomUUID(),
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

      rooms.set(randomUUID(), newRoom);

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
  const idGame = randomUUID();

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
    handleTurn(game.players[0], game);
  } else {
    console.error(`Game with id ${gameId} does not exist`);
  }
};

const handleTurn = (curPlayer: IGamePlayersData, game: IGameData) => {
  game.players.forEach((player) => {
    const res = createResponse(MessageType.Turn, { currentPlayer: curPlayer.indexPlayer });
    player.ws.send(JSON.stringify(res));
  });
};

const handleAttack = (parsedMessage: IAttackMessage) => {
  const { indexPlayer: curPlayerId, gameId, x: attackX, y: attackY } = parsedMessage.data;

  const game = gameDb.get(gameId) as IGameData;
  const victim = game.players.find((player) => player.indexPlayer !== curPlayerId);

  if (victim) {
    if (attackX && attackY) {
      const hasShotShip = victim.ships.find((ship) => {
        if (ship.position.x === attackX && ship.position.y === attackY) {
          return ship;
        }
        return null;
      });

      if (hasShotShip) {
        const attackData = {
          position: { x: attackX, y: attackY, status: AttackStatus.Shot },
        };
        game.players.forEach((player) => {
          const response = createResponse(MessageType.Attack, { ...attackData, currentPlayer: player.indexPlayer });
          player.ws.send(JSON.stringify(response));
        });
      } else {
        const attackData = {
          position: { x: attackX, y: attackY, status: AttackStatus.Miss },
        };
        game.players.forEach((player) => {
          const response = createResponse(MessageType.Attack, { ...attackData, currentPlayer: player.indexPlayer });
          player.ws.send(JSON.stringify(response));
        });
      }

      const turnRes = createResponse(MessageType.Turn, {
        currentPlayer: hasShotShip ? curPlayerId : victim.indexPlayer,
      });

      game.players.forEach((player) => {
        player.ws.send(JSON.stringify(turnRes));
      });
    }
  }
};

const handleRandomAttack = (parsedMessage: IRandomAttackMessage) => {
  const { gameId, indexPlayer: curPlayerId } = parsedMessage.data;
  const attackPosition = {
    x: Math.floor(Math.random() * 11),
    y: Math.floor(Math.random() * 11),
  };

  const game = gameDb.get(gameId) as IGameData;
  const victim = game.players.find((player) => player.indexPlayer !== curPlayerId);
  if (victim) {
    const hasShotShip = victim.ships.find(
      (ship) => ship.position.x === attackPosition.x && ship.position.y === attackPosition.y,
    );

    if (hasShotShip) {
      const attackData = {
        position: { x: attackPosition.x, y: attackPosition.y, status: AttackStatus.Shot },
      };
      game.players.forEach((player) => {
        const response = createResponse(MessageType.Attack, { ...attackData, currentPlayer: player.indexPlayer });
        player.ws.send(JSON.stringify(response));
      });
    } else {
      const attackData = {
        position: { x: attackPosition.x, y: attackPosition.y, status: AttackStatus.Miss },
      };
      game.players.forEach((player) => {
        const response = createResponse(MessageType.Attack, { ...attackData, currentPlayer: player.indexPlayer });
        player.ws.send(JSON.stringify(response));
      });
    }

    const turnRes = createResponse(MessageType.Turn, { currentPlayer: hasShotShip ? curPlayerId : victim.indexPlayer });

    game.players.forEach((player) => {
      player.ws.send(JSON.stringify(turnRes));
    });
  } else {
    console.error(`Player was not found`);
  }
};

export {
  handleRegMessage,
  handleCreateRoomMessage,
  handleAddUserToRoom,
  handleAddShips,
  handleAttack,
  handleRandomAttack,
};
