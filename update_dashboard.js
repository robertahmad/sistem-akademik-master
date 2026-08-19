const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/admin.js';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/const examSchedules = await prisma\.examSchedule\.findMany\(\{[^}]*\}\);/, 
`const examSchedules = await prisma.examSchedule.findMany({ orderBy: { startTime: 'asc' } });
  
  let majors = await prisma.major.findMany({ orderBy: { code: 'asc' } });
  if (majors.length === 0) {
    await prisma.major.create({ data: { code: 'DKV', name: 'Desain Komunikasi Visual', unit: 'SMK' } });
    majors = await prisma.major.findMany({ orderBy: { code: 'asc' } });
  }`);

c = c.replace(/return \{ success: true, school, teachers, students, subjects, extracurriculars, examSchedules \};/, 
'return { success: true, school, teachers, students, subjects, extracurriculars, examSchedules, majors };');

fs.writeFileSync(p, c);
console.log('getAdminDashboard updated');
