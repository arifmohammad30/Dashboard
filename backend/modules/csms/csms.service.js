import prisma from '../../prisma.js';
import { calculateSessionTelemetry } from '../livesessions/session.service.js';


async function formatSessionForUi(session) {
  const fullSession = await prisma.liveSession.findUnique({
    where: { id: session.id },
    include: {
      user: true,
      chargingStation: true,
      chargePoint: true,
      connector: true,
      tariff: true
    }
  });

  if (!fullSession) return session;
  return calculateSessionTelemetry(fullSession);
}

async function getOrCreateDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Simulated Driver',
        email: 'driver@sim.ev',
        initials: 'SD',
        color: 'bg-emerald-100 text-emerald-700'
      }
    });
  }
  return user;
}

export async function processOcppMessage({ cpCode, action, payload, io }) {

  let cp = await prisma.chargePoint.findFirst({
    where: {
      OR: [
        { code: cpCode },
        { id: cpCode },
        { cpId: cpCode }
      ]
    },
    include: {
      chargingStation: true,
      tariff: true,
      connectors: true
    }
  });

  if (!cp) {
    cp = await prisma.chargePoint.findFirst({
      include: {
        chargingStation: true,
        tariff: true,
        connectors: true
      }
    });
  }

  if (!cp) {
    throw new Error(`ChargePoint not found for code: ${cpCode}`);
  }

  const conn = cp.connectors?.[0] || null;
  const defaultUser = await getOrCreateDefaultUser();

  switch (action) {
    case 'StartTransaction': {
      const initialSoc = payload.soc !== undefined ? parseFloat(payload.soc) : 10.0;

      const newSession = await prisma.liveSession.create({
        data: {
          status: 'Ongoing',
          initialSoc: initialSoc,
          currentSoc: initialSoc,
          kwhDelivered: 0.0,
          totalCost: 0.0,
          chargeTxCode: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          billCode: `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          userId: defaultUser.id,
          chargingStationId: cp.chargingStationId,
          chargePointId: cp.id,
          connectorId: conn?.id || null,
          tariffId: cp.tariffId || null
        }
      });

      // Update ChargePoint & Connector status
      await prisma.chargePoint.update({
        where: { id: cp.id },
        data: { status: 'Charging', stage: 'Active' }
      });

      if (conn) {
        await prisma.connector.update({
          where: { id: conn.id },
          data: { status: 'Charging' }
        });
      }

      // Log INBOUND telemetry
      await prisma.sessionLog.create({
        data: {
          command: 'StartTransaction',
          direction: 'INBOUND',
          logType: 'OCPP 1.6J',
          summary: `StartTransaction initiated for ${cp.name}`,
          body: JSON.stringify(payload),
          sessionId: newSession.id
        }
      });

      const formatted = await formatSessionForUi(newSession);

      if (io) {
        io.emit('session:created', formatted);
        io.emit('session:updated', formatted);
        io.emit('cp:status:updated', { cpCode: cp.code, status: 'Charging' });
      }

      return {
        transactionId: newSession.id,
        status: 'Accepted'
      };
    }

    case 'StatusNotification': {
      const status = payload.status || 'Available';
      await prisma.chargePoint.update({
        where: { id: cp.id },
        data: { status: status }
      });

      if (cp.connectors?.[0]) {
        await prisma.connector.update({
          where: { id: cp.connectors[0].id },
          data: { status: status }
        });
      }

      if (io) {
        io.emit('cp:status:updated', { cpCode: cp.code, status });
      }

      return {};
    }

    case 'MeterValues': {
      const txId = payload.transactionId;
      let session = null;

      if (txId) {
        session = await prisma.liveSession.findUnique({ where: { id: txId } });
      }

      if (!session) {
        session = await prisma.liveSession.findFirst({
          where: { chargePointId: cp.id, status: 'Ongoing' },
          orderBy: { createdAt: 'desc' }
        });
      }

      if (!session) {
        return {};
      }

      // Extract telemetry values (SoC & Energy)
      let currentSoc = session.currentSoc;
      let kwhDelivered = session.kwhDelivered;

      if (payload.soc !== undefined) {
        currentSoc = parseFloat(payload.soc);
      }
      if (payload.kwh !== undefined) {
        kwhDelivered = parseFloat(payload.kwh);
      }

      // Extract from standard OCPP sampledValue if present
      if (Array.isArray(payload.meterValue)) {
        for (const mv of payload.meterValue) {
          if (Array.isArray(mv.sampledValue)) {
            for (const sv of mv.sampledValue) {
              if (sv.measurand === 'SoC' && sv.value) {
                currentSoc = parseFloat(sv.value);
              }
              if ((sv.measurand === 'Energy.Active.Import.Register' || sv.unit === 'kWh') && sv.value) {
                kwhDelivered = parseFloat(sv.value);
              }
            }
          }
        }
      }

      // Calculate cost based on tariff base rate
      const baseRate = cp.tariff?.baseRate || 15.0;
      const gstPercent = cp.tariff?.gstPercentage || 18.0;
      const calculatedCost = parseFloat((kwhDelivered * baseRate * (1 + gstPercent / 100)).toFixed(2));

      const updatedSession = await prisma.liveSession.update({
        where: { id: session.id },
        data: {
          currentSoc: currentSoc,
          kwhDelivered: kwhDelivered,
          totalCost: calculatedCost,
          updatedAt: new Date()
        }
      });

      await prisma.sessionLog.create({
        data: {
          command: 'MeterValues',
          direction: 'INBOUND',
          logType: 'OCPP 1.6J',
          summary: `MeterValues telemetry: SoC ${currentSoc}%, ${kwhDelivered} kWh`,
          body: JSON.stringify(payload),
          sessionId: session.id
        }
      });

      const formatted = await formatSessionForUi(updatedSession);

      if (io) {
        io.emit('session:updated', formatted);
      }

      return {};
    }

    case 'StopTransaction': {
      const txId = payload.transactionId;
      let session = null;

      if (txId) {
        session = await prisma.liveSession.findUnique({ where: { id: txId } });
      }

      if (!session) {
        session = await prisma.liveSession.findFirst({
          where: { chargePointId: cp.id, status: 'Ongoing' },
          orderBy: { createdAt: 'desc' }
        });
      }

      if (!session) {
        return {};
      }

      const finalKwh = payload.meterStop !== undefined ? parseFloat(payload.meterStop) : session.kwhDelivered;
      const baseRate = cp.tariff?.baseRate || 15.0;
      const gstPercent = cp.tariff?.gstPercentage || 18.0;
      const finalCost = parseFloat((finalKwh * baseRate * (1 + gstPercent / 100)).toFixed(2));

      const stoppedSession = await prisma.liveSession.update({
        where: { id: session.id },
        data: {
          status: 'Completed',
          kwhDelivered: finalKwh,
          totalCost: finalCost,
          updatedAt: new Date()
        }
      });

      // Update ChargePoint & Connector back to Available
      await prisma.chargePoint.update({
        where: { id: cp.id },
        data: {
          status: 'Available',
          stage: 'Active',
          totalSessions: { increment: 1 },
          energyDelivered: { increment: finalKwh },
          revenueGenerated: { increment: finalCost }
        }
      });

      if (conn) {
        await prisma.connector.update({
          where: { id: conn.id },
          data: { status: 'Available' }
        });
      }

      // Update ChargingStation aggregate metrics
      if (cp.chargingStationId) {
        await prisma.chargingStation.update({
          where: { id: cp.chargingStationId },
          data: {
            totalSessions: { increment: 1 },
            energyDelivered: { increment: finalKwh },
            revenueGenerated: { increment: finalCost }
          }
        });
      }

      await prisma.sessionLog.create({
        data: {
          command: 'StopTransaction',
          direction: 'INBOUND',
          logType: 'OCPP 1.6J',
          summary: `StopTransaction completed. Final: ${finalKwh} kWh, ₹${finalCost}`,
          body: JSON.stringify(payload),
          sessionId: session.id
        }
      });

      const formatted = await formatSessionForUi(stoppedSession);

      if (io) {
        io.emit('session:stopped', formatted);
        io.emit('session:updated', formatted);
        io.emit('cp:status:updated', { cpCode: cp.code, status: 'Available' });
      }

      return { status: 'Accepted' };
    }

    default:
      console.warn(`[CSMS SERVICE] Unknown action: ${action}`);
      return {};
  }
}
