import prisma from './prisma.js';

async function main() {
  console.log('Searching for charge points matching "100"...');
  const chargePoints = await prisma.chargePoint.findMany({
    where: {
      OR: [
        { code: { contains: '100' } },
        { name: { contains: '100' } },
        { id: { contains: '100' } },
        { cpId: { contains: '100' } }
      ]
    },
    include: { connectors: true }
  });

  console.log(`Found ${chargePoints.length} matching charge points:`);
  chargePoints.forEach(cp => {
    console.log(`- ID: ${cp.id}, Name: ${cp.name}, Code: ${cp.code}, Connectors: ${cp.connectors.length}`);
  });

  // If match found, delete connectors
  if (chargePoints.length > 0) {
    for (const cp of chargePoints) {
      const deleted = await prisma.connector.deleteMany({
        where: { chargePointId: cp.id }
      });
      console.log(`Deleted ${deleted.count} connectors for ChargePoint [${cp.name} (${cp.code}) - ID: ${cp.id}]`);
    }
  } else {
    // If no specific "100" match, check all charge points
    const allCps = await prisma.chargePoint.findMany({ include: { connectors: true } });
    console.log(`Total charge points in DB: ${allCps.length}`);
    allCps.forEach(cp => {
      console.log(`- ID: ${cp.id}, Name: ${cp.name}, Code: ${cp.code}, Connectors: ${cp.connectors.length}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
