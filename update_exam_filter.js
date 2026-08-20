const fs = require('fs');

let path = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/siswa.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    // Ambil soal yang aktif untuk semester ini dan tingkat kelas ini
    const activeSemesterQuestions = await prisma.question.findMany({
      where: { 
        semester: activeSemester,
        kelas: gradeLevel
      }
    });`;

const replacementStr = `    // Ambil daftar mata pelajaran untuk memfilter berdasarkan jurusan siswa
    const allSubjects = await prisma.subject.findMany();
    const studentJurusan = (student.jurusan || "").trim();
    
    // Mata pelajaran yang diizinkan: jurusan kosong (umum) atau jurusan sama dengan jurusan siswa
    const validSubjectNames = allSubjects
      .filter(s => !s.jurusan || s.jurusan.trim() === "" || s.jurusan.trim() === studentJurusan)
      .map(s => s.name);

    // Ambil soal yang aktif untuk semester ini dan tingkat kelas ini, serta sesuai jurusan
    const activeSemesterQuestions = await prisma.question.findMany({
      where: { 
        semester: activeSemester,
        kelas: gradeLevel,
        subject: { in: validSubjectNames }
      }
    });`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(path, content);
  console.log('Successfully updated getStudentDashboardData filter in app/actions/siswa.js');
} else {
  console.log('Target string not found!');
}
