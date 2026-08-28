import prisma from '../../prisma.js';
import { isTokenMatchedServer } from '../../utils/search.js';
import { formatCsvRow } from '../../utils/csvSanitizer.js';

export async function getChargingStations({ page = 1, limit = 10, searchTerm = '', filters = {} }) {
  const whereClause = { AND: [] };

  if (searchTerm && searchTerm.trim()) {
    const searchTokens = searchTerm.trim().split(/\s+/).filter(Boolean);
    searchTokens.forEach(token => {
      whereClause.AND.push({
        OR: [
          { name: { contains: token } },
          { code: { contains: token } },
          { stationType: { contains: token } },
          { mobilityType: { contains: token } },
          { totalCapacity: { contains: token } },
          { chargePoints: { some: { OR: [{ name: { contains: token } }, { code: { contains: token } }] } } }
        ]
      });
    });
  }

  if (filters?.stationType && Array.isArray(filters.stationType) && filters.stationType.length > 0) {
    whereClause.AND.push({ stationType: { in: filters.stationType } });
  }

  if (filters?.mobilityType && Array.isArray(filters.mobilityType) && filters.mobilityType.length > 0) {
    whereClause.AND.push({ mobilityType: { in: filters.mobilityType } });
  }

  if (filters?.stage && Array.isArray(filters.stage) && filters.stage.length > 0) {
    whereClause.AND.push({ chargePoints: { some: { stage: { in: filters.stage } } } });
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;

  const total = await prisma.chargingStation.count({ where: whereClause });

  const dbStations = await prisma.chargingStation.findMany({
    where: whereClause,
    include: {
      chargePoints: true
    },
    orderBy: { createdAt: 'asc' },
    skip: (pageNum - 1) * limitNum,
    take: limitNum
  });

  const paginatedData = dbStations.map((cs) => {
    const matchingCps = cs.chargePoints || [];
    const mainCp = matchingCps[0] || null;

    return {
      ...cs,
      chargePoints: matchingCps.length || cs.chargePointsCount || 0,
      chargePointName: mainCp ? mainCp.name : '',
      chargePointId: mainCp ? mainCp.id : null,
      chargePointsList: matchingCps,
      createdOn: cs.createdAt ? new Date(cs.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'
    };
  });

  return {
    data: paginatedData,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum))
  };
}

export async function getChargingStationById(id) {
  let cs = await prisma.chargingStation.findUnique({
    where: { id },
    include: {
      chargePoints: true
    }
  });

  if (!cs) {
    cs = await prisma.chargingStation.findFirst({
      where: {
        OR: [
          { code: id },
          { name: id }
        ]
      },
      include: {
        chargePoints: true
      }
    });
  }

  if (!cs) return null;

  const matchingCps = cs.chargePoints || [];
  const mainCp = matchingCps[0] || null;

  return {
    ...cs,
    chargePoints: matchingCps.length || cs.chargePointsCount || 0,
    chargePointName: mainCp ? mainCp.name : '',
    chargePointId: mainCp ? mainCp.id : null,
    chargePointsList: matchingCps,
    createdOn: cs.createdAt ? new Date(cs.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'
  };
}

export async function createChargingStation(payload) {
  if (!payload.code) {
    payload.code = `CS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  return await prisma.chargingStation.create({
    data: {
      name: payload.name,
      code: payload.code,
      chargePointsCount: parseInt(payload.chargePoints) || 5,
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
}

export async function updateChargingStation(id, payload) {
  return await prisma.chargingStation.update({
    where: { id },
    data: {
      name: payload.name,
      code: payload.code,
      chargePointsCount: parseInt(payload.chargePoints) || 5,
      totalSessions: parseInt(payload.totalSessions) || 0,
      revenueGenerated: parseFloat(payload.revenueGenerated) || 0,
      energyDelivered: parseFloat(payload.energyDelivered) || 0,
    }
  });
}

export async function deleteChargingStation(id) {
  return await prisma.chargingStation.delete({ where: { id } });
}

export async function streamChargingStationsCsv(res, query = {}) {
  const { search } = query;
  const whereClause = { AND: [] };

  if (search && search.trim()) {
    const searchTokens = search.trim().split(/\s+/).filter(Boolean);
    searchTokens.forEach(token => {
      whereClause.AND.push({
        OR: [
          { name: { contains: token } },
          { code: { contains: token } },
          { stationType: { contains: token } },
          { mobilityType: { contains: token } },
          { totalCapacity: { contains: token } },
          { chargePoints: { some: { OR: [{ name: { contains: token } }, { code: { contains: token } }] } } }
        ]
      });
    });
  }

  const filename = `charging_stations_export_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const headers = [
    'Station ID',
    'Station Name',
    'Station Code',
    'Station Type',
    'Mobility Type',
    'Charge Points Count',
    'Total Capacity',
    'Total Sessions',
    'Revenue (₹)',
    'Energy Delivered (kWh)',
    'Created Date'
  ];
  res.write(formatCsvRow(headers));

  const stations = await prisma.chargingStation.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  for (const cs of stations) {
    const row = [
      cs.id,
      cs.name,
      cs.code,
      cs.stationType || 'Public Fast Hub',
      cs.mobilityType || 'Stationary',
      cs.chargePointsCount || 5,
      cs.totalCapacity || '120 kW',
      cs.totalSessions || 0,
      (cs.revenueGenerated || 0).toFixed(2),
      (cs.energyDelivered || 0).toFixed(2),
      cs.createdAt ? new Date(cs.createdAt).toISOString() : ''
    ];
    res.write(formatCsvRow(row));
  }

  res.end();
}
