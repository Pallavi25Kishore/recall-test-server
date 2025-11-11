import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3789;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = createServer(app);

// Absolutely minimal WebSocket - accept everything, no validation
const wss = new WebSocketServer({
  server,
  // Remove ALL verification - just accept everything
});

wss.on('connection', (ws, req) => {
  console.log('='.repeat(60));
  console.log('✅ WEBSOCKET CONNECTION RECEIVED');
  console.log('Time:', new Date().toISOString());
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('='.repeat(60));

  ws.on('message', (data) => {
    console.log('📨 Message received:', data.toString().substring(0, 200));
  });

  ws.on('close', () => {
    console.log('🔌 Connection closed');
  });

  ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal WebSocket Server on port ${PORT}`);
});