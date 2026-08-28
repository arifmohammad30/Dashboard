import prisma from '../prisma.js';
import { io as ioClient } from 'socket.io-client';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const socketUrl = process.env.SOCKET_URL || 'http://localhost:5000';
const ACTIVE_CHARGERS = 2; // Limited to 2 ChargePoints as requested

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
  console.log(`[Mock Hardware] Socket connected: ${socket.id}`);
});

socket.on('ocpp:remote-start', (data) => {
  console.log(`[Mock Hardware] Received RemoteStartTransaction request for ${data.chargePointCode} (Connector #${data.connectorId})`);
});

socket.on('connect_error', (error) => {
  console.error(`[Mock Hardware] Socket connection error: ${error.message}`);
});

function sendCallAndWaitForConf(action, payload, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const msgId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const callFrame = [2, msgId, action, payload];

    let timer = null;

    const confHandler = (responseFrame) => {
      if (Array.isArray(responseFrame) && responseFrame[0] === 3 && responseFrame[1] === msgId) {
        if (timer) clearTimeout(timer);
        socket.off('ocpp:conf', confHandler);
        resolve({ success: true, payload: responseFrame[2] });
      }
    };

    socket.on('ocpp:conf', confHandler);

    timer = setTimeout(() => {
      socket.off('ocpp:conf', confHandler);
      resolve({ success: false, timeout: true });
    }, timeoutMs);

    console.log(`[${payload.chargePointCode || 'OCPP Outbound'}] CALL [${msgId}] ${action}:`, JSON.stringify(payload));
    socket.emit('ocpp:frame', callFrame);
    socket.emit('ocpp:message', callFrame);
  });
}

async function simulateChargePoint(cp, cpIndex) {
  if (!cp.chargingStation) {
    console.error(`Skipping ${cp.code}: ChargingStation relation not found`);
    return;
  }

  if (!cp.connectors || cp.connectors.length === 0) {
    console.error(`Skipping ${cp.code}: Connector relation not found`);
    return;
  }

  const station = cp.chargingStation;

  await sendCallAndWaitForConf('BootNotification', {
    chargePointCode: cp.code,
    chargePointVendor: cp.manufacturer || 'EVNet Hardware',
    chargePointModel: cp.name || 'ProCharge AC/DC',
    firmwareVersion: cp.firmwareVersion || '1.0.4'
  });

  await sendCallAndWaitForConf('StatusNotification', {
    chargePointCode: cp.code,
    connectorId: 0,
    errorCode: 'NoError',
    status: 'Available',
    timestamp: new Date().toISOString()
  });

  // Limited to 2 sessions per chargepoint as requested
  for (let sessionNum = 1; sessionNum <= 2; sessionNum++) {
    const connectorIndex = (sessionNum - 1) % cp.connectors.length;
    const connector = cp.connectors[connectorIndex];
    const connectorId = connector.connectorId || connectorIndex + 1;

    const isDc =
      connector.type?.toUpperCase().includes('DC') ||
      connector.type?.toUpperCase().includes('CCS') ||
      connector.type?.toUpperCase().includes('CHADEMO') ||
      cp.type?.toUpperCase().includes('DC') ||
      station.name?.toLowerCase().includes('dc');

    const baseVoltage = isDc ? 400.0 : 235.0;
    const basePower = connector.maxPower || (isDc ? 60.0 : 22.0);

    const idTagList = ['TAG-8091', 'TAG-9042', 'TAG-1048', 'TAG-7023', 'TAG-3094'];
    const idTag = idTagList[(cpIndex * 2 + sessionNum - 1) % idTagList.length];

    const shouldFail = (cpIndex === 1 && sessionNum === 2);
    const failAtTick = shouldFail ? 3 : null;
    const totalTicks = shouldFail ? failAtTick : 4;

    await sendCallAndWaitForConf('StatusNotification', {
      chargePointCode: cp.code,
      connectorId,
      errorCode: 'NoError',
      status: 'Preparing',
      timestamp: new Date().toISOString()
    });

    const initialMeterWh = 10000 + (cpIndex * 5000) + ((sessionNum - 1) * 2500);
    let cumulativeEnergyWh = initialMeterWh;
    let currentSoc = 20.0;

    const startRes = await sendCallAndWaitForConf('StartTransaction', {
      chargePointCode: cp.code,
      connectorId,
      idTag,
      meterStart: initialMeterWh,
      timestamp: new Date().toISOString()
    });

    const transactionId = (startRes.success && startRes.payload?.transactionId)
      ? startRes.payload.transactionId
      : (1000 + cpIndex * 10 + sessionNum);

    console.log(`[${cp.code}] Session ${sessionNum} StartTransaction sent -> Received txId: ${transactionId} (idTag: ${idTag})`);

    await sendCallAndWaitForConf('StatusNotification', {
      chargePointCode: cp.code,
      connectorId,
      errorCode: 'NoError',
      status: 'Charging',
      timestamp: new Date().toISOString()
    });

    for (let tick = 1; tick <= totalTicks; tick++) {
      await sleep(1000);

      currentSoc = parseFloat(Math.min(95.0, currentSoc + 5.0).toFixed(1));

      const powerJitter = Math.sin(tick) * 0.8;
      const powerKw = parseFloat(Math.max(1.0, basePower + powerJitter).toFixed(2));
      const voltage = parseFloat((baseVoltage + Math.sin(tick * 2) * 1.5).toFixed(1));
      const currentA = parseFloat(((powerKw * 1000) / (voltage * (isDc ? 1.0 : 1.64))).toFixed(1));

      const energyIncrementWh = Math.round(powerKw * 1000 * (2.5 / 3600));
      cumulativeEnergyWh += energyIncrementWh;

      const meterValuesPayload = {
        chargePointCode: cp.code,
        connectorId,
        transactionId,
        meterValue: [
          {
            timestamp: new Date().toISOString(),
            sampledValue: [
              {
                value: String(cumulativeEnergyWh),
                measurand: 'Energy.Active.Import.Register',
                unit: 'Wh'
              },
              {
                value: String(powerKw),
                measurand: 'Power.Active.Import',
                unit: 'kW'
              },
              {
                value: String(voltage),
                measurand: 'Voltage',
                unit: 'V'
              },
              {
                value: String(currentA),
                measurand: 'Current.Import',
                unit: 'A'
              },
              {
                value: String(currentSoc),
                measurand: 'SoC',
                unit: 'Percent'
              }
            ]
          }
        ]
      };

      console.log(
        `[${cp.code}] Session ${sessionNum} tick ${tick}/${totalTicks} | ` +
        `txId: ${transactionId} | SoC: ${currentSoc}% | Power: ${powerKw} kW | Meter: ${cumulativeEnergyWh} Wh`
      );

      await sendCallAndWaitForConf('MeterValues', meterValuesPayload);
    }

    const stopReason = shouldFail ? 'OtherError' : 'Local';
    const stopErrorCode = shouldFail ? 'EVCommunicationError' : 'NoError';

    if (shouldFail) {
      await sendCallAndWaitForConf('StatusNotification', {
        chargePointCode: cp.code,
        connectorId,
        errorCode: stopErrorCode,
        status: 'Faulted',
        timestamp: new Date().toISOString()
      });
    }

    await sendCallAndWaitForConf('StopTransaction', {
      chargePointCode: cp.code,
      transactionId,
      meterStop: cumulativeEnergyWh,
      timestamp: new Date().toISOString(),
      reason: stopReason
    });

    console.log(
      `[${cp.code}] Session ${sessionNum} (txId: ${transactionId}) StopTransaction sent (${shouldFail ? 'FAILED' : 'COMPLETED'})`
    );

    await sendCallAndWaitForConf('StatusNotification', {
      chargePointCode: cp.code,
      connectorId,
      errorCode: 'NoError',
      status: 'Available',
      timestamp: new Date().toISOString()
    });

    await sleep(1000);
  }
}

async function runTelemetryGenerator() {
  console.log('Starting OCPP 1.6J Hardware Simulation for 2 DB ChargePoints (2 Sessions each)...');

  try {
    await waitForSocketConnection();

    const chargePoints = await prisma.chargePoint.findMany({
      take: ACTIVE_CHARGERS,
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

    console.log(
      `Selected ${chargePoints.length} ChargePoints from DB: [${chargePoints.map(c => c.code).join(', ')}]`
    );

    await Promise.all(
      chargePoints.map(async (cp, cpIndex) => {
        if (cpIndex > 0) {
          await sleep(cpIndex * 1500);
        }

        return simulateChargePoint(cp, cpIndex);
      })
    );

    console.log('All OCPP 1.6J mock charger simulations completed');
  } finally {
    await sleep(500);

    socket.disconnect();
    await prisma.$disconnect();
  }
}

runTelemetryGenerator().catch((error) => {
  console.error(`OCPP Mock Telemetry generator error: ${error.message}`);

  socket.disconnect();
  prisma.$disconnect();
});
