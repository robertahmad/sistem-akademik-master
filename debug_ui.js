const fs = require('fs');
const c = fs.readFileSync('C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js', 'utf8');

const jIdx = c.indexOf('{activeTab === "jurusan" && (');
console.log("Jurusan UI:");
console.log(c.substring(jIdx, jIdx + 500));

const kIdx = c.indexOf('schoolSubTab === "konten" ? (');
console.log("\nKonten UI:");
console.log(c.substring(kIdx, kIdx + 500));
