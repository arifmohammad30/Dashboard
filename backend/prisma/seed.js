import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database tables...");
  await prisma.sessionLog.deleteMany({});
  await prisma.liveSession.deleteMany({});
  await prisma.connector.deleteMany({});
  await prisma.chargePoint.deleteMany({});
  await prisma.chargingStation.deleteMany({});
  await prisma.tariff.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding Users...");
  const usersData = [
    { name: 'B108901020', email: 'b108901020@evre.in', initials: 'B', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Jothi viknesh', email: 'jothi@evre.in', initials: 'J', color: 'bg-purple-100 text-purple-700' },
    { name: 'Athiljit', email: 'athiljit@evre.in', initials: 'A', color: 'bg-fuchsia-100 text-fuchsia-700' },
    { name: 'Priya R', email: 'priya@evre.in', initials: 'P', color: 'bg-pink-100 text-pink-700' },
    { name: 'Rahul M', email: 'rahul@evre.in', initials: 'R', color: 'bg-rose-100 text-rose-700' },
    { name: 'Mohit Sharma', email: 'mohit@evre.in', initials: 'M', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Sarah K', email: 'sarah@evre.in', initials: 'S', color: 'bg-amber-100 text-amber-700' },
    { name: 'Vikram Singh', email: 'vikram@evre.in', initials: 'V', color: 'bg-cyan-100 text-cyan-700' },
    { name: 'Deepak T', email: 'deepak@evre.in', initials: 'D', color: 'bg-sky-100 text-sky-700' }
  ];

  const seededUsers = [];
  for (const u of usersData) {
    const createdUser = await prisma.user.create({ data: u });
    seededUsers.push(createdUser);
  }

  console.log("Seeding Tariffs...");
  const tariffsData = [
    { name: 'Standard Rate', code: 'TAR-001', type: 'Default', baseRate: 15.00, gstPercentage: 18.0, description: 'Standard charging rate for public AC/DC stations.' },
    { name: 'Time of Day Peak', code: 'TAR-002', type: 'ToD', baseRate: 22.50, gstPercentage: 18.0, description: 'Peak daytime electricity tariff (9 AM - 9 PM).' },
    { name: 'Off-Peak Discount', code: 'TAR-003', type: 'ToD', baseRate: 11.00, gstPercentage: 18.0, description: 'Night discount rate (11 PM - 6 AM).' },
    { name: 'Fleet Special', code: 'TAR-004', type: 'Event', baseRate: 12.50, gstPercentage: 0.0, description: 'Exclusive bulk rate for commercial logistics fleets.' },
    { name: 'High Power DC', code: 'TAR-005', type: 'SoC', baseRate: 25.00, gstPercentage: 18.0, description: 'Fast DC ultra-charging tier for high capacity EVs.' },
    { name: 'Green Energy Special', code: 'TAR-006', type: 'Default', baseRate: 14.00, gstPercentage: 18.0, description: 'Solar powered renewable energy charging tariff.' }
  ];

  const seededTariffs = [];
  for (const t of tariffsData) {
    const createdTariff = await prisma.tariff.create({ data: t });
    seededTariffs.push(createdTariff);
  }

  console.log("Seeding 20 Charging Stations & 100 Charge Points with relational foreign keys...");

  const manufacturers = ['ABB', 'Siemens', 'Schneider Electric', 'EVBox', 'Delta'];
  const modes = ['Public', 'Private'];
  const accessibilityOpts = ['Public', 'Restricted'];
  const stages = ['Active', 'Inactive', 'Maintenance'];
  const exclusives = ['Exclusive', 'Shared'];
  const types = ['AC', 'DC'];
  const oems = ['EVRE', 'Siemens', 'Delta', 'ABB', 'Schneider'];

  const cpIdPresets = [
    'CP25R63RV8', 'CPNYW8F06U', 'CPR0E3TRQK', 'CP832NCYSF', 'CPNMU35QY0',
    'CPBWYOCTOJ', 'CPC066JB03', 'CP5JJ82NIQ', 'CPQFPRMK3K', 'CPJ6WSAR6L'
  ];

  const qrCodePresets = [
    'CQUHBOICZV', 'CQ3MT0099C', 'CQN0SKKCJ', 'CQ0J6XPPS6', 'CQLIUF8AQ4',
    'CQQH8H8D0B', 'CQ65RSXDKC', 'CQ5NTZQ5R', 'CQ19MZXMCT', 'CQ0450IJAB'
  ];

  for (let s = 1; s <= 20; s++) {
    const stationName = `Location ${s} Hub`;
    const stationCode = `CS-LOC-${s.toString().padStart(2, '0')}`;
    const lat = 19.0760 + (s * 0.015);
    const lng = 72.8777 + (s * 0.012);

    const station = await prisma.chargingStation.create({
      data: {
        name: stationName,
        code: stationCode,
        chargePointsCount: 5,
        totalCapacity: `${60 + (s % 3) * 60} kW`,
        stationType: s % 2 === 0 ? 'Public Fast Hub' : 'Commercial Hub',
        mobilityType: 'Stationary',
        latitude: parseFloat(lat.toFixed(4)),
        longitude: parseFloat(lng.toFixed(4)),
        totalSessions: 0,
        energyDelivered: 0,
        revenueGenerated: 0
      }
    });

    // Generate 5 Charge Points per Charging Station
    for (let cpIdx = 1; cpIdx <= 5; cpIdx++) {
      const globalIndex = (s - 1) * 5 + cpIdx;
      const cpCode = `CP-${(1000 + globalIndex).toString()}`;
      const cpIdVal = cpIdPresets[(globalIndex - 1) % cpIdPresets.length];
      const qrVal = qrCodePresets[(globalIndex - 1) % qrCodePresets.length];
      const assignedTariff = seededTariffs[(globalIndex - 1) % seededTariffs.length];

      const cp = await prisma.chargePoint.create({
        data: {
          name: `Charge Point Station ${globalIndex} ${types[globalIndex % types.length]}`,
          code: cpCode,
          chargingStationId: station.id, // Foreign Key
          tariffId: assignedTariff.id,    // Foreign Key
          manufacturer: manufacturers[globalIndex % manufacturers.length],
          oem: oems[globalIndex % oems.length],
          thirdPartyCpId: 'NA',
          zone: '-',
          mode: modes[globalIndex % modes.length],
          cpId: cpIdVal,
          accessibility: accessibilityOpts[globalIndex % accessibilityOpts.length],
          stage: stages[globalIndex % stages.length],
          exclusive: exclusives[globalIndex % exclusives.length],
          gracePeriod: Math.floor(Math.random() * 15) + 5,
          tariffProfiles: assignedTariff.name,
          settlementProfile: 'Standard Rate',
          type: types[globalIndex % types.length],
          chargingMethods: JSON.stringify([
            { id: 'soc', label: 'SoC', selected: true, value: '80', unit: '%', isFirst: true },
            { id: 'time', label: 'Time', selected: true, value: '30', unit: 'mins', isFirst: false }
          ]),
          lastActive: 'Just now',
          totalSessions: 0,
          energyDelivered: 0,
          revenueGenerated: 0,
          mobilityType: 'Stationary',
          qrCodeId: qrVal,
          firmwareVersion: '2.0.2',
          totalCapacity: '120 kW'
        }
      });

      // Create Connectors for ChargePoint
      await prisma.connector.create({
        data: {
          chargePointId: cp.id,
          connectorId: 1,
          type: cp.type === 'DC' ? 'CCS2' : 'Type2',
          maxPower: cp.type === 'DC' ? 60.0 : 22.0,
          status: 'Available'
        }
      });

      await prisma.connector.create({
        data: {
          chargePointId: cp.id,
          connectorId: 2,
          type: cp.type === 'DC' ? 'CCS2' : '15A',
          maxPower: cp.type === 'DC' ? 60.0 : 3.3,
          status: 'Available'
        }
      });
    }
  }

  console.log("Database seeded successfully with relational relational hierarchy (Users, Stations, ChargePoints, Connectors, Tariffs). No mock sessions seeded.");
}

main()
  .catch((e) => {
    console.error("Error during relational database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
