const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
  try {
    const session = { nisn: '0093183499' };
    const student = await prisma.student.findUnique({
      where: { nisn: session.nisn },
      include: { grades: true, attendances: true, portfolios: true }
    });
    console.log("Student found:", !!student);
    
    const school = await prisma.school.findFirst({ where: { id: 1 } });
    console.log("School found:", !!school);

    const normKelas = (student.kelas || "").trim().toLowerCase();
    let level = 7;
    if (normKelas.startsWith("viii") || normKelas.includes("kelas xi") || normKelas.includes("kelas 8") || normKelas.startsWith("8")) {
      level = 8;
    } else if (normKelas.startsWith("ix") || normKelas.includes("kelas xii") || normKelas.includes("kelas 9") || normKelas.startsWith("9")) {
      level = 9;
    }
    const isGanjil = (school.semester || "Ganjil").toLowerCase().trim() === "ganjil";
    let activeSemester = "1";
    if (level === 7) activeSemester = isGanjil ? "1" : "2";
    else if (level === 8) activeSemester = isGanjil ? "3" : "4";
    else activeSemester = isGanjil ? "5" : "6";

    const gradeLevel = level === 7 ? "X" : level === 8 ? "XI" : "XII";

    const allSubjects = await prisma.subject.findMany();
    const studentJurusan = (student.jurusan || "").trim();
    
    const validSubjectNames = allSubjects
      .filter(s => !s.jurusan || s.jurusan.trim() === "" || s.jurusan.trim() === studentJurusan)
      .map(s => s.name);

    const activeSemesterQuestions = await prisma.question.findMany({
      where: { 
        semester: activeSemester,
        kelas: gradeLevel,
        subject: { in: validSubjectNames }
      }
    });
    console.log("Questions found:", activeSemesterQuestions.length);
    console.log("SUCCESS!");
  } catch (error) {
    console.error("ERROR CAUGHT:", error);
  }
}

simulate();
