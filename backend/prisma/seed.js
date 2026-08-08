import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateMockData = () => {
  const stationsData = [];
  const chargePointsData = [];

  const manufacturers = ['ABB', 'Siemens', 'Schneider Electric', 'EVBox', 'Delta'];
  const modes = ['Public', 'Private'];
  const accessibilityOpts = ['Public', 'Restricted'];
  const stages = ['Active', 'Inactive', 'Maintenance'];
  const exclusives = ['Exclusive', 'Shared'];
  const profiles = [
    'Standard Rate',
    'Time of Day Peak',
    'Off-Peak Discount',
    'Fleet Special',
    'High Power DC',
    'Green Energy Special'
  ];
  const types = ['AC', 'DC', 'NA'];
  const oems = ['EVRE', 'Siemens', 'Delta', 'ABB', 'Schneider'];

  const firmwareVersions = ['1.2.6', '2.2.4', '2.0.2', '1.2.5'];
  const connectorPresets = [
    ['15A (2)', '15A (1)', '15A (3)'],
    ['CCS2 (1)', 'CCS2 (2)'],
    ['Type2 (1)'],
    ['Type2 (1)'],
    ['CCS2 (1)', 'CCS2 (2)'],
    ['15A (1)']
  ];
  const capacities = ['60 kW', '120 kW', '22 kW', '50 kW', '11 kW', '150 kW'];
  const lastActiveOpts = ['10 mins ago', 'Just now', '1 hour ago', '2 hours ago', 'Yesterday'];

  const cpIdPresets = [
    'CP25R63RV8', 'CPNYW8F06U', 'CPR0E3TRQK', 'CP832NCYSF', 'CPNMU35QY0',
    'CPBWYOCTOJ', 'CPC066JB03', 'CP5JJ82NIQ', 'CPQFPRMK3K', 'CPJ6WSAR6L'
  ];

  const qrCodePresets = [
    'CQUHBOICZV', 'CQ3MT0099C', 'CQN0SKKCJ', 'CQ0J6XPPS6', 'CQLIUF8AQ4',
    'CQQH8H8D0B', 'CQ65RSXDKC', 'CQ5NTZQ5R', 'CQ19MZXMCT', 'CQ0450IJAB'
  ];

  // 1. Generate 20 Charging Stations
  for (let s = 1; s <= 20; s++) {
    const stationName = `Location ${s} Hub`;
    const stationCode = `CS-LOC-${s.toString().padStart(2, '0')}`;
    const lat = 19.0760 + (s * 0.015);
    const lng = 72.8777 + (s * 0.012);

    let stationTotalSessions = 0;
    let stationEnergyDelivered = 0;
    let stationRevenue = 0;

    // 2. Generate exactly 5 ChargePoints per Charging Station (Total 100)
    for (let cpIdx = 1; cpIdx <= 5; cpIdx++) {
      const globalIndex = (s - 1) * 5 + cpIdx;
      const cpCode = `CP-${(1000 + globalIndex).toString()}`;
      const cpIdVal = cpIdPresets[(globalIndex - 1) % cpIdPresets.length];
      const qrVal = qrCodePresets[(globalIndex - 1) % qrCodePresets.length];
      const hasActivity = globalIndex % 3 === 0;
      const totalSessions = hasActivity ? (globalIndex * 2) % 15 + 1 : 0;
      const energyDelivered = hasActivity ? parseFloat(((globalIndex * 14.23) % 120 + 5).toFixed(2)) : 0;
      const revenueGenerated = hasActivity ? parseFloat(((globalIndex * 245.80) % 2500 + 100).toFixed(2)) : 0;

      stationTotalSessions += totalSessions;
      stationEnergyDelivered += energyDelivered;
      stationRevenue += revenueGenerated;

      chargePointsData.push({
        name: `Charge Point Station ${globalIndex} ${types[globalIndex % types.length]}`,
        chargingStation: stationName,
        manufacturer: manufacturers[globalIndex % manufacturers.length],
        oem: oems[globalIndex % oems.length],
        thirdPartyCpId: 'NA',
        zone: '-',
        mode: modes[globalIndex % modes.length],
        code: cpCode,
        cpId: cpIdVal,
        accessibility: accessibilityOpts[globalIndex % accessibilityOpts.length],
        stage: stages[globalIndex % stages.length],
        exclusive: exclusives[globalIndex % exclusives.length],
        gracePeriod: Math.floor(Math.random() * 15) + 5,
        tariffProfiles: profiles[(globalIndex - 1) % profiles.length],
        settlementProfile: profiles[(globalIndex + 1) % profiles.length],
        type: types[globalIndex % types.length],
        chargingMethods: JSON.stringify([
          { id: 'soc', label: 'SoC', selected: true, value: '80', unit: '%', isFirst: true },
          { id: 'time', label: 'Time', selected: true, value: '30', unit: 'mins', isFirst: false }
        ]),
        lastActive: lastActiveOpts[globalIndex % lastActiveOpts.length],
        totalSessions,
        energyDelivered,
        revenueGenerated,
        mobilityType: 'Stationary',
        qrCodeId: qrVal,
        firmwareVersion: firmwareVersions[globalIndex % firmwareVersions.length],
        connectors: JSON.stringify(connectorPresets[globalIndex % connectorPresets.length]),
        totalCapacity: capacities[globalIndex % capacities.length]
      });
    }

    stationsData.push({
      name: stationName,
      code: stationCode,
      chargePoints: 5,
      totalCapacity: `${60 + (s % 3) * 60} kW`,
      stationType: s % 2 === 0 ? 'Public Fast Hub' : 'Commercial Hub',
      mobilityType: 'Stationary',
      latitude: parseFloat(lat.toFixed(4)),
      longitude: parseFloat(lng.toFixed(4)),
      totalSessions: stationTotalSessions,
      energyDelivered: parseFloat(stationEnergyDelivered.toFixed(2)),
      revenueGenerated: parseFloat(stationRevenue.toFixed(2))
    });
  }

  const tariffsData = [
    { name: 'Standard Rate', code: 'TAR-001', type: 'Default', baseRate: 15.00, gstPercentage: 18.0, description: 'Standard charging rate for public AC/DC stations.' },
    { name: 'Time of Day Peak', code: 'TAR-002', type: 'ToD', baseRate: 22.50, gstPercentage: 18.0, description: 'Peak daytime electricity tariff (9 AM - 9 PM).' },
    { name: 'Off-Peak Discount', code: 'TAR-003', type: 'ToD', baseRate: 11.00, gstPercentage: 18.0, description: 'Night discount rate (11 PM - 6 AM).' },
    { name: 'Fleet Special', code: 'TAR-004', type: 'Event', baseRate: 12.50, gstPercentage: 0.0, description: 'Exclusive bulk rate for commercial logistics fleets.' },
    { name: 'High Power DC', code: 'TAR-005', type: 'SoC', baseRate: 25.00, gstPercentage: 18.0, description: 'Fast DC ultra-charging tier for high capacity EVs.' },
    { name: 'Green Energy Special', code: 'TAR-006', type: 'Default', baseRate: 14.00, gstPercentage: 18.0, description: 'Solar powered renewable energy charging tariff.' }
  ];

  const liveSessionsData = [
    { userInitials: 'B', userColor: 'bg-indigo-100 text-indigo-700', userName: 'B108901020', station: 'Location 1 Hub', chargePoint: 'Charge Point Station 1 DC', connector: 'Type2 (1)', status: 'Ongoing' },
    { userInitials: 'J', userColor: 'bg-purple-100 text-purple-700', userName: 'Jothi viknesh', station: 'Location 2 Hub', chargePoint: 'Charge Point Station 6 AC', connector: '15A (2)', status: 'Ongoing' },
    { userInitials: 'A', userColor: 'bg-fuchsia-100 text-fuchsia-700', userName: 'Athiljit', station: 'Location 2 Hub', chargePoint: 'Charge Point Station 7 DC', connector: 'Type2 (1)', status: 'Ongoing' },
    { userInitials: 'P', userColor: 'bg-pink-100 text-pink-700', userName: 'Priya R', station: 'Location 3 Hub', chargePoint: 'Charge Point Station 11 NA', connector: 'CCS2 (1)', status: 'Ongoing' },
    { userInitials: 'R', userColor: 'bg-rose-100 text-rose-700', userName: 'Rahul M', station: 'Location 4 Hub', chargePoint: 'Charge Point Station 16 DC', connector: 'CCS2 (1)', status: 'Failed' },
    { userInitials: 'M', userColor: 'bg-emerald-100 text-emerald-700', userName: 'Mohit Sharma', station: 'Location 5 Hub', chargePoint: 'Charge Point Station 22 DC', connector: 'CCS2 (2)', status: 'Failed' },
    { userInitials: 'S', userColor: 'bg-amber-100 text-amber-700', userName: 'Sarah K', station: 'Location 6 Hub', chargePoint: 'Charge Point Station 28 AC', connector: 'Type2 (1)', status: 'Stopped' },
    { userInitials: 'V', userColor: 'bg-cyan-100 text-cyan-700', userName: 'Vikram Singh', station: 'Location 1 Hub', chargePoint: 'Charge Point Station 2 DC', connector: 'Type2 (1)', status: 'Stopped' },
    { userInitials: 'D', userColor: 'bg-sky-100 text-sky-700', userName: 'Deepak T', station: 'Location 6 Hub', chargePoint: 'Charge Point Station 26 AC', connector: 'CCS2 (2)', status: 'Stopped' }
  ];

  return { stationsData, chargePointsData, tariffsData, liveSessionsData };
};

async function main() {
  console.log("Cleaning database...");
  await prisma.liveSession.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.chargePoint.deleteMany();
  await prisma.chargingStation.deleteMany();

  const { stationsData, chargePointsData, tariffsData, liveSessionsData } = generateMockData();

  console.log("Seeding 20 Charging Stations...");
  for (const cs of stationsData) {
    await prisma.chargingStation.create({ data: cs });
  }

  console.log("Seeding 100 ChargePoints (5 per station)...");
  for (const cp of chargePointsData) {
    await prisma.chargePoint.create({ data: cp });
  }

  console.log("Seeding Tariffs...");
  for (const t of tariffsData) {
    await prisma.tariff.create({ data: t });
  }

  console.log("Seeding Live Sessions...");
  for (const ls of liveSessionsData) {
    await prisma.liveSession.create({ data: ls });
  }

  console.log("Database seeding completed successfully! 20 Stations, 100 ChargePoints, 6 Tariffs, and 9 Live Sessions stored in SQLite.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
