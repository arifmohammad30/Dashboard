import prisma from '../../prisma.js';


const initialFleets = [
  {
    name: 'EVRE FACTORY',
    operatorCode: '306905',
    driverCount: 0,
    availableWalletBalance: 0.00,
    status: 'Active',
    createdAt: new Date('2025-12-04T16:46:00Z')
  },
  {
    name: 'Rajapushpa Provincia RWA',
    operatorCode: '556451',
    driverCount: 3,
    availableWalletBalance: 80000.00,
    status: 'Active',
    createdAt: new Date('2025-12-01T11:14:00Z')
  },
  {
    name: 'EVnnovator <> EVRE OCPI',
    operatorCode: '603982',
    driverCount: 1,
    availableWalletBalance: -105.11,
    status: 'Active',
    createdAt: new Date('2024-08-03T14:54:00Z')
  },
  {
    name: 'MoEVing - Mumbai',
    operatorCode: '215942',
    driverCount: 0,
    availableWalletBalance: 0.00,
    status: 'Active',
    createdAt: new Date('2024-07-18T15:23:00Z')
  },
  {
    name: 'Subash user at EC BLR',
    operatorCode: '724789',
    driverCount: 1,
    availableWalletBalance: -3052.97,
    status: 'Active',
    createdAt: new Date('2024-07-03T20:04:00Z')
  },
  {
    name: 'ARCZ MANAGEMENT PVT LTD',
    operatorCode: '209367',
    driverCount: 0,
    availableWalletBalance: 0.00,
    status: 'Active',
    createdAt: new Date('2024-06-25T13:33:00Z')
  },
  {
    name: 'EV vendors/saroor nagar Hyd',
    operatorCode: '410530',
    driverCount: 0,
    availableWalletBalance: 0.00,
    status: 'Active',
    createdAt: new Date('2024-06-06T12:38:00Z')
  },
  {
    name: 'EVRE Test Fleet',
    operatorCode: '128270',
    driverCount: 5,
    availableWalletBalance: 6.98,
    status: 'Active',
    createdAt: new Date('2024-05-11T17:29:00Z')
  }
];

export async function seedFleetsIfEmpty() {
  try {
    const count = await prisma.fleet.count();
    if (count === 0) {
      for (const item of initialFleets) {
        await prisma.fleet.create({ data: item });
      }
      console.log('[FleetService] Seeded initial fleets successfully.');
    }
  } catch (err) {
    console.error('[FleetService] Error seeding fleets:', err);
  }
}

export async function getFleetsFromDb({ page = 1, limit = 10, search = '', filters = {} }) {
  await seedFleetsIfEmpty();
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term } },
      { operatorCode: { contains: term } }
    ];
  }

  if (filters && typeof filters === 'object') {
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
  }

  const [data, total] = await Promise.all([
    prisma.fleet.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.fleet.count({ where })
  ]);

  return {
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
}

export async function getFleetByIdFromDb(id) {
  return await prisma.fleet.findUnique({ where: { id } });
}

export async function createFleetInDb(data) {
  const code = data.operatorCode || String(Math.floor(100000 + Math.random() * 900000));
  return await prisma.fleet.create({
    data: {
      name: data.name,
      operatorCode: code,
      ownerName: data.ownerName || null,
      ownerEmail: data.ownerEmail || null,
      accessCodeUsage: data.accessCodeUsage || 'Open To Everyone',
      paymentType: data.paymentType || 'Prepaid',
      gstin: data.gstin || null,
      companyName: data.companyName || null,
      companyEmail: data.companyEmail || null,
      companyPhone: data.companyPhone || null,
      driverCount: data.driverCount ? parseInt(data.driverCount, 10) : 0,
      availableWalletBalance: data.availableWalletBalance ? parseFloat(data.availableWalletBalance) : 0.0,
      status: data.status || 'Active'
    }
  });
}


export async function updateFleetInDb(id, data) {
  const updateData = { ...data };
  if (updateData.driverCount !== undefined) updateData.driverCount = parseInt(updateData.driverCount, 10);
  if (updateData.availableWalletBalance !== undefined) updateData.availableWalletBalance = parseFloat(updateData.availableWalletBalance);
  return await prisma.fleet.update({
    where: { id },
    data: updateData
  });
}


export async function topUpFleetWalletInDb(id, amount) {
  const current = await prisma.fleet.findUnique({ where: { id } });
  if (!current) throw new Error('Fleet not found');
  const newBalance = (current.availableWalletBalance || 0) + parseFloat(amount);
  return await prisma.fleet.update({
    where: { id },
    data: { availableWalletBalance: newBalance }
  });
}

export async function deleteFleetFromDb(id) {
  return await prisma.fleet.delete({ where: { id } });
}
