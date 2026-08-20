const fs = require('fs');

let pagePath = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/portal/admin/page.js';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Change the fallback for empty username to use NISN directly
pageContent = pageContent.replace(
  /if \(\!username\) \{\s*username = "siswa_" \+ \(nisn \|\| Math\.random\(\)\.toString\(36\)\.substring\(2, 7\)\);\s*\}/s,
  `if (!username) {\n            username = nisn ? nisn : "siswa_" + Math.random().toString(36).substring(2, 7);\n          }`
);

fs.writeFileSync(pagePath, pageContent);
console.log('Updated username fallback to use NISN directly.');
