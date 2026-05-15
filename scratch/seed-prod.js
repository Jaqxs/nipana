const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('nipana2026', 10);
  
  const admins = [
    { name: 'Director', email: 'director@nipanaatlas.co.tz', role: 'admin' },
    { name: 'CEO', email: 'ceo@nipanaatlas.co.tz', role: 'admin' },
    { name: 'Developer', email: 'Developer@nipanaatlas.co.tz', role: 'admin' }
  ];

  console.log('Seeding administrative accounts...');

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        name: admin.name,
        email: admin.email,
        password: password,
        role: admin.role
      }
    });
    console.log(`- Created/Verified: ${admin.email}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
