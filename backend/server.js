import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import chargePointRouter from './modules/chargepoints/chargePoint.routes.js';
import chargeStationRouter from './modules/chargestations/chargeStations.routes.js';
import tariffRouter from './modules/tariffs/tariffs.routes.js';
import sessionRouter from './modules/livesessions/session.routes.js';
import { processOcppMessage } from './modules/csms/csms.service.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('ocpp:message', async (data, callback) => {
    try {
      const { cpCode, action, payload } = data || {};
      console.log(`[Socket.io OCPP IN] [${cpCode}] Action: ${action}`);

      const responsePayload = await processOcppMessage({
        cpCode,
        action,
        payload,
        io
      });

      if (typeof callback === 'function') {
        callback({ status: 'OK', data: responsePayload });
      }
    } catch (err) {
      console.error(`[Socket.io OCPP ERROR] Message processing failed:`, err.message);
      if (typeof callback === 'function') {
        callback({ status: 'ERROR', error: err.message });
      }
    }
  });

  // Live Session Telemetry Event Relays
  socket.on('session:created', (data) => {
    console.log(`[Socket.io Server] Relaying session:created -> ${data?.sessionId || data?.id}`);
    io.emit('session:created', data);
  });

  socket.on('session:updated', (data) => {
    console.log(`[Socket.io Server] Relaying session:updated -> ${data?.sessionId || data?.id}`);
    io.emit('session:updated', data);
  });

  socket.on('session:stopped', (data) => {
    console.log(`[Socket.io Server] Relaying session:stopped -> ${data?.sessionId || data?.id}`);
    io.emit('session:stopped', data);
    io.emit('session:updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(['/api/charge-points', '/api/chargepoints'], chargePointRouter);
app.use(['/api/charging-stations', '/api/chargingstations'], chargeStationRouter);
app.use('/api/tariffs', tariffRouter);
app.use(['/api/live-sessions', '/api/livesessions'], sessionRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
