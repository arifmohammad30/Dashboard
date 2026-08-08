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
      console.log("[Mock Database] Seeded 9 initial live sessions.");
    }
  } catch (error) {
    console.error("Failed to seed live sessions:", error);
  }
}
seedLiveSessions();

app.get(['/api/live-sessions', '/api/livesessions'], async (req, res) => {
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

app.get(['/api/charge-points/filters', '/api/chargepoints/filters'], async (req, res) => {
  try {
    const locations = await prisma.chargePoint.findMany({ select: { chargingStation: true }, distinct: ['chargingStation'] });
    const manufacturers = await prisma.chargePoint.findMany({ select: { manufacturer: true }, distinct: ['manufacturer'] });
    const statuses = await prisma.chargePoint.findMany({ select: { stage: true }, distinct: ['stage'] });
    const types = await prisma.chargePoint.findMany({ select: { type: true }, distinct: ['type'] });

    res.json({
      locations: locations.map(l => l.chargingStation).sort(),
      manufacturers: manufacturers.map(m => m.manufacturer).sort(),
      statuses: ['Available', 'Charging', 'Faulted', 'Preparing'],
      types: types.map(t => t.type).sort(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

app.get(['/api/charge-points', '/api/chargepoints'], async (req, res) => {
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

    let allData = await prisma.chargePoint.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    if (searchTerm) {
      const searchTokens = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
      allData = allData.filter(cp => {
        const searchableText = [
          cp.name,
          cp.chargingStation,
          cp.code,
          cp.manufacturer,
          cp.stage,
          cp.type,
          cp.model,
          cp.tariffProfile
        ].join(' ').toLowerCase();

        return searchTokens.every(token => isTokenMatchedServer(searchableText, token));
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
    res.status(500).json({ error: "Failed to fetch charge points", details: error.message });
  }
});

function formatChargePointData(cp, idx = 0) {
  let methods = [];
  try {
    methods = cp.chargingMethods ? JSON.parse(cp.chargingMethods) : [];
  } catch (e) {
    methods = [];
  }

  let parsedConnectors = null;
  if (cp.connectors) {
    if (Array.isArray(cp.connectors)) {
      parsedConnectors = cp.connectors;
    } else if (typeof cp.connectors === 'string') {
      try {
        const parsed = JSON.parse(cp.connectors);
        parsedConnectors = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        parsedConnectors = [cp.connectors];
      }
    }
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
  const isStageDisabled = resolvedStage === 'Inactive' || resolvedStage === 'Maintenance';
  const resolvedStatus = (isStageDisabled || cp.availability === 'Inoperative')
    ? 'Faulted'
    : (cp.status && cp.status !== 'Faulted' ? cp.status : 'Available');

  return {
    ...cp,
    stage: resolvedStage,
    status: resolvedStatus,
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

app.get(['/api/charge-points/:id', '/api/chargepoints/:id'], async (req, res) => {
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

app.post(['/api/charge-points', '/api/chargepoints'], async (req, res) => {
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

app.put(['/api/charge-points/:id', '/api/chargepoints/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const dataToUpdate = {};
    if (payload.name !== undefined) dataToUpdate.name = payload.name;
    if (payload.chargingStation !== undefined) dataToUpdate.chargingStation = payload.chargingStation;
    if (payload.manufacturer !== undefined) dataToUpdate.manufacturer = payload.manufacturer;
    if (payload.mode !== undefined) dataToUpdate.mode = payload.mode;
    if (payload.code !== undefined) dataToUpdate.code = payload.code;
    if (payload.accessibility !== undefined) dataToUpdate.accessibility = payload.accessibility;
    if (payload.stage !== undefined) dataToUpdate.stage = payload.stage;
    if (payload.status !== undefined) dataToUpdate.status = payload.status;
    if (payload.connectors !== undefined) dataToUpdate.connectors = typeof payload.connectors === 'string' ? payload.connectors : JSON.stringify(payload.connectors);
    if (payload.exclusive !== undefined) dataToUpdate.exclusive = payload.exclusive;
    if (payload.gracePeriod !== undefined) dataToUpdate.gracePeriod = payload.gracePeriod !== null ? parseInt(payload.gracePeriod) : null;
    if (payload.tariffProfiles !== undefined) dataToUpdate.tariffProfiles = payload.tariffProfiles;
    if (payload.settlementProfile !== undefined) dataToUpdate.settlementProfile = payload.settlementProfile;
    if (payload.type !== undefined) dataToUpdate.type = payload.type;
    if (payload.supportedChargingMethods !== undefined) dataToUpdate.chargingMethods = JSON.stringify(payload.supportedChargingMethods);

    const updatedCp = await prisma.chargePoint.update({
      where: { id },
      data: dataToUpdate
    });

    let methods = [];
    try { methods = JSON.parse(updatedCp.chargingMethods); } catch (e) {}

    const formattedCp = { ...updatedCp, chargingMethods: methods };
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

const LOCATION_HUBS = [
  { id: '1', name: 'Location 1 Hub', code: 'HUB-001', chargePoints: 8, totalSessions: 1240, revenueGenerated: 48500, energyDelivered: 12400, totalCapacity: '111.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'Jul 25, 2026 10:23 am', latitude: '17.286609', longitude: '78.364512' },
  { id: '2', name: 'Location 2 Hub', code: 'HUB-002', chargePoints: 6, totalSessions: 980, revenueGenerated: 36200, energyDelivered: 9100, totalCapacity: '60.00 kW', stationType: 'Commercial', mobilityType: 'Stationary', createdOn: 'Jul 07, 2026 05:55 pm', latitude: '28.442523', longitude: '77.102490' },
  { id: '3', name: 'Location 3 Hub', code: 'HUB-003', chargePoints: 12, totalSessions: 2100, revenueGenerated: 84000, energyDelivered: 21500, totalCapacity: '150.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'Jul 07, 2026 05:51 pm', latitude: '28.442523', longitude: '77.102490' },
  { id: '4', name: 'Location 4 Hub', code: 'HUB-004', chargePoints: 4, totalSessions: 450, revenueGenerated: 18000, energyDelivered: 4500, totalCapacity: '45.00 kW', stationType: 'Private', mobilityType: 'Stationary', createdOn: 'Jul 04, 2026 04:06 pm', latitude: '19.098970', longitude: '72.877655' },
  { id: '5', name: 'Location 5 Hub', code: 'HUB-005', chargePoints: 10, totalSessions: 1650, revenueGenerated: 62000, energyDelivered: 15800, totalCapacity: '120.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'Jul 04, 2026 04:02 pm', latitude: '19.099899', longitude: '72.878120' },
  { id: '6', name: 'Location 6 Hub', code: 'HUB-006', chargePoints: 6, totalSessions: 890, revenueGenerated: 31000, energyDelivered: 8200, totalCapacity: '60.00 kW', stationType: 'Commercial', mobilityType: 'Stationary', createdOn: 'Jul 04, 2026 10:54 am', latitude: '28.517055', longitude: '77.210415' },
  { id: '7', name: 'Location 7 Hub', code: 'HUB-007', chargePoints: 14, totalSessions: 2400, revenueGenerated: 95000, energyDelivered: 24100, totalCapacity: '180.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'Jun 29, 2026 02:15 pm', latitude: '17.454825', longitude: '78.372100' },
  { id: '8', name: 'Location 8 Hub', code: 'HUB-008', chargePoints: 5, totalSessions: 620, revenueGenerated: 23000, energyDelivered: 6000, totalCapacity: '50.00 kW', stationType: 'Commercial', mobilityType: 'Stationary', createdOn: 'Jun 25, 2026 11:30 am', latitude: '12.971598', longitude: '77.594562' },
  { id: '9', name: 'Location 9 Hub', code: 'HUB-009', chargePoints: 9, totalSessions: 1420, revenueGenerated: 54000, energyDelivered: 13900, totalCapacity: '90.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'Jun 20, 2026 09:40 am', latitude: '13.082680', longitude: '80.270718' },
  { id: '10', name: 'Location 10 Hub', code: 'HUB-010', chargePoints: 16, totalSessions: 2950, revenueGenerated: 112000, energyDelivered: 28900, totalCapacity: '200.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'Jun 15, 2026 03:20 pm', latitude: '22.572646', longitude: '88.363895' },
  { id: '11', name: 'Location 11 Hub', code: 'HUB-011', chargePoints: 8, totalSessions: 1100, revenueGenerated: 42000, energyDelivered: 10800, totalCapacity: '80.00 kW', stationType: 'Commercial', mobilityType: 'Stationary', createdOn: 'Jun 10, 2026 01:10 pm', latitude: '18.520430', longitude: '73.856744' },
  { id: '12', name: 'Location 12 Hub', code: 'HUB-012', chargePoints: 6, totalSessions: 780, revenueGenerated: 29000, energyDelivered: 7500, totalCapacity: '60.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'Jun 05, 2026 10:05 am', latitude: '23.022505', longitude: '72.571362' },
  { id: '13', name: 'Location 13 Hub', code: 'HUB-013', chargePoints: 10, totalSessions: 1750, revenueGenerated: 68000, energyDelivered: 17100, totalCapacity: '120.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'May 30, 2026 04:50 pm', latitude: '26.912434', longitude: '75.787271' },
  { id: '14', name: 'Location 14 Hub', code: 'HUB-014', chargePoints: 7, totalSessions: 910, revenueGenerated: 34000, energyDelivered: 8900, totalCapacity: '70.00 kW', stationType: 'Commercial', mobilityType: 'Stationary', createdOn: 'May 25, 2026 11:15 am', latitude: '30.733315', longitude: '76.779419' },
  { id: '15', name: 'Location 15 Hub', code: 'HUB-015', chargePoints: 12, totalSessions: 2050, revenueGenerated: 81000, energyDelivered: 20200, totalCapacity: '150.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'May 20, 2026 02:40 pm', latitude: '15.299326', longitude: '74.123996' },
  { id: '16', name: 'Location 16 Hub', code: 'HUB-016', chargePoints: 4, totalSessions: 390, revenueGenerated: 15500, energyDelivered: 3800, totalCapacity: '40.00 kW', stationType: 'Private', mobilityType: 'Stationary', createdOn: 'May 15, 2026 08:30 am', latitude: '9.931233', longitude: '76.267304' },
  { id: '17', name: 'Location 17 Hub', code: 'HUB-017', chargePoints: 8, totalSessions: 1280, revenueGenerated: 49000, energyDelivered: 12600, totalCapacity: '80.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'May 10, 2026 05:25 pm', latitude: '21.170240', longitude: '72.831061' },
  { id: '18', name: 'Location 18 Hub', code: 'HUB-018', chargePoints: 15, totalSessions: 2700, revenueGenerated: 104000, energyDelivered: 26500, totalCapacity: '180.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'May 05, 2026 12:00 pm', latitude: '26.846708', longitude: '80.946159' },
  { id: '19', name: 'Location 19 Hub', code: 'HUB-019', chargePoints: 6, totalSessions: 840, revenueGenerated: 32500, energyDelivered: 8300, totalCapacity: '60.00 kW', stationType: 'Commercial', mobilityType: 'Stationary', createdOn: 'May 01, 2026 09:10 am', latitude: '25.594095', longitude: '85.137566' },
  { id: '20', name: 'Location 20 Hub', code: 'HUB-020', chargePoints: 11, totalSessions: 1890, revenueGenerated: 73000, energyDelivered: 18400, totalCapacity: '130.00 kW', stationType: 'Public', mobilityType: 'Stationary', createdOn: 'Apr 25, 2026 03:45 pm', latitude: '20.296059', longitude: '85.824539' },
];

app.get('/api/charging-stations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const searchTerm = req.query.search || '';

    const dbStations = await prisma.chargingStation.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const dbChargePoints = await prisma.chargePoint.findMany({
      select: { id: true, name: true, chargingStation: true, code: true }
    });

    const stationCpMap = new Map();
    for (let i = 0; i < dbChargePoints.length; i++) {
      const cp = dbChargePoints[i];
      if (cp.chargingStation) {
        const key = cp.chargingStation.toLowerCase().trim();
        if (!stationCpMap.has(key)) {
          stationCpMap.set(key, []);
        }
        stationCpMap.get(key).push(cp);
      }
    }

    let allData = dbStations.map((cs) => {
      const csNameKey = cs.name.toLowerCase().trim();
      let matchingCps = stationCpMap.get(csNameKey) || [];

      if (matchingCps.length === 0) {
        matchingCps = dbChargePoints.filter(cp =>
          cp.chargingStation && (
            cp.chargingStation.toLowerCase().includes(csNameKey) ||
            csNameKey.includes(cp.chargingStation.toLowerCase())
          )
        );
      }

      const mainCp = matchingCps[0] || null;

      return {
        ...cs,
        chargePoints: matchingCps.length || cs.chargePoints,
        chargePointName: mainCp ? mainCp.name : '',
        chargePointId: mainCp ? mainCp.id : null,
        chargePointsList: matchingCps,
        createdOn: cs.createdAt ? new Date(cs.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'
      };
    });

    if (searchTerm) {
      const searchTokens = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
      allData = allData.filter(cs => {
        const searchableText = [
          cs.name,
          cs.code,
          cs.chargePointName,
          cs.stationType,
          cs.mobilityType,
          cs.totalCapacity,
          ...(cs.chargePointsList || []).map(cp => `${cp.name} ${cp.code}`)
        ].join(' ').toLowerCase();

        return searchTokens.every(token => isTokenMatchedServer(searchableText, token));
      });
    }

    const total = allData.length;
    const paginatedData = allData.slice((page - 1) * limit, page * limit);

    res.json({
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    console.error("Error fetching charging stations:", error);
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
        chargePoints: parseInt(payload.chargePoints) || 5,
        totalSessions: parseInt(payload.totalSessions) || 0,
        revenueGenerated: parseFloat(payload.revenueGenerated) || 0,
        energyDelivered: parseFloat(payload.energyDelivered) || 0,
        totalCapacity: payload.totalCapacity || '120 kW',
        stationType: payload.stationType || 'Public Fast Hub',
        mobilityType: payload.mobilityType || 'Stationary',
        latitude: parseFloat(payload.latitude) || 19.0760,
        longitude: parseFloat(payload.longitude) || 72.8777,
      }
    });
    io.emit('chargingStationAdded', newCs);
    res.status(201).json(newCs);
  } catch (error) {
    console.error("Error creating charging station:", error);
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
        chargePoints: parseInt(payload.chargePoints) || 5,
        totalSessions: parseInt(payload.totalSessions) || 0,
        revenueGenerated: parseFloat(payload.revenueGenerated) || 0,
        energyDelivered: parseFloat(payload.energyDelivered) || 0,
      }
    });
    io.emit('chargingStationUpdated', updatedCs);
    res.json(updatedCs);
  } catch (error) {
    console.error("Error updating charging station:", error);
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
    console.error("Error deleting charging station:", error);
    res.status(500).json({ error: "Failed to delete charging station" });
  }
});

// Tariffs API Endpoints
app.get('/api/tariffs', async (req, res) => {
  try {
    const tariffs = await prisma.tariff.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const formatted = tariffs.map(t => ({
      id: t.id,
      name: t.name,
      code: t.code,
      type: t.type || 'Default',
      costingType: 'Charging Only',
      applicableTo: 'All Fleets',
      chargingFee: `₹${t.baseRate.toFixed(2)} / kWh`,
      parkingFee: 'NA',
      idleFee: '₹0 / min',
      soc: 'NA',
      startsAt: 'NA',
      endsAt: 'NA',
      weight: 1,
      createdOn: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-',
      gstPercentage: `${t.gstPercentage}%`
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching tariffs:", error);
    res.status(500).json({ error: "Failed to fetch tariffs" });
  }
});

app.post('/api/tariffs', async (req, res) => {
  try {
    const payload = req.body;
    const newTariff = await prisma.tariff.create({
      data: {
        name: payload.name,
        code: payload.code || `TAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        type: payload.type || 'Default',
        baseRate: parseFloat(payload.baseRate) || 15.0,
        gstPercentage: parseFloat(payload.gstPercentage) || 18.0,
        description: payload.description || ''
      }
    });
    res.status(201).json(newTariff);
  } catch (error) {
    console.error("Error creating tariff:", error);
    res.status(500).json({ error: "Failed to create tariff" });
  }
});

app.delete('/api/tariffs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tariff.delete({ where: { id } });
    res.json({ success: true, message: "Tariff deleted" });
  } catch (error) {
    console.error("Error deleting tariff:", error);
    res.status(500).json({ error: "Failed to delete tariff" });
  }
});

function isTokenMatchedServer(text, token) {
  if (!text || !token) return false;
  const lowerText = text.toLowerCase();
  const lowerToken = token.toLowerCase();

  if (lowerText === lowerToken) return true;

  const escaped = lowerToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`(?:^|\\b|\\s|_|-)${escaped}(?:$|\\b|\\s|_|-)`, 'i');

  if (wordBoundaryRegex.test(lowerText)) {
    return true;
  }

  if (lowerToken.length >= 4 && !/^\d+$/.test(lowerToken)) {
    return lowerText.includes(lowerToken);
  }

  return false;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
