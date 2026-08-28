import prisma from '../../prisma.js';
import { formatCsvRow } from '../../utils/csvSanitizer.js';

export async function createBillFromSession(session) {
  if (!session || !session.id) return null;

  // Strict Guard: ONLY generate Bill for completed/stopped sessions, NEVER for Failed or Ongoing
  const statusStr = session.status || '';
  if (statusStr !== 'Completed' && statusStr !== 'Stopped') {
    console.log(`[Bill Service] Skipping bill creation for non-completed session ${session.id} (Status: ${statusStr})`);
    return null;
  }

  try {
    // Check if session already has an attached bill
    const fullSession = await prisma.liveSession.findUnique({
      where: { id: session.id },
      include: {
        user: true,
        chargePoint: true,
        chargingStation: true,
        bill: true
      }
    });

    if (fullSession?.bill) {
      return fullSession.bill;
    }

    const billNumber = fullSession?.billCode || session.billCode || `BILL-${session.chargeTxCode || Math.floor(100000 + Math.random() * 900000)}`;
    const kwhVal = fullSession?.kwhDelivered ?? session.kwhDelivered ?? 0.0;
    const energyDelivered = `${parseFloat(kwhVal).toFixed(2)} kWh`;
    const amountVal = fullSession?.totalCost ?? session.totalCost ?? 0.0;
    const amount = parseFloat(parseFloat(amountVal).toFixed(2));

    const driverName = fullSession?.user?.name || session.userName || session.driver?.name || 'EV Driver';
    const driverInitials = fullSession?.user?.initials || session.userInitials || session.driver?.initials || 'ED';
    const driverColor = fullSession?.user?.color || session.userColor || session.driver?.color || 'bg-indigo-100 text-indigo-700';

    const chargePointStr = fullSession?.chargePoint?.name || session.chargePointName || session.chargePoint?.name || session.chargePointCode || 'Charge Point';

    const firstFleet = await prisma.fleet.findFirst().catch(() => null);
    const fleetName = firstFleet?.name || 'EVRE Corporate Fleet';

    const newBill = await prisma.bill.create({
      data: {
        billNumber,
        billStatus: 'Unpaid',
        chargeTransactionStatus: fullSession?.status || session.status || 'Completed',
        chargeTransaction: String(fullSession?.chargeTxCode || session.chargeTxCode || session.id),
        energyDelivered,
        appliedDiscount: '-',
        amount,
        fleet: fleetName,
        method: 'User Wallet',
        driverName,
        driverInitials,
        driverColor,
        invoiceAvailable: true,
        chargePoint: chargePointStr,
        generatedOn: fullSession?.updatedAt ? new Date(fullSession.updatedAt) : new Date()
      }
    });

    // Attach billId to LiveSession
    await prisma.liveSession.update({
      where: { id: session.id },
      data: { billId: newBill.id }
    });

    console.log(`[Bill Service] Created Bill ${newBill.billNumber} (ID: ${newBill.id}) for LiveSession ${session.id}`);
    return newBill;
  } catch (err) {
    console.error('[Bill Service Error] Failed to create bill:', err.message);
    return null;
  }
}

export async function getBillByIdFromDb(billId) {
  if (!billId) return null;
  const b = await prisma.bill.findFirst({
    where: {
      OR: [
        { id: billId },
        { billNumber: billId }
      ]
    }
  });

  if (!b) return null;

  // Resolve linked LiveSession details (station, tariff, chargePoint)
  const session = await prisma.liveSession.findFirst({
    where: {
      OR: [
        { billId: b.id },
        { chargeTxCode: b.chargeTransaction },
        { id: b.chargeTransaction }
      ]
    },
    include: {
      chargingStation: true,
      chargePoint: {
        include: {
          tariff: true,
          chargingStation: true
        }
      },
      tariff: true
    }
  }).catch(() => null);

  // Fallback queries if session was created without direct relations
  const stationEntity =
    session?.chargingStation ||
    session?.chargePoint?.chargingStation ||
    (await prisma.chargingStation.findFirst({ where: { name: b.chargePoint } }).catch(() => null)) ||
    (await prisma.chargingStation.findFirst().catch(() => null));

  const cpEntity =
    session?.chargePoint ||
    (await prisma.chargePoint.findFirst({ where: { OR: [{ name: b.chargePoint }, { code: b.chargePoint }] } }).catch(() => null)) ||
    (await prisma.chargePoint.findFirst().catch(() => null));

  const tariffEntity =
    session?.tariff ||
    session?.chargePoint?.tariff ||
    (cpEntity?.tariffId ? await prisma.tariff.findUnique({ where: { id: cpEntity.tariffId } }).catch(() => null) : null) ||
    (await prisma.tariff.findFirst().catch(() => null));

  const stationName = stationEntity?.name || 'DLF Cybercity Fast Hub';
  const cpName = cpEntity?.name || cpEntity?.code || b.chargePoint || 'Charge Point Station 28 AC';

  const activeTariff = {
    id: tariffEntity?.id || 'default-tariff',
    name: tariffEntity?.name || 'Standard AC Tariff',
    type: tariffEntity?.type || 'Default',
    costingType: 'Charging Only',
    baseRate: tariffEntity?.baseRate ?? 15.0,
    gstPercentage: tariffEntity?.gstPercentage ?? 18.0,
    createdAt: tariffEntity?.createdAt || new Date()
  };

  return {
    id: b.id,
    billNumber: b.billNumber,
    billStatus: b.billStatus,
    chargeTransactionStatus: b.chargeTransactionStatus,
    chargeTransaction: b.chargeTransaction,
    energyDelivered: b.energyDelivered,
    appliedDiscount: b.appliedDiscount || '-',
    amount: b.amount,
    fleet: b.fleet || '-',
    method: b.method || 'User Wallet',
    customerDriver: {
      name: b.driverName || 'EV Driver',
      initial: b.driverInitials || 'D',
      bg: b.driverColor || 'bg-purple-600'
    },
    invoiceAvailable: b.invoiceAvailable,
    chargePoint: cpName,
    chargePointId: cpEntity?.id || cpEntity?.code || cpName,
    chargingStation: stationName,
    chargingStationId: stationEntity?.id || stationEntity?.name || stationName,
    appliedTariff: activeTariff,
    generatedOn: new Date(b.generatedOn).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }) + ' ' + new Date(b.generatedOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}



export async function getBillsFromDb(query = {}) {
  const { page = 1, limit = 10, search, filters: rawFilters, timeRange } = query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;

  let filters = {};
  if (rawFilters) {
    try {
      filters = typeof rawFilters === 'string' ? JSON.parse(rawFilters) : rawFilters;
    } catch (e) {
      filters = {};
    }
  }

  const where = { AND: [] };

  if (filters.billStatus && filters.billStatus.length > 0) {
    where.AND.push({ billStatus: { in: filters.billStatus } });
  }

  if (timeRange && timeRange !== 'All') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (timeRange === 'Today') {
      where.AND.push({ generatedOn: { gte: startOfToday } });
    } else if (timeRange === 'Yesterday') {
      where.AND.push({ generatedOn: { gte: startOfYesterday, lte: endOfYesterday } });
    } else if (timeRange === 'Last 7 Days') {
      where.AND.push({ generatedOn: { gte: sevenDaysAgo } });
    } else if (timeRange === 'Last 30 Days') {
      where.AND.push({ generatedOn: { gte: thirtyDaysAgo } });
    }
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.AND.push({
      OR: [
        { billNumber: { contains: term } },
        { chargeTransaction: { contains: term } },
        { chargePoint: { contains: term } },
        { driverName: { contains: term } },
        { fleet: { contains: term } }
      ]
    });
  }

  const total = await prisma.bill.count({ where });
  const rawBills = await prisma.bill.findMany({
    where,
    orderBy: { generatedOn: 'desc' },
    skip: (pageNum - 1) * limitNum,
    take: limitNum
  });

  const formattedBills = rawBills.map(b => ({
    id: b.id,
    billNumber: b.billNumber,
    billStatus: b.billStatus,
    chargeTransactionStatus: b.chargeTransactionStatus,
    chargeTransaction: b.chargeTransaction,
    energyDelivered: b.energyDelivered,
    appliedDiscount: b.appliedDiscount || '-',
    amount: b.amount,
    fleet: b.fleet || '-',
    method: b.method || 'User Wallet',
    customerDriver: {
      name: b.driverName || 'EV Driver',
      initial: b.driverInitials || 'D',
      bg: b.driverColor || 'bg-purple-600'
    },
    invoiceAvailable: b.invoiceAvailable,
    chargePoint: b.chargePoint || 'Charge Point',
    generatedOn: new Date(b.generatedOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return {
    data: formattedBills,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum))
  };
}

export async function streamBillsCsv(res, query = {}) {
  const { search, filters: rawFilters, timeRange } = query;
  let filters = {};
  if (rawFilters) {
    try {
      filters = typeof rawFilters === 'string' ? JSON.parse(rawFilters) : rawFilters;
    } catch (e) {
      filters = {};
    }
  }

  const where = { AND: [] };

  if (filters.billStatus && filters.billStatus.length > 0) {
    where.AND.push({ billStatus: { in: filters.billStatus } });
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.AND.push({
      OR: [
        { billNumber: { contains: term } },
        { chargeTransaction: { contains: term } },
        { chargePoint: { contains: term } },
        { driverName: { contains: term } }
      ]
    });
  }

  const filename = `bills_export_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const headers = ['Bill Number', 'Bill Status', 'Transaction Status', 'Transaction ID', 'Energy Delivered', 'Amount (₹)', 'Driver', 'Charge Point', 'Generated On'];
  res.write(formatCsvRow(headers));

  const bills = await prisma.bill.findMany({
    where,
    orderBy: { generatedOn: 'desc' }
  });

  for (const b of bills) {
    const row = [
      b.billNumber,
      b.billStatus,
      b.chargeTransactionStatus,
      b.chargeTransaction,
      b.energyDelivered,
      b.amount.toFixed(2),
      b.driverName || 'EV Driver',
      b.chargePoint,
      b.generatedOn ? new Date(b.generatedOn).toISOString() : ''
    ];
    res.write(formatCsvRow(row));
  }

  res.end();
}
