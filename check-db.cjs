require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const countries = await prisma.country.findMany({ select: { id: true, name: true, code: true } });
  console.log('Countries:', countries.map(c => c.name).join(', '));
  const providers = await prisma.provider.findMany({ select: { id: true, name: true } });
  console.log('Providers:', providers.map(p => p.name).join(', '));
  const universities = await prisma.university.findMany({ select: { id: true, name: true } });
  console.log('Universities count:', universities.length);
  const fields = await prisma.field.findMany({ select: { id: true, name: true } });
  console.log('Fields:', fields.map(f => f.name).join(', '));
  const count = await prisma.scholarship.count();
  console.log('Scholarships count:', count);
  await prisma.$disconnect();
})();