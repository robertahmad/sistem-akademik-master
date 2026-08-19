const fs = require('fs');
const c = fs.readFileSync('C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js', 'utf8');

const sIdx = c.indexOf(') : schoolSubTab === "konten" ? (');
console.log(c.substring(sIdx, sIdx + 4500));
