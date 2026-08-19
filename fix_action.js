const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/admin.js';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  /const examSchedules = await prisma\.examSchedule\.findMany\(\{\s*orderBy: \{\s*startTime: "asc"\s*\}\s*\}\);/,
  `const examSchedules = await prisma.examSchedule.findMany({ orderBy: { startTime: "asc" } });\n    let majors = await prisma.major.findMany({ orderBy: { code: 'asc' } });\n    if (majors.length === 0) { await prisma.major.create({ data: { code: 'DKV', name: 'Desain Komunikasi Visual', unit: 'SMK' } }); majors = await prisma.major.findMany({ orderBy: { code: 'asc' } }); }`
);

c = c.replace(
  /success: true,\s*school,\s*teachers,\s*students,\s*subjects,\s*extracurriculars,\s*examSchedules/g,
  "success: true, school, teachers, students, subjects, extracurriculars, examSchedules, majors"
);

fs.writeFileSync(p, c);
console.log('Fixed getAdminDashboard');
