import { processOcppMessage } from './modules/ocpp/ocpp.service.js';
import { saveSessionToDb } from './modules/livesessions/session.service.js';
import { handleRemoteStartOcppMock, handleRemoteStopOcppMock } from './mocks/remoteOcppHandler.js';


export function safeIoEmit(io, event, data) {
  if (!io || typeof io.emit !== 'function') return;

  const cpId = data?.chargePointId || (event === 'chargePointUpdated' ? data?.id : null);
  const csId = data?.chargingStationId || (event === 'chargingStationUpdated' ? data?.id : null);

  const rooms = [];
  if (cpId) rooms.push(`chargepoint:${cpId}`);
  if (csId) rooms.push(`chargingstation:${csId}`);

  if (rooms.length > 0) {
    // 1. Emit to targeted room subscribers
    rooms.forEach(room => io.to(room).emit(event, data));
    // 2. Emit to non-room subscribers (global pages) without double-sending to room subscribers
    io.except(rooms).emit(event, data);
  } else {
    // Untargeted event, emit globally
    io.emit(event, data);
  }
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);


    socket.on('join:room', (roomName) => {
      if (roomName) {
        console.log(`[Socket.io Server] Socket ${socket.id} joined room: ${roomName}`);
        socket.join(roomName);
      }
    });

    socket.on('leave:room', (roomName) => {
      if (roomName) {
        console.log(`[Socket.io Server] Socket ${socket.id} left room: ${roomName}`);
        socket.leave(roomName);
      }
    });

    socket.on('ocpp:frame', (data) => {
      processOcppMessage(data, socket, io);
    });

    socket.on('ocpp:message', (data) => {
      processOcppMessage(data, socket, io);
    });

    socket.on('ocpp:remote-start', (data) => {
      handleRemoteStartOcppMock(data, socket, io);
    });

    socket.on('ocpp:remote-stop', (data) => {
      handleRemoteStopOcppMock(data, socket, io);
    });

    socket.on('session:created', (data) => {
      console.log(`[Socket.io Server] Relaying session:created -> ${data?.sessionId || data?.id}`);
      safeIoEmit(io, 'session:created', data);
    });

    socket.on('session:updated', (data) => {
      console.log(`[Socket.io Server] Relaying session:updated -> ${data?.sessionId || data?.id}`);
      safeIoEmit(io, 'session:updated', data);
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

      const payload = dbSession || data;
      safeIoEmit(io, 'session:stopped', payload);
      safeIoEmit(io, 'session:updated', payload);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}
