const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

wss.on('listening', () => {
  console.log('WebSocket server listening on port 8080');
});
