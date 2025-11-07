import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3789;

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Recall.ai test server running'
  });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  // Accept all origins for testing
  verifyClient: () => true
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const botId = url.searchParams.get('bot_id');
  const connectionType = url.searchParams.get('connection_type');

  console.log('='.repeat(60));
  console.log('🎉 NEW WEBSOCKET CONNECTION');
  console.log('='.repeat(60));
  console.log('Timestamp:', new Date().toISOString());
  console.log('Bot ID:', botId || 'NOT PROVIDED');
  console.log('Connection Type:', connectionType || 'NOT PROVIDED');
  console.log('Full URL:', req.url);
  console.log('Origin:', req.headers.origin || 'NOT PROVIDED');
  console.log('User-Agent:', req.headers['user-agent'] || 'NOT PROVIDED');
  console.log('='.repeat(60));

  // Track message count
  let messageCount = 0;
  let audioMessageCount = 0;
  let lastLogTime = Date.now();

  ws.on('message', (data) => {
    messageCount++;

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(data.toString());

      // Log every 10 messages or if it's been more than 5 seconds
      const now = Date.now();
      const shouldLog = messageCount % 10 === 0 || (now - lastLogTime) > 5000;

      if (shouldLog) {
        console.log(`\n📨 Message #${messageCount} received`);
        console.log('Event type:', parsed.event || parsed.type || 'UNKNOWN');

        // Check if it's audio data
        if (parsed.event === 'audio_separate_raw.data' || parsed.type === 'audio_separate_raw.data') {
          audioMessageCount++;
          const audioData = parsed.data?.data;
          const participant = parsed.data?.data?.participant;
          const buffer = audioData?.buffer;

          console.log('🎤 AUDIO DATA RECEIVED:');
          console.log('  - Audio message #:', audioMessageCount);
          console.log('  - Participant:', participant?.name || participant?.id || 'UNKNOWN');
          console.log('  - Buffer size:', buffer ? Buffer.from(buffer, 'base64').length : 'NO BUFFER');
          console.log('  - Timestamp:', audioData?.timestamp || 'NO TIMESTAMP');
        } else {
          console.log('Event data:', JSON.stringify(parsed, null, 2).substring(0, 500));
        }

        lastLogTime = now;
      }
    } catch (e) {
      // Not JSON, might be binary
      console.log(`\n📨 Message #${messageCount} (binary/non-JSON)`);
      console.log('Size:', data.length, 'bytes');
    }
  });

  ws.on('close', (code, reason) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔌 WEBSOCKET CLOSED');
    console.log('='.repeat(60));
    console.log('Bot ID:', botId);
    console.log('Close code:', code);
    console.log('Reason:', reason.toString() || 'No reason provided');
    console.log('Total messages received:', messageCount);
    console.log('Total audio messages:', audioMessageCount);
    console.log('='.repeat(60));
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error for bot', botId, ':', error);
  });

  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'connection.established',
    bot_id: botId,
    timestamp: new Date().toISOString(),
    message: 'Connected to Recall.ai test server'
  }));
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Recall.ai Test WebSocket Server Started');
  console.log('='.repeat(60));
  console.log('Port:', PORT);
  console.log('Health check:', `http://localhost:${PORT}/health`);
  console.log('WebSocket URL:', `ws://localhost:${PORT}?bot_id=test&connection_type=recall`);
  console.log('='.repeat(60));
  console.log('\nWaiting for Recall.ai bot to connect...\n');
});