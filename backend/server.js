import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import chargePointRouter from './modules/chargepoints/chargePoint.routes.js';
import chargeStationRouter from './modules/chargestations/chargeStations.routes.js';
import tariffRouter from './modules/tariffs/tariffs.routes.js';
import sessionRouter from './modules/livesessions/session.routes.js';
import { saveSessionToDb } from './modules/livesessions/session.service.js';

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

  socket.on('session:created', (data) => {
    console.log(`[Socket.io Server] Relaying session:created -> ${data?.sessionId || data?.id}`);
    io.emit('session:created', data);
  });

  socket.on('session:updated', (data) => {
    console.log(`[Socket.io Server] Relaying session:updated -> ${data?.sessionId || data?.id}`);
    io.emit('session:updated', data);
  });

  socket.on('session:stopped', async (data) => {
    console.log(` Saving stopped session to Database: ${data?.sessionId || data?.id} (Status: ${data?.status})`);

    let dbSession = data;
    try {
      dbSession = await saveSessionToDb(data);
      console.log(` Successfully saved session ${dbSession?.id} to SQLite DB!`);
    } catch (err) {
      console.error(` Failed to save session to SQLite DB:`, err.message);
    }

    io.emit('session:stopped', dbSession || data);
    io.emit('session:updated', dbSession || data);
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
