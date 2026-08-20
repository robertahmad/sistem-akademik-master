const fs = require('fs');
let path = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/siswa.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    const normKelas = (student.kelas || "").trim().toLowerCase();
    let gradeLevel = "X";
    if (normKelas.startsWith("viii") || normKelas.includes("kelas xi") || normKelas.includes("kelas 8") || normKelas.startsWith("8")) {
      gradeLevel = "XI";
    } else if (normKelas.startsWith("ix") || normKelas.includes("kelas xii") || normKelas.includes("kelas 9") || normKelas.startsWith("9")) {
      gradeLevel = "XII";
    }`;

const newStr = `    const normKelas = (student.kelas || "").trim().toLowerCase();
    let gradeLevel = "X";
    if (
      normKelas.startsWith("viii") || 
      normKelas.includes("kelas xi") || 
      normKelas.includes("kelas 8") || 
      normKelas.startsWith("8") || 
      /\\bxi\\b/.test(normKelas)
    ) {
      gradeLevel = "XI";
    } else if (
      normKelas.startsWith("ix") || 
      normKelas.includes("kelas xii") || 
      normKelas.includes("kelas 9") || 
      normKelas.startsWith("9") || 
      /\\bxii\\b/.test(normKelas)
    ) {
      gradeLevel = "XII";
    }`;

content = content.replace(targetStr, newStr);

fs.writeFileSync(path, content);
console.log('Fixed gradeLevel detection logic in getExamQuestions.');
