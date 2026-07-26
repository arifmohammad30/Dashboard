import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import { Server } from 'socket.io';

const prisma = new PrismaClient();
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
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());



async function seedLiveSessions() {
  try {
    const count = await prisma.liveSession.count();
    if (count !== 9) {
      await prisma.liveSession.deleteMany({});
      const mockData = [
        { userInitials: 'B', userColor: 'bg-indigo-100 text-indigo-700', userName: 'B108901020', station: 'Lodha The Park, Mumbai', chargePoint: 'EVRE Lodha The Park AC1', connector: 'Type2 (1)', status: 'Ongoing' },
        { userInitials: 'J', userColor: 'bg-purple-100 text-purple-700', userName: 'Jothi viknesh', station: 'Sobha Chrysanthemum, Bengaluru', chargePoint: 'EVRE Sobha Chrysanthemum AC1', connector: '15A (2)', status: 'Ongoing' },
        { userInitials: 'A', userColor: 'bg-fuchsia-100 text-fuchsia-700', userName: 'Athiljit', station: 'Sobha Chrysanthemum, Bengaluru', chargePoint: 'Sobha Chrysanthemum 10D AC2', connector: 'Type2 (1)', status: 'Ongoing' },
        { userInitials: 'P', userColor: 'bg-pink-100 text-pink-700', userName: 'Priya R', station: 'Orion Mall, Bengaluru', chargePoint: 'Orion Fast DC1', connector: 'CCS2 (1)', status: 'Ongoing' },
        { userInitials: 'R', userColor: 'bg-rose-100 text-rose-700', userName: 'Rahul M', station: 'Cyber Hub Charging Station', chargePoint: 'EVRE Cyber Hub DC1', connector: 'CCS2 (1)', status: 'Failed' },
        { userInitials: 'M', userColor: 'bg-emerald-100 text-emerald-700', userName: 'Mohit Sharma', station: 'Phoenix Marketcity, Pune', chargePoint: 'Phoenix Fast DC2', connector: 'CCS2 (2)', status: 'Failed' },
        { userInitials: 'S', userColor: 'bg-amber-100 text-amber-700', userName: 'Sarah K', station: 'Nexus Mall, Koramangala', chargePoint: 'Nexus Mall AC3', connector: 'Type2 (1)', status: 'Stopped' },
        { userInitials: 'V', userColor: 'bg-cyan-100 text-cyan-700', userName: 'Vikram Singh', station: 'Lodha The Park, Mumbai', chargePoint: 'EVRE Lodha The Park AC2', connector: 'Type2 (1)', status: 'Stopped' },
        { userInitials: 'D', userColor: 'bg-sky-100 text-sky-700', userName: 'Deepak T', station: 'Nexus Mall, Koramangala', chargePoint: 'Nexus Mall DC1', connector: 'CCS2 (2)', status: 'Stopped' }
      ];
      await prisma.liveSession.createMany({ data: mockData });
      console.log("[Mock OCPP] Seeded 9 initial live sessions into database.");
    }
  } catch (error) {
    console.error("[Mock OCPP] Failed to seed live sessions:", error);
  }
}
seedLiveSessions();

// Mimic  OCPP (Temporarily disabled to reduce system load)
/*
setInterval(async () => {
  try {
    const sessions = await prisma.liveSession.findMany();
    if (sessions.length > 0) {
      const randomIndex = Math.floor(Math.random() * sessions.length);
      const session = sessions[randomIndex];

      const statuses = ['Ongoing', 'Failed', 'Stopped'];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

      if (session.status !== newStatus) {
        const updatedSession = await prisma.liveSession.update({
          where: { id: session.id },
          data: { status: newStatus }
        });
        io.emit('sessionUpdated', updatedSession);
        // console.log(`[Mock OCPP] Updated session ${updatedSession.id} status to ${updatedSession.status}`);
      }
    }
  } catch (error) {
    console.error("[Mock OCPP] Error updating session:", error);
  }
}, 5000);
*/

app.get('/api/livesessions', async (req, res) => {
  try {
    const sessions = await prisma.liveSession.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch live sessions" });
  }
});



app.get('/api/chargepoints/filters', async (req, res) => {
  try {
    const locations = await prisma.chargePoint.findMany({ select: { chargingStation: true }, distinct: ['chargingStation'] });
    const manufacturers = await prisma.chargePoint.findMany({ select: { manufacturer: true }, distinct: ['manufacturer'] });
    const statuses = await prisma.chargePoint.findMany({ select: { stage: true }, distinct: ['stage'] });
    const types = await prisma.chargePoint.findMany({ select: { type: true }, distinct: ['type'] });

    res.json({
      locations: locations.map(l => l.chargingStation).sort(),
      manufacturers: manufacturers.map(m => m.manufacturer).sort(),
      statuses: statuses.map(s => s.stage).sort(),
      types: types.map(t => t.type).sort(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

app.get('/api/chargepoints', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.search || '';

    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

    const whereClause = {
      AND: []
    };


    if (filters.location && filters.location.length > 0) {
      whereClause.AND.push({ chargingStation: { in: filters.location } });
    }
    if (filters.manufacturer && filters.manufacturer.length > 0) {
      whereClause.AND.push({ manufacturer: { in: filters.manufacturer } });
    }
    if (filters.status && filters.status.length > 0) {
      whereClause.AND.push({ stage: { in: filters.status } });
    }
    if (filters.type && filters.type.length > 0) {
      whereClause.AND.push({ type: { in: filters.type } });
    }

    // Fetch all matching basic filters first
    let allData = await prisma.chargePoint.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    // In-memory space-agnostic fuzzy search
    if (searchTerm) {
      const normalizedSearch = searchTerm.replace(/\s+/g, '').toLowerCase();
      allData = allData.filter(cp => {
        const name = (cp.name || '').replace(/\s+/g, '').toLowerCase();
        const station = (cp.chargingStation || '').replace(/\s+/g, '').toLowerCase();
        const code = (cp.code || '').replace(/\s+/g, '').toLowerCase();
        const manufacturer = (cp.manufacturer || '').replace(/\s+/g, '').toLowerCase();

        return name.includes(normalizedSearch) ||
          station.includes(normalizedSearch) ||
          code.includes(normalizedSearch) ||
          manufacturer.includes(normalizedSearch);
      });
    }

    const total = allData.length;
    const paginatedData = allData.slice((page - 1) * limit, page * limit);

    const formattedData = paginatedData.map((cp, idx) => formatChargePointData(cp, idx));

    res.json({
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch charge points", details: error.message, stack: error.stack });
  }
});

function formatChargePointData(cp, idx = 0) {
  let methods = [];
  try {
    methods = cp.chargingMethods ? JSON.parse(cp.chargingMethods) : [];
  } catch (e) {
    methods = [];
  }

  let parsedConnectors = [];
  try {
    parsedConnectors = cp.connectors ? JSON.parse(cp.connectors) : null;
  } catch (e) {
    parsedConnectors = null;
  }

  const cpIdPresets = [
    'CP25R63RV8',
    'CPNYW8F06U',
    'CPR0E3TRQK',
    'CP832NCYSF',
    'CPNMU35QY0',
    'CPBWYOCTOJ',
    'CPC066JB03',
    'CP5JJ82NIQ',
    'CPQFPRMK3K',
    'CPJ6WSAR6L'
  ];

  const qrCodePresets = [
    'CQUHBOICZV',
    'CQ3MT0099C',
    'CQN0SKKCJ',
    'CQ0J6XPPS6',
    'CQLIUF8AQ4',
    'CQQH8H8D0B',
    'CQ65RSXDKC',
    'CQ5NTZQ5R',
    'CQ19MZXMCT',
    'CQ0450IJAB'
  ];

  const connectorOpts = [
    ['15A (2)', '15A (1)', '15A (3)'],
    ['CCS2 (1)', 'CCS2 (2)'],
    ['Type2 (1)'],
    ['Type2 (1)'],
    ['Type2 (1)'],
    ['Type2 (1)'],
    ['Type2 (1)'],
    ['Type2 (1)'],
    ['CCS2 (1)', 'CCS2 (2)'],
    ['15A (1)']
  ];
  const defaultConnectors = connectorOpts[idx % connectorOpts.length];
  const defaultFirmwares = ['2.0.2 & 1.2.6', '2.2.0-2.2.4', '2.0.2', '2.0.2', '2.0.2', '2.0.2', '2.0.2', '2.0.2', '2.2.0-2.2.4', '1.8.8 & 1.2.5'];
  const defaultCapacities = ['9.899999999999999 kW', '-', '-', '-', '-', '-', '-', '-', '-', '3 kW'];
  const defaultLastActive = ['10 mins ago', 'Just now', '1 hour ago', '2 hours ago', 'Yesterday'];

  const resolvedCpId = (cp.cpId && cp.cpId !== cp.code) ? cp.cpId : cpIdPresets[idx % cpIdPresets.length];
  const resolvedQrCode = cp.qrCodeId || qrCodePresets[idx % qrCodePresets.length];

  const defaultOems = ['EVRE', 'Siemens', 'Delta', 'ABB', 'Schneider'];
  const defaultTariffs = ['EVRE TEST', 'DLF Park Place DC', 'DLF Park Place AC', 'Sobha DC', 'Brigade Kovai AC'];
  const defaultStages = ['Active', 'Inactive', 'Maintenance'];

  const resolvedStage = cp.stage || defaultStages[idx % defaultStages.length];

  return {
    ...cp,
    stage: resolvedStage,
    status: cp.status || (resolvedStage === 'Inactive' ? 'Offline' : (idx % 4 === 0 ? 'Offline' : 'Online')),
    cpId: resolvedCpId,
    thirdPartyCpId: cp.thirdPartyCpId || 'NA',
    oem: cp.oem || cp.manufacturer || defaultOems[idx % defaultOems.length],
    zone: cp.zone || '-',
    tariffProfiles: cp.tariffProfiles || defaultTariffs[idx % defaultTariffs.length],
    qrCodeId: resolvedQrCode,
    chargingMethods: methods,
    connectors: parsedConnectors || defaultConnectors,
    lastActive: cp.lastActive || defaultLastActive[idx % defaultLastActive.length],
    totalSessions: cp.totalSessions ?? (idx % 3 === 0 ? (idx * 2) % 15 + 1 : 0),
    energyDelivered: cp.energyDelivered ?? (idx % 3 === 0 ? parseFloat(((idx * 14.23) % 120 + 5).toFixed(2)) : 0),
    revenueGenerated: cp.revenueGenerated ?? (idx % 3 === 0 ? parseFloat(((idx * 245.80) % 2500 + 100).toFixed(2)) : 0),
    mobilityType: cp.mobilityType || 'Stationary',
    firmwareVersion: cp.firmwareVersion || defaultFirmwares[idx % defaultFirmwares.length],
    totalCapacity: cp.totalCapacity || defaultCapacities[idx % defaultCapacities.length],
    mode: cp.mode || 'Public'
  };
}

app.get('/api/chargepoints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cp = await prisma.chargePoint.findUnique({
      where: { id }
    });
    if (!cp) {
      return res.status(404).json({ error: "Charge point not found" });
    }

    res.json(formatChargePointData(cp));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch charge point", details: error.message });
  }
});

app.post('/api/chargepoints', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.code) {
      payload.code = `CP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    const newCp = await prisma.chargePoint.create({
      data: {
        name: payload.name,
        chargingStation: payload.chargingStation,
        manufacturer: payload.manufacturer,
        mode: payload.mode,
        code: payload.code,
        accessibility: payload.accessibility,
        stage: payload.stage || 'Active',
        exclusive: payload.exclusive,
        gracePeriod: payload.gracePeriod !== null && payload.gracePeriod !== undefined ? parseInt(payload.gracePeriod) : null,
        tariffProfiles: payload.tariffProfiles,
        settlementProfile: payload.settlementProfile || '',
        type: payload.type || 'NA',
        chargingMethods: JSON.stringify(payload.supportedChargingMethods || [])
      }
    });

    const formattedCp = { ...newCp, chargingMethods: JSON.parse(newCp.chargingMethods) };

    io.emit('chargePointAdded', formattedCp);

    res.status(201).json(formattedCp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create charge point", details: error.message });
  }
});

app.put('/api/chargepoints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const updatedCp = await prisma.chargePoint.update({
      where: { id },
      data: {
        name: payload.name,
        chargingStation: payload.chargingStation,
        manufacturer: payload.manufacturer,
        mode: payload.mode,
        code: payload.code,
        accessibility: payload.accessibility,
        stage: payload.stage,
        exclusive: payload.exclusive,
        gracePeriod: payload.gracePeriod !== null && payload.gracePeriod !== undefined ? parseInt(payload.gracePeriod) : null,
        tariffProfiles: payload.tariffProfiles,
        settlementProfile: payload.settlementProfile || '',
        type: payload.type || 'NA',
        chargingMethods: JSON.stringify(payload.supportedChargingMethods || [])
      }
    });

    const formattedCp = { ...updatedCp, chargingMethods: JSON.parse(updatedCp.chargingMethods) };

    // Emit WebSocket event
    io.emit('chargePointUpdated', formattedCp);

    res.json(formattedCp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update charge point", details: error.message });
  }
});

app.delete('/api/chargepoints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.chargePoint.delete({
      where: { id }
    });

    io.emit('chargePointDeleted', id);

    res.json({ success: true, message: "Charge point deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete charge point", details: error.message });
  }
});



// CHARGING STATIONS

app.get('/api/charging-stations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.search || '';

    let allData = await prisma.chargingStation.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (searchTerm) {
      const normalizedSearch = searchTerm.replace(/\s+/g, '').toLowerCase();
      allData = allData.filter(cs => {
        const name = (cs.name || '').replace(/\s+/g, '').toLowerCase();
        const code = (cs.code || '').replace(/\s+/g, '').toLowerCase();
        return name.includes(normalizedSearch) || code.includes(normalizedSearch);
      });
    }

    const total = allData.length;
    const paginatedData = allData.slice((page - 1) * limit, page * limit);

    res.json({
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch charging stations" });
  }
});

app.post('/api/charging-stations', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.code) {
      payload.code = `CS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    const newCs = await prisma.chargingStation.create({
      data: {
        name: payload.name,
        code: payload.code,
        chargePoints: parseInt(payload.chargePoints) || 0,
        totalSessions: parseInt(payload.totalSessions) || 0,
        revenueGenerated: parseFloat(payload.revenueGenerated) || 0,
        energyDelivered: parseFloat(payload.energyDelivered) || 0,
      }
    });
    io.emit('chargingStationAdded', newCs);
    res.status(201).json(newCs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create charging station" });
  }
});

app.put('/api/charging-stations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updatedCs = await prisma.chargingStation.update({
      where: { id },
      data: {
        name: payload.name,
        code: payload.code,
        chargePoints: parseInt(payload.chargePoints) || 0,
        totalSessions: parseInt(payload.totalSessions) || 0,
        revenueGenerated: parseFloat(payload.revenueGenerated) || 0,
        energyDelivered: parseFloat(payload.energyDelivered) || 0,
      }
    });
    io.emit('chargingStationUpdated', updatedCs);
    res.json(updatedCs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update charging station" });
  }
});

app.delete('/api/charging-stations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.chargingStation.delete({ where: { id } });
    io.emit('chargingStationDeleted', id);
    res.json({ success: true, message: "Charging station deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete charging station" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
