const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Connected successfully!');
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Query result:', result);
    const count = await prisma.inventoryBatch.count();
    console.log('InventoryBatch count:', count);
  } catch (error) {
    console.error('Failed to connect to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
