import { processOcppMessage } from '../modules/ocpp/ocpp.service.js';
import prisma from '../prisma.js';

const activeRemoteMockIntervals = new Map();
const activeTxIdMap = new Map();

export async function handleRemoteStartOcppMock(data, socket, io) {
  const { chargePointCode, connectorId } = data;
  console.log(`[Mock OCPP Hardware Handler] Received RemoteStartTransaction request for ${chargePointCode} (Connector #${connectorId})`);

  const cp = await prisma.chargePoint.findUnique({
    where: { code: chargePointCode }
  });

  if (!cp) return;

  const msgId1 = `msg_st_${Date.now()}`;
  const startTxFrame = [
    2,
    msgId1,
    'StartTransaction',
    {
      chargePointCode,
      connectorId: connectorId || 1,
      idTag: 'TAG-REMOTE-809',
      meterStart: 10000,
      timestamp: new Date().toISOString()
    }
  ];

  await processOcppMessage(startTxFrame, socket, io);

  const statusChargingFrame = [
    2,
    `msg_sn_${Date.now()}`,
    'StatusNotification',
    {
      chargePointCode,
      connectorId: connectorId || 1,
      errorCode: 'NoError',
      status: 'Charging',
      timestamp: new Date().toISOString()
    }
  ];
  await processOcppMessage(statusChargingFrame, socket, io);

  const activeSession = await prisma.liveSession.findFirst({
    where: {
      chargePointId: cp.id,
      status: 'Ongoing'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!activeSession) return;

  const numericTxId = parseInt(activeSession.chargeTxCode.replace(/\D/g, ''), 10) || 1001;
  activeTxIdMap.set(activeSession.id, numericTxId);

  if (activeRemoteMockIntervals.has(activeSession.id)) {
    clearInterval(activeRemoteMockIntervals.get(activeSession.id));
  }

  let cumulativeEnergyWh = 10000;
  let currentSoc = 20.0;

  const sendMeterValuesTick = async () => {
    currentSoc = Math.min(100.0, parseFloat((currentSoc + 1.5).toFixed(1)));
    const powerKw = 22.0;
    const voltage = 235.0;
    const currentA = 32.5;
    cumulativeEnergyWh += 350;

    const meterValuesFrame = [
      2,
      `msg_mv_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      'MeterValues',
      {
        chargePointCode,
        connectorId: connectorId || 1,
        transactionId: numericTxId,
        meterValue: [
          {
            timestamp: new Date().toISOString(),
            sampledValue: [
              { value: String(cumulativeEnergyWh), measurand: 'Energy.Active.Import.Register', unit: 'Wh' },
              { value: String(powerKw), measurand: 'Power.Active.Import', unit: 'kW' },
              { value: String(voltage), measurand: 'Voltage', unit: 'V' },
              { value: String(currentA), measurand: 'Current.Import', unit: 'A' },
              { value: String(currentSoc), measurand: 'SoC', unit: 'Percent' }
            ]
          }
        ]
      }
    ];

    await processOcppMessage(meterValuesFrame, socket, io);
  };

  // 1. Send immediate initial MeterValues tick right away
  await sendMeterValuesTick();

  // 2. Schedule recurring MeterValues ticks every 2.5 seconds
  const interval = setInterval(async () => {
    try {
      await sendMeterValuesTick();

      if (currentSoc >= 100.0) {
        handleRemoteStopOcppMock(data, socket, io);
      }
    } catch (err) {
      console.error('[Mock OCPP Telemetry Error]:', err.message);
    }
  }, 2500);

  activeRemoteMockIntervals.set(activeSession.id, interval);
}

export async function handleRemoteStopOcppMock(data, socket, io) {
  const { chargePointCode, connectorId } = data;
  console.log(`[Mock OCPP Hardware Handler] Received RemoteStopTransaction request for ${chargePointCode} (Connector #${connectorId})`);

  const cp = await prisma.chargePoint.findUnique({
    where: { code: chargePointCode }
  });

  if (!cp) return;

  const activeSession = await prisma.liveSession.findFirst({
    where: {
      chargePointId: cp.id,
      status: 'Ongoing'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (activeSession) {
    if (activeRemoteMockIntervals.has(activeSession.id)) {
      clearInterval(activeRemoteMockIntervals.get(activeSession.id));
      activeRemoteMockIntervals.delete(activeSession.id);
    }

    const numericTxId = activeTxIdMap.get(activeSession.id) || parseInt(activeSession.chargeTxCode.replace(/\D/g, ''), 10) || 1001;

    const stopFrame = [
      2,
      `msg_stop_${Date.now()}`,
      'StopTransaction',
      {
        chargePointCode,
        connectorId: connectorId || 1,
        transactionId: numericTxId,
        meterStop: 15000,
        timestamp: new Date().toISOString(),
        reason: 'RemoteStop'
      }
    ];

    await processOcppMessage(stopFrame, socket, io);
  }

  const statusAvailableFrame = [
    2,
    `msg_sn_avail_${Date.now()}`,
    'StatusNotification',
    {
      chargePointCode,
      connectorId: connectorId || 1,
      errorCode: 'NoError',
      status: 'Available',
      timestamp: new Date().toISOString()
    }
  ];
  await processOcppMessage(statusAvailableFrame, socket, io);
}
