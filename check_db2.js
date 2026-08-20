const prisma = require('./lib/prisma.js').default; // Assuming it exports default

async function checkStudents() {
  const students = await prisma.student.findMany({
    take: 5
  });
  console.log("Found students:", students.map(s => ({
    name: s.name,
    nisn: s.nisn,
    username: s.username,
    password_hash: s.password, // check length to see if it is hashed
  })));
  process.exit(0);
}

checkStudents();
