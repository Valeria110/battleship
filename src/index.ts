import { WebSocketServer } from 'ws';
import { httpServer } from './http_server';
import 'dotenv/config';
import { parseMessage } from './utils';
import { handleRegMessage } from './ws_server/hanldeMessages';
import { IWebsocket, MessageType } from './types/types';
import { v4 as uuidv4 } from 'uuid';
import { players } from './db/db';

const WS_PORT = Number(process.env.WS_PORT) | 3000;
const HTTP_PORT = Number(process.env.HTTP_PORT) | 8181;

httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({
  port: WS_PORT,
});
wss.on('listening', () => {
  console.log(`Websocket server is listening on ws://localhost:${WS_PORT}`);
});

wss.on('connection', function connection(ws: IWebsocket) {
  ws.id = uuidv4();
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    try {
      const parsedMessage = parseMessage(data);
      const messageType = parsedMessage.type;

      switch (messageType) {
        case MessageType.Reg:
          handleRegMessage(ws, parsedMessage);
          break;
      }
    } catch (err) {
      console.error(err);
    }
  });

  ws.on('close', () => {
    console.log(`Websocket server connection with id ${ws.id} is closed`);
    const playerName = ws.playerName;
    if (playerName) {
      players.delete(playerName);
    }
  });
});

process.on('SIGINT', () => {
  wss.clients.forEach((ws) => ws.close());
  players.clear();
});
