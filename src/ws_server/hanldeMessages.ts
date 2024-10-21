import { IRegMessage, IWebsocket } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { createResponse, isCorrectPassword, isPlayerExist } from '../utils';
import { players } from '../db/db';

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
    const wsResponse = createResponse(parsedMessage.type, regData);

    ws.send(JSON.stringify(wsResponse));
  }
};

export { handleRegMessage };
