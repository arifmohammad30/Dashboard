import prisma from '../../prisma.js';
import { createSessionTemplate } from './mockSessionTemplate.js';
import { io as ioClient } from 'socket.io-client';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const socketUrl = process.env.SOCKET_URL || 'http://localhost:5000';

const socket = ioClient(socketUrl, {
  reconnection: true,
  transports: ['websocket', 'polling']
});

function waitForSocketConnection() {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Socket.IO connection timeout'));
    }, 10000);

    socket.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });

    socket.once('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

socket.on('connect', () => {
  console.log(`Socket connected: ${socket.id}`);
});

socket.on('connect_error', (error) => {
  console.error(`Socket connection error: ${error.message}`);
});

async function simulateChargePoint(cp, driverPool, cpIndex) {
  if (!cp.chargingStation) {
    console.error(`Skipping ${cp.code}: ChargingStation relation not found`);
    return;
  }

  if (!cp.connectors || cp.connectors.length === 0) {
    console.error(`Skipping ${cp.code}: Connector relation not found`);
    return;
  }

  const station = cp.chargingStation;
  const tariff = cp.tariff || {
    baseRate: 15.0,
    gstPercentage: 18.0
  };

  // Run 3 sequential sessions per ChargePoint
  for (let sessionNum = 1; sessionNum <= 3; sessionNum++) {
    // Select dynamic driver from driver pool
    const driverIndex = (cpIndex * 3 + (sessionNum - 1)) % driverPool.length;
    const driver = driverPool[driverIndex];

    // Select the interconnected connector belonging to this ChargePoint
    const connectorIndex = (sessionNum - 1) % cp.connectors.length;
    const connector = cp.connectors[connectorIndex];

    const isDc =
      connector.type?.toUpperCase().includes('DC') ||
      connector.type?.toUpperCase().includes('CCS') ||
      connector.type?.toUpperCase().includes('CHADEMO') ||
      cp.type?.toUpperCase().includes('DC') ||
      station.name?.toLowerCase().includes('dc');

    const baseVoltage = isDc ? 400.0 : 235.0;
    const basePower = connector.maxPower || (isDc ? 60.0 : 22.0);

    const startTime = new Date();

    let currentSoc = 20.0;
    let energyAccumulated = 0.0;

    // Simulate selected sessions failing for testing.
    const shouldFail =
      (cpIndex === 1 && sessionNum === 2) ||
      (cpIndex === 3 && sessionNum === 1) ||
      (cpIndex === 2 && sessionNum === 2);

    const failAtTick = shouldFail
      ? cpIndex === 1
        ? 5
        : cpIndex === 3
          ? 4
          : 6
      : null;

    const totalTicks = shouldFail ? failAtTick : 12;

    const sessionObj = createSessionTemplate();

    const generatedId =
      `sess_${cp.code.toLowerCase()}_tx0${sessionNum}_${Date.now()}`;

    sessionObj.id = generatedId;
    sessionObj.sessionId = generatedId;
    sessionObj.status = 'Ongoing';

    sessionObj.chargePoint = {
      id: cp.id,
      code: cp.code,
      name: cp.name
    };

    sessionObj.chargingStation = {
      id: station.id,
      name: station.name
    };

    sessionObj.connector = {
      id: connector.id,
      connectorId: connector.connectorId,
      type: connector.type,
      maxPower: connector.maxPower
    };

    sessionObj.driver = {
      id: driver.id,
      name: driver.name || 'EV Driver',
      initials: driver.initials || 'ED',
      color: driver.color || 'bg-indigo-100 text-indigo-700'
    };

    sessionObj.userName = driver.name || 'EV Driver';
    sessionObj.userInitials = driver.initials || 'ED';
    sessionObj.userColor = driver.color || 'bg-indigo-100 text-indigo-700';

    sessionObj.station = station.name;
    sessionObj.chargingStationId = station.id;
    sessionObj.chargePointCode = cp.code;
    sessionObj.chargePointId = cp.id;

    sessionObj.startedAt = startTime.toISOString();

    sessionObj.soc.initial = currentSoc;
    sessionObj.soc.current = currentSoc;

    sessionObj.initialSoc = currentSoc;
    sessionObj.currentSoc = currentSoc;

    console.log(
      `[${cp.code}] Session ${sessionNum} started (Driver: ${driver.name})`
    );

    socket.emit('session:created', sessionObj);

    for (let tick = 1; tick <= totalTicks; tick++) {
      await sleep(1500);

      currentSoc = parseFloat(
        Math.min(95.0, currentSoc + 2.5).toFixed(1)
      );

      const powerJitter =
        Math.sin(tick) * 0.8 +
        (Math.random() * 0.5 - 0.25);

      const powerKw = parseFloat(
        Math.max(1.0, basePower + powerJitter).toFixed(2)
      );

      const voltage = parseFloat(
        (baseVoltage + Math.sin(tick * 2) * 1.5).toFixed(1)
      );

      const currentA = parseFloat(
        (
          (powerKw * 1000) /
          (voltage * (isDc ? 1.0 : 1.64))
        ).toFixed(1)
      );

      const energyIncrement = parseFloat(
        (powerKw * (1.5 / 3600)).toFixed(4)
      );

      energyAccumulated = parseFloat(
        (energyAccumulated + energyIncrement).toFixed(4)
      );

      const baseRate = tariff.baseRate || 15.0;
      const gstPercent = tariff.gstPercentage || 18.0;

      const cost = parseFloat(
        (
          energyAccumulated *
          baseRate *
          (1 + gstPercent / 100)
        ).toFixed(2)
      );

      sessionObj.soc.current = currentSoc;
      sessionObj.currentSoc = currentSoc;

      sessionObj.energyDeliveredKwh = energyAccumulated;
      sessionObj.kwhDelivered = energyAccumulated;

      sessionObj.powerKw = powerKw;
      sessionObj.voltage = voltage;
      sessionObj.current = currentA;
      sessionObj.cost = cost;

      sessionObj.updatedAt = new Date().toISOString();

      console.log(
        `[${cp.code}] Session ${sessionNum} telemetry ${tick}/${totalTicks} | ` +
        `Driver: ${driver.name} | SoC ${currentSoc}% | Power ${powerKw} kW | ` +
        `Energy ${energyAccumulated} kWh | Cost ₹${cost}`
      );

      socket.emit('session:updated', sessionObj);
    }

    if (shouldFail) {
      sessionObj.status = 'Failed';
      sessionObj.stopReason = 'EV Communication Error / Hardware Fault';

      sessionObj.updatedAt = new Date().toISOString();

      console.log(
        `[${cp.code}] Session ${sessionNum} failed (Driver: ${driver.name})`
      );
    } else {
      sessionObj.status = 'Completed';
      sessionObj.stopReason = 'Local / Remote Stop';

      sessionObj.updatedAt = new Date().toISOString();

      console.log(
        `[${cp.code}] Session ${sessionNum} completed (Driver: ${driver.name})`
      );
    }

    socket.emit('session:stopped', sessionObj);
    socket.emit('session:updated', sessionObj);

    // Small gap before the next session on this ChargePoint.
    await sleep(1500);
  }
}

async function runTelemetryGenerator() {
  console.log('Starting telemetry generator');

  try {
    await waitForSocketConnection();

    const chargePoints = await prisma.chargePoint.findMany({
      take: 4,
      include: {
        chargingStation: true,
        connectors: true,
        tariff: true
      }
    });

    if (!chargePoints || chargePoints.length === 0) {
      console.error('No ChargePoints found in database');
      return;
    }

    // Query real users from database
    const dbUsers = await prisma.user.findMany({ take: 10 });

    const fallbackDrivers = [
      { id: 'usr_01', name: 'Alex Rivera', initials: 'AR', color: 'bg-indigo-100 text-indigo-700' },
      { id: 'usr_02', name: 'Priya Sharma', initials: 'PS', color: 'bg-emerald-100 text-emerald-700' },
      { id: 'usr_03', name: 'Vikram Malhotra', initials: 'VM', color: 'bg-amber-100 text-amber-700' },
      { id: 'usr_04', name: 'Sarah Chen', initials: 'SC', color: 'bg-purple-100 text-purple-700' },
      { id: 'usr_05', name: 'Marcus Vance', initials: 'MV', color: 'bg-rose-100 text-rose-700' },
      { id: 'usr_06', name: 'Ananya Rao', initials: 'AR', color: 'bg-teal-100 text-teal-700' }
    ];

    const driverPool = dbUsers.length > 0
      ? dbUsers.map((u, idx) => ({
          id: u.id,
          name: u.name || `EV Driver ${idx + 1}`,
          initials: u.name ? u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : `D${idx + 1}`,
          color: fallbackDrivers[idx % fallbackDrivers.length].color
        }))
      : fallbackDrivers;

    console.log(
      `Starting simulation for ${chargePoints.length} ChargePoints across ${driverPool.length} EV Drivers`
    );

    await Promise.all(
      chargePoints.map(async (cp, cpIndex) => {
        if (cpIndex > 0) {
          await sleep(cpIndex * 2500);
        }

        return simulateChargePoint(
          cp,
          driverPool,
          cpIndex
        );
      })
    );

    console.log('All telemetry simulations completed');
  } finally {
    await sleep(500);

    socket.disconnect();
    await prisma.$disconnect();
  }
}

runTelemetryGenerator().catch((error) => {
  console.error(`Telemetry generator error: ${error.message}`);

  socket.disconnect();
  prisma.$disconnect();
});