const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudents() {
  const students = await prisma.student.findMany({
    take: 5
  });
  console.log("Found students:", students.map(s => ({
    name: s.name,
    nisn: s.nisn,
    username: s.username,
    jurusan: s.jurusan
  })));
  process.exit(0);
}

checkStudents();
