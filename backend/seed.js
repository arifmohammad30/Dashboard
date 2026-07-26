import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.chargingStation.count();
  if (count > 0) {
    console.log(`Already seeded with ${count} stations. Skipping.`);
    return;
  }

  const stations = [];
  for (let i = 1; i <= 10; i++) {
    stations.push({
      name: `Station ${i} - ${['Downtown', 'Airport', 'Mall', 'Highway', 'Plaza'][i % 5]}`,
      code: `CS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      chargePoints: Math.floor(Math.random() * 15) + 1,
      totalSessions: Math.floor(Math.random() * 5000) + 100,
      revenueGenerated: parseFloat((Math.random() * 50000 + 1000).toFixed(2)),
      energyDelivered: parseFloat((Math.random() * 10000 + 500).toFixed(2)),
    });
  }

  await prisma.chargingStation.createMany({ data: stations });
  console.log('Seeded 10 charging stations successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
