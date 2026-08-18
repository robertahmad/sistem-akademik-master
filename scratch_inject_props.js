const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'USER', '.gemini', 'antigravity', 'scratch', 'smk-al-qodiriyah-windusari-next', 'app', 'portal', 'admin', 'page.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/<PklTab\s*session=\{session\}\s*\/>/g, '<PklTab session={session} isAdmin={true} adminStudents={students} adminTeachers={teachers} />');
content = content.replace(/<UkkTab\s*session=\{session\}\s*\/>/g, '<UkkTab session={session} isAdmin={true} adminStudents={students} adminTeachers={teachers} />');
content = content.replace(/<SettingsTab\s*session=\{session\}\s*\/>/g, '<SettingsTab session={session} isAdmin={true} />');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Props injected successfully.');
