require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const nepal = await prisma.country.findFirst({ where: { name: { contains: 'Nepal' } } });
  console.log('Nepal:', nepal ? `${nepal.name} (${nepal.code})` : 'NOT FOUND');
  
  const unis = await prisma.university.findMany({ select: { id: true, name: true } });
  console.log('Universities:', unis.map(u => u.name).join(', '));
  
  const count = await prisma.scholarship.count();
  console.log('Scholarships count:', count);
  
  await prisma.$disconnect();
})();