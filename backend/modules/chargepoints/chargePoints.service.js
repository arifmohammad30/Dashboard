import prisma from '../../prisma.js';
import { isTokenMatchedServer } from '../../utils/search.js';
import { formatCsvRow } from '../../utils/csvSanitizer.js';

export function formatChargePointData(cp, idx = 0) {
  let methods = [];
  try {
    methods = cp.chargingMethods ? JSON.parse(cp.chargingMethods) : [];
  } catch (e) {
    methods = [];
  }

  let parsedConnectors = null;
  if (cp.connectors && Array.isArray(cp.connectors) && cp.connectors.length > 0) {
    parsedConnectors = cp.connectors.map(c => `${c.type} (${c.connectorId})`);
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

export async function getFilterOptions() {
  const stations = await prisma.chargingStation.findMany({ select: { name: true } });
  const manufacturers = await prisma.chargePoint.findMany({ select: { manufacturer: true }, distinct: ['manufacturer'] });
  const types = await prisma.chargePoint.findMany({ select: { type: true }, distinct: ['type'] });

  return {
    locations: stations.map(s => s.name).sort(),
    manufacturers: manufacturers.map(m => m.manufacturer).sort(),
    statuses: ['Available', 'Charging', 'Faulted', 'Preparing'],
    types: types.map(t => t.type).sort(),
  };
}

export async function getChargePoints({ page = 1, limit = 10, searchTerm = '', filters = {} }) {
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
    include: {
      chargingStation: true,
      tariff: true,
      connectors: true
    },
    orderBy: { createdAt: 'desc' }
  });

  if (searchTerm) {
    const searchTokens = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
    allData = allData.filter(cp => {
      const stationName = cp.chargingStation?.name || '';
      const searchableText = [
        cp.name,
        stationName,
        cp.code,
        cp.manufacturer,
        cp.stage,
        cp.type,
        cp.tariffProfiles
      ].join(' ').toLowerCase();

      return searchTokens.every(token => isTokenMatchedServer(searchableText, token));
    });
  }

  const total = allData.length;
  const paginatedData = allData.slice((page - 1) * limit, page * limit);
  const formattedData = paginatedData.map((cp, idx) => formatChargePointData(cp, idx));

  return {
    data: formattedData,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getChargePointById(id) {
  const cp = await prisma.chargePoint.findUnique({
    where: { id }
  });
  if (!cp) return null;
  return formatChargePointData(cp);
}

export async function createChargePoint(payload) {
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

  return { ...newCp, chargingMethods: JSON.parse(newCp.chargingMethods) };
}

export async function updateChargePoint(id, payload) {
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

  return { ...updatedCp, chargingMethods: methods };
}

export async function deleteChargePoint(id) {
  return await prisma.chargePoint.delete({
    where: { id }
  });
}

export async function streamChargePointsCsv(res, query = {}) {
  const { search } = query;
  const where = {};

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term } },
      { code: { contains: term } },
      { manufacturer: { contains: term } },
      { mode: { contains: term } },
      { status: { contains: term } },
      { chargingStation: { name: { contains: term } } }
    ];
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
    where,
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

