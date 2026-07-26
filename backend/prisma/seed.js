import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateMockData = () => {
  const data = [];
  const manufacturers = ['ABB', 'Siemens', 'Schneider Electric', 'EVBox', 'Delta'];
  const modes = ['Public', 'Private'];
  const accessibilityOpts = ['Public', 'Restricted'];
  const stages = ['Active', 'Inactive', 'Maintenance'];
  const exclusives = ['Exclusive', 'Shared'];
  const profiles = [
    'EVRE TEST',
    'DLF Park Place DC',
    'DLF Park Place AC',
    'Sobha DC',
    'Brigade Kovai AC',
    'DLF Park Place AC'
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
  const capacities = ['9.899999999999999 kW', '-', '-', '-', '-', '3 kW'];
  const lastActiveOpts = ['10 mins ago', 'Just now', '1 hour ago', '2 hours ago', 'Yesterday'];

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

  for (let i = 1; i <= 100; i++) {
    const cpCode = `CP-${(1000 + i).toString()}`;
    const cpIdVal = cpIdPresets[(i - 1) % cpIdPresets.length];
    const qrVal = qrCodePresets[(i - 1) % qrCodePresets.length];
    const hasActivity = i % 3 === 0;
    const totalSessions = hasActivity ? (i * 2) % 15 + 1 : 0;
    const energyDelivered = hasActivity ? parseFloat(((i * 14.23) % 120 + 5).toFixed(2)) : 0;
    const revenueGenerated = hasActivity ? parseFloat(((i * 245.80) % 2500 + 100).toFixed(2)) : 0;

    data.push({
      name: `Charge Point Station ${i} ${types[i % types.length]}`,
      chargingStation: `Location ${Math.floor((i - 1) / 5) + 1} Hub`,
      manufacturer: manufacturers[i % manufacturers.length],
      oem: oems[i % oems.length],
      thirdPartyCpId: 'NA',
      zone: '-',
      mode: modes[i % modes.length],
      code: cpCode,
      cpId: cpIdVal,
      accessibility: accessibilityOpts[i % accessibilityOpts.length],
      stage: stages[i % stages.length],
      exclusive: exclusives[i % exclusives.length],
      gracePeriod: Math.floor(Math.random() * 15) + 5,
      tariffProfiles: profiles[(i - 1) % profiles.length],
      settlementProfile: profiles[(i + 1) % profiles.length],
      type: types[i % types.length],
      chargingMethods: JSON.stringify([
        { id: 'soc', label: 'SoC', selected: true, value: '80', unit: '%', isFirst: true },
        { id: 'time', label: 'Time', selected: true, value: '30', unit: 'mins', isFirst: false }
      ]),
      lastActive: lastActiveOpts[i % lastActiveOpts.length],
      totalSessions,
      energyDelivered,
      revenueGenerated,
      mobilityType: 'Stationary',
      qrCodeId: qrVal,
      firmwareVersion: firmwareVersions[i % firmwareVersions.length],
      connectors: JSON.stringify(connectorPresets[i % connectorPresets.length]),
      totalCapacity: capacities[i % capacities.length]
    });
  }
  return data;
};

async function main() {
  console.log("Cleaning database...");
  await prisma.chargePoint.deleteMany();

  console.log("Seeding ChargePoints...");
  const mockChargePoints = generateMockData();

  for (const cp of mockChargePoints) {
    await prisma.chargePoint.create({ data: cp });
  }

  console.log("Seeding complete! Successfully added 100 mock ChargePoints to SQLite.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
