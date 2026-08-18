const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'USER', '.gemini', 'antigravity', 'scratch', 'smk-al-qodiriyah-windusari-next', 'app', 'portal', 'guru', 'UkkTab.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update export default function UkkTab({ session, isAdmin, adminStudents, adminTeachers })
content = content.replace(/export default function UkkTab\(\{ session \}\) \{/g, 'export default function UkkTab({ session, isAdmin, adminStudents, adminTeachers }) {');

// 2. Hide forms behind isAdmin
content = content.replace(/<h3 style=\{\{ marginBottom: "1rem" \}\}>Buat Skema UKK Baru<\/h3>/g, '{isAdmin && <><h3 style={{ marginBottom: "1rem" }}>Buat Skema UKK Baru</h3>');
content = content.replace(/<\/form>\s*<\/div>\s*<table/g, '</form></>}</div><table');

content = content.replace(/<h3 style=\{\{ marginBottom: "1rem" \}\}>Tambah Asesor Baru<\/h3>/g, '{isAdmin && <><h3 style={{ marginBottom: "1rem" }}>Tambah Asesor Baru</h3>');

content = content.replace(/<h3 style=\{\{ marginBottom: "1rem" \}\}>Daftarkan Siswa ke Ujian UKK<\/h3>/g, '{isAdmin && <><h3 style={{ marginBottom: "1rem" }}>Daftarkan Siswa ke Ujian UKK</h3>');

// Use adminStudents instead of fetching students locally in UkkTab for the dropdown
content = content.replace(/\{students\.map\(s => <option key=\{s\.nisn\} value=\{s\.nisn\}>\{s\.name\} \(\{s\.nisn\}\)<\/option>\)\}/g, '{adminStudents && adminStudents.map(s => <option key={s.nisn} value={s.nisn}>{s.name} ({s.nisn})</option>)}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('UkkTab.js updated successfully.');
