import prisma from '../../prisma.js';
import { isTokenMatchedServer } from '../../utils/search.js';
import { formatCsvRow } from '../../utils/csvSanitizer.js';
import { calculateSessionTelemetry } from '../livesessions/session.service.js';
import { handleRemoteStartOcppMock, handleRemoteStopOcppMock } from '../../mocks/remoteOcppHandler.js';

export function formatChargePointListItem(cp, idx = 0) {
  let parsedConnectors = [];
  if (cp.connectors && Array.isArray(cp.connectors)) {
    parsedConnectors = cp.connectors.map(c => typeof c === 'object' ? {
      id: c.id,
      connectorId: c.connectorId,
      type: c.type
    } : c);
  }

  const cpIdPresets = ['CP25R63RV8', 'CPNYW8F06U', 'CPR0E3TRQK', 'CP832NCYSF', 'CPNMU35QY0', 'CPBWYOCTOJ', 'CPC066JB03', 'CP5JJ82NIQ', 'CPQFPRMK3K', 'CPJ6WSAR6L'];
  const qrCodePresets = ['CQUHBOICZV', 'CQ3MT0099C', 'CQN0SKKCJ', 'CQ0J6XPPS6', 'CQLIUF8AQ4', 'CQQH8H8D0B', 'CQ65RSXDKC', 'CQ5NTZQ5R', 'CQ19MZXMCT', 'CQ0450IJAB'];
  const defaultFirmwares = ['2.0.2 & 1.2.6', '2.2.0-2.2.4', '2.0.2', '2.0.2', '2.0.2', '2.0.2', '2.0.2', '2.0.2', '2.2.0-2.2.4', '1.8.8 & 1.2.5'];
  const defaultCapacities = ['9.899999999999999 kW', '-', '-', '-', '-', '-', '-', '-', '-', '3 kW'];
  const defaultLastActive = ['10 mins ago', 'Just now', '1 hour ago', '2 hours ago', 'Yesterday'];
  const defaultOems = ['EVRE', 'Siemens', 'Delta', 'ABB', 'Schneider'];
  const defaultTariffs = ['EVRE TEST', 'DLF Park Place DC', 'DLF Park Place AC', 'Sobha DC', 'Brigade Kovai AC'];
  const defaultStages = ['Active', 'Inactive', 'Maintenance'];

  const resolvedStage = cp.stage || defaultStages[idx % defaultStages.length];
  const isStageDisabled = resolvedStage === 'Inactive' || resolvedStage === 'Maintenance';
  const resolvedStatus = (isStageDisabled || cp.availability === 'Inoperative')
    ? 'Faulted'
    : (cp.status && cp.status !== 'Faulted' ? cp.status : 'Available');

  const resolvedTariffName = cp.tariff?.name || cp.tariffProfiles || defaultTariffs[idx % defaultTariffs.length];
  const resolvedTariff = cp.tariff ? {
    id: cp.tariff.id,
    name: cp.tariff.name
  } : (resolvedTariffName ? {
    id: cp.tariffId || `tar_${idx + 1}`,
    name: resolvedTariffName
  } : null);

  return {
    id: cp.id,
    name: cp.name,
    code: cp.code,
    chargingStation: cp.chargingStation ? {
      id: cp.chargingStation.id,
      name: cp.chargingStation.name,
      code: cp.chargingStation.code
    } : null,
    status: resolvedStatus,
    stage: resolvedStage,
    type: cp.type || 'AC',
    mode: cp.mode || 'Public',
    manufacturer: cp.manufacturer || cp.oem || defaultOems[idx % defaultOems.length],
    oem: cp.oem || cp.manufacturer || defaultOems[idx % defaultOems.length],
    firmwareVersion: cp.firmwareVersion || defaultFirmwares[idx % defaultFirmwares.length],
    totalCapacity: cp.totalCapacity || defaultCapacities[idx % defaultCapacities.length],
    cpId: (cp.cpId && cp.cpId !== cp.code) ? cp.cpId : cpIdPresets[idx % cpIdPresets.length],
    thirdPartyCpId: cp.thirdPartyCpId || 'NA',
    qrCodeId: cp.qrCodeId || qrCodePresets[idx % qrCodePresets.length],
    tariff: resolvedTariff,
    connectors: parsedConnectors,
    lastActive: cp.lastActive || defaultLastActive[idx % defaultLastActive.length],
    mobilityType: cp.mobilityType || 'Stationary',
    createdAt: cp.createdAt
  };
}

export function formatChargePointData(cp, idx = 0) {
  let methods = [];
  try {
    methods = cp.chargingMethods ? JSON.parse(cp.chargingMethods) : [];
  } catch (e) {
    methods = [];
  }

  const defaultStages = ['Active', 'Inactive', 'Maintenance'];
  const resolvedStage = cp.stage || defaultStages[idx % defaultStages.length];

  const resolvedTariff = cp.tariff ? {
    id: cp.tariff.id,
    name: cp.tariff.name,
    code: cp.tariff.code,
    baseRate: cp.tariff.baseRate || 15.0,
    gstPercentage: cp.tariff.gstPercentage || 18.0
  } : null;

  const resolvedChargingStation = cp.chargingStation ? {
    id: cp.chargingStation.id,
    name: cp.chargingStation.name,
    code: cp.chargingStation.code
  } : null;

  return {
    id: cp.id,
    name: cp.name,
    code: cp.code,
    chargingStation: resolvedChargingStation,
    manufacturer: cp.manufacturer,
    mode: cp.mode || 'Public',
    accessibility: cp.accessibility || 'Public',
    stage: resolvedStage,
    type: cp.type || 'AC',
    exclusive: cp.exclusive || 'Exclusive',
    gracePeriod: cp.gracePeriod !== null && cp.gracePeriod !== undefined ? cp.gracePeriod : 0,
    tariff: resolvedTariff,
    settlementProfile: cp.settlementProfile || 'Standard Rate',
    chargingMethods: methods,
    createdAt: cp.createdAt,
    updatedAt: cp.updatedAt
  };
}

export async function getFilterOptions() {
  const stations = await prisma.chargingStation.findMany({ select: { id: true, name: true, code: true } });
  const tariffs = await prisma.tariff.findMany({ select: { id: true, name: true, code: true } });
  const manufacturers = await prisma.chargePoint.findMany({ select: { manufacturer: true }, distinct: ['manufacturer'] });
  const types = await prisma.chargePoint.findMany({ select: { type: true }, distinct: ['type'] });

  return {
    locations: stations.map(s => s.name).filter(Boolean).sort(),
    stations: stations,
    tariffs: tariffs,
    tariffNames: tariffs.map(t => t.name).filter(Boolean).sort(),
    manufacturers: manufacturers.map(m => m.manufacturer).filter(Boolean).sort(),
    statuses: ['Available', 'Charging', 'Faulted', 'Preparing'],
    types: types.map(t => t.type).filter(Boolean).sort(),
  };
}

export async function getChargePoints({ page = 1, limit = 10, searchTerm = '', filters = {}, chargingStationId = null }) {
  const whereClause = {
    AND: []
  };

  const targetStationId = chargingStationId || filters.chargingStationId;
  if (targetStationId) {
    whereClause.AND.push({
      OR: [
        { chargingStationId: targetStationId },
        { chargingStation: { id: targetStationId } },
        { chargingStation: { name: targetStationId } },
        { chargingStation: { code: targetStationId } }
      ]
    });
  }

  if (filters.location && Array.isArray(filters.location) && filters.location.length > 0) {
    whereClause.AND.push({
      OR: [
        { chargingStation: { name: { in: filters.location } } },
        { chargingStation: { code: { in: filters.location } } },
        { chargingStationId: { in: filters.location } }
      ]
    });
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

  if (searchTerm && searchTerm.trim()) {
    const searchTokens = searchTerm.trim().split(/\s+/).filter(Boolean);
    searchTokens.forEach(token => {
      whereClause.AND.push({
        OR: [
          { name: { contains: token } },
          { code: { contains: token } },
          { manufacturer: { contains: token } },
          { stage: { contains: token } },
          { type: { contains: token } },
          { tariffProfiles: { contains: token } },
          { chargingStation: { name: { contains: token } } }
        ]
      });
    });
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  const total = await prisma.chargePoint.count({ where: whereClause });

  const paginatedData = await prisma.chargePoint.findMany({
    where: whereClause,
    include: {
      chargingStation: true,
      tariff: true,
      connectors: true
    },
    orderBy: { createdAt: 'desc' },
    skip: (pageNum - 1) * limitNum,
    take: limitNum
  });

  const formattedData = paginatedData.map((cp, idx) => formatChargePointListItem(cp, idx));

  return {
    data: formattedData,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum))
  };
}

export async function getChargePointById(id) {
  const cp = await prisma.chargePoint.findFirst({
    where: {
      OR: [
        { id: id },
        { code: id }
      ]
    },
    include: {
      chargingStation: true,
      tariff: true,
      connectors: true
    }
  });
  if (!cp) return null;

  const ongoingSession = await prisma.liveSession.findFirst({
    where: {
      chargePointId: cp.id,
      status: 'Ongoing'
    }
  });

  if (ongoingSession) {
    cp.status = 'Charging';
    if (Array.isArray(cp.connectors)) {
      cp.connectors = cp.connectors.map(conn => {
        const isTargetConn = ongoingSession.connectorId
          ? (conn.id === ongoingSession.connectorId || conn.connectorId === ongoingSession.connectorId)
          : conn.connectorId === 1;
        if (isTargetConn) {
          return { ...conn, status: 'Charging' };
        }
        return { ...conn, status: conn.status || 'Available' };
      });
    }
  }

  return formatChargePointData(cp);
}

export async function getChargePointStatsFromDb(id, timeRange = 'Today') {
  const cp = await prisma.chargePoint.findFirst({
    where: {
      OR: [{ id }, { code: id }]
    },
    include: { connectors: true }
  });

  const cpId = cp ? cp.id : id;

  const now = new Date();
  let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let endDate = undefined;

  if (timeRange === 'Yesterday') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (timeRange === 'Last 7 Days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === 'Last 30 Days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeRange === 'This Year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else if (timeRange === 'Last Year') {
    startDate = new Date(now.getFullYear() - 1, 0, 1);
    endDate = new Date(now.getFullYear(), 0, 1);
  }

  const completedStats = await prisma.liveSession.aggregate({
    where: {
      chargePointId: cpId,
      createdAt: {
        gte: startDate,
        ...(endDate ? { lt: endDate } : {})
      }
    },
    _sum: {
      totalCost: true,
      kwhDelivered: true
    },
    _count: {
      id: true
    }
  });

  const totalRevenue = completedStats._sum.totalCost || 0.0;
  const totalEnergyKwh = completedStats._sum.kwhDelivered || 0.0;
  const totalSessions = completedStats._count.id || 0;

  const activeConnectors = cp?.connectors ? cp.connectors.filter(c => c.status === 'Available' || c.status === 'Charging').length : 0;
  const totalConnectors = cp?.connectors ? cp.connectors.length : 1;

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalEnergyKwh: parseFloat(totalEnergyKwh.toFixed(2)),
    totalSessions,
    activeConnectors,
    totalConnectors,
    timeRange
  };
}

export async function updateChargePointConnectorInDb(id, connectorId, payload) {
  const cp = await prisma.chargePoint.findFirst({
    where: { OR: [{ id }, { code: id }] }
  });

  if (!cp) throw new Error("Charge point not found");

  const connIdNum = parseInt(connectorId) || 1;

  const existingConn = await prisma.connector.findFirst({
    where: { chargePointId: cp.id, connectorId: connIdNum }
  });

  let updatedConn;
  if (existingConn) {
    updatedConn = await prisma.connector.update({
      where: { id: existingConn.id },
      data: {
        type: payload.type || existingConn.type,
        maxPower: payload.maxPower !== undefined ? parseFloat(payload.maxPower) : existingConn.maxPower,
        status: payload.status || existingConn.status
      }
    });
  } else {
    updatedConn = await prisma.connector.create({
      data: {
        chargePointId: cp.id,
        connectorId: connIdNum,
        type: payload.type || 'Type2',
        maxPower: payload.maxPower ? parseFloat(payload.maxPower) : 22.0,
        status: payload.status || 'Available'
      }
    });
  }

  const updatedCp = await getChargePointById(cp.id);
  return { connector: updatedConn, chargePoint: updatedCp };
}

export async function addConnectorToDb(id, payload = {}) {
  const cp = await prisma.chargePoint.findFirst({
    where: { OR: [{ id }, { code: id }] },
    include: { connectors: true }
  });

  if (!cp) throw new Error("Charge point not found");

  const existingConnectorIds = (cp.connectors || []).map(c => c.connectorId);
  const requestedId = parseInt(payload.connectorId);

  let finalConnId;
  if (requestedId && requestedId > 0 && !existingConnectorIds.includes(requestedId)) {
    finalConnId = requestedId;
  } else {
    let nextConnId = 1;
    while (existingConnectorIds.includes(nextConnId)) {
      nextConnId++;
    }
    finalConnId = nextConnId;
  }

  const newConn = await prisma.connector.create({
    data: {
      chargePointId: cp.id,
      connectorId: finalConnId,
      type: payload.type || 'Type2',
      maxPower: payload.maxPower ? parseFloat(payload.maxPower) : 22.0,
      status: payload.status || 'Available'
    }
  });

  const updatedCp = await getChargePointById(cp.id);
  return { connector: newConn, chargePoint: updatedCp };
}


export async function assignChargePointTariffInDb(id, tariffId) {
  const cp = await prisma.chargePoint.findFirst({
    where: { OR: [{ id }, { code: id }] }
  });

  if (!cp) throw new Error("Charge point not found");

  await prisma.chargePoint.update({
    where: { id: cp.id },
    data: { tariffId: tariffId || null }
  });

  return getChargePointById(cp.id);
}

export async function remoteStartConnectorTransaction(id, connectorId, io) {
  const cp = await prisma.chargePoint.findFirst({
    where: { OR: [{ id }, { code: id }] },
    include: { chargingStation: true, connectors: true }
  });

  if (!cp) throw new Error("Charge point not found");

  const connIdNum = parseInt(connectorId) || 1;
  const msgId = `msg_rs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const ocppFrame = [2, msgId, "RemoteStartTransaction", { connectorId: connIdNum, idTag: "TAG-REMOTE-01" }];

  if (io) {
    io.emit('ocpp:remote-start', {
      chargePointCode: cp.code,
      chargePointId: cp.id,
      connectorId: connIdNum,
      messageId: msgId,
      frame: ocppFrame
    });
    io.emit('ocpp:frame', ocppFrame);
  }

  handleRemoteStartOcppMock({
    chargePointCode: cp.code,
    chargePointId: cp.id,
    connectorId: connIdNum,
    messageId: msgId
  }, null, io);

  const updatedCp = await getChargePointById(cp.id);
  return { success: true, message: `RemoteStartTransaction sent to ${cp.code}`, chargePoint: updatedCp };
}

export async function remoteStopConnectorTransaction(id, connectorId, io) {
  const cp = await prisma.chargePoint.findFirst({
    where: { OR: [{ id }, { code: id }] }
  });

  if (!cp) throw new Error("Charge point not found");

  const connIdNum = parseInt(connectorId) || 1;
  const msgId = `msg_stop_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const ocppFrame = [2, msgId, "RemoteStopTransaction", { connectorId: connIdNum }];

  if (io) {
    io.emit('ocpp:remote-stop', {
      chargePointCode: cp.code,
      chargePointId: cp.id,
      connectorId: connIdNum,
      messageId: msgId,
      frame: ocppFrame
    });
    io.emit('ocpp:frame', ocppFrame);
  }

  handleRemoteStopOcppMock({
    chargePointCode: cp.code,
    chargePointId: cp.id,
    connectorId: connIdNum,
    messageId: msgId
  }, null, io);

  const updatedCp = await getChargePointById(cp.id);
  return { success: true, message: `RemoteStopTransaction sent to ${cp.code}`, chargePoint: updatedCp };
}

export async function getConnectorStatusFromDb(id, connectorId) {
  const cp = await prisma.chargePoint.findFirst({
    where: { OR: [{ id }, { code: id }] },
    include: { connectors: true }
  });

  if (!cp) throw new Error("Charge point not found");

  const connIdNum = parseInt(connectorId) || 1;
  const connector = cp.connectors ? cp.connectors.find(c => c.connectorId === connIdNum) : null;

  const status = connector ? connector.status : (cp.status || 'Available');
  const availability = status === 'Faulted' || cp.status === 'Offline' ? 'Inoperative' : 'Operative';

  return {
    chargePointId: cp.id,
    connectorId: connIdNum,
    type: connector ? connector.type : 'Type2',
    status,
    availability,
    maxPower: connector ? connector.maxPower : 22.0,
    updatedAt: new Date().toISOString()
  };
}

export async function createChargePoint(payload) {
  if (!payload.code) {
    payload.code = `CP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  const targetStation = payload.chargingStation || payload.chargingStationId;
  let stationId = null;
  if (targetStation) {
    const station = await prisma.chargingStation.findFirst({
      where: {
        OR: [
          { id: typeof targetStation === 'object' ? targetStation.id : targetStation },
          { name: typeof targetStation === 'object' ? targetStation.name : targetStation },
          { code: typeof targetStation === 'object' ? targetStation.code : targetStation }
        ]
      }
    });
    if (station) {
      stationId = station.id;
    }
  }

  if (!stationId) {
    const firstStation = await prisma.chargingStation.findFirst();
    if (firstStation) {
      stationId = firstStation.id;
    } else {
      const newStation = await prisma.chargingStation.create({
        data: {
          name: typeof payload.chargingStation === 'string' && payload.chargingStation.trim() ? payload.chargingStation : 'Default Hub',
          code: `CS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        }
      });
      stationId = newStation.id;
    }
  }

  const targetTariff = payload.tariff || payload.tariffProfiles || payload.tariffId;
  let resolvedTariffId = null;
  let resolvedTariffName = '';
  if (targetTariff) {
    const matchedTariff = await prisma.tariff.findFirst({
      where: {
        OR: [
          { id: typeof targetTariff === 'object' ? targetTariff.id : targetTariff },
          { name: typeof targetTariff === 'object' ? targetTariff.name : targetTariff },
          { code: typeof targetTariff === 'object' ? targetTariff.code : targetTariff }
        ]
      }
    });
    if (matchedTariff) {
      resolvedTariffId = matchedTariff.id;
      resolvedTariffName = matchedTariff.name;
    }
  }

  const chargingMethodsData = payload.chargingMethods !== undefined
    ? (typeof payload.chargingMethods === 'string' ? payload.chargingMethods : JSON.stringify(payload.chargingMethods))
    : (payload.supportedChargingMethods !== undefined ? JSON.stringify(payload.supportedChargingMethods) : '[]');

  const newCp = await prisma.chargePoint.create({
    data: {
      name: payload.name,
      chargingStationId: stationId,
      tariffId: resolvedTariffId || null,
      manufacturer: payload.manufacturer || 'Siemens',
      mode: payload.mode || 'Public',
      code: payload.code,
      accessibility: payload.accessibility || 'Public',
      stage: payload.stage || 'Active',
      exclusive: payload.exclusive || 'Shared',
      gracePeriod: payload.gracePeriod !== null && payload.gracePeriod !== undefined ? parseInt(payload.gracePeriod) : 0,
      tariffProfiles: resolvedTariffName,
      settlementProfile: payload.settlementProfile || '',
      type: payload.type || 'AC',
      chargingMethods: chargingMethodsData
    },
    include: {
      chargingStation: true,
      tariff: true,
      connectors: true
    }
  });

  return {
    success: true,
    message: "Charge point created successfully",
    id: newCp.id,
    name: newCp.name,
    code: newCp.code
  };
}


export async function updateChargePoint(id, payload) {
  const dataToUpdate = {};
  if (payload.name !== undefined) dataToUpdate.name = payload.name;
  
  if (payload.chargingStation !== undefined || payload.chargingStationId !== undefined) {
    const targetStation = payload.chargingStation || payload.chargingStationId;
    if (targetStation) {
      const station = await prisma.chargingStation.findFirst({
        where: {
          OR: [
            { id: typeof targetStation === 'object' ? targetStation.id : targetStation },
            { name: typeof targetStation === 'object' ? targetStation.name : targetStation },
            { code: typeof targetStation === 'object' ? targetStation.code : targetStation }
          ]
        }
      });
      if (station) {
        dataToUpdate.chargingStationId = station.id;
      }
    } else {
      dataToUpdate.chargingStationId = null;
    }
  }

  if (payload.manufacturer !== undefined) dataToUpdate.manufacturer = payload.manufacturer;
  if (payload.mode !== undefined) dataToUpdate.mode = payload.mode;
  if (payload.code !== undefined) dataToUpdate.code = payload.code;
  if (payload.accessibility !== undefined) dataToUpdate.accessibility = payload.accessibility;
  if (payload.stage !== undefined) dataToUpdate.stage = payload.stage;
  if (payload.status !== undefined) dataToUpdate.status = payload.status;
  if (payload.exclusive !== undefined) dataToUpdate.exclusive = payload.exclusive;
  if (payload.gracePeriod !== undefined) dataToUpdate.gracePeriod = payload.gracePeriod !== null ? parseInt(payload.gracePeriod) : 0;
  
  if (payload.tariff !== undefined || payload.tariffProfiles !== undefined || payload.tariffId !== undefined) {
    const targetTariff = payload.tariff || payload.tariffProfiles || payload.tariffId;
    if (targetTariff) {
      const matchedTariff = await prisma.tariff.findFirst({
        where: {
          OR: [
            { id: typeof targetTariff === 'object' ? targetTariff.id : targetTariff },
            { name: typeof targetTariff === 'object' ? targetTariff.name : targetTariff },
            { code: typeof targetTariff === 'object' ? targetTariff.code : targetTariff }
          ]
        }
      });
      if (matchedTariff) {
        dataToUpdate.tariffId = matchedTariff.id;
        dataToUpdate.tariffProfiles = matchedTariff.name;
      } else {
        dataToUpdate.tariffId = null;
        dataToUpdate.tariffProfiles = '';
      }
    } else {
      dataToUpdate.tariffId = null;
      dataToUpdate.tariffProfiles = '';
    }
  }

  if (payload.settlementProfile !== undefined) dataToUpdate.settlementProfile = payload.settlementProfile;
  if (payload.type !== undefined) dataToUpdate.type = payload.type;
  
  if (payload.chargingMethods !== undefined) {
    dataToUpdate.chargingMethods = typeof payload.chargingMethods === 'string'
      ? payload.chargingMethods
      : JSON.stringify(payload.chargingMethods);
  } else if (payload.supportedChargingMethods !== undefined) {
    dataToUpdate.chargingMethods = JSON.stringify(payload.supportedChargingMethods);
  }

  const updatedCp = await prisma.chargePoint.update({
    where: { id },
    data: dataToUpdate,
    include: {
      chargingStation: true,
      tariff: true,
      connectors: true
    }
  });

  return {
    success: true,
    message: "Charge point updated successfully",
    id: updatedCp.id,
    name: updatedCp.name,
    code: updatedCp.code
  };
}

export async function deleteChargePoint(id) {
  return await prisma.chargePoint.delete({
    where: { id }
  });
}

export async function streamChargePointsCsv(res, query = {}) {
  const { search, filters: rawFilters } = query;
  let filters = {};
  if (rawFilters) {
    try {
      filters = typeof rawFilters === 'string' ? JSON.parse(rawFilters) : rawFilters;
    } catch (e) {
      filters = {};
    }
  }

  const whereClause = { AND: [] };

  if (filters.location && filters.location.length > 0) {
    whereClause.AND.push({ chargingStation: { name: { in: filters.location } } });
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

  if (search && search.trim()) {
    const searchTokens = search.trim().split(/\s+/).filter(Boolean);
    searchTokens.forEach(token => {
      whereClause.AND.push({
        OR: [
          { name: { contains: token } },
          { code: { contains: token } },
          { manufacturer: { contains: token } },
          { stage: { contains: token } },
          { type: { contains: token } },
          { tariffProfiles: { contains: token } },
          { chargingStation: { name: { contains: token } } }
        ]
      });
    });
  }

  const filename = `charge_points_export_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const headers = [
    'Charge Point ID',
    'Charge Point Name',
    'Code',
    'Charging Station',
    'Manufacturer',
    'Mode',
    'Accessibility',
    'Stage',
    'Type',
    'Status',
    'Firmware Version',
    'Created Date'
  ];
  res.write(formatCsvRow(headers));

  const points = await prisma.chargePoint.findMany({
    where: whereClause,
    include: {
      chargingStation: true,
      connectors: true
    },
    orderBy: { createdAt: 'desc' }
  });

  for (const cp of points) {
    const row = [
      cp.id,
      cp.name,
      cp.code,
      cp.chargingStation?.name || '-',
      cp.manufacturer || '-',
      cp.mode || 'Public',
      cp.accessibility || 'Public',
      cp.stage || 'Active',
      cp.type || 'AC',
      cp.status || 'Available',
      cp.firmwareVersion || '2.0.2',
      cp.createdAt ? new Date(cp.createdAt).toISOString() : ''
    ];
    res.write(formatCsvRow(row));
  }

  res.end();
}

