const prisma = require('./lib/prisma').default || require('./lib/prisma');

async function main() {
  try {
    const p = typeof prisma === 'function' ? prisma() : prisma;
    const teachers = await p.teacher.findMany();
    console.log(JSON.stringify(teachers, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
