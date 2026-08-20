const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const student = await prisma.student.findUnique({
      where: { nisn: '0093183499' }
    });
    
    const allSubjects = await prisma.subject.findMany();
    const studentJurusan = (student.jurusan || "").trim();
    
    const validSubjectNames = allSubjects
      .filter(s => !s.jurusan || s.jurusan.trim() === "" || s.jurusan.trim() === studentJurusan)
      .map(s => s.name);

    console.log("Valid subjects:", validSubjectNames);

    const activeSemesterQuestions = await prisma.question.findMany({
      where: { 
        semester: '1',
        kelas: 'X',
        subject: { in: validSubjectNames }
      }
    });

    console.log("Questions found:", activeSemesterQuestions.length);
  } catch (err) {
    console.error("CRASH:", err);
  }
}

test();
