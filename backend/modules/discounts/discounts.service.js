import prisma from '../../prisma.js';

export function formatDiscountData(disc) {
  if (!disc) return disc;
  const parseArr = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return [];
  };
  return {
    ...disc,
    selectedUsers: parseArr(disc.selectedUsers),
    selectedFleets: parseArr(disc.selectedFleets),
    selectedStations: parseArr(disc.selectedStations),
    selectedChargePoints: parseArr(disc.selectedChargePoints)
  };
}

export async function getAllDiscountsFromDb(search = '', page, limit, filtersStr = '') {
  let where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { type: { contains: search } },
      { status: { contains: search } }
    ];
  }

  if (filtersStr) {
    try {
      const parsedFilters = typeof filtersStr === 'string' ? JSON.parse(filtersStr) : filtersStr;
      if (parsedFilters.status && Array.isArray(parsedFilters.status) && parsedFilters.status.length > 0) {
        where.status = { in: parsedFilters.status };
      }
      if (parsedFilters.type && Array.isArray(parsedFilters.type) && parsedFilters.type.length > 0) {
        where.type = { in: parsedFilters.type };
      }
    } catch (e) {
      console.error('Error parsing discount filters:', e);
    }
  }

  if (page || limit) {
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 10;
    const skip = (p - 1) * l;

    const [data, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: l
      }),
      prisma.discount.count({ where })
    ]);

    return {
      data: data.map(formatDiscountData),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l) || 1
    };
  }

  const rawDiscounts = await prisma.discount.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
  return rawDiscounts.map(formatDiscountData);
}

export async function getDiscountByIdFromDb(id) {
  const disc = await prisma.discount.findFirst({
    where: { OR: [{ id }, { name: id }] }
  });
  if (!disc) throw new Error('Discount offer not found');
  return formatDiscountData(disc);
}

export async function createDiscountInDb(data) {
  return prisma.discount.create({
    data: {
      name: data.name,
      code: data.code || `DISC_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      description: data.description || '',
      type: data.type || 'Percentage Discounts',
      value: data.value ? parseFloat(data.value) : 0.0,
      status: data.status || 'Active',
      expiresOn: data.expiresOn ? new Date(data.expiresOn) : null,
      conditionType: data.conditionType || 'OR',
      appVariants: data.appVariants || 'All',
      userAccess: data.userAccess || 'All',
      selectedUsers: typeof data.selectedUsers === 'string' ? data.selectedUsers : JSON.stringify(data.selectedUsers || []),
      fleetsAccess: data.fleetsAccess || 'All',
      selectedFleets: typeof data.selectedFleets === 'string' ? data.selectedFleets : JSON.stringify(data.selectedFleets || []),
      chargingStationsAccess: data.chargingStationsAccess || 'All',
      selectedStations: typeof data.selectedStations === 'string' ? data.selectedStations : JSON.stringify(data.selectedStations || []),
      chargePointsAccess: data.chargePointsAccess || 'All',
      selectedChargePoints: typeof data.selectedChargePoints === 'string' ? data.selectedChargePoints : JSON.stringify(data.selectedChargePoints || [])
    }
  });
}

export async function updateDiscountInDb(id, data) {
  const existing = await prisma.discount.findFirst({
    where: { OR: [{ id }, { name: id }] }
  });
  if (!existing) throw new Error('Discount offer not found');

  return prisma.discount.update({
    where: { id: existing.id },
    data: {
      name: data.name !== undefined ? data.name : existing.name,
      code: data.code !== undefined ? data.code : existing.code,
      description: data.description !== undefined ? data.description : existing.description,
      type: data.type !== undefined ? data.type : existing.type,
      value: data.value !== undefined ? parseFloat(data.value) : existing.value,
      status: data.status !== undefined ? data.status : existing.status,
      expiresOn: data.expiresOn !== undefined ? (data.expiresOn ? new Date(data.expiresOn) : null) : existing.expiresOn,
      conditionType: data.conditionType !== undefined ? data.conditionType : existing.conditionType,
      appVariants: data.appVariants !== undefined ? data.appVariants : existing.appVariants,
      userAccess: data.userAccess !== undefined ? data.userAccess : existing.userAccess,
      selectedUsers: data.selectedUsers !== undefined ? (typeof data.selectedUsers === 'string' ? data.selectedUsers : JSON.stringify(data.selectedUsers || [])) : existing.selectedUsers,
      fleetsAccess: data.fleetsAccess !== undefined ? data.fleetsAccess : existing.fleetsAccess,
      selectedFleets: data.selectedFleets !== undefined ? (typeof data.selectedFleets === 'string' ? data.selectedFleets : JSON.stringify(data.selectedFleets || [])) : existing.selectedFleets,
      chargingStationsAccess: data.chargingStationsAccess !== undefined ? data.chargingStationsAccess : existing.chargingStationsAccess,
      selectedStations: data.selectedStations !== undefined ? (typeof data.selectedStations === 'string' ? data.selectedStations : JSON.stringify(data.selectedStations || [])) : existing.selectedStations,
      chargePointsAccess: data.chargePointsAccess !== undefined ? data.chargePointsAccess : existing.chargePointsAccess,
      selectedChargePoints: data.selectedChargePoints !== undefined ? (typeof data.selectedChargePoints === 'string' ? data.selectedChargePoints : JSON.stringify(data.selectedChargePoints || [])) : existing.selectedChargePoints
    }
  });
}

export async function deleteDiscountFromDb(id) {
  const existing = await prisma.discount.findFirst({
    where: { OR: [{ id }, { name: id }] }
  });
  if (!existing) throw new Error('Discount offer not found');

  return prisma.discount.delete({
    where: { id: existing.id }
  });
}

export async function searchAccessEntitiesInDb(category, query = '') {
  const q = search => ({ contains: search });

  if (category === 'users') {
    const users = await prisma.user.findMany({
      where: query ? { OR: [{ name: q(query) }, { email: q(query) }] } : {},
      take: 10
    });
    return users.map(u => ({ id: u.id, name: u.name, subtitle: u.email }));
  }

  if (category === 'fleets') {
    const fleets = await prisma.fleet.findMany({
      where: query ? { OR: [{ fleetName: q(query) }, { accessCode: q(query) }] } : {},
      take: 10
    });
    return fleets.map(f => ({ id: f.id, name: f.fleetName, subtitle: `Code: ${f.accessCode || 'N/A'}` }));
  }

  if (category === 'chargingStations') {
    const stations = await prisma.chargingStation.findMany({
      where: query ? { OR: [{ name: q(query) }, { city: q(query) }] } : {},
      take: 10
    });
    return stations.map(s => ({ id: s.id, name: s.name, subtitle: s.city || 'Station' }));
  }

  if (category === 'chargePoints') {
    const cps = await prisma.chargePoint.findMany({
      where: query ? { OR: [{ name: q(query) }, { cpId: q(query) }] } : {},
      take: 10
    });
    return cps.map(c => ({ id: c.id, name: c.name || c.cpId, subtitle: c.cpId }));
  }

  return [];
}
