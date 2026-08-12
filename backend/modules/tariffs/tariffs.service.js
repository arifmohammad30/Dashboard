import prisma from '../../prisma.js';
import { formatCsvRow } from '../../utils/csvSanitizer.js';

export async function getTariffs() {
  const tariffs = await prisma.tariff.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return tariffs.map(t => ({
    id: t.id,
    name: t.name,
    code: t.code,
    type: t.type || 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: `₹${t.baseRate.toFixed(2)} / kWh`,
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    soc: 'NA',
    startsAt: 'NA',
    endsAt: 'NA',
    weight: 1,
    createdOn: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-',
    gstPercentage: `${t.gstPercentage}%`
  }));
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

  return {
    id: tariff.id,
    name: tariff.name,
    code: tariff.code,
    type: tariff.type || 'Default',
    costingType: 'Charging Only',
    applicableTo: 'All Fleets',
    chargingFee: `₹${tariff.baseRate.toFixed(2)} / kWh`,
    baseRate: tariff.baseRate,
    gstPercentage: `${tariff.gstPercentage}%`,
    rawGstPercentage: tariff.gstPercentage,
    description: tariff.description || '',
    parkingFee: 'NA',
    idleFee: '₹0 / min',
    createdOn: tariff.createdAt ? new Date(tariff.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-',
    chargePointsCount: tariff.chargePoints?.length || 0,
    chargePoints: tariff.chargePoints || []
  };
}

export async function createTariff(payload) {
  return await prisma.tariff.create({
    data: {
      name: payload.name,
      code: payload.code || `TAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type: payload.type || 'Default',
      baseRate: parseFloat(payload.baseRate) || 15.0,
      gstPercentage: parseFloat(payload.gstPercentage) || 18.0,
      description: payload.description || ''
    }
  });
}

export async function deleteTariff(id) {
  return await prisma.tariff.delete({ where: { id } });
}

export async function streamTariffsCsv(res, query = {}) {
  const { search } = query;
  const where = {};

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term } },
      { code: { contains: term } },
      { type: { contains: term } },
      { description: { contains: term } }
    ];
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
    where,
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
