const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const teachers = await prisma.teacher.findMany({
      select: { id: true, name: true, tunjangan: true, jabatan: true }
    });
    console.log("Teachers in database:");
    console.dir(teachers, { depth: null });
  } catch (err) {
    console.error("DB Query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
