import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'prisma/dev.db').replace(/\\/g, '/');
process.env.DATABASE_URL = `file:${dbPath}`;




import chargePointRouter from './modules/chargepoints/chargePoint.routes.js';
import chargeStationRouter from './modules/chargestations/chargeStations.routes.js';
import tariffRouter from './modules/tariffs/tariffs.routes.js';
import sessionRouter from './modules/livesessions/session.routes.js';
import fleetRouter from './modules/fleets/fleet.routes.js';
import billRouter from './modules/bills/bill.routes.js';
import discountRouter from './modules/discounts/discounts.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import teamRouter from './modules/teams/team.routes.js';
import paymentRouter from './modules/payments/payments.routes.js';
import { registerSocketHandlers } from './socket.js';
import { startSessionSweeper } from './modules/livesessions/session.sweeper.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Register Socket.io event handlers
registerSocketHandlers(io);

// Middlewares
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use(['/api/charge-points', '/api/chargepoints'], chargePointRouter);
app.use(['/api/charging-stations', '/api/chargingstations'], chargeStationRouter);
app.use('/api/tariffs', tariffRouter);
app.use(['/api/live-sessions', '/api/livesessions'], sessionRouter);
app.use('/api/fleets', fleetRouter);
app.use('/api/bills', billRouter);
app.use('/api/discounts', discountRouter);
app.use(['/api/teams', '/api/team-members'], teamRouter);
app.use('/api/payments', paymentRouter);




const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Start background session cleanup sweeper
  await startSessionSweeper(io, 15000);
});
