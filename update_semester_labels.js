const fs = require('fs');

let pagePath = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let content = fs.readFileSync(pagePath, 'utf8');

content = content.replace(/<option value="1">Semester 1 \(Ganjil Kelas VII\)<\/option>/g, '<option value="1">Semester 1 (Ganjil Kelas X)</option>');
content = content.replace(/<option value="2">Semester 2 \(Genap Kelas VII\)<\/option>/g, '<option value="2">Semester 2 (Genap Kelas X)</option>');
content = content.replace(/<option value="3">Semester 3 \(Ganjil Kelas VIII\)<\/option>/g, '<option value="3">Semester 3 (Ganjil Kelas XI)</option>');
content = content.replace(/<option value="4">Semester 4 \(Genap Kelas VIII\)<\/option>/g, '<option value="4">Semester 4 (Genap Kelas XI)</option>');
content = content.replace(/<option value="5">Semester 5 \(Ganjil Kelas IX\)<\/option>/g, '<option value="5">Semester 5 (Ganjil Kelas XII)</option>');
content = content.replace(/<option value="6">Semester 6 \(Genap Kelas IX \/ PAJ\)<\/option>/g, '<option value="6">Semester 6 (Genap Kelas XII)</option>');

fs.writeFileSync(pagePath, content);
console.log('Updated app/portal/admin/page.js successfully.');
