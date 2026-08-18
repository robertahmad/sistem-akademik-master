import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.subject.updateMany({
    where: {
      name: {
        in: ['Pendidikan Jasmani Olahraga dan Kesehatan', 'Bahasa Jawa', 'Seni Budaya', 'Pendidikan Jasmani, Olahraga, dan Kesehatan']
      }
    },
    data: { kelompok: 'B' }
  });
  console.log('Updated ' + res.count + ' subjects to Kelompok B.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
