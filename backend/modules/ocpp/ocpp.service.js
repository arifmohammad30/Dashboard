import prisma from '../../prisma.js';
import { getChargePointById } from '../chargepoints/chargePoints.service.js';
import { createBillFromSession } from '../bills/bill.service.js';
import { safeIoEmit } from '../../socket.js';


function safeSocketEmit(socket, event, data) {
  if (socket && typeof socket.emit === 'function') {
    socket.emit(event, data);
  }
}

let transactionCounter = Math.floor(Date.now() / 1000) % 100000;
function generateTransactionId() {
  transactionCounter += 1;
  return transactionCounter;
}

const sessionMeterStartMap = new Map();
const STALE_TIMEOUT_MS = 45000;

function formatSessionForReact(s) {
  if (!s) return null;

  const kwh = parseFloat((s.kwhDelivered ?? 0.0).toFixed(4));
  const cost = parseFloat((s.totalCost ?? 0.0).toFixed(2));
  const currentSoc = parseFloat((s.currentSoc ?? 20.0).toFixed(1));
  const initialSoc = parseFloat((s.initialSoc ?? 20.0).toFixed(1));

  const powerKw = s.powerKw ? parseFloat(s.powerKw.toFixed(2)) : 22.0;
  const voltage = s.voltage ? parseFloat(s.voltage.toFixed(1)) : 235.0;
  const currentA = s.currentA ? parseFloat(s.currentA.toFixed(1)) : 32.5;

  const startMs = s.createdAt ? new Date(s.createdAt).getTime() : Date.now();
  const endMs = s.updatedAt ? new Date(s.updatedAt).getTime() : Date.now();
  const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');
  const durationStr = `${hrs}:${mins}:${secs}`;

  return {
    id: s.id,
    sessionId: s.id,
    status: s.status || 'Ongoing',
    initialSoc,
    currentSoc,
    soc: {
      initial: initialSoc,
      current: currentSoc
    },
    energyDeliveredKwh: kwh,
    kwhDelivered: kwh,
    powerKw,
    voltage,
    current: currentA,
    currentA,
    cost,
    totalCost: cost,
    duration: durationStr,
    meterValues: {
      energy: `${kwh.toFixed(2)} kWh`,
      power: `${powerKw.toFixed(2)} kW`,
      voltage: `${voltage.toFixed(1)} V`,
      current: `${currentA.toFixed(1)} A`
    },
    startedAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
    userName: s.user?.name || 'Simulated Driver',
    userInitials: s.user?.initials || 'SD',
    userColor: s.user?.color || 'bg-emerald-100 text-emerald-700',
    driver: {
      id: s.user?.id || '',
      name: s.user?.name || 'Simulated Driver',
      initials: s.user?.initials || 'SD',
      color: s.user?.color || 'bg-emerald-100 text-emerald-700'
    },
    station: s.chargingStation?.name || 'Station',
    chargingStationId: s.chargingStationId,
    chargingStationName: s.chargingStation?.name || 'Station',
    chargingStation: {
      id: s.chargingStation?.id || '',
      name: s.chargingStation?.name || 'Station'
    },
    chargePointId: s.chargePointId,
    chargePointCode: s.chargePoint?.code || '',
    chargePointName: s.chargePoint?.name || 'Charge Point',
    chargePoint: {
      id: s.chargePoint?.id || '',
      code: s.chargePoint?.code || '',
      name: s.chargePoint?.name || 'Charge Point'
    },
    connector: {
      id: s.connector?.id || '',
      connectorId: s.connector?.connectorId || 1,
      type: s.connector?.type || 'Type2'
    }
  };
}

async function recordSessionLog(sessionId, command, direction, messageId, payload, io) {
  if (!sessionId) return;
  try {
    const summary = `${direction === 'INBOUND' ? '↘' : '↖'} ${command} ${direction === 'INBOUND' ? 'Inbound' : 'Outbound'}`;
    const newLog = await prisma.sessionLog.create({
      data: {
        sessionId,
        command,
        direction,
        messageId: messageId || `msg_${Date.now()}`,
        logType: 'OCPP 1.6J',
        summary,
        body: JSON.stringify(payload)
      }
    });

    if (io) {
      const formattedLog = {
        ...newLog,
        body: typeof newLog.body === 'string' ? (JSON.parse(newLog.body) || {}) : (newLog.body || {}),
        recordedOn: new Date(newLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        fullTimestamp: new Date(newLog.createdAt).toLocaleString()
      };
      safeIoEmit(io, 'session:log', formattedLog);
      if (sessionId) {
        safeIoEmit(io, `session:log:${sessionId}`, formattedLog);
      }
    }
  } catch (err) {
    console.error(`[OCPP Log Error] Failed to log ${command}:`, err.message);
  }
}

export async function cleanStaleOngoingSessions(io) {
  try {
    const cutoffTime = new Date(Date.now() - STALE_TIMEOUT_MS);
    const staleSessions = await prisma.liveSession.findMany({
      where: {
        status: 'Ongoing',
        updatedAt: { lt: cutoffTime }
      },
      include: {
        user: true,
        chargingStation: true,
        chargePoint: true,
        connector: true,
        tariff: true
      }
    });

    for (const session of staleSessions) {
      const updatedSession = await prisma.liveSession.update({
        where: { id: session.id },
        data: {
          status: 'Failed',
          updatedAt: new Date()
        },
        include: {
          user: true,
          chargingStation: true,
          chargePoint: true,
          connector: true,
          tariff: true
        }
      });

      if (session.chargePointId) {
        await prisma.chargePoint.update({
          where: { id: session.chargePointId },
          data: { status: 'Available' }
        }).catch(() => {});
      }

      if (session.connectorId) {
        await prisma.connector.update({
          where: { id: session.connectorId },
          data: { status: 'Available' }
        }).catch(() => {});
      }

      await recordSessionLog(session.id, 'SystemTimeout', 'SYSTEM', `timeout_${Date.now()}`, {
        reason: 'Session timed out due to telemetry inactivity (> 45s)'
      });

      const reactPayload = formatSessionForReact(updatedSession);
      if (io) {
        io.emit('session:stopped', reactPayload);
        io.emit('session:updated', reactPayload);
      }
      console.log(`[OCPP Stale Sweeper] Marked session ${session.chargeTxCode || session.id} as Failed (Inactivity Timeout)`);
    }
  } catch (err) {
    console.error('[OCPP Stale Sweeper Error]:', err.message);
  }
}

export async function processOcppMessage(frame, socket, io) {
  if (!Array.isArray(frame) || frame.length < 4 || frame[0] !== 2) {
    console.warn('[OCPP Service] Ignored non-CALL frame:', frame);
    return;
  }

  const [, messageId, action, payload] = frame;
  const cpCode = payload?.chargePointCode || payload?.chargePointId;

  console.log(`[OCPP Service] Processing CALL [${messageId}] ${action} from ${cpCode || 'Charger'}`);

  if (io) {
    const liveLog = {
      id: `live_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      command: action,
      direction: 'INBOUND',
      messageId: messageId || `msg_${Date.now()}`,
      logType: 'OCPP 1.6J',
      summary: `↘ ${action} Inbound`,
      body: payload || {},
      recordedOn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      fullTimestamp: new Date().toLocaleString(),
      chargePointCode: cpCode
    };
    io.emit('session:log', liveLog);
  }

  switch (action) {
    case 'BootNotification': {
      if (cpCode) {
        await prisma.chargePoint.updateMany({
          where: { code: cpCode },
          data: {
            firmwareVersion: payload.firmwareVersion || '2.0.2',
            lastActive: new Date().toISOString(),
            status: 'Available'
          }
        });
      }

      const responsePayload = {
        status: 'Accepted',
        currentTime: new Date().toISOString(),
        interval: 300
      };

      const confFrame = [3, messageId, responsePayload];
      safeSocketEmit(socket, 'ocpp:conf', confFrame);
      break;
    }

    case 'StatusNotification': {
      if (cpCode) {
        const cp = await prisma.chargePoint.findUnique({
          where: { code: cpCode },
          include: { connectors: true }
        });

        if (cp) {
          const newStatus = payload.status || 'Available';
          await prisma.chargePoint.update({
            where: { id: cp.id },
            data: { status: newStatus }
          });

          if (payload.connectorId && payload.connectorId > 0) {
            const conn = cp.connectors.find(c => c.connectorId === payload.connectorId);
            if (conn) {
              await prisma.connector.update({
                where: { id: conn.id },
                data: { status: newStatus }
              });
            }
          }

          if (io) {
            const updatedCp = await getChargePointById(cp.id);
            safeIoEmit(io, 'chargePointUpdated', updatedCp);
          }
        }
      }

      const confFrame = [3, messageId, {}];
      safeSocketEmit(socket, 'ocpp:conf', confFrame);
      break;
    }

    case 'StartTransaction': {
      const cp = cpCode
        ? await prisma.chargePoint.findUnique({
          where: { code: cpCode },
          include: { chargingStation: true, connectors: true, tariff: true }
        })
        : await prisma.chargePoint.findFirst({
          include: { chargingStation: true, connectors: true, tariff: true }
        });

      if (!cp) {
        console.error(`[OCPP StartTransaction] ChargePoint ${cpCode} not found in DB`);
        safeSocketEmit(socket, 'ocpp:conf', [3, messageId, { transactionId: 0, idTagInfo: { status: 'Rejected' } }]);
        return;
      }

      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: 'Simulated Driver',
            email: `driver_${Date.now()}@evnet.com`,
            initials: 'SD',
            color: 'bg-emerald-100 text-emerald-700'
          }
        });
      }

      const connector = cp.connectors.find(c => c.connectorId === (payload.connectorId || 1)) || cp.connectors[0];

      const numericTxId = generateTransactionId();
      const dbSessionId = `sess_${cp.code.toLowerCase()}_tx_${numericTxId}_${Date.now()}`;
      const initialMeterWh = payload.meterStart || 0;

      sessionMeterStartMap.set(dbSessionId, initialMeterWh);

      const createdDbSession = await prisma.liveSession.create({
        data: {
          id: dbSessionId,
          chargeTxCode: String(numericTxId),
          billCode: `BILL-${numericTxId}`,
          status: 'Ongoing',
          initialSoc: 20.0,
          currentSoc: 20.0,
          kwhDelivered: 0.0,
          totalCost: 0.0,
          userId: user.id,
          chargingStationId: cp.chargingStationId,
          chargePointId: cp.id,
          connectorId: connector?.id || null,
          tariffId: cp.tariffId || null
        },
        include: {
          user: true,
          chargingStation: true,
          chargePoint: true,
          connector: true,
          tariff: true
        }
      });

      try {
        await prisma.chargePoint.update({
          where: { id: cp.id },
          data: { status: 'Charging' }
        });
        if (connector?.id) {
          await prisma.connector.update({
            where: { id: connector.id },
            data: { status: 'Charging' }
          });
        }
      } catch (e) {
        console.warn('[OCPP StartTransaction] Failed to update CP/Connector status:', e.message);
      }

      await recordSessionLog(dbSessionId, 'StartTransaction', 'INBOUND', messageId, payload, io);

      const confPayload = {
        transactionId: numericTxId,
        idTagInfo: { status: 'Accepted' }
      };
      const confFrame = [3, messageId, confPayload];
      safeSocketEmit(socket, 'ocpp:conf', confFrame);

      await recordSessionLog(dbSessionId, 'StartTransaction.conf', 'OUTBOUND', messageId, confPayload, io);

      const reactPayload = formatSessionForReact(createdDbSession);
      safeIoEmit(io, 'session:created', reactPayload);
      console.log(`[OCPP StartTransaction] Emitted session:created -> txId: ${numericTxId} (DB ID: ${dbSessionId}, meterStart: ${initialMeterWh} Wh)`);
      break;
    }

    case 'MeterValues': {
      const numericTxId = payload.transactionId;
      const cpCodeStr = payload.chargePointCode;

      let session = null;

      if (numericTxId) {
        session = await prisma.liveSession.findFirst({
          where: {
            chargeTxCode: String(numericTxId),
            status: 'Ongoing'
          },
          include: {
            user: true,
            chargingStation: true,
            chargePoint: true,
            connector: true,
            tariff: true
          }
        });
      }

      if (!session && cpCodeStr) {
        session = await prisma.liveSession.findFirst({
          where: {
            chargePoint: { code: cpCodeStr },
            status: 'Ongoing'
          },
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            chargingStation: true,
            chargePoint: true,
            connector: true,
            tariff: true
          }
        });
      }

      if (session) {
        let cumulativeWh = 0;
        let powerKw = 22.0;
        let voltage = 235.0;
        let currentA = 32.5;
        let currentSoc = session.currentSoc || 20.0;

        const meterValueArray = payload.meterValue || [];
        for (const mv of meterValueArray) {
          const sampledValues = mv.sampledValue || [];
          for (const sv of sampledValues) {
            const valNum = parseFloat(sv.value);
            if (isNaN(valNum)) continue;

            switch (sv.measurand) {
              case 'Energy.Active.Import.Register':
                cumulativeWh = valNum;
                break;
              case 'Power.Active.Import':
                powerKw = valNum;
                break;
              case 'Voltage':
                voltage = valNum;
                break;
              case 'Current.Import':
                currentA = valNum;
                break;
              case 'SoC':
                currentSoc = valNum;
                break;
              default:
                break;
            }
          }
        }

        let meterStartWh = sessionMeterStartMap.get(session.id);
        if (meterStartWh === undefined) {
          const startLog = await prisma.sessionLog.findFirst({
            where: { sessionId: session.id, command: 'StartTransaction' }
          });
          if (startLog && startLog.body) {
            try {
              const bodyObj = JSON.parse(startLog.body);
              meterStartWh = bodyObj.meterStart || 0;
            } catch (e) {
              meterStartWh = 0;
            }
          } else {
            meterStartWh = 0;
          }
          sessionMeterStartMap.set(session.id, meterStartWh);
        }

        const netWh = Math.max(0, cumulativeWh - meterStartWh);
        const kwhDelivered = parseFloat((netWh / 1000).toFixed(4));

        const baseRate = session.tariff?.baseRate || 15.0;
        const gstPercent = session.tariff?.gstPercentage || 18.0;
        const totalCost = parseFloat((kwhDelivered * baseRate * (1 + gstPercent / 100)).toFixed(2));

        const updatedDbSession = await prisma.liveSession.update({
          where: { id: session.id },
          data: {
            currentSoc,
            kwhDelivered,
            totalCost,
            updatedAt: new Date()
          },
          include: {
            user: true,
            chargingStation: true,
            chargePoint: true,
            connector: true,
            tariff: true
          }
        });

        updatedDbSession.powerKw = powerKw;
        updatedDbSession.voltage = voltage;
        updatedDbSession.currentA = currentA;

        await recordSessionLog(session.id, 'MeterValues', 'INBOUND', messageId, payload, io);

        const confFrame = [3, messageId, {}];
        safeSocketEmit(socket, 'ocpp:conf', confFrame);

        await recordSessionLog(session.id, 'MeterValues.conf', 'OUTBOUND', messageId, {}, io);

        const reactPayload = formatSessionForReact(updatedDbSession);
        reactPayload.powerKw = powerKw;
        reactPayload.voltage = voltage;
        reactPayload.current = currentA;

        safeIoEmit(io, 'session:updated', reactPayload);
        console.log(`[OCPP MeterValues] Updated txId: ${numericTxId || session.chargeTxCode} | SoC: ${currentSoc}% | kWh: ${kwhDelivered} (Net: ${netWh} Wh) | Cost: ₹${totalCost}`);
      } else {
        const confFrame = [3, messageId, {}];
        safeSocketEmit(socket, 'ocpp:conf', confFrame);
      }
      break;
    }

    case 'StopTransaction': {
      const numericTxId = payload.transactionId;
      const cpCodeStr = payload.chargePointCode;

      let session = null;

      if (numericTxId) {
        session = await prisma.liveSession.findFirst({
          where: { chargeTxCode: String(numericTxId) },
          include: {
            user: true,
            chargingStation: true,
            chargePoint: true,
            connector: true,
            tariff: true
          }
        });
      }

      if (!session && cpCodeStr) {
        session = await prisma.liveSession.findFirst({
          where: {
            chargePoint: { code: cpCodeStr },
            status: 'Ongoing'
          },
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            chargingStation: true,
            chargePoint: true,
            connector: true,
            tariff: true
          }
        });
      }

      const finalStatus = payload.reason === 'OtherError' || payload.reason === 'EVCommunicationError' ? 'Failed' : 'Completed';

      if (session) {
        let meterStartWh = sessionMeterStartMap.get(session.id) || 0;
        const cumulativeStopWh = payload.meterStop || 0;
        const netStopWh = Math.max(0, cumulativeStopWh - meterStartWh);
        const finalKwh = cumulativeStopWh > 0 ? parseFloat((netStopWh / 1000).toFixed(4)) : session.kwhDelivered;

        const baseRate = session.tariff?.baseRate || 15.0;
        const gstPercent = session.tariff?.gstPercentage || 18.0;
        const finalCost = parseFloat((finalKwh * baseRate * (1 + gstPercent / 100)).toFixed(2));

        const stoppedDbSession = await prisma.liveSession.update({
          where: { id: session.id },
          data: {
            status: finalStatus,
            kwhDelivered: finalKwh,
            totalCost: finalCost,
            updatedAt: new Date()
          },
          include: {
            user: true,
            chargingStation: true,
            chargePoint: true,
            connector: true,
            tariff: true
          }
        });

        if (session.chargePointId) {
          await prisma.chargePoint.update({
            where: { id: session.chargePointId },
            data: {
              status: 'Available',
              totalSessions: { increment: 1 },
              energyDelivered: { increment: finalKwh },
              revenueGenerated: { increment: finalCost }
            }
          }).catch(err => console.error('[OCPP StopTransaction] ChargePoint stat update failed:', err.message));
        }

        if (session.connectorId) {
          await prisma.connector.update({
            where: { id: session.connectorId },
            data: { status: 'Available' }
          }).catch(err => console.error('[OCPP StopTransaction] Connector status update failed:', err.message));
        }

        if (session.chargingStationId) {
          await prisma.chargingStation.update({
            where: { id: session.chargingStationId },
            data: {
              totalSessions: { increment: 1 },
              energyDelivered: { increment: finalKwh },
              revenueGenerated: { increment: finalCost }
            }
          }).catch(err => console.error('[OCPP StopTransaction] Station stat update failed:', err.message));
        }

        sessionMeterStartMap.delete(session.id);

        await recordSessionLog(session.id, 'StopTransaction', 'INBOUND', messageId, payload, io);

        const confPayload = { idTagInfo: { status: 'Accepted' } };
        const confFrame = [3, messageId, confPayload];
        safeSocketEmit(socket, 'ocpp:conf', confFrame);

        await recordSessionLog(session.id, 'StopTransaction.conf', 'OUTBOUND', messageId, confPayload, io);

        const reactPayload = formatSessionForReact(stoppedDbSession);

        if (finalStatus === 'Completed') {
          const generatedBill = await createBillFromSession(stoppedDbSession);
          if (generatedBill) {
            reactPayload.billId = generatedBill.id;
            safeIoEmit(io, 'session:completed', {
              sessionId: stoppedDbSession.id,
              billId: generatedBill.id
            });
          }
        }

        safeIoEmit(io, 'session:stopped', reactPayload);
        safeIoEmit(io, 'session:updated', reactPayload);

        console.log(`[OCPP StopTransaction] Stopped txId: ${numericTxId || session.chargeTxCode} (${finalStatus}, finalKwh: ${finalKwh}, billId: ${reactPayload.billId || 'N/A'})`);


      } else {
        const confFrame = [3, messageId, { idTagInfo: { status: 'Accepted' } }];
        safeSocketEmit(socket, 'ocpp:conf', confFrame);
      }
      break;
    }

    default:
      console.warn(`[OCPP Service] Unknown action: ${action}`);
      safeSocketEmit(socket, 'ocpp:conf', [3, messageId, {}]);
      break;
  }
}
