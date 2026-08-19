const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  /const arr = school\.galeriImages\.split\(';'\)\.filter\(Boolean\);/,
  "const arr = school.galeriImages.split(';').filter(Boolean).filter(img => img !== 'undefined' && img !== 'null');"
);

fs.writeFileSync(p, c);
console.log('Fixed array indexing for delete');
