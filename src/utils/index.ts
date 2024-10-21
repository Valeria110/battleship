import { RawData } from 'ws';
import { players } from '../db/db';

const parseMessage = (message: RawData) => {
  const parsedMessage = JSON.parse(message.toString());
  return {
    ...parsedMessage,
    data: JSON.parse(parsedMessage.data || '""'),
  };
};

const createResponse = (type: string, data: unknown) => {
  return {
    type,
    data: JSON.stringify(data),
    id: 0,
  };
};

const isPlayerExist = (password: string) => {
  return players.get(password) ?? false;
};

const isCorrectPassword = (password: string, name: string) => {
  const player = players.get(name);
  return password === player?.password;
};

export { parseMessage, createResponse, isPlayerExist, isCorrectPassword };
