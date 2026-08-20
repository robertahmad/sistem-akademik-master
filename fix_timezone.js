const fs = require('fs');
const path = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/admin.js';
let content = fs.readFileSync(path, 'utf8');

const target = `const start = new Date(startTime);
    const end = new Date(endTime);`;
    
const replacement = `// Fix Timezone: datetime-local string (YYYY-MM-DDTHH:mm) dikirim tanpa zona waktu. 
    // Vercel (server UTC) akan menganggapnya UTC, sehingga bergeser 7 jam. 
    // Kita tambahkan +07:00 agar dibaca sebagai WIB.
    const startString = startTime.length === 16 ? startTime + "+07:00" : startTime;
    const endString = endTime.length === 16 ? endTime + "+07:00" : endTime;
    
    const start = new Date(startString);
    const end = new Date(endString);`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log("Successfully fixed timezone offset in saveExamSchedule.");
} else {
    console.log("Target not found!");
}
