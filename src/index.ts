import { WebSocketServer } from 'ws';
import { httpServer } from './http_server';

const sum = (a: number, b: number) => a + b;
console.log(sum(1, 3));

httpServer.listen(8181);

const wss = new WebSocketServer({
  port: 3000,
});
wss.on('listening', () => {
  console.log(`Websocket server is listening on ws://localhost:3000`);
});

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received message: ', data.toString());
  });

  ws.send('something');
});
