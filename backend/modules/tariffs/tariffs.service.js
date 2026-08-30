import prisma from '../../prisma.js';
import { formatCsvRow } from '../../utils/csvSanitizer.js';
import { validatePricingConfig } from './tariffs.validator.js';

export async function getFilterOptions() {
  const types = await prisma.tariff.findMany({
    select: { type: true },
    distinct: ['type']
  });

  const gsts = await prisma.tariff.findMany({
    select: { gstPercentage: true },
    distinct: ['gstPercentage']
  });

  return {
    types: types.map(t => t.type).filter(Boolean).sort(),
    gstPercentages: gsts.map(g => `${g.gstPercentage} %`).filter(g => g && g !== 'null %' && g !== 'undefined %').sort()
  };
}

export async function getTariffs({ page = 1, limit = 10, searchTerm = '', filters = {} } = {}) {
  const whereClause = { AND: [] };

  if (filters.type && filters.type.length > 0) {
    whereClause.AND.push({ type: { in: filters.type } });
  }

  if (filters.gstPercentage && filters.gstPercentage.length > 0) {
    const gstNums = filters.gstPercentage.map(g => parseFloat(String(g).replace('%', '').trim())).filter(n => !isNaN(n));
    if (gstNums.length > 0) {
      whereClause.AND.push({ gstPercentage: { in: gstNums } });
    }
  }

  if (searchTerm && searchTerm.trim()) {
    const searchTokens = searchTerm.trim().split(/\s+/).filter(Boolean);
    searchTokens.forEach(token => {
      whereClause.AND.push({
        OR: [
          { name: { contains: token } },
          { code: { contains: token } },
          { type: { contains: token } },
          { description: { contains: token } }
        ]
      });
    });
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  const total = await prisma.tariff.count({ where: whereClause });

  const tariffs = await prisma.tariff.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip: (pageNum - 1) * limitNum,
    take: limitNum
  });

  const formattedData = tariffs.map(t => {
    let parsedConfig = null;
    try {
      if (t.pricingConfig) parsedConfig = JSON.parse(t.pricingConfig);
    } catch (e) {
      parsedConfig = null;
    }

    const energyPriceVal = parsedConfig?.normalPricing?.energyPrice ?? t.baseRate;
    const timePriceVal = parsedConfig?.normalPricing?.timePrice ?? 0;
    const parkingFeeVal = parsedConfig?.parkingConfig?.enabled ? `₹${parsedConfig.parkingConfig.feePerMin} / min` : 'NA';

    return {
      id: t.id,
      name: t.name,
      code: t.code,
      type: t.type || 'Default',
      status: t.status || 'Active',
      costingType: parsedConfig?.parkingConfig?.enabled ? 'Charging + Parking' : 'Charging Only',
      applicableTo: t.type === 'ToD' ? 'ToD Schedule' : 'All Chargers',
      chargingFee: `₹${Number(energyPriceVal).toFixed(2)} / kWh`,
      parkingFee: parkingFeeVal,
      idleFee: `₹${Number(timePriceVal).toFixed(2)} / min`,
      soc: parsedConfig?.normalPricing?.socRanges?.length > 0 ? `${parsedConfig.normalPricing.socRanges.length} Tiers` : 'NA',
      startsAt: 'NA',
      endsAt: 'NA',
      weight: 1,
      createdOn: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-',
      gstPercentage: `${t.gstPercentage}%`,
      baseRate: t.baseRate,
      pricingConfig: parsedConfig
    };
  });

  return {
    data: formattedData,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum))
  };
}

export async function getTariffById(id) {
  let tariff = await prisma.tariff.findUnique({
    where: { id },
    include: { chargePoints: true }
  });

  if (!tariff) {
    tariff = await prisma.tariff.findFirst({
      where: {
        OR: [
          { code: id },
          { name: id }
        ]
      },
      include: { chargePoints: true }
    });
  }

  if (!tariff) return null;

  let parsedConfig = null;
  try {
    if (tariff.pricingConfig) parsedConfig = JSON.parse(tariff.pricingConfig);
  } catch (e) {
    parsedConfig = null;
  }

  return {
    id: tariff.id,
    name: tariff.name,
    code: tariff.code,
    type: tariff.type || 'Default',
    status: tariff.status || 'Active',
    baseRate: tariff.baseRate,
    gstPercentage: `${tariff.gstPercentage}%`,
    rawGstPercentage: tariff.gstPercentage,
    description: tariff.description || '',
    pricingConfig: parsedConfig,
    createdOn: tariff.createdAt ? new Date(tariff.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-',
    chargePointsCount: tariff.chargePoints?.length || 0,
    chargePoints: tariff.chargePoints || []
  };
}

export async function createTariff(payload) {
  let configObj = payload.pricingConfig;
  if (typeof configObj === 'string') {
    try {
      configObj = JSON.parse(configObj);
    } catch (e) {
      configObj = null;
    }
  }

  if (configObj) {
    const validation = validatePricingConfig(configObj);
    if (!validation.valid) {
      const err = new Error(validation.error);
      err.statusCode = 400;
      throw err;
    }
  }

  const rawGst = typeof payload.gstPercentage === 'string'
    ? parseFloat(payload.gstPercentage.replace(/[^0-9.]/g, ''))
    : parseFloat(payload.gstPercentage);

  const baseRateVal = configObj?.normalPricing?.energyPrice !== undefined
    ? parseFloat(configObj.normalPricing.energyPrice)
    : (parseFloat(payload.baseRate) || 15.0);

  return await prisma.tariff.create({
    data: {
      name: payload.name,
      code: payload.code || `TAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type: payload.type || (configObj?.peakPeriods?.length > 0 || configObj?.offPeakPeriods?.length > 0 ? 'ToD' : 'Default'),
      status: payload.status || 'Active',
      baseRate: isNaN(baseRateVal) ? 15.0 : baseRateVal,
      gstPercentage: isNaN(rawGst) ? 18.0 : rawGst,
      description: payload.description || '',
      pricingConfig: configObj ? JSON.stringify(configObj) : null
    }
  });
}

export async function updateTariff(id, payload) {
  let configObj = payload.pricingConfig;
  if (typeof configObj === 'string') {
    try {
      configObj = JSON.parse(configObj);
    } catch (e) {
      configObj = null;
    }
  }

  if (configObj) {
    const validation = validatePricingConfig(configObj);
    if (!validation.valid) {
      const err = new Error(validation.error);
      err.statusCode = 400;
      throw err;
    }
  }

  const rawGst = typeof payload.gstPercentage === 'string'
    ? parseFloat(payload.gstPercentage.replace(/[^0-9.]/g, ''))
    : parseFloat(payload.gstPercentage);

  const baseRateVal = configObj?.normalPricing?.energyPrice !== undefined
    ? parseFloat(configObj.normalPricing.energyPrice)
    : (parseFloat(payload.baseRate) || 15.0);

  return await prisma.tariff.update({
    where: { id },
    data: {
      name: payload.name,
      type: payload.type || (configObj?.peakPeriods?.length > 0 || configObj?.offPeakPeriods?.length > 0 ? 'ToD' : 'Default'),
      status: payload.status || 'Active',
      baseRate: isNaN(baseRateVal) ? 15.0 : baseRateVal,
      gstPercentage: isNaN(rawGst) ? 18.0 : rawGst,
      description: payload.description || '',
      pricingConfig: configObj ? JSON.stringify(configObj) : null
    }
  });
}

export async function deleteTariff(id) {
  return await prisma.tariff.delete({ where: { id } });
}

export async function streamTariffsCsv(res, query = {}) {
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

  if (filters.type && filters.type.length > 0) {
    whereClause.AND.push({ type: { in: filters.type } });
  }

  if (filters.gstPercentage && filters.gstPercentage.length > 0) {
    const gstNums = filters.gstPercentage.map(g => parseFloat(String(g).replace('%', '').trim())).filter(n => !isNaN(n));
    if (gstNums.length > 0) {
      whereClause.AND.push({ gstPercentage: { in: gstNums } });
    }
  }

  if (search && search.trim()) {
    const searchTokens = search.trim().split(/\s+/).filter(Boolean);
    searchTokens.forEach(token => {
      whereClause.AND.push({
        OR: [
          { name: { contains: token } },
          { code: { contains: token } },
          { type: { contains: token } },
          { description: { contains: token } }
        ]
      });
    });
  }

  const filename = `tariffs_export_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const headers = [
    'Tariff ID',
    'Tariff Name',
    'Code',
    'Type',
    'Base Rate (₹/kWh)',
    'GST Percentage',
    'Description',
    'Created Date'
  ];
  res.write(formatCsvRow(headers));

  const list = await prisma.tariff.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  for (const t of list) {
    const row = [
      t.id,
      t.name,
      t.code,
      t.type || 'Default',
      (t.baseRate || 0).toFixed(2),
      `${t.gstPercentage || 18}%`,
      t.description || '',
      t.createdAt ? new Date(t.createdAt).toISOString() : ''
    ];
    res.write(formatCsvRow(row));
  }

  res.end();
}
